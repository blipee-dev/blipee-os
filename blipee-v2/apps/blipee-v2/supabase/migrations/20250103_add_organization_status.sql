-- Add organization status system
-- Status can be: 'setup' (incomplete), 'active', or 'inactive' (manually disabled)

-- Add status column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'inactive'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

-- Create function to calculate organization status automatically
CREATE OR REPLACE FUNCTION calculate_organization_status(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_account_owner_id UUID;
    v_site_count INTEGER;
    v_current_status TEXT;
BEGIN
    -- Get organization details
    SELECT account_owner_id, status INTO v_account_owner_id, v_current_status
    FROM organizations
    WHERE id = org_id;

    -- If manually set to inactive, keep it inactive
    IF v_current_status = 'inactive' THEN
        RETURN 'inactive';
    END IF;

    -- Count sites for this organization
    SELECT COUNT(*) INTO v_site_count
    FROM sites
    WHERE organization_id = org_id;

    -- Determine status
    -- Active: has account_owner AND at least 1 site
    -- Setup: missing account_owner OR no sites
    IF v_account_owner_id IS NOT NULL AND v_site_count > 0 THEN
        RETURN 'active';
    ELSE
        RETURN 'setup';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update organization status
CREATE OR REPLACE FUNCTION update_organization_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-update if not manually set to inactive
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND
       (NEW.status IS NULL OR NEW.status != 'inactive') THEN
        NEW.status := calculate_organization_status(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizations table
DROP TRIGGER IF EXISTS trigger_update_organization_status ON organizations;
CREATE TRIGGER trigger_update_organization_status
    BEFORE INSERT OR UPDATE OF account_owner_id
    ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_status();

-- Create trigger for sites table to update org status when sites are added/removed
CREATE OR REPLACE FUNCTION update_organization_status_from_sites()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Get organization ID from either NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        v_org_id := OLD.organization_id;
    ELSE
        v_org_id := NEW.organization_id;
    END IF;

    -- Update organization status if not manually inactive
    UPDATE organizations
    SET status = calculate_organization_status(v_org_id)
    WHERE id = v_org_id
    AND status != 'inactive';

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_org_status_from_sites ON sites;
CREATE TRIGGER trigger_update_org_status_from_sites
    AFTER INSERT OR UPDATE OR DELETE
    ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_status_from_sites();

-- Update existing organizations to have correct status
UPDATE organizations
SET status = calculate_organization_status(id)
WHERE deleted_at IS NULL;

COMMENT ON COLUMN organizations.status IS 'Organization status: setup (incomplete), active (ready), or inactive (manually disabled by admin)';
