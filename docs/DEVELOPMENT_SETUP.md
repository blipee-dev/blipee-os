# Development Setup Guide

## Quick Start (Recommended)

You can start developing immediately using the remote Supabase instance:

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your Supabase credentials to .env
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start development server
npm run dev
```

That's it! Visit http://localhost:3000 and start building.

## Local Database (Optional)

If you need a local database for destructive testing or offline development:

### Prerequisites
- Docker Desktop installed and running
- Supabase CLI installed (`npm install -g supabase`)

### Setup
```bash
# Start local Supabase
npx supabase start

# Push database schema
npx supabase db push

# Stop when done
npx supabase stop
```

## Which Setup Should I Use?

### Use Remote Database (Default) When:
- Building features quickly
- Working with the team
- Testing with real data
- Normal development tasks

### Use Local Database When:
- Testing destructive operations
- Working offline
- Testing migrations
- Performance benchmarking

## Environment Configuration

### Remote Database (.env)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Local Database (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

## Commands

All commands work with both local and remote databases:

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript

# Database
npm run db:optimize analyze      # Analyze database performance
npm run db:optimize create-core  # Create optimized indexes

# Testing
npm test                # Run tests
npm run test:security   # Security tests
```

## Troubleshooting

### Remote Database Issues
1. Check your internet connection
2. Verify Supabase credentials in .env
3. Check Supabase dashboard for service status

### Local Database Issues (if using)
1. Ensure Docker is running
2. Check port 54321 is not in use
3. Run `npx supabase status` to debug

## Next Steps

1. Set up your .env file with Supabase credentials
2. Run `npm run dev`
3. Start building features!

The majority of development can be done with the remote database. Local setup is entirely optional.