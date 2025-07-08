-- Compliance tables for GDPR and SOC2

-- User consents table
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('marketing', 'analytics', 'functional', 'necessary')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('granted', 'denied', 'pending', 'withdrawn')),
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Privacy settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data_processing JSONB DEFAULT '{
        "allowAnalytics": false,
        "allowMarketing": false,
        "allowDataSharing": false,
        "allowProfiling": false
    }',
    communication JSONB DEFAULT '{
        "emailNotifications": true,
        "smsNotifications": false,
        "pushNotifications": false,
        "marketingEmails": false
    }',
    visibility JSONB DEFAULT '{
        "profileVisibility": "organization",
        "activityVisibility": "team"
    }',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    format VARCHAR(20) NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'csv', 'pdf')),
    scope TEXT[] DEFAULT ARRAY['profile', 'activities', 'consents', 'preferences'],
    completed_at TIMESTAMPTZ,
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    reason TEXT,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Security policies table
CREATE TABLE IF NOT EXISTS security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    framework VARCHAR(50) NOT NULL CHECK (framework IN ('gdpr', 'soc2', 'hipaa', 'iso27001', 'ccpa')),
    version VARCHAR(20) NOT NULL,
    requirements JSONB NOT NULL DEFAULT '[]',
    effective_date TIMESTAMPTZ NOT NULL,
    review_date TIMESTAMPTZ NOT NULL,
    approved BOOLEAN DEFAULT false,
    approved_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(255) NOT NULL,
    retention_days INTEGER NOT NULL CHECK (retention_days >= 0),
    framework VARCHAR(50) NOT NULL CHECK (framework IN ('gdpr', 'soc2', 'hipaa', 'iso27001', 'ccpa')),
    auto_delete BOOLEAN DEFAULT false,
    exceptions TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework VARCHAR(50) NOT NULL CHECK (framework IN ('gdpr', 'soc2', 'hipaa', 'iso27001', 'ccpa')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    summary JSONB NOT NULL,
    findings JSONB DEFAULT '[]',
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Data processing activities table (GDPR Article 30)
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    data_categories TEXT[] NOT NULL,
    data_subjects TEXT[] NOT NULL,
    recipients TEXT[],
    retention_period VARCHAR(255) NOT NULL,
    safeguards TEXT[],
    cross_border_transfers BOOLEAN DEFAULT false,
    transfer_mechanisms TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Privacy impact assessments table
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    data_processing_activities TEXT[],
    risks JSONB DEFAULT '[]',
    mitigations JSONB DEFAULT '[]',
    approvals JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Legal documents table (for privacy policies, terms, etc.)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('privacy_notice', 'terms_of_service', 'cookie_policy', 'dpa', 'sla')),
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type_status ON user_consents(type, status);
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status) WHERE status != 'completed';
CREATE INDEX idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status) WHERE status != 'completed';
CREATE INDEX idx_security_policies_framework ON security_policies(framework, approved);
CREATE INDEX idx_compliance_reports_framework ON compliance_reports(framework, generated_at DESC);

-- Row-level security
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can manage their own consents
CREATE POLICY "Users can manage own consents" ON user_consents
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can manage their own privacy settings
CREATE POLICY "Users can manage own privacy settings" ON privacy_settings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view and create their own export requests
CREATE POLICY "Users can manage own export requests" ON data_export_requests
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view and create their own deletion requests
CREATE POLICY "Users can manage own deletion requests" ON data_deletion_requests
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only admins can manage security policies
CREATE POLICY "Admins can manage security policies" ON security_policies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Only admins can manage retention policies
CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Compliance reports viewable by admins and managers
CREATE POLICY "Authorized users can view compliance reports" ON compliance_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin', 'sustainability_lead')
        )
    );

-- Only admins can create compliance reports
CREATE POLICY "Admins can create compliance reports" ON compliance_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Data processing activities manageable by admins
CREATE POLICY "Admins can manage data processing activities" ON data_processing_activities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Privacy impact assessments manageable by admins
CREATE POLICY "Admins can manage privacy impact assessments" ON privacy_impact_assessments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Legal documents viewable by all authenticated users
CREATE POLICY "Users can view legal documents" ON legal_documents
    FOR SELECT
    TO authenticated
    USING (active = true);

-- Only admins can manage legal documents
CREATE POLICY "Admins can manage legal documents" ON legal_documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'admin')
        )
    );

-- Add audit event types for compliance
INSERT INTO audit_event_types (name, description, category, severity) VALUES
    ('consent_recorded', 'User consent recorded', 'compliance', 'INFO'),
    ('consent_withdrawn', 'User consent withdrawn', 'compliance', 'INFO'),
    ('data_export_requested', 'Data export requested', 'compliance', 'INFO'),
    ('data_export_completed', 'Data export completed', 'compliance', 'INFO'),
    ('deletion_requested', 'Account deletion requested', 'compliance', 'WARNING'),
    ('deletion_cancelled', 'Account deletion cancelled', 'compliance', 'INFO'),
    ('deletion_completed', 'Account deletion completed', 'compliance', 'WARNING'),
    ('privacy_settings_updated', 'Privacy settings updated', 'compliance', 'INFO'),
    ('compliance_report_generated', 'Compliance report generated', 'compliance', 'INFO'),
    ('policy_created', 'Compliance policy created', 'compliance', 'INFO'),
    ('policy_updated', 'Compliance policy updated', 'compliance', 'INFO'),
    ('requirement_verified', 'Compliance requirement verified', 'compliance', 'INFO'),
    ('pia_created', 'Privacy impact assessment created', 'compliance', 'INFO'),
    ('pia_approved', 'Privacy impact assessment approved', 'compliance', 'INFO')
ON CONFLICT (name) DO NOTHING;