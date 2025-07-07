# Blipee OS - The ChatGPT for Buildings

> Revolutionizing building management through conversational AI. No dashboards. No menus. Just conversation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fblipee-dev%2Fblipee-os)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-blue?style=flat-square&logo=vercel)](https://blipee-os.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-green?style=flat-square&logo=supabase)](https://supabase.com)

## 🚀 Vision

Blipee OS transforms how humans interact with buildings. Instead of navigating through complex dashboards and forms, users simply have a conversation with their building.

**Traditional Way:** Navigate → Click → Search → Configure → Submit → Wait  
**Blipee OS Way:** "Reduce my energy costs by 30%" → Done.

## ✨ Current Status

🎉 **Production Ready** - Full-featured building management platform with multi-tenant architecture

### Latest Updates (January 2025)

- ✅ **Multi-tenant Architecture** - Complete authentication and authorization system
- ✅ **Premium Landing Page** - Beautiful marketing site with animations
- ✅ **Enhanced Auth Pages** - Polished sign-in/sign-up with OAuth support
- ✅ **7-Minute Onboarding** - Streamlined setup with progressive disclosure
- ✅ **Role-Based Access** - 8 hierarchical user roles with granular permissions
- ✅ **Row Level Security** - PostgreSQL RLS for data isolation
- ✅ **Glass Morphism UI** - Premium design system throughout
- ✅ **Production Deployment** - Live on Vercel with CI/CD

### Core Features

- ✅ Natural language building interaction
- ✅ Proactive AI insights and welcomes
- ✅ Dynamic dashboard generation
- ✅ Premium glass morphism design
- ✅ Voice input capabilities
- ✅ Real-time building intelligence
- ✅ Predictive analytics
- ✅ Multi-building support

## 🎯 Quick Start

### Prerequisites

- Node.js 20+ (required)
- Supabase account (free tier works)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/blipee-dev/blipee-os.git
cd blipee-os

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Create `.env.local` with:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI (required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Optional: Alternative AI providers
ANTHROPIC_API_KEY=your_anthropic_key
DEEPSEEK_API_KEY=your_deepseek_key
```

### Database Setup

```bash
# Push database schema to Supabase
npx supabase db push

# Run migrations
npx supabase migration up

# (Optional) Seed with demo data
npm run db:seed
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

**Live Demo:** [blipee-os.vercel.app](https://blipee-os.vercel.app)

## 📚 Documentation

### Core Docs

- **[CLAUDE.md](./CLAUDE.md)** - AI Assistant configuration and development guide
- **[Multi-tenant Architecture](./docs/architecture/MULTI_TENANT_ARCHITECTURE.md)** - Complete auth & permissions system
- [Vision & Philosophy](./docs/vision/VISION.md)
- [System Architecture](./docs/architecture/OVERVIEW.md)
- [Database Schema](./docs/database/SCHEMA.md)

### Development Guides

- [Getting Started](./docs/guides/GETTING_STARTED.md)
- [Authentication Flow](./docs/guides/AUTHENTICATION.md)
- [API Documentation](./docs/api/OVERVIEW.md)
- [Deployment Guide](./docs/deployment/VERCEL.md)
- [Contributing](./docs/guides/CONTRIBUTING.md)

## 🏗️ Architecture & Features

### 🔐 Multi-tenant System

- **8 User Roles**: From Subscription Owner to Guest with hierarchical permissions
- **Row Level Security**: PostgreSQL RLS ensures data isolation
- **Organization Hierarchy**: Support for multiple buildings per organization
- **Granular Permissions**: Control access down to individual building areas
- **OAuth Integration**: Google and Microsoft authentication support

### 🗣️ Conversational AI

- **Natural Language**: Talk to your building like a butler
- **Multi-provider AI**: DeepSeek, OpenAI, Anthropic with intelligent fallbacks
- **Context Awareness**: Remembers conversations and user preferences
- **Proactive Insights**: AI analyzes building data and greets with insights
- **Voice Input**: Hands-free building control

### 📊 Dynamic UI Generation

- **Smart Dashboards**: AI generates building reports on demand
- **Live Visualizations**: Energy, temperature, occupancy charts
- **Tabbed Interface**: Organized building data presentation
- **Real-time Updates**: Live data streaming from building systems
- **Responsive Design**: Perfect on desktop, tablet, and mobile

### 🧠 Building Intelligence

- **Predictive Analytics**: Forecast energy usage and maintenance needs
- **Pattern Recognition**: Learn from building behavior over time
- **Anomaly Detection**: Proactive alerts for unusual patterns
- **Cost Optimization**: AI suggests ways to reduce operational costs
- **ESG Reporting**: Automated sustainability compliance reports

### 🎨 Premium Design System

- **Glass Morphism**: Beautiful translucent UI elements
- **Animated Backgrounds**: Dynamic blob animations
- **Dark/Light Mode**: Automatic theme switching
- **Smooth Transitions**: Framer Motion animations throughout
- **Consistent Styling**: Cohesive design from landing to dashboard

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 3.4 + Glass Morphism
- **Animations:** Framer Motion
- **State:** React Context API
- **Forms:** React Hook Form + Zod

### Backend

- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + OAuth
- **Realtime:** Supabase Realtime subscriptions
- **File Storage:** Supabase Storage

### AI & Intelligence

- **Primary:** DeepSeek R1
- **Fallbacks:** OpenAI GPT-4, Anthropic Claude
- **Voice:** Web Speech API
- **Embeddings:** OpenAI Ada-002

### Infrastructure

- **Hosting:** Vercel
- **CDN:** Vercel Edge Network
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics
- **Development:** GitHub Codespaces

## 🎨 Design Philosophy

1. **Conversation First:** Every interaction starts with natural language
2. **Zero Learning Curve:** If you can talk, you can use Blipee OS
3. **Intelligent Defaults:** The AI understands context and anticipates needs
4. **Beautiful Simplicity:** Clean, modern interface that gets out of the way

## 🚦 Project Roadmap

### ✅ Phase 1-2: MVP Development (COMPLETE)

- Natural language building interaction
- Dynamic dashboard generation
- AI-powered insights
- Voice control integration
- Basic building monitoring

### ✅ Phase 3: Enterprise Features (COMPLETE)

- Multi-tenant architecture with RLS
- 8-tier role hierarchy
- OAuth authentication (Google/Microsoft)
- Organization & building management
- 7-minute onboarding flow
- Premium UI with glass morphism

### 🚧 Phase 4: Production Enhancement (IN PROGRESS)

- Performance optimization
- Advanced analytics dashboard
- Mobile app development
- API documentation
- Integration marketplace

### 🔮 Phase 5: AI Advancement (PLANNED)

- Computer vision for security
- Advanced predictive models
- Autonomous building operations
- Natural language report generation
- Cross-building intelligence network

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fblipee-dev%2Fblipee-os)

#### Manual Deployment Steps:

1. **Fork/Clone Repository**

   ```bash
   git clone https://github.com/blipee-dev/blipee-os.git
   cd blipee-os
   ```

2. **Set Up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run database migrations:
     ```bash
     npx supabase link --project-ref your-project-ref
     npx supabase db push
     ```
   - Enable Row Level Security (RLS) on all tables
   - Create storage bucket named "uploads" with public access

3. **Configure Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Add all required environment variables from `.env.example`
   - At minimum, you need:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY` (or another AI provider)

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables Reference

See `.env.example` for a complete list. Key variables:

- **Required**: Supabase credentials and at least one AI provider key
- **Recommended**: External API keys for weather, carbon data, etc.
- **Optional**: OAuth providers, analytics, error tracking

### Post-Deployment Setup

1. **Configure OAuth Providers** (Optional)
   - Add your production URL to OAuth app settings
   - Update redirect URLs in Supabase Auth settings

2. **Set Up Custom Domain** (Optional)
   - Configure in Vercel project settings
   - Update `NEXT_PUBLIC_APP_URL` environment variable

3. **Enable Analytics** (Optional)
   - Vercel Analytics is automatically available
   - Add `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` if needed

### Production Checklist

- [ ] All environment variables configured
- [ ] Supabase RLS policies enabled
- [ ] Storage bucket configured
- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured (optional)
- [ ] Error tracking set up (optional)
- [ ] Analytics enabled (optional)

## 🤝 Contributing

We're building the future of building management. Interested in contributing? Check out our [Contributing Guide](./CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**"The future of building management isn't more features. It's no features. Just conversation."**
