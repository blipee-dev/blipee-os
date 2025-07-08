-- Enterprise SSO Tables and Functions

-- Create ENUM types for SSO
CREATE TYPE sso_provider AS ENUM ('saml', 'oidc');
CREATE TYPE sso_status AS ENUM ('active', 'inactive', 'configuring', 'error');

-- SSO Configurations table
CREATE TABLE IF NOT EXISTS sso_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider sso_provider NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    status sso_status NOT NULL DEFAULT 'configuring',
    
    -- Common fields
    name TEXT NOT NULL,
    domain TEXT NOT NULL, -- Email domain for auto-assignment
    
    -- SAML-specific fields
    saml_metadata_url TEXT,
    saml_metadata_xml TEXT,
    saml_issuer TEXT,
    saml_sso_url TEXT,
    saml_certificate TEXT,
    saml_attribute_mapping JSONB,
    
    -- OIDC-specific fields
    oidc_client_id TEXT,
    oidc_client_secret TEXT, -- Will be encrypted
    oidc_issuer_url TEXT,
    oidc_discovery_url TEXT,
    oidc_authorization_endpoint TEXT,
    oidc_token_endpoint TEXT,
    oidc_userinfo_endpoint TEXT,
    oidc_jwks_uri TEXT,
    oidc_scopes TEXT[], -- Array of scopes
    oidc_attribute_mapping JSONB,
    
    -- Auto-provisioning settings
    auto_provision_users BOOLEAN NOT NULL DEFAULT false,
    default_role TEXT DEFAULT 'guest',
    default_permissions JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    last_tested_at TIMESTAMPTZ,
    last_test_status TEXT CHECK (last_test_status IN ('success', 'failed')),
    last_test_error TEXT,
    
    -- Constraints
    CONSTRAINT unique_org_domain UNIQUE (organization_id, domain),
    CONSTRAINT valid_saml_config CHECK (
        provider != 'saml' OR (
            saml_issuer IS NOT NULL AND
            (saml_metadata_url IS NOT NULL OR saml_metadata_xml IS NOT NULL OR saml_sso_url IS NOT NULL)
        )
    ),
    CONSTRAINT valid_oidc_config CHECK (
        provider != 'oidc' OR (
            oidc_client_id IS NOT NULL AND
            oidc_client_secret IS NOT NULL AND
            (oidc_discovery_url IS NOT NULL OR (
                oidc_issuer_url IS NOT NULL AND
                oidc_authorization_endpoint IS NOT NULL AND
                oidc_token_endpoint IS NOT NULL
            ))
        )
    )
);

-- SSO Sessions table
CREATE TABLE IF NOT EXISTS sso_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sso_configuration_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
    provider sso_provider NOT NULL,
    
    -- Session data
    external_id TEXT NOT NULL, -- External user identifier
    session_index TEXT, -- SAML session index
    name_id TEXT, -- SAML NameID
    oidc_access_token TEXT, -- Encrypted
    oidc_refresh_token TEXT, -- Encrypted
    oidc_id_token TEXT, -- Encrypted
    id_token TEXT, -- For OIDC logout hint
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- SSO Authentication Requests table (for tracking auth flows)
CREATE TABLE IF NOT EXISTS sso_auth_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_configuration_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
    provider sso_provider NOT NULL,
    state TEXT NOT NULL UNIQUE, -- Random state for CSRF protection
    nonce TEXT, -- For OIDC
    relay_state TEXT, -- For SAML
    redirect_uri TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes'
);

-- SSO Users mapping table
CREATE TABLE IF NOT EXISTS sso_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sso_configuration_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL, -- ID from the SSO provider
    
    -- User attributes from SSO
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    groups TEXT[],
    department TEXT,
    employee_id TEXT,
    custom_attributes JSONB,
    
    -- Provisioning
    auto_provisioned BOOLEAN NOT NULL DEFAULT false,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_sso_external_id UNIQUE (sso_configuration_id, external_id),
    CONSTRAINT unique_sso_user UNIQUE (user_id, sso_configuration_id)
);

-- Create indexes
CREATE INDEX idx_sso_configurations_org ON sso_configurations(organization_id);
CREATE INDEX idx_sso_configurations_domain ON sso_configurations(domain);
CREATE INDEX idx_sso_configurations_status ON sso_configurations(status) WHERE enabled = true;
CREATE INDEX idx_sso_sessions_user_id ON sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_expires_at ON sso_sessions(expires_at);
CREATE INDEX idx_sso_auth_requests_state ON sso_auth_requests(state);
CREATE INDEX idx_sso_auth_requests_expires_at ON sso_auth_requests(expires_at);
CREATE INDEX idx_sso_users_user_id ON sso_users(user_id);
CREATE INDEX idx_sso_users_email ON sso_users(email);

