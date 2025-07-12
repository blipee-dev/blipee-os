#!/usr/bin/env python3
"""
Compatibility wrapper for existing Python/Telegram bot to use new API
This allows the existing bot to continue working while transitioning to the new system
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import aiohttp
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RetailAPIWrapper:
    """Wrapper to make the new API compatible with existing Python code"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key or os.getenv('TELEGRAM_API_KEY')
        self.session = None
        self._headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        } if self.api_key else {'Content-Type': 'application/json'}
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self._headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate_telegram_user(
        self, 
        telegram_user_id: str, 
        telegram_username: Optional[str] = None,
        chat_id: str = None
    ) -> Dict[str, Any]:
        """Authenticate Telegram user with new API"""
        url = urljoin(self.base_url, '/api/v1/auth/telegram')
        data = {
            'telegram_user_id': str(telegram_user_id),
            'telegram_username': telegram_username,
            'chat_id': str(chat_id)
        }
        
        async with self.session.post(url, json=data) as resp:
            return await resp.json()
    
    async def get_analytics(
        self,
        loja: str,
        start_date: datetime,
        end_date: datetime,
        metric_type: str = 'all'
    ) -> Dict[str, Any]:
        """Get analytics data - compatible with existing bot queries"""
        url = urljoin(self.base_url, '/api/v1/analytics')
        params = {
            'loja': loja,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'metric_type': metric_type
        }
        
        async with self.session.get(url, params=params) as resp:
            result = await resp.json()
            
            # Transform to match existing bot's expected format if needed
            if result.get('success') and result.get('data'):
                return self._transform_analytics_response(result['data'])
            return result
    
    async def get_realtime_traffic(self, loja: str) -> Dict[str, Any]:
        """Get real-time traffic data"""
        url = urljoin(self.base_url, '/api/v1/traffic/realtime')
        params = {'loja': loja}
        
        async with self.session.get(url, params=params) as resp:
            return await resp.json()
    
    async def get_stores(self) -> List[Dict[str, Any]]:
        """Get available stores"""
        url = urljoin(self.base_url, '/api/v1/stores')
        
        async with self.session.get(url) as resp:
            result = await resp.json()
            if result.get('success'):
                return result.get('stores', [])
            return []
    
    async def update_bot_state(
        self,
        chat_id: str,
        state: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Update Telegram bot conversation state"""
        url = urljoin(self.base_url, '/api/v1/telegram/state')
        data = {
            'chat_id': str(chat_id),
            'state': state,
            'context': context or {}
        }
        
        async with self.session.post(url, json=data) as resp:
            return await resp.json()
    
    async def get_bot_state(self, chat_id: str) -> Dict[str, Any]:
        """Get Telegram bot conversation state"""
        url = urljoin(self.base_url, '/api/v1/telegram/state')
        params = {'chat_id': str(chat_id)}
        
        async with self.session.get(url, params=params) as resp:
            return await resp.json()
    
    def _transform_analytics_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform API response to match existing bot's expected format"""
        # The new API already returns data in the expected format
        # This method is here for any future transformations needed
        return data
    
    # Compatibility methods for existing bot code
    async def get_daily_report(self, loja: str, date: datetime) -> Dict[str, Any]:
        """Get daily report - wrapper for analytics API"""
        start_date = date.replace(hour=0, minute=0, second=0)
        end_date = date.replace(hour=23, minute=59, second=59)
        return await self.get_analytics(loja, start_date, end_date)
    
    async def get_weekly_report(self, loja: str, end_date: datetime) -> Dict[str, Any]:
        """Get weekly report - wrapper for analytics API"""
        start_date = end_date - timedelta(days=6)
        return await self.get_analytics(loja, start_date, end_date)
    
    async def get_monthly_report(self, loja: str, year: int, month: int) -> Dict[str, Any]:
        """Get monthly report - wrapper for analytics API"""
        import calendar
        start_date = datetime(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime(year, month, last_day, 23, 59, 59)
        return await self.get_analytics(loja, start_date, end_date)


# Drop-in replacement for existing database queries
class CompatibilityDB:
    """Database compatibility layer for existing bot code"""
    
    def __init__(self, api_wrapper: RetailAPIWrapper):
        self.api = api_wrapper
    
    async def get_analytics_results(
        self,
        loja: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Mimics the existing analytics_results query"""
        result = await self.api.get_analytics(loja, start_date, end_date)
        
        # Transform to match SQLite query result format
        if result.get('success') and result.get('data'):
            data = result['data']
            return {
                'loja': data['loja'],
                'data_inicio': data['periodo']['inicio'],
                'data_fim': data['periodo']['fim'],
                'total_vendas_com_iva': data['vendas']['total_com_iva'],
                'total_vendas_sem_iva': data['vendas']['total_sem_iva'],
                'transacoes_vendas': data['vendas']['transacoes'],
                'visitantes': data['trafego']['visitantes'],
                'taxa_conversao': data['conversao']['taxa_conversao'],
                'tempo_medio_permanencia': data['conversao']['tempo_medio_permanencia'],
                'ticket_medio_com_iva': data['vendas']['ticket_medio'],
                'entry_rate': data['trafego']['entry_rate'],
                'total_passagens': data['trafego']['total_passagens'],
                'ultima_coleta': data['ultima_atualizacao'],
                'top_vendedores': json.dumps(data['top_performers']['vendedores']),
                'top_produtos': json.dumps(data['top_performers']['produtos']),
                'ocupacao_regioes': json.dumps(data['regioes']['ocupacao']),
                'top_2_regioes_ocupadas': json.dumps(data['regioes']['top_2']),
                'menos_2_regioes_ocupadas': json.dumps(data['regioes']['bottom_2'])
            }
        return None


# Example usage in existing bot
async def main():
    """Example of how to use the wrapper in existing bot code"""
    
    # Initialize the API wrapper
    api_url = os.getenv('API_BASE_URL', 'http://localhost:3001')
    
    async with RetailAPIWrapper(api_url) as api:
        # Authenticate user
        auth_result = await api.authenticate_telegram_user(
            telegram_user_id='123456789',
            telegram_username='test_user',
            chat_id='987654321'
        )
        print(f"Auth result: {auth_result}")
        
        # Get stores
        stores = await api.get_stores()
        print(f"Available stores: {[s['name'] for s in stores]}")
        
        # Get analytics
        if stores:
            analytics = await api.get_daily_report(
                loja=stores[0]['name'],
                date=datetime.now()
            )
            print(f"Today's sales: {analytics.get('vendas', {}).get('total_com_iva', 0)}")
        
        # Get real-time traffic
        if stores:
            traffic = await api.get_realtime_traffic(stores[0]['name'])
            print(f"Current occupancy: {traffic.get('data', {}).get('current_occupancy', 0)}")


if __name__ == '__main__':
    asyncio.run(main())