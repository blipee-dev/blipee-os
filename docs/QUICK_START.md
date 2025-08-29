# Quick Start Guide

## Prerequisites

- **Node.js** 20.0 or later
- **npm** 10.0 or later  
- **Supabase account** (free tier works great)
- **AI API key** (at least one of: OpenAI, DeepSeek, or Anthropic)

That's it! No Docker required for development.

## 5-Minute Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/blipee-os.git
cd blipee-os
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Provider (at least one required)
OPENAI_API_KEY=sk-...
# or
DEEPSEEK_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start Development

```bash
npm run dev
```

Visit http://localhost:3000 and start chatting with the AI!

## What Can I Do Now?

Try these conversations with the AI:

- "Show me our carbon emissions for this month"
- "What's our energy usage trend?"
- "Generate an ESG report"
- "Analyze this utility bill" (upload a PDF)
- "What are our sustainability goals?"

## Optional: Local Database

If you need a local PostgreSQL instance for destructive testing:

1. Install Docker Desktop
2. Run `npx supabase start`
3. Update `.env` to use local URLs

Most development can be done with the remote database.

## Next Steps

- Read the [Development Setup Guide](./DEVELOPMENT_SETUP.md) for detailed configuration
- Check out the [Database Optimization Guide](./DATABASE_OPTIMIZATION.md) 
- Explore the [API Documentation](./API_DOCUMENTATION.md)
- Review [Security Best Practices](./SECURITY.md)

## Need Help?

- Join our Discord: [discord.gg/blipee](https://discord.gg/blipee)
- Email support: support@blipee.com
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)