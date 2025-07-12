# User Migration Guide

## Overview

This guide explains how users can seamlessly transition between the Telegram bot and web interface, maintaining their data access and preferences across both platforms.

## User Account Linking

### For Existing Telegram Users

1. **Continue using Telegram as normal**
   - No immediate action required
   - All existing commands and data remain accessible
   - Bot continues to work exactly as before

2. **Access the Web Interface**
   - Visit https://retail.blipee.ai
   - Click "Sign in with Telegram"
   - Authorize the web app with your Telegram account
   - Your data is automatically available

3. **Account Linking Process**
   ```
   Telegram Bot          Web Interface
        |                     |
        |   Get Link Code     |
        |<------------------->|
        |                     |
        |   Enter Code        |
        |-------------------->|
        |                     |
        |   Accounts Linked   |
        |<------------------->|
   ```

### For New Users

1. **Starting with Web Interface**
   - Create account at https://retail.blipee.ai
   - Access full dashboard features
   - Optionally link Telegram later

2. **Starting with Telegram Bot**
   - Message @RetailIntelligenceBot
   - Use `/start` command
   - Optionally link web account later

## Data Access Across Interfaces

### What's Shared
- ✅ Store access permissions
- ✅ Historical analytics data
- ✅ Custom report preferences
- ✅ Alert configurations
- ✅ Favorite stores

### Interface-Specific Features

| Feature | Telegram Bot | Web Interface |
|---------|--------------|---------------|
| Quick Reports | ✅ Text-based | ✅ Visual charts |
| Real-time Alerts | ✅ Push notifications | ✅ Dashboard + Email |
| Data Export | ✅ CSV via file | ✅ Multiple formats |
| Historical Analysis | ✅ Last 30 days | ✅ Unlimited |
| Custom Dashboards | ❌ | ✅ |
| AI Predictions | ✅ Basic | ✅ Advanced |

## Permission Mapping

### Role Translation

| Telegram Role | Web Interface Role | Permissions |
|---------------|-------------------|-------------|
| Admin | Organization Owner | Full access to all stores and settings |
| Manager | Store Manager | Manage assigned stores, view analytics |
| User | Analyst | View analytics, generate reports |
| Viewer | Viewer | Read-only access to assigned stores |

### Store Access

Store access is automatically synchronized:

```python
# Example: User has access to these stores in Telegram
Telegram: ["OML01", "OML02", "OML03"]

# Same access in web interface
Web: ["OML01-Omnia GuimarãesShopping", 
      "OML02-Omnia Fórum Almada",
      "OML03-Omnia Norteshopping"]
```

## Migration Process

### Step 1: Account Discovery

The system automatically detects existing users:

```sql
-- System checks for existing Telegram users
SELECT * FROM retail.user_mappings 
WHERE telegram_user_id = '123456789';
```

### Step 2: Verification

For security, users verify their identity:

**Via Telegram:**
1. Bot sends verification code
2. User enters code in web interface
3. Accounts are linked

**Via Email:**
1. Enter email used in web account
2. Receive verification link
3. Click to confirm linking

### Step 3: Data Synchronization

Once linked, data syncs automatically:
- Preferences merged (web takes precedence for conflicts)
- Historical data available in both interfaces
- Real-time updates across platforms

## User Workflows

### Daily Operations Manager

**Morning Routine:**
1. Receive Telegram alert: "Store opening in 30 minutes"
2. Check quick metrics via `/analise` command
3. Open web dashboard for detailed review
4. Set daily targets in web interface
5. Receive progress updates via Telegram throughout the day

### Regional Manager

**Weekly Analysis:**
1. Generate weekly report via Telegram: `/relatorio semanal`
2. Access web interface for deep-dive analysis
3. Create custom visualizations
4. Share insights with team
5. Set up alerts for anomalies

### Executive

**Monthly Review:**
1. Receive monthly summary via Telegram
2. Access executive dashboard on web
3. Review AI predictions and recommendations
4. Export data for board presentation

## Common Scenarios

### Scenario 1: Telegram User Wants Web Features

```
User: I want to see charts for my data
Bot: Great! You can access visual analytics at https://retail.blipee.ai
     Use /link to get your access code
User: /link
Bot: Your access code is: ABC123
     Enter this code when signing up on the web interface
```

### Scenario 2: Web User Wants Mobile Alerts

```
Web Interface: Enable Telegram Notifications
User: [Clicks Enable]
System: Scan this QR code with Telegram
User: [Scans QR code]
Bot: Welcome! Your accounts are now linked.
     You'll receive alerts here for your web dashboard settings.
```

### Scenario 3: Switching Between Interfaces

```
Morning (Telegram):
/trafego OML01
> Current traffic: 45 people

Afternoon (Web):
- Views detailed traffic patterns
- Identifies peak hours
- Sets staff optimization alert

Evening (Telegram):
[Alert] Staff optimization needed at OML01
> Traffic exceeds threshold: 150 people
```

## Privacy and Security

### Data Protection
- Each interface maintains separate sessions
- Linking requires explicit user consent
- Users can unlink accounts at any time
- Data deletion affects both interfaces

### Security Best Practices
1. Use different passwords for web account
2. Enable 2FA on both platforms
3. Regularly review linked devices
4. Monitor access logs

## Unlinking Accounts

### Via Web Interface
1. Go to Settings > Linked Accounts
2. Click "Unlink Telegram"
3. Confirm action

### Via Telegram Bot
1. Send `/unlink` command
2. Confirm with verification code
3. Accounts are separated

**Note:** Unlinking doesn't delete data, it only removes the connection between accounts.

## FAQ

**Q: Will my Telegram bot stop working if I don't link accounts?**
A: No, the Telegram bot continues to work independently.

**Q: Can I use different stores in each interface?**
A: No, store access is synchronized for consistency.

**Q: What happens to my data if I unlink accounts?**
A: Data remains in both systems but stops syncing.

**Q: Can multiple Telegram accounts link to one web account?**
A: No, it's a 1:1 relationship for security.

**Q: How long does the migration take?**
A: Account linking is instant. Historical data may take a few minutes to appear.

## Support

Need help with migration?
- Telegram: Send `/help migration` to the bot
- Web: Click the support chat icon
- Email: support@blipee.ai