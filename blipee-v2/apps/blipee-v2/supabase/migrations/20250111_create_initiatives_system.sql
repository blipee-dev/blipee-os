-- ============================================================================
-- INITIATIVES SYSTEM
-- ============================================================================
-- This migration creates the initiatives tracking system that allows
-- organizations to group metrics into sustainability initiatives/programs
-- ============================================================================

-- Create enum types
CREATE TYPE initiative_status AS ENUM (
  'planning',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled'
);

CREATE TYPE initiative_priority AS ENUM (
  'high',
  'medium',
  'low'
);

-- ============================================================================
-- INITIATIVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  status initiative_status NOT NULL DEFAULT 'planning',
  priority initiative_priority NOT NULL DEFAULT 'medium',

  -- Timeline
  start_date DATE,
  target_date DATE,
  completion_date DATE,

  -- Resources
  budget DECIMAL(15, 2),
  budget_spent DECIMAL(15, 2) DEFAULT 0,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_members UUID[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT valid_dates CHECK (
    (target_date IS NULL OR start_date IS NULL OR target_date >= start_date) AND
    (completion_date IS NULL OR start_date IS NULL OR completion_date >= start_date)
  ),
  CONSTRAINT valid_budget CHECK (budget IS NULL OR budget >= 0),
  CONSTRAINT valid_budget_spent CHECK (budget_spent >= 0 AND (budget IS NULL OR budget_spent <= budget))
);

-- Indexes
CREATE INDEX idx_initiatives_organization ON initiatives(organization_id);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_owner ON initiatives(owner_id);
CREATE INDEX idx_initiatives_priority ON initiatives(priority);
CREATE INDEX idx_initiatives_target_date ON initiatives(target_date);

-- ============================================================================
-- INITIATIVE METRICS TABLE (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS initiative_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  metric_code VARCHAR(50) NOT NULL,

  -- Targets
  target_value DECIMAL(15, 4),
  target_unit TEXT,
  baseline_value DECIMAL(15, 4),
  baseline_date DATE,

  -- Current progress
  current_value DECIMAL(15, 4),
  current_value_date DATE,
  progress_percentage DECIMAL(5, 2), -- 0-100%

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(initiative_id, metric_code),
  CONSTRAINT valid_progress CHECK (progress_percentage IS NULL OR (progress_percentage >= 0 AND progress_percentage <= 100))
);

-- Indexes
CREATE INDEX idx_initiative_metrics_initiative ON initiative_metrics(initiative_id);
CREATE INDEX idx_initiative_metrics_code ON initiative_metrics(metric_code);

-- ============================================================================
-- INITIATIVE MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS initiative_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,

  -- Milestone info
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Order
  display_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT completed_consistency CHECK (
    (completed = FALSE AND completed_at IS NULL AND completed_by IS NULL) OR
    (completed = TRUE AND completed_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_initiative_milestones_initiative ON initiative_milestones(initiative_id);
CREATE INDEX idx_initiative_milestones_due_date ON initiative_milestones(due_date);
CREATE INDEX idx_initiative_milestones_completed ON initiative_milestones(completed);

-- ============================================================================
-- INITIATIVE ACTIVITY LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS initiative_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'metric_added', 'milestone_completed', etc.
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- User
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_initiative_activity_log_initiative ON initiative_activity_log(initiative_id);
CREATE INDEX idx_initiative_activity_log_created_at ON initiative_activity_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_activity_log ENABLE ROW LEVEL SECURITY;

-- Initiatives policies
CREATE POLICY "Users can view initiatives for their organization"
  ON initiatives FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Users can create initiatives for their organization"
  ON initiatives FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

CREATE POLICY "Users can update initiatives for their organization"
  ON initiatives FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

CREATE POLICY "Users can delete initiatives for their organization"
  ON initiatives FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

-- Initiative metrics policies
CREATE POLICY "Users can view initiative metrics for their organization"
  ON initiative_metrics FOR SELECT
  USING (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Users can manage initiative metrics for their organization"
  ON initiative_metrics FOR ALL
  USING (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
          AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      )
    )
  );

-- Initiative milestones policies
CREATE POLICY "Users can view initiative milestones for their organization"
  ON initiative_milestones FOR SELECT
  USING (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Users can manage initiative milestones for their organization"
  ON initiative_milestones FOR ALL
  USING (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
          AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead', 'facility_manager')
      )
    )
  );

-- Initiative activity log policies
CREATE POLICY "Users can view activity log for their organization initiatives"
  ON initiative_activity_log FOR SELECT
  USING (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Users can create activity log entries"
  ON initiative_activity_log FOR INSERT
  WITH CHECK (
    initiative_id IN (
      SELECT id FROM initiatives
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiative_metrics_updated_at
  BEFORE UPDATE ON initiative_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiative_milestones_updated_at
  BEFORE UPDATE ON initiative_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate initiative overall progress based on metrics
CREATE OR REPLACE FUNCTION calculate_initiative_progress(p_initiative_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_avg_progress DECIMAL;
BEGIN
  SELECT AVG(progress_percentage)
  INTO v_avg_progress
  FROM initiative_metrics
  WHERE initiative_id = p_initiative_id
    AND progress_percentage IS NOT NULL;

  RETURN COALESCE(v_avg_progress, 0);
END;
$$ LANGUAGE plpgsql;

-- Get initiatives summary for an organization
CREATE OR REPLACE FUNCTION get_initiatives_summary(p_organization_id UUID)
RETURNS TABLE (
  total_initiatives BIGINT,
  in_progress BIGINT,
  completed BIGINT,
  planning BIGINT,
  on_hold BIGINT,
  total_metrics_tracked BIGINT,
  total_milestones BIGINT,
  completed_milestones BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT i.id) AS total_initiatives,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'in_progress') AS in_progress,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'completed') AS completed,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'planning') AS planning,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'on_hold') AS on_hold,
    COUNT(DISTINCT im.id) AS total_metrics_tracked,
    COUNT(DISTINCT m.id) AS total_milestones,
    COUNT(DISTINCT m.id) FILTER (WHERE m.completed = TRUE) AS completed_milestones
  FROM initiatives i
  LEFT JOIN initiative_metrics im ON im.initiative_id = i.id
  LEFT JOIN initiative_milestones m ON m.initiative_id = i.id
  WHERE i.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;
