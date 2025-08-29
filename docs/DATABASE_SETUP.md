# 🗄️ Database Setup Guide - The Proper Way

This guide provides the **enterprise-grade approach** to setting up and maintaining the blipee OS database schema.

## 🎯 Overview

The database setup follows a **layered architecture** approach:
1. **Core Foundation** - Essential enums, tables, and functions
2. **Feature Modules** - Specific functionality (AI, monitoring, etc.)
3. **Optimization** - Indexes, performance tuning
4. **Validation** - Health checks and integrity verification

## 🚀 Quick Setup

### Step 1: Core Foundation
Run the foundational migration first:

```bash
# Apply core schema foundation (CRITICAL - RUN FIRST)
npx supabase db push --include-seed=false
```

Or manually run in Supabase SQL Editor:
```sql
-- Copy and paste the contents of:
-- /supabase/migrations/20250829_00_core_schema_foundation.sql
```

### Step 2: Verify Setup
Check database health:

```bash
# Check via API (requires authentication)
curl -X GET "https://your-app.com/api/database/health?action=validate"

# Or use the database health checker
curl -X GET "https://your-app.com/api/database/health?action=status"
```

### Step 3: Apply Feature Migrations
```bash
# Apply all remaining migrations
npx supabase db push
```

## 📋 Database Schema Architecture

### Core Enums
```sql
-- User roles (hierarchical permissions)
user_role: 'platform_admin' | 'account_owner' | 'admin' | 
           'sustainability_lead' | 'sustainability_manager' | 
           'facility_manager' | 'analyst' | 'reporter' | 'viewer'

-- Invitation status tracking
invitation_status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked'

-- Organization subscription tiers
organization_tier: 'free' | 'starter' | 'professional' | 'enterprise'
```

### Core Tables

#### `organization_members` 
**The Critical Missing Table** - Links users to organizations with role-based access:

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```

#### `organization_settings`
Centralized configuration for organizations:

```sql
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
    tier organization_tier NOT NULL DEFAULT 'free',
    features JSONB DEFAULT '{"ai_streaming": true}',
    ai_preferences JSONB DEFAULT '{"default_provider": "deepseek"}',
    security_settings JSONB DEFAULT '{"require_2fa": false}',
    retention_policies JSONB DEFAULT '{"conversations": 365}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🔒 Security Implementation

### Row Level Security (RLS)
All tables have comprehensive RLS policies:

```sql
-- Example: Organization members can only see their org's data
CREATE POLICY "Users can view organization members"
    ON organization_members
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
```

### Role-Based Access Control
- **Platform Admin**: Full system access
- **Account Owner**: Full organization access  
- **Admin**: Organization management
- **Sustainability Lead/Manager**: ESG data management
- **Facility Manager**: Building operations
- **Analyst**: Data analysis and reporting
- **Reporter**: Report generation
- **Viewer**: Read-only access

## 📊 Health Monitoring

### Database Health API
The system includes comprehensive health monitoring:

```typescript
// Get quick health status
GET /api/database/health?action=status

// Full schema validation
GET /api/database/health?action=validate  

// Generate detailed report
GET /api/database/health?action=report

// Auto-repair issues (platform admin only)
GET /api/database/health?action=repair
```

### Health Metrics
- **Database Connection**: Connectivity test
- **Core Tables**: Essential table existence
- **Enum Validity**: Enum values and constraints
- **RLS Status**: Row Level Security policies
- **Index Performance**: Critical indexes present
- **Overall Score**: 0-100 health percentage

## 🛠️ Troubleshooting

### Common Issues

#### Issue: `invalid input value for enum user_role: "sustainability_manager"`
**Root Cause**: The `user_role` enum doesn't exist or is missing values.

**Solution**: Run the core foundation migration:
```sql
-- Create the enum with all required values
CREATE TYPE user_role AS ENUM (
    'platform_admin', 'account_owner', 'admin',
    'sustainability_lead', 'sustainability_manager', 
    'facility_manager', 'analyst', 'reporter', 'viewer'
);
```

#### Issue: `relation "organization_members" does not exist`
**Root Cause**: Core tables weren't created.

**Solution**: 
```sql
-- Run the complete core foundation migration
-- See: /supabase/migrations/20250829_00_core_schema_foundation.sql
```

#### Issue: `Cannot find project ref. Have you run supabase link?`
**Solution**:
```bash
# Link to your Supabase project
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Manual Fixes

#### Quick Enum Fix
```sql
-- Add missing enum value immediately
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sustainability_manager';
```

#### Emergency Table Creation
```sql
-- Create organization_members table if missing
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```

## 🔍 Validation Tools

### Schema Validator
The system includes a comprehensive schema validator:

```typescript
import { schemaValidator } from '@/lib/database/schema-validator';

// Validate entire schema
const validation = await schemaValidator.validateSchema();

// Auto-repair issues
const repair = await schemaValidator.autoRepairSchema();

// Generate health report  
const report = await schemaValidator.generateSchemaReport();
```

### Migration Order
Migrations must be applied in this order:

1. `20250829_00_core_schema_foundation.sql` ← **CRITICAL FIRST**
2. `20250828_optimization_functions.sql`
3. `20250828_query_monitoring.sql` 
4. `20250829_conversation_memory.sql`
5. All other feature migrations

## 💡 Best Practices

### 1. **Always Validate Before Deploy**
```bash
# Check schema health before deploying
curl -X GET "/api/database/health?action=validate"
```

### 2. **Monitor Health Continuously** 
```bash
# Set up monitoring alerts for health score < 80
GET /api/database/health?action=status
```

### 3. **Use Proper Migration Naming**
```
YYYYMMDD_NN_descriptive_name.sql
20250829_00_core_schema_foundation.sql  # Priority 00 = critical first
20250829_01_feature_addition.sql        # Priority 01 = next
```

### 4. **Test Migrations Locally**
```bash
# Always test locally first
npx supabase start
npx supabase db push
npx supabase db reset  # If needed
```

### 5. **Backup Before Major Changes**
```bash
# Create backup before schema changes
npx supabase db dump -f backup_before_migration.sql
```

## 🎯 Production Deployment Checklist

- [ ] Core foundation migration applied
- [ ] Database health score > 90%
- [ ] All RLS policies active
- [ ] Critical indexes present
- [ ] Enum values complete
- [ ] Functions and triggers working
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

## 📞 Support

If you encounter issues:

1. **Check Health API**: `/api/database/health?action=status`
2. **Run Validation**: `/api/database/health?action=validate` 
3. **Generate Report**: `/api/database/health?action=report`
4. **Review Logs**: Check Supabase dashboard logs
5. **Auto-Repair**: `/api/database/health?action=repair` (admin only)

---

**Remember**: The database is the foundation of blipee OS. Taking time to set it up properly prevents 90% of issues and ensures enterprise-grade reliability! 🚀