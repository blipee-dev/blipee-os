# Telegram Bot Setup Guide

## Overview

This guide explains how to set up and configure the Telegram bot to work with the new Retail Intelligence system while maintaining full compatibility with existing functionality.

## Prerequisites

- Existing Telegram Bot Token (from @BotFather)
- Access to the Retail Intelligence API
- Python 3.8+ (for existing bot)
- API key for bot authentication

## Setup Options

### Option 1: Use Existing Bot with New API (Recommended)

This approach keeps your existing Python bot running but connects it to the new system.

#### Step 1: Generate API Key

```bash
# Request an API key for your bot
curl -X POST https://retail.blipee.ai/api/v1/keys \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Telegram Bot - Production",
    "permissions": {
      "stores": ["OML01", "OML02", "OML03", "ONL01", "ONL02"],
      "endpoints": ["/api/v1/*"],
      "rate_limit": 1000
    }
  }'
```

Save the returned API key securely.

#### Step 2: Update Bot Configuration

Add to your bot's environment variables:

```bash
# .env file
TELEGRAM_BOT_TOKEN=your-existing-bot-token
API_BASE_URL=https://retail.blipee.ai
TELEGRAM_API_KEY=your-generated-api-key

# Remove old database configuration
# DATABASE_PATH=/path/to/bot_database.db  # No longer needed
```

#### Step 3: Install Compatibility Wrapper

Copy the [Python Compatibility Wrapper](deployment/PYTHON_COMPATIBILITY_WRAPPER.py) to your bot directory:

```bash
wget https://raw.githubusercontent.com/your-repo/retail-intelligence/main/docs/deployment/PYTHON_COMPATIBILITY_WRAPPER.py
mv PYTHON_COMPATIBILITY_WRAPPER.py retail_api.py
```

#### Step 4: Update Bot Code

Minimal changes to your existing bot:

```python
# bot.py - Example updates

import os
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from retail_api import RetailAPIWrapper
import asyncio
from datetime import datetime

# Initialize API client
API_BASE_URL = os.getenv('API_BASE_URL', 'https://retail.blipee.ai')
api_client = RetailAPIWrapper(API_BASE_URL)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    chat_id = update.effective_chat.id
    
    # Authenticate user with new system
    async with RetailAPIWrapper(API_BASE_URL) as api:
        auth_result = await api.authenticate_telegram_user(
            telegram_user_id=str(user.id),
            telegram_username=user.username,
            chat_id=str(chat_id)
        )
    
    welcome_message = f"Bem-vindo {user.first_name}! 👋\n\n"
    welcome_message += "Comandos disponíveis:\n"
    welcome_message += "/lojas - Ver lojas disponíveis\n"
    welcome_message += "/analise - Análise de vendas\n"
    welcome_message += "/trafego - Tráfego em tempo real\n"
    
    await update.message.reply_text(welcome_message)

async def lojas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /lojas command"""
    async with RetailAPIWrapper(API_BASE_URL) as api:
        stores = await api.get_stores()
        
    if stores:
        message = "🏪 Lojas disponíveis:\n\n"
        for store in stores:
            message += f"• {store['name']} ({store['code']})\n"
    else:
        message = "Nenhuma loja encontrada."
    
    await update.message.reply_text(message)

async def analise(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /analise command"""
    # Store selection logic here...
    
    # Get analytics for selected store
    async with RetailAPIWrapper(API_BASE_URL) as api:
        analytics = await api.get_daily_report(
            loja='OML01-Omnia GuimarãesShopping',
            date=datetime.now()
        )
    
    if analytics and analytics.get('vendas'):
        vendas = analytics['vendas']
        trafego = analytics['trafego']
        conversao = analytics['conversao']
        
        message = f"📊 Análise de Hoje:\n\n"
        message += f"💰 Vendas: €{vendas['total_com_iva']:,.2f}\n"
        message += f"🛍️ Transações: {vendas['transacoes']}\n"
        message += f"🎯 Ticket Médio: €{vendas['ticket_medio']:,.2f}\n\n"
        message += f"👥 Visitantes: {trafego['visitantes']:,}\n"
        message += f"📈 Taxa de Conversão: {conversao['taxa_conversao']:.1f}%\n"
    else:
        message = "Não foi possível obter os dados de análise."
    
    await update.message.reply_text(message)

def main():
    """Start the bot"""
    # Create application
    application = Application.builder().token(os.getenv('TELEGRAM_BOT_TOKEN')).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("lojas", lojas))
    application.add_handler(CommandHandler("analise", analise))
    
    # Run the bot
    application.run_polling()

if __name__ == '__main__':
    main()
```