-- Create updated_at trigger for sso_configurations
CREATE TRIGGER update_sso_configurations_updated_at
    BEFORE UPDATE ON sso_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for sso_users
CREATE TRIGGER update_sso_users_updated_at
    BEFORE UPDATE ON sso_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for sso_configurations
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;

-- Only organization admins and subscription owners can view SSO configs
CREATE POLICY "Organization admins can view SSO configs"
    ON sso_configurations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = sso_configurations.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Only subscription owners can create/update/delete SSO configs
CREATE POLICY "Subscription owners can manage SSO configs"
    ON sso_configurations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = sso_configurations.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'account_owner'
            AND om.invitation_status = 'accepted'
        )
    );

-- RLS Policies for sso_sessions
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own SSO sessions
CREATE POLICY "Users can view own SSO sessions"
    ON sso_sessions FOR SELECT
    USING (user_id = auth.uid());

-- System can manage all SSO sessions (via service role)
-- No user-level insert/update/delete policies - managed by backend

-- RLS Policies for sso_auth_requests
ALTER TABLE sso_auth_requests ENABLE ROW LEVEL SECURITY;

-- Only backend can manage auth requests (via service role)
-- No user-level policies

-- RLS Policies for sso_users
ALTER TABLE sso_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own SSO user mappings
CREATE POLICY "Users can view own SSO mappings"
    ON sso_users FOR SELECT
    USING (user_id = auth.uid());

-- Organization admins can view SSO users in their org
CREATE POLICY "Organization admins can view SSO users"
    ON sso_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN sso_configurations sc ON sc.organization_id = om.organization_id
            WHERE sc.id = sso_users.sso_configuration_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Function to clean up expired SSO auth requests
CREATE OR REPLACE FUNCTION cleanup_expired_sso_auth_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM sso_auth_requests
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sso_sessions
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SSO configuration by email domain
CREATE OR REPLACE FUNCTION get_sso_config_by_email(email_address TEXT)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    provider sso_provider,
    enabled BOOLEAN,
    config JSONB
) AS $$
DECLARE
    email_domain TEXT;
BEGIN
    -- Extract domain from email
    email_domain := LOWER(SPLIT_PART(email_address, '@', 2));
    
    -- Return matching SSO configuration
    RETURN QUERY
    SELECT 
        sc.id,
        sc.organization_id,
        sc.provider,
        sc.enabled,
        CASE 
            WHEN sc.provider = 'saml' THEN
                jsonb_build_object(
                    'metadata_url', sc.saml_metadata_url,
                    'issuer', sc.saml_issuer,
                    'sso_url', sc.saml_sso_url,
                    'attribute_mapping', sc.saml_attribute_mapping
                )
            WHEN sc.provider = 'oidc' THEN
                jsonb_build_object(
                    'client_id', sc.oidc_client_id,
                    'issuer_url', sc.oidc_issuer_url,
                    'discovery_url', sc.oidc_discovery_url,
                    'authorization_endpoint', sc.oidc_authorization_endpoint,
                    'token_endpoint', sc.oidc_token_endpoint,
                    'userinfo_endpoint', sc.oidc_userinfo_endpoint,
                    'scopes', sc.oidc_scopes,
                    'attribute_mapping', sc.oidc_attribute_mapping
                )
        END as config
    FROM sso_configurations sc
    WHERE sc.domain = email_domain
    AND sc.enabled = true
    AND sc.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging for SSO events
INSERT INTO audit_event_types (name, description, category, severity) VALUES
    ('sso.config.created', 'SSO configuration created', 'security', 'INFO'),
    ('sso.config.updated', 'SSO configuration updated', 'security', 'INFO'),
    ('sso.config.deleted', 'SSO configuration deleted', 'security', 'WARNING'),
    ('sso.config.tested', 'SSO configuration tested', 'security', 'INFO'),
    ('sso.auth.initiated', 'SSO authentication initiated', 'security', 'INFO'),
    ('sso.auth.success', 'SSO authentication succeeded', 'security', 'INFO'),
    ('sso.auth.failed', 'SSO authentication failed', 'security', 'WARNING'),
    ('sso.user.provisioned', 'SSO user auto-provisioned', 'security', 'INFO'),
    ('sso.user.synced', 'SSO user attributes synced', 'security', 'INFO'),
    ('sso.session.created', 'SSO session created', 'security', 'INFO'),
    ('sso.session.terminated', 'SSO session terminated', 'security', 'INFO')
ON CONFLICT (name) DO NOTHING;