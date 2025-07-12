import logging
import time
from datetime import datetime, timedelta
from datetime import time as dt_time  # Import necessário para comparar os horários
from datetime import timezone
from sqlalchemy import create_engine, text, and_
from sqlalchemy.orm import sessionmaker
from core.models import SaleData, PeopleCountingData, HeatmapData, LastUpdate, AnalyticsResults, RegionalPeopleCountingData
from core.config import DATABASE_URL
from conector.autenticar import autenticar
from conector.consultar import consultar_vendas
from tenacity import retry, wait_fixed, stop_after_attempt
import pandas as pd
from io import StringIO
import requests
import schedule
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback
import subprocess

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Conexão com o banco de dados
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# URLs das lojas (removendo OML01-Omnia GuimarãesShopping)
stores = {
    "OML01-Omnia GuimarãesShopping": ["93.108.96.96:21001"],
    "ONL01-Only UBBO Amadora": ["93.108.245.76:21002", "93.108.245.76:21003"],
    "OML02-Omnia Fórum Almada": ["188.37.175.41:2201"],
    "OML03-Omnia Norteshopping": ["188.37.124.33:21002"],
    "ONL02-Only Gaia": ["62.48.154.135:21001", "62.48.154.135:21002"]
}

# Função para iniciar o outro script em sequência
def iniciar_outro_script():
    try:
        logger.info("Iniciando o script analytics_collector_4.py em sequência...")
        # Especifica o caminho completo do script a ser iniciado e aguarda a conclusão
        subprocess.run(["python", "C:/projetos/grnl_platform/analytics_collector_4.py"], check=True)
        logger.info("Script analytics_collector_4.py finalizado com sucesso.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Erro ao executar o script teste_vs133_14.py: {str(e)}", exc_info=True)

def get_jwt_token():
    try:
        logger.info("Tentando autenticar e obter token JWT...")
        token = autenticar()
        logger.info("Token JWT obtido com sucesso.")
        return token
    except Exception as e:
        logger.error(f"Erro ao obter token JWT: {str(e)}", exc_info=True)
        raise

# Função para coletar dados de vendas, incluindo tratamento para erros da API
@retry(wait=wait_fixed(10), stop=stop_after_attempt(5))
def consultar_vendas_com_retry(jwt_token, data, loja):
    try:
        return consultar_vendas(jwt_token, data, loja)
    except Exception as e:
        logger.error(f"Erro na API ao consultar vendas para {loja} na data {data}: {str(e)}", exc_info=True)
        raise

def coletar_dados_vendas(jwt_token, inicio, fim, loja):
    dados = []
    data_atual = inicio
    total_erros = 0  # Contador de erros

    while data_atual < fim:
        try:
            consulta_data = consultar_vendas_com_retry(jwt_token, data_atual.strftime('%Y-%m-%d'), loja)
            logger.info(f"Resposta da consulta de vendas para a data {data_atual} e loja {loja}: {consulta_data}")
            if consulta_data.get('Sucesso'):
                result_sets = consulta_data['Objecto']['ResultSets']
                if result_sets:
                    first_result_set = result_sets[0]
                    if first_result_set:
                        dados.extend(first_result_set)
            else:
                logger.warning(f"API de vendas não retornou dados para {loja} na data {data_atual}.")
        except Exception as e:
            error_message = str(e)
            stack_trace = traceback.format_exc()
            log_error_to_db(loja, data_atual, error_message, stack_trace)  # type: ignore # Log de erro detalhado
            total_erros += 1
            logger.error(f"Erro ao consultar vendas para {loja} na data {data_atual}: {str(e)}", exc_info=True)
        finally:
            data_atual += timedelta(hours=1)

    if total_erros > 0:
        logger.warning(f"Falhas na coleta de vendas para {loja}: {total_erros} erros no período de {inicio} a {fim}")

    return [dict(t) for t in {tuple(d.items()) for d in dados}]