### Option 2: Deploy with Docker Compose

Use the provided Docker Compose configuration:

```yaml
# docker-compose.yml
version: '3.8'

services:
  telegram-bot:
    image: your-bot-image
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - API_BASE_URL=http://api:3001
      - TELEGRAM_API_KEY=${TELEGRAM_API_KEY}
    depends_on:
      - api
    restart: unless-stopped
```

## Bot Commands Reference

Maintain your existing commands, they'll work with the new API:

| Command | Description | API Endpoint Used |
|---------|-------------|------------------|
| `/start` | Initialize bot | `/api/v1/auth/telegram` |
| `/lojas` | List stores | `/api/v1/stores` |
| `/analise [loja]` | Sales analysis | `/api/v1/analytics` |
| `/trafego [loja]` | Real-time traffic | `/api/v1/traffic/realtime` |
| `/relatorio` | Generate report | `/api/v1/analytics` |
| `/ajuda` | Help message | Local |

## Testing Your Bot

### 1. Test API Connection

```python
# test_connection.py
import asyncio
from retail_api import RetailAPIWrapper

async def test():
    api = RetailAPIWrapper('https://retail.blipee.ai')
    
    # Test authentication
    auth = await api.authenticate_telegram_user(
        telegram_user_id='test_123',
        telegram_username='test_user',
        chat_id='chat_123'
    )
    print(f"Auth result: {auth}")
    
    # Test stores
    stores = await api.get_stores()
    print(f"Stores: {stores}")

asyncio.run(test())
```

### 2. Test Bot Commands

Send these commands to your bot:
```
/start
/lojas
/analise OML01
/trafego OML01
```

## Migration Checklist

- [ ] Generate API key for bot
- [ ] Update environment variables
- [ ] Install compatibility wrapper
- [ ] Update database queries to use API
- [ ] Test all bot commands
- [ ] Monitor API usage
- [ ] Update error handling
- [ ] Deploy updated bot

## Troubleshooting

### Bot not responding
1. Check API health: `curl https://retail.blipee.ai/api/v1/health`
2. Verify API key: Check `X-API-Key` header is sent
3. Check bot logs for errors

### Authentication errors
1. Ensure API key has correct permissions
2. Verify Telegram user ID format (string)
3. Check API base URL configuration

### Data format issues
1. The compatibility wrapper handles format conversion
2. Check wrapper version is up to date
3. Review API response in logs

## Advanced Configuration

### Rate Limiting
The API allows 1000 requests per minute per API key. Monitor usage:

```python
# Check rate limit headers
response_headers = {
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Remaining': '995',
    'X-RateLimit-Reset': '1704121200'
}
```

### Webhook Support
For production, consider using webhooks instead of polling:

```python
# Webhook setup
application.run_webhook(
    listen="0.0.0.0",
    port=8443,
    url_path=TELEGRAM_BOT_TOKEN,
    webhook_url=f"https://your-domain.com/{TELEGRAM_BOT_TOKEN}"
)
```

## Support

For issues or questions:
1. Check API documentation: [API Compatibility Guide](api/API_COMPATIBILITY_GUIDE.md)
2. Review update guide: [Telegram Bot Update Guide](deployment/TELEGRAM_BOT_UPDATE_GUIDE.md)
3. Test with provided examples
4. Monitor both bot and API logs