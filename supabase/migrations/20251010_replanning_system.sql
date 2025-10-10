-- ============================================================================
-- REPLANNING SYSTEM MIGRATION
-- Enables automatic target recalibration with metric-level monthly breakdowns
-- ============================================================================

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS metric_targets_monthly CASCADE;
DROP TABLE IF EXISTS reduction_initiatives CASCADE;
DROP TABLE IF EXISTS metric_targets CASCADE;
DROP TABLE IF EXISTS target_replanning_history CASCADE;
DROP TABLE IF EXISTS allocation_strategies CASCADE;

-- 1. METRIC TARGETS TABLE
-- Stores target values for each metric contributing to a sustainability target
CREATE TABLE metric_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_catalog_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,
    target_id UUID REFERENCES sustainability_targets(id) ON DELETE CASCADE,

    -- Current state (baseline)
    baseline_year INTEGER NOT NULL,
    baseline_value DECIMAL(15,2) NOT NULL,
    baseline_emissions DECIMAL(15,2) NOT NULL,

    -- Target state
    target_year INTEGER NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    target_emissions DECIMAL(15,2) NOT NULL,
    reduction_percentage DECIMAL(5,2),

    -- Strategy
    strategy_type TEXT NOT NULL DEFAULT 'hybrid' CHECK (strategy_type IN (
        'activity_reduction',
        'emission_factor',
        'hybrid',
        'elimination'
    )),

    -- Emission factor assumptions
    current_emission_factor DECIMAL(10,6),
    target_emission_factor DECIMAL(10,6),

    -- Tracking
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'archived')),
    confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),

    -- Notes
    notes TEXT,
    assumptions TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(organization_id, metric_catalog_id, target_id)
);

-- 2. MONTHLY METRIC TARGETS TABLE
CREATE TABLE metric_targets_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_target_id UUID NOT NULL REFERENCES metric_targets(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

    -- Planned values
    planned_value DECIMAL(15,2) NOT NULL,
    planned_emissions DECIMAL(15,2) NOT NULL,
    planned_emission_factor DECIMAL(10,6),

    -- Actuals
    actual_value DECIMAL(15,2),
    actual_emissions DECIMAL(15,2),
    actual_emission_factor DECIMAL(10,6),

    -- Variance (computed columns)
    variance_value DECIMAL(15,2) GENERATED ALWAYS AS (actual_value - planned_value) STORED,
    variance_emissions DECIMAL(15,2) GENERATED ALWAYS AS (actual_emissions - planned_emissions) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN planned_emissions != 0 THEN ((actual_emissions - planned_emissions) / planned_emissions * 100)
            ELSE NULL
        END
    ) STORED,

    -- Status
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'missed')),

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(metric_target_id, year, month)
);

-- 3. REDUCTION INITIATIVES TABLE
CREATE TABLE reduction_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_target_id UUID REFERENCES metric_targets(id) ON DELETE SET NULL,
    sustainability_target_id UUID REFERENCES sustainability_targets(id) ON DELETE CASCADE,

    -- Initiative details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initiative_type TEXT CHECK (initiative_type IN (
        'energy_efficiency',
        'renewable_energy',
        'fuel_switch',
        'fleet_electrification',
        'behavioral_change',
        'procurement_policy',
        'supplier_engagement',
        'process_optimization',
        'carbon_offset',
        'other'
    )),

    -- Impact
    estimated_reduction_tco2e DECIMAL(15,2) NOT NULL,
    estimated_reduction_percentage DECIMAL(5,2),
    actual_reduction_tco2e DECIMAL(15,2),

    -- Timeline
    start_date DATE NOT NULL,
    completion_date DATE,
    implementation_status TEXT DEFAULT 'planned' CHECK (implementation_status IN (
        'planned',
        'approved',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
        'delayed'
    )),

    -- Financials
    capex DECIMAL(15,2),
    annual_opex DECIMAL(15,2),
    annual_savings DECIMAL(15,2),
    roi_years DECIMAL(4,1),

    -- Risk and confidence
    confidence_score DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence_score BETWEEN 0 AND 1),
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    risks TEXT,
    dependencies TEXT,

    -- Ownership
    owner_user_id UUID REFERENCES auth.users(id),
    owner_team TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. TARGET REPLANNING HISTORY TABLE