def coletar_e_armazenar_dados_vendas(loja, inicio, fim):
    try:
        jwt_token = get_jwt_token()
    except Exception as e:
        logger.error(f"Erro ao obter token JWT para {loja}: {str(e)}", exc_info=True)
        return 1  # Conta como um erro

    current_time = inicio.astimezone(timezone.utc)
    total_erros = 0
    while current_time < fim:
        next_time = current_time + timedelta(hours=1)
        if current_time.hour >= 0 and current_time.hour < 9:
            current_time = next_time
            continue
        logger.info(f"Coletando dados para {loja} de {current_time} a {next_time}")
        try:
            todos_dados = coletar_dados_vendas(jwt_token, current_time, next_time, loja)
            if todos_dados:
                armazenar_dados_no_banco(todos_dados, SaleData)
                logger.info(f"Dados de vendas armazenados com sucesso para {loja} de {current_time} a {next_time}")
            else:
                logger.warning(f"Sem dados para {loja} de {current_time} a {next_time}")
        except Exception as e:
            total_erros += 1
            logger.error(f"Erro ao coletar ou armazenar dados para {loja} de {current_time} a {next_time}: {str(e)}", exc_info=True)
        current_time = next_time
    return total_erros

def fetch_and_store(url, parse_function, model, loja, ip):
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = parse_function(response.text, loja, ip)
        # Convert objects to dictionaries e remove SQLAlchemy internal attributes
        data_dicts = [{k: v for k, v in d.__dict__.items() if k != '_sa_instance_state'} for d in data]
        if data_dicts:
            armazenar_dados_no_banco(data_dicts, model)
            logger.info(f"Dados armazenados no banco de dados com sucesso para a URL: {url}")
        else:
            logger.warning(f"Nenhum dado processado para a URL: {url}")
    except Exception as e:
        logger.error(f"Erro ao processar os dados da URL: {url} - {str(e)}", exc_info=True)
        raise

def parse_people_counting_data(text, loja, ip):
    try:
        df = pd.read_csv(StringIO(text))
        df.columns = [col.strip() for col in df.columns]
        data = [
            PeopleCountingData(
                loja=loja,
                ip=ip,
                start_time=datetime.strptime(row['StartTime'], '%Y/%m/%d %H:%M:%S'),
                end_time=datetime.strptime(row['EndTime'], '%Y/%m/%d %H:%M:%S'),
                total_in=int(row['Line1 - In']) + int(row['Line2 - In']) + int(row['Line3 - In']),
                line1_in=int(row['Line1 - In']),
                line2_in=int(row['Line2 - In']),
                line3_in=int(row['Line3 - In']),
                line4_in=int(row['Line4 - In']),
                line4_out=int(row['Line4 - Out'])  # Adicionando line4_out
            )
            for index, row in df.iterrows()
        ]
        return data
    except Exception as e:
        logger.error(f"Erro ao analisar os dados de contagem de pessoas: {str(e)}", exc_info=True)
        return []

def parse_heatmap_data(text, loja, ip):
    try:
        # Lista de câmaras específicas
        camaras_especificas = [
            "62.48.154.135:21001",
            "62.48.154.135:21002",
            "93.108.96.96:21001"
        ]

        df = pd.read_csv(StringIO(text))
        df.columns = [col.strip() for col in df.columns]
        data = [
            HeatmapData(
                loja=loja,
                ip=ip,
                start_time=datetime.strptime(row['StartTime'], '%Y-%m-%d %H:%M:%S'),
                end_time=datetime.strptime(row['EndTime'], '%Y-%m-%d %H:%M:%S'),
                # Dividir por 10 apenas para as câmaras específicas
                value=int(row['Value(s)']) / 10 if ip in camaras_especificas else int(row['Value(s)'])
            )
            for index, row in df.iterrows()
        ]
        return data
    except Exception as e:
        logger.error(f"Erro ao analisar os dados de heatmap: {str(e)}", exc_info=True)
        return []

def parse_regional_people_counting_data(text, loja, ip):
    try:
        df = pd.read_csv(StringIO(text))
        df.columns = [col.strip() for col in df.columns]
        data = [
            RegionalPeopleCountingData(
                loja=loja,
                ip=ip,
                start_time=datetime.strptime(row['StartTime'], '%Y/%m/%d %H:%M:%S'),
                end_time=datetime.strptime(row['EndTime'], '%Y/%m/%d %H:%M:%S'),
                region1=int(row['region1']),
                region2=int(row['region2']),
                region3=int(row['region3']),
                region4=int(row['region4']),
                total=int(row['Sum'])
            )
            for index, row in df.iterrows()
        ]
        return data
    except Exception as e:
        logger.error(f"Erro ao analisar os dados de contagem regional de pessoas: {str(e)}", exc_info=True)
        return []

