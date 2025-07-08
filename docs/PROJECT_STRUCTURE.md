# Blipee OS Project Structure

## Directory Organization

```
blipee-os/
├── src/                    # Source code
│   ├── app/               # Next.js 14 app directory
│   ├── components/        # React components
│   ├── lib/              # Core libraries
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│
├── supabase/              # Database
│   ├── migrations/       # Database migrations
│   │   └── FINAL_FORTUNE10_MIGRATION.sql
│   └── functions/        # Edge functions
│
├── public/                # Static assets
├── docs/                  # Documentation
├── scripts/              # Utility scripts
├── tests/                # Test files
└── .env.local            # Environment variables
```

## Key Directories

### `/src/lib/` - Core Business Logic
- `ai/` - Multi-provider AI system
- `auth/` - Authentication services
- `api/` - API utilities
- `data/` - Data processing
- `supabase/` - Database client

### `/src/components/` - UI Components
- `dashboard/` - Dashboard components
- `dynamic/` - AI-generated UI
- `emissions/` - Emissions tracking
- `ui/` - Reusable UI components

### `/supabase/migrations/`
- `FINAL_FORTUNE10_MIGRATION.sql` - Complete Fortune 10 schema (150+ tables)
- `README.md` - Migration instructions

### `/scripts/`
- `setup.sh` - Initial setup
- `migrate-to-v2.sh` - Database migration

## Clean Code Practices

1. **No temporary files** in root directory
2. **All tests** in `/tests/` directory
3. **Documentation** in `/docs/`
4. **Archives** are gitignored
5. **Environment files** never committed

## Fortune 10 Standards

- ✅ Clean directory structure
- ✅ Clear separation of concerns
- ✅ Proper gitignore rules
- ✅ Documentation in place
- ✅ No clutter or temporary files