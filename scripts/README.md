# Blipee OS Scripts

This directory contains utility scripts for managing Blipee OS.

## Available Scripts

### create-demo-user.ts
Creates a test user account with a confirmed email and sets up a demo organization.

**Usage:**
```bash
# Make sure you have your environment variables set up
cp .env.example .env.local
# Add your SUPABASE_SERVICE_KEY to .env.local

# Run the script
npx tsx scripts/create-demo-user.ts
```

**What it creates:**
- User account: `demo@blipee.com` / `demo123456`
- Organization: "Demo Organization"
- Building: "Demo Building" in San Francisco

**Features:**
- Automatically confirms the email address
- Handles existing users gracefully (updates password)
- Creates organization with professional tier
- Sets up a demo building with metadata

### create-demo-data.ts
Creates a more comprehensive demo dataset including multiple buildings, team members, and work orders.

**Usage:**
```bash
npx tsx scripts/create-demo-data.ts
```

### Other Scripts
- `populate-sustainability-data.ts` - Populates sustainability metrics
- `extract-report-data.ts` - Extracts data from sustainability reports
- `setup.sh` - Initial setup script for the project

## Environment Variables

All scripts require the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (admin access)

## Notes

- The service role key has admin privileges - keep it secure
- These scripts are meant for development and testing
- Always backup your data before running scripts in production