def generate_urls(start_date, end_date, base_url, data_type):
    urls = []
    current_date = start_date
    while current_date < end_date:
        url = f"http://admin:grnl.2024@{base_url}/dataloader.cgi?dw={data_type}&time_start={current_date.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={(current_date + timedelta(hours=1)).strftime('%Y-%m-%d-%H:%M:%S')}"
        urls.append(url)
        current_date += timedelta(hours=1)
    return urls

def process_data_for_store_parallel(loja, ips, start_date, end_date, data_type, parse_function, model):
    if not ips:
        logger.warning(f"Nenhum IP fornecido para a loja {loja}, pulando processamento.")
        return
    with ThreadPoolExecutor(max_workers=len(ips)) as executor:
        futures = []
        for ip in ips:
            base_url = f"{ip}"
            urls = generate_urls(start_date, end_date, base_url, data_type)
            for url in urls:
                futures.append(executor.submit(fetch_and_store, url, parse_function, model, loja, ip))

        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                logger.error(f"Erro ao tentar obter e armazenar dados: {str(e)}")

from datetime import timezone

def get_last_update(store):
    session = SessionLocal()
    try:
        last_update_record = session.query(LastUpdate).filter_by(loja=store).first()
        if last_update_record:
            # Retorna a última data de atualização como UTC
            return last_update_record.last_update_time.replace(tzinfo=timezone.utc)
        else:
            return None
    except Exception as e:
        logger.error(f"Erro ao obter a data do último update para {store}: {str(e)}", exc_info=True)
        return None
    finally:
        session.close()

def set_last_update(store, last_update):
    session = SessionLocal()
    try:
        last_update_record = session.query(LastUpdate).filter_by(loja=store).first()
        if last_update_record:
            last_update_record.last_update_time = last_update.astimezone(timezone.utc)
        else:
            last_update_record = LastUpdate(loja=store, last_update_time=last_update.astimezone(timezone.utc))
            session.add(last_update_record)
        session.commit()
        logger.info(f"Data da última atualização atualizada para a loja {store}")
    except Exception as e:
        logger.error(f"Erro ao atualizar a data da última coleta: {str(e)}", exc_info=True)
        session.rollback()
    finally:
        session.close()

def remover_registros_futuros_e_duplicados():
    session = SessionLocal()
    try:
        # Remover registros futuros de people_counting_data considerando apenas o start_time
        session.execute(text("""
            DELETE FROM people_counting_data
            WHERE start_time > datetime('now');
        """))
        # Remover registros duplicados de people_counting_data considerando start_time, loja e ip
        session.execute(text("""
            DELETE FROM people_counting_data
            WHERE rowid NOT IN (
                SELECT MIN(rowid)
                FROM people_counting_data
                GROUP BY start_time, loja, ip
            );
        """))

        # Remover registros futuros de regional_people_counting_data considerando apenas o start_time
        session.execute(text("""
            DELETE FROM regional_people_counting_data
            WHERE start_time > datetime('now');
        """))
        # Remover registros duplicados de regional_people_counting_data considerando start_time, loja e ip
        session.execute(text("""
            DELETE FROM regional_people_counting_data
            WHERE rowid NOT IN (
                SELECT MIN(rowid)
                FROM regional_people_counting_data
                GROUP BY start_time, loja, ip
            );
        """))

        # Remover registros futuros de heatmap_data considerando apenas o start_time
        session.execute(text("""
            DELETE FROM heatmap_data
            WHERE start_time > datetime('now');
        """))
        # Remover registros duplicados de heatmap_data considerando start_time, loja e ip
        session.execute(text("""
            DELETE FROM heatmap_data
            WHERE rowid NOT IN (
                SELECT MIN(rowid)
                FROM heatmap_data
                GROUP BY start_time, loja, ip
            );
        """))

        session.commit()
        logger.info("Registros futuros e duplicados removidos com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao remover registros futuros e duplicados: {str(e)}", exc_info=True)
        session.rollback()
    finally:
        session.close()

