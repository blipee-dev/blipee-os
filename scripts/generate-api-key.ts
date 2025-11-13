/**
 * Script para gerar API Key para cliente
 *
 * Uso:
 * npm run generate-api-key -- --org=<organization-id> --name="Power BI Production"
 *
 * Ou interativo:
 * npm run generate-api-key
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface para linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Gerar API key segura
function generateApiKey(): string {
  const randomPart = crypto.randomUUID().replace(/-/g, '');
  return `sk_live_${randomPart}`;
}

// Buscar organizações disponíveis
async function listOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('❌ Erro ao buscar organizações:', error.message);
    return [];
  }

  return data || [];
}

// Criar API key
async function createApiKey(organizationId: string, name: string, description?: string) {
  const apiKey = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: organizationId,
      key: apiKey,
      name,
      description,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar API key:', error.message);
    return null;
  }

  return { ...data, key: apiKey };
}

// Modo interativo
async function interactiveMode() {
  console.log('\n🔑 Gerador de API Keys - Blipee Power BI Integration\n');

  // Listar organizações
  console.log('📋 Buscando organizações...\n');
  const orgs = await listOrganizations();

  if (orgs.length === 0) {
    console.error('❌ Nenhuma organização encontrada.');
    rl.close();
    return;
  }

  console.log('Organizações disponíveis:\n');
  orgs.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.id})`);
  });
  console.log('');

  // Selecionar organização
  const orgIndexStr = await question('Selecione organização (número): ');
  const orgIndex = parseInt(orgIndexStr) - 1;

  if (orgIndex < 0 || orgIndex >= orgs.length) {
    console.error('❌ Seleção inválida.');
    rl.close();
    return;
  }

  const selectedOrg = orgs[orgIndex];
  console.log(`\n✓ Selecionado: ${selectedOrg.name}\n`);

  // Nome da key
  const name = await question('Nome para a API key (ex: "Power BI Production"): ');
  if (!name.trim()) {
    console.error('❌ Nome é obrigatório.');
    rl.close();
    return;
  }

  // Descrição (opcional)
  const description = await question('Descrição (opcional, Enter para pular): ');

  // Criar key
  console.log('\n🔄 Criando API key...\n');
  const result = await createApiKey(
    selectedOrg.id,
    name.trim(),
    description.trim() || undefined
  );

  if (!result) {
    rl.close();
    return;
  }

  // Mostrar resultado
  console.log('✅ API Key criada com sucesso!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 INFORMAÇÃO DO CLIENTE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Organization ID:  ${selectedOrg.id}`);
  console.log(`Organization:     ${selectedOrg.name}`);
  console.log(`Key Name:         ${result.name}`);
  if (result.description) {
    console.log(`Description:      ${result.description}`);
  }
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔑 API KEY (guardar em local seguro!)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   ${result.key}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - Esta key só é mostrada UMA VEZ');
  console.log('   - Guardar num password manager');
  console.log('   - Não partilhar por email/chat inseguro');
  console.log('   - Usar encryption se enviar ao cliente\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Gerar ficheiro de credenciais
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.blipee.com';
  const credentialsContent = `
Blipee Power BI Integration - Credenciais
==========================================

Organização: ${selectedOrg.name}
Organization ID: ${selectedOrg.id}

API Key: ${result.key}

API Base URL: ${baseUrl}/api/powerbi

🧪 TESTE RÁPIDO (2 minutos)
===========================
Antes de configurar Power BI, testar se credenciais funcionam:

1. Abrir no browser:
   ${baseUrl}/api/powerbi/test?organizationId=${selectedOrg.id}

2. Quando pedir password, colar a API Key acima

3. Deve aparecer: "Connection successful"

Endpoints Disponíveis:
======================
- Test: /api/powerbi/test
- Emissions: /api/powerbi/emissions
- Sites: /api/powerbi/sites

Exemplo de uso:
===============
GET /api/powerbi/emissions?organizationId=${selectedOrg.id}&startDate=2024-01-01&endDate=2024-12-31
Header: x-api-key: ${result.key}

Criado em: ${new Date().toLocaleString('pt-PT')}
Criado por: ${process.env.USER || 'system'}

⚠️ CONFIDENCIAL - Guardar em local seguro
`.trim();

  const filename = `credentials_${selectedOrg.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;

  console.log(`💾 Guardar credenciais num ficheiro? (${filename})`);
  const save = await question('   [Y/n]: ');

  if (save.toLowerCase() !== 'n') {
    const fs = require('fs');
    const path = require('path');
    const filepath = path.join(process.cwd(), 'credentials', filename);

    // Criar diretório se não existe
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, credentialsContent);
    console.log(`\n✓ Ficheiro guardado: ${filepath}\n`);
  }

  rl.close();
}

// Modo comando (argumentos)
async function commandMode() {
  const args = process.argv.slice(2);
  const orgArg = args.find(arg => arg.startsWith('--org='));
  const nameArg = args.find(arg => arg.startsWith('--name='));
  const descArg = args.find(arg => arg.startsWith('--desc='));

  if (!orgArg || !nameArg) {
    console.error('❌ Argumentos insuficientes.');
    console.log('\nUso:');
    console.log('  npm run generate-api-key -- --org=<organization-id> --name="Nome da Key" [--desc="Descrição"]');
    console.log('\nOu modo interativo:');
    console.log('  npm run generate-api-key\n');
    return;
  }

  const organizationId = orgArg.split('=')[1];
  const name = nameArg.split('=')[1].replace(/['"]/g, '');
  const description = descArg ? descArg.split('=')[1].replace(/['"]/g, '') : undefined;

  console.log('\n🔄 Criando API key...\n');
  const result = await createApiKey(organizationId, name, description);

  if (!result) {
    return;
  }

  console.log('✅ API Key criada com sucesso!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Organization ID:  ${organizationId}`);
  console.log(`Key Name:         ${result.name}`);
  console.log('');
  console.log('🔑 API KEY:');
  console.log(`   ${result.key}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Modo interativo
    await interactiveMode();
  } else {
    // Modo comando
    await commandMode();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erro:', error.message);
  process.exit(1);
});