CREATE TABLE target_replanning_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sustainability_target_id UUID NOT NULL REFERENCES sustainability_targets(id) ON DELETE CASCADE,

    -- Trigger
    replanning_trigger TEXT CHECK (replanning_trigger IN (
        'manual',
        'off_track_alert',
        'annual_review',
        'strategy_change',
        'external_factor'
    )),

    -- Changes
    previous_target_emissions DECIMAL(15,2),
    new_target_emissions DECIMAL(15,2),
    previous_target_year INTEGER,
    new_target_year INTEGER,

    -- Strategy
    allocation_strategy TEXT CHECK (allocation_strategy IN (
        'equal',
        'cost_optimized',
        'quick_wins',
        'custom',
        'ai_recommended'
    )),

    -- Summary
    total_initiatives_added INTEGER DEFAULT 0,
    total_estimated_investment DECIMAL(15,2),
    average_confidence_score DECIMAL(3,2),

    -- Snapshots for rollback
    metric_targets_snapshot JSONB,
    initiatives_snapshot JSONB,

    -- Who and when
    replanned_by UUID REFERENCES auth.users(id),
    replanned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ALLOCATION STRATEGIES TABLE
CREATE TABLE allocation_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    strategy_type TEXT NOT NULL,

    -- Configuration
    config JSONB,

    -- Usage stats
    times_used INTEGER DEFAULT 0,
    avg_success_rate DECIMAL(5,2),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(organization_id, name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_metric_targets_org ON metric_targets(organization_id);
CREATE INDEX idx_metric_targets_target ON metric_targets(target_id);
CREATE INDEX idx_metric_targets_status ON metric_targets(status);

CREATE INDEX idx_metric_targets_monthly_metric ON metric_targets_monthly(metric_target_id);
CREATE INDEX idx_metric_targets_monthly_period ON metric_targets_monthly(year, month);

CREATE INDEX idx_initiatives_org ON reduction_initiatives(organization_id);
CREATE INDEX idx_initiatives_metric ON reduction_initiatives(metric_target_id);
CREATE INDEX idx_initiatives_target ON reduction_initiatives(sustainability_target_id);
CREATE INDEX idx_initiatives_status ON reduction_initiatives(implementation_status);
CREATE INDEX idx_initiatives_owner ON reduction_initiatives(owner_user_id);

CREATE INDEX idx_replanning_history_org ON target_replanning_history(organization_id);
CREATE INDEX idx_replanning_history_target ON target_replanning_history(sustainability_target_id);
CREATE INDEX idx_replanning_history_date ON target_replanning_history(replanned_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metric_targets_updated_at BEFORE UPDATE ON metric_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metric_targets_monthly_updated_at BEFORE UPDATE ON metric_targets_monthly
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reduction_initiatives_updated_at BEFORE UPDATE ON reduction_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocation_strategies_updated_at BEFORE UPDATE ON allocation_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE metric_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_targets_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE reduction_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_replanning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_strategies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their org's metric targets"
    ON metric_targets FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = metric_targets.organization_id
    ));

CREATE POLICY "Users can view their org's monthly targets"
    ON metric_targets_monthly FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM organization_members om
        JOIN metric_targets mt ON mt.organization_id = om.organization_id
        WHERE mt.id = metric_targets_monthly.metric_target_id
    ));

CREATE POLICY "Users can view their org's initiatives"
    ON reduction_initiatives FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = reduction_initiatives.organization_id
    ));

CREATE POLICY "Users can view their org's replanning history"
    ON target_replanning_history FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = target_replanning_history.organization_id
    ));

CREATE POLICY "Users can view their org's allocation strategies"
    ON allocation_strategies FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = allocation_strategies.organization_id
    ));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_metric_target_progress(
    p_metric_target_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    planned_ytd DECIMAL,
    actual_ytd DECIMAL,
    variance_ytd DECIMAL,
    on_track BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(planned_emissions) as planned_ytd,
        SUM(actual_emissions) as actual_ytd,
        SUM(variance_emissions) as variance_ytd,
        ABS(SUM(variance_emissions)) < (SUM(planned_emissions) * 0.15) as on_track
    FROM metric_targets_monthly
    WHERE metric_target_id = p_metric_target_id
        AND (year < p_year OR (year = p_year AND month <= p_month));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE metric_targets IS 'Target values for each metric contributing to sustainability targets';
COMMENT ON TABLE metric_targets_monthly IS 'Monthly breakdown of metric targets with planned vs actual tracking';
COMMENT ON TABLE reduction_initiatives IS 'Specific actions/projects to achieve emission reductions';
COMMENT ON TABLE target_replanning_history IS 'Audit trail of target recalibration events';
COMMENT ON TABLE allocation_strategies IS 'Reusable strategies for distributing reduction targets';

COMMENT ON COLUMN metric_targets.strategy_type IS 'How this metric will achieve reduction: activity, emission factor, or both';
COMMENT ON COLUMN metric_targets_monthly.variance_percentage IS 'Automatically calculated: (actual - planned) / planned * 100';
COMMENT ON COLUMN reduction_initiatives.confidence_score IS 'Probability of achieving estimated reduction (0-1)';
