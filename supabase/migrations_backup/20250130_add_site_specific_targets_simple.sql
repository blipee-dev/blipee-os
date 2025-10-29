-- Simple migration to add site-specific target support

-- Check if sustainability_targets table exists and add site_id column
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'sustainability_targets') THEN

        -- Add site_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public'
                       AND table_name = 'sustainability_targets'
                       AND column_name = 'site_id') THEN
            ALTER TABLE sustainability_targets
            ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;

            -- Add index for performance
            CREATE INDEX idx_targets_site ON sustainability_targets(site_id);
        END IF;

        -- Ensure is_active column exists (might be needed)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public'
                       AND table_name = 'sustainability_targets'
                       AND column_name = 'is_active') THEN
            ALTER TABLE sustainability_targets
            ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;

    ELSE
        -- Create a simple targets table if it doesn't exist
        CREATE TABLE sustainability_targets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
            target_type VARCHAR(50) NOT NULL DEFAULT 'near-term',
            target_scope VARCHAR(50) DEFAULT 'all_scopes',
            target_reduction_percent DECIMAL(5,2) NOT NULL DEFAULT 42.0,
            baseline_year INTEGER NOT NULL DEFAULT 2022,
            target_year INTEGER NOT NULL DEFAULT 2030,
            sbti_ambition VARCHAR(20) DEFAULT '1.5C',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Add indexes
        CREATE INDEX idx_targets_org ON sustainability_targets(organization_id);
        CREATE INDEX idx_targets_site ON sustainability_targets(site_id);
        CREATE INDEX idx_targets_active ON sustainability_targets(is_active);
    END IF;
END $$;

-- Add comment to explain the site_id usage
COMMENT ON COLUMN sustainability_targets.site_id IS
'Optional: Links target to specific site. NULL means organization-wide target that applies to all sites.';

-- Sample data showing how site-specific targets work (optional - remove in production)
-- This demonstrates how different sites can have different reduction targets:
-- INSERT INTO sustainability_targets (organization_id, site_id, target_reduction_percent, target_type, baseline_year, target_year, sbti_ambition)
-- VALUES
-- ('org-uuid', NULL, 42.0, 'near-term', 2022, 2030, '1.5C'),  -- Org-wide default: 42%
-- ('org-uuid', 'lisboa-uuid', 45.0, 'near-term', 2022, 2030, '1.5C'),  -- Lisboa office: 45% (easier)
-- ('org-uuid', 'porto-uuid', 35.0, 'near-term', 2022, 2030, '1.5C');  -- Porto facility: 35% (harder)