def armazenar_dados_no_banco(dados, model):
    session = SessionLocal()
    try:
        if model == SaleData:
            objetos = [processar_dados_venda_entrada(d) for d in dados if d is not None]
        else:
            objetos = [model(**d) for d in dados]

        for obj in objetos:
            if isinstance(obj, SaleData) and verificar_existencia_duplicada(session, obj):
                logger.warning(f"Dado duplicado encontrado: {obj.referencia_documento}, item: {obj.item}, data: {obj.data}")
                continue
            session.add(obj)

        session.commit()
        logger.info("Dados armazenados no banco de dados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao armazenar dados no banco de dados: {str(e)}", exc_info=True)
        session.rollback()
    finally:
        session.close()

def processar_dados_venda_entrada(dado):
    try:
        dado_processado = {
            'loja': dado['Loja'],
            'data': datetime.strptime(dado['Data'] + dado['Hora'], '%Y%m%d%H:%M:%S'),  # Aqui garantimos a conversão correta
            'codigo': dado['Codigo'],
            'referencia_documento': dado['ReferenciaDocumento'],
            'documento_original': dado['DocumentoOriginal'] if dado['DocumentoOriginal'] else None,
            'tipo_documento': dado['TipoDocumento'],
            'hora': dado['Hora'],
            'vendedor_codigo': dado['VendedorCodigo'],
            'vendedor_nome_curto': dado['VendedorNomeCurto'],
            'item': dado['Item'],
            'descritivo': dado['Descritivo'],
            'quantidade': float(dado['QuantidadeDataTypeNumber'].replace(',', '.')),
            'valor_venda_com_iva': float(dado['Valor venda com IVADataTypeNumber'].replace(',', '.')),
            'valor_venda_sem_iva': float(dado['Valor venda sem IVADataTypeNumber'].replace(',', '.')),
            'iva': float(dado['IVADataTypeNumber'].replace(',', '.')),
            'desconto': float(dado['DescontoDataTypeNumber'].replace(',', '.')),
            'percentual_desconto': float(dado['% DescontoDataTypeNumber'].replace(',', '.')),
            'motivo_desconto': dado['Motivo Desconto'] if dado['Motivo Desconto'] else None
        }
        return SaleData(**dado_processado)
    except Exception as e:
        logger.error(f"Erro ao processar dados de entrada: {str(e)}", exc_info=True)
        return None

def verificar_existencia_duplicada(session, dado):
    existe = session.query(SaleData).filter(
        and_(
            SaleData.referencia_documento == dado.referencia_documento,
            SaleData.item == dado.item,
            SaleData.data == dado.data
        )
    ).first()
    return existe is not None

def resetar_dados_hora_atual(loja, hora_atual):
    session = SessionLocal()
    try:
        
        # Deletar registros de contagem de pessoas da hora atual
        session.execute(text("""
            DELETE FROM people_counting_data
            WHERE loja = :loja AND strftime('%Y-%m-%d %H', start_time) = :hora_atual
        """), {'loja': loja, 'hora_atual': hora_atual.strftime('%Y-%m-%d %H')})

        # Deletar registros de heatmap da hora atual
        session.execute(text("""
            DELETE FROM heatmap_data
            WHERE loja = :loja AND strftime('%Y-%m-%d %H', start_time) = :hora_atual
        """), {'loja': loja, 'hora_atual': hora_atual.strftime('%Y-%m-%d %H')})

        # Deletar registros de contagem regional de pessoas da hora atual
        session.execute(text("""
            DELETE FROM regional_people_counting_data
            WHERE loja = :loja AND strftime('%Y-%m-%d %H', start_time) = :hora_atual
        """), {'loja': loja, 'hora_atual': hora_atual.strftime('%Y-%m-%d %H')})

        session.commit()
        logger.info(f"Dados da hora atual resetados para a loja {loja}.")
    except Exception as e:
        logger.error(f"Erro ao resetar dados da hora atual para a loja {loja}: {str(e)}", exc_info=True)
        session.rollback()
    finally:
        session.close()

# Função de coleta de dados ajustada para receber o tipo de intervalo
def collect_data(interval_type):
    # Verificar se o horário atual está entre 09:00 e 01:00
    hora_atual = datetime.now(timezone.utc).time()

    if not (dt_time(9, 0) <= hora_atual or hora_atual <= dt_time(1, 0)):
        logger.info("Fora do horário permitido (09:00 - 01:00). Coleta de dados não será realizada.")
        return
    
    # Definir o intervalo de coleta de acordo com o tipo de chamada
    if interval_type == "hora_cheia":
        end_date = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(hours=1)
    elif interval_type == "20_minutos":
        # Coleta de 16:00 a 16:19, mas registra como 16:00 a 16:59
        end_date = datetime.now(timezone.utc).replace(minute=59, second=59, microsecond=0)
        start_date = end_date.replace(minute=0, second=0)  # Começo da hora
    elif interval_type == "40_minutos":
        # Coleta de 16:00 a 16:39, mas registra como 16:00 a 16:59
        end_date = datetime.now(timezone.utc).replace(minute=59, second=59, microsecond=0)
        start_date = end_date.replace(minute=0, second=0)  # Começo da hora
    else:
        logger.error("Tipo de intervalo não reconhecido.")
        return

    logger.info(f"Iniciando coleta de dados para intervalo: {interval_type}")
    
    for loja in stores.keys():
        # Obter a data do último update em UTC
        last_update = get_last_update(loja)
        if last_update:
            start_date = last_update
        else:
            # Se não houver registro anterior, usar o intervalo calculado
            start_date = start_date

        # Resetar dados para o horário atual
        resetar_dados_hora_atual(loja, end_date)

        # Processando dados de vendas
        logger.info(f"Coletando dados de vendas para {loja} de {start_date} até {end_date}...")
        total_erros_vendas = 0
        try:
            erros = coletar_e_armazenar_dados_vendas(loja, start_date, end_date)
            total_erros_vendas += erros
        except Exception as e:
            logger.error(f"Erro ao coletar e armazenar dados de vendas para {loja}: {str(e)}", exc_info=True)
            total_erros_vendas += 1

        # Processando dados de contagem de pessoas
        logger.info(f"Coletando dados de contagem de pessoas para {loja}...")
        process_data_for_store_parallel(loja, stores[loja], start_date, end_date, "vcalogcsv&report_type=0&linetype=31&statistics_type=3", parse_people_counting_data, PeopleCountingData)

        # Processando dados de heatmap
        logger.info(f"Coletando dados de heatmap para {loja}...")
        process_data_for_store_parallel(loja, stores[loja], start_date, end_date, "heatmapcsv&sub_type=0", parse_heatmap_data, HeatmapData)

        # Processando dados de contagem regional de pessoas
        logger.info(f"Coletando dados de contagem regional de pessoas para {loja}...")
        process_data_for_store_parallel(loja, stores[loja], start_date, end_date, "regionalcountlogcsv&report_type=0&lengthtype=0&length=0&region1=1&region2=1&region3=1&region4=1", parse_regional_people_counting_data, RegionalPeopleCountingData)

        # Atualizar a data do último update para UTC
        if total_erros_vendas == 0:
            logger.info(f"Todos os dados de vendas foram atualizados com sucesso para {loja}.")
        else:
            logger.info(f"Dados de vendas foram atualizados com {total_erros_vendas} erros para {loja}.")

        set_last_update(loja, end_date)

    # Iniciar o outro script a cada coleta de dados
    iniciar_outro_script()

    # Removendo registros futuros e duplicados
    logger.info("Removendo registros futuros e duplicados...")
    try:
        remover_registros_futuros_e_duplicados()
    except Exception as e:
        logger.error(f"Erro ao remover registros futuros e duplicados: {str(e)}", exc_info=True)

    logger.info("Todos os dados foram atualizados com sucesso.")
    proxima_atualizacao = datetime.now(timezone.utc) + timedelta(minutes=20)
    logger.info(f"Próxima atualização programada para: {proxima_atualizacao.strftime('%Y-%m-%d %H:%M:%S')}")

def schedule_jobs():
    # Agendar coletas para cada intervalo
    schedule.every().hour.at(":00").do(collect_data, "hora_cheia")
    schedule.every().hour.at(":20").do(collect_data, "20_minutos")
    schedule.every().hour.at(":40").do(collect_data, "40_minutos")

# Função principal para executar as tarefas agendadas
def main(): 
    # Coleta inicial ao iniciar o script
    collect_data("hora_cheia")

    # Agendar a coleta de dados para os intervalos desejados
    schedule_jobs()    
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()