# Scripts Directory

## Active Scripts

### 🚀 Setup & Migration
- `setup.sh` - Initial project setup
- `migrate-to-v2.sh` - Migrate database to Fortune 10 schema

## Usage

### Initial Setup
```bash
./scripts/setup.sh
```

### Database Migration
```bash
# Migrate to Fortune 10 schema (will DROP all data!)
./scripts/migrate-to-v2.sh
```

## Archived Scripts

Old scripts have been moved to `archive/old_scripts/`:
- `auth_fixes/` - Old authentication fixes
- `demo_data/` - Demo data creation scripts
- `migration_tests/` - Migration testing scripts
- `analysis/` - Database analysis scripts

These are kept for reference but are no longer needed with the Fortune 10 schema.