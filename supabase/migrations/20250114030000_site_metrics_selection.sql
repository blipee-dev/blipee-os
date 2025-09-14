-- Site-specific metrics selection
-- This allows each site to have its own relevant metrics while organization inherits all

CREATE TABLE IF NOT EXISTS site_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  baseline_value DECIMAL, -- Optional baseline for this site
  target_value DECIMAL, -- Optional target for this site
  target_date DATE, -- Optional target date
  responsible_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, metric_id)
);

-- Indexes
CREATE INDEX idx_site_metrics_site_id ON site_metrics(site_id);
CREATE INDEX idx_site_metrics_metric_id ON site_metrics(metric_id);
CREATE INDEX idx_site_metrics_org_id ON site_metrics(organization_id);

-- RLS Policies
ALTER TABLE site_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view site metrics for their organization" ON site_metrics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT user_id FROM super_admins)
    OR
    auth.uid() IN (SELECT auth_user_id FROM app_users WHERE role = 'super_admin')
  );

CREATE POLICY "Managers can manage site metrics" ON site_metrics
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
    OR
    auth.uid() IN (SELECT user_id FROM super_admins)
    OR
    auth.uid() IN (SELECT auth_user_id FROM app_users WHERE role = 'super_admin')
  );

-- Function to get organization's aggregated metrics (all site metrics + org-level metrics)
CREATE OR REPLACE FUNCTION get_organization_aggregated_metrics(org_id UUID)
RETURNS TABLE (
  metric_id UUID,
  metric_name TEXT,
  metric_code TEXT,
  total_sites_using INTEGER,
  organization_level BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id as metric_id,
    mc.name as metric_name,
    mc.code as metric_code,
    COUNT(DISTINCT sm.site_id)::INTEGER as total_sites_using,
    (om.id IS NOT NULL) as organization_level
  FROM metrics_catalog mc
  LEFT JOIN site_metrics sm ON sm.metric_id = mc.id AND sm.organization_id = org_id AND sm.is_active = true
  LEFT JOIN organization_metrics om ON om.metric_id = mc.id AND om.organization_id = org_id AND om.is_active = true
  WHERE sm.id IS NOT NULL OR om.id IS NOT NULL
  GROUP BY mc.id, mc.name, mc.code, om.id
  ORDER BY mc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update organization_metrics when sites are updated
CREATE OR REPLACE FUNCTION sync_organization_metrics_from_sites()
RETURNS TRIGGER AS $$
BEGIN
  -- When a site metric is added, ensure it exists in organization_metrics
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true) THEN
    INSERT INTO organization_metrics (organization_id, metric_id, is_active)
    VALUES (NEW.organization_id, NEW.metric_id, true)
    ON CONFLICT (organization_id, metric_id)
    DO UPDATE SET is_active = true;
  END IF;

  -- When all sites remove a metric, optionally remove from organization (configurable)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = false) THEN
    -- Check if any other site still uses this metric
    IF NOT EXISTS (
      SELECT 1 FROM site_metrics
      WHERE organization_id = COALESCE(OLD.organization_id, NEW.organization_id)
        AND metric_id = COALESCE(OLD.metric_id, NEW.metric_id)
        AND is_active = true
        AND id != COALESCE(OLD.id, NEW.id)
    ) THEN
      -- Optionally mark as inactive at org level (don't delete, just deactivate)
      -- UPDATE organization_metrics
      -- SET is_active = false
      -- WHERE organization_id = COALESCE(OLD.organization_id, NEW.organization_id)
      --   AND metric_id = COALESCE(OLD.metric_id, NEW.metric_id);
      NULL; -- For now, keep org metrics active even if no sites use them
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_org_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON site_metrics
  FOR EACH ROW
  EXECUTE FUNCTION sync_organization_metrics_from_sites();