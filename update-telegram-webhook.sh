#!/bin/bash

# Update Telegram webhook to point to the deployed Blipee OS

echo "🔄 Updating Telegram webhook..."
echo "Target URL: https://blipee-os.vercel.app/api/retail/v1/telegram/webhook"

# Update the main production bot
curl -X POST https://api.telegram.org/bot7320381187:AAGGqR6KIQySaEP7P_ucCf_9HV-gku7duM8/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://blipee-os.vercel.app/api/retail/v1/telegram/webhook"}' \
  | jq .

echo -e "\n✅ Webhook updated! Your Telegram bot is now connected to the retail module."
echo -e "\n📱 Test it by sending these commands to your bot:"
echo "  /start - Welcome message"
echo "  /sales OML01 - Get sales data for store OML01"
echo "  /traffic OML01 - Get people counting data"
echo "  /help - List all commands"