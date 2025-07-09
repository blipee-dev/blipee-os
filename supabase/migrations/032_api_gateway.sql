-- API Gateway: API Keys and Usage Tracking

-- Create API key status enum
CREATE TYPE api_key_status AS ENUM ('active', 'revoked', 'expired');

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Key information
    name TEXT NOT NULL,
    description TEXT,
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
    key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "blp_live_")
    last_four TEXT NOT NULL, -- Last 4 chars for display
    
    -- Configuration
    version TEXT NOT NULL DEFAULT 'v1' CHECK (version IN ('v1', 'v2')),
    allowed_origins TEXT[], -- CORS origins
    allowed_ips INET[], -- IP whitelist
    scopes TEXT[], -- API permissions/scopes
    rate_limit_override INTEGER, -- Custom rate limit (requests per hour)
    
    -- Status and lifecycle
    status api_key_status NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revoked_reason TEXT
);

-- API Usage table (for analytics and rate limiting)
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Request information
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    version TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    
    -- Client information
    ip_address INET,
    user_agent TEXT,
    origin TEXT,
    
    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMPTZ,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Usage Aggregates table (hourly rollups for performance)
CREATE TABLE IF NOT EXISTS api_usage_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    hour TIMESTAMPTZ NOT NULL,
    
    -- Aggregated metrics
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms NUMERIC(10, 2),
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    
    -- Bandwidth
    total_request_bytes BIGINT DEFAULT 0,
    total_response_bytes BIGINT DEFAULT 0,
    
    -- Top endpoints
    top_endpoints JSONB, -- Array of {endpoint, count}
    
    -- Status code distribution
    status_codes JSONB, -- {200: count, 404: count, etc}
    
    -- Unique constraint
    CONSTRAINT unique_api_usage_hourly UNIQUE (api_key_id, hour)
);

-- API Quotas table (for usage limits)
CREATE TABLE IF NOT EXISTS api_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Quota configuration
    quota_type TEXT NOT NULL CHECK (quota_type IN ('requests', 'bandwidth', 'compute')),
    limit_value BIGINT NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('hour', 'day', 'month')),
    
    -- Current usage
    current_usage BIGINT NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_api_quota UNIQUE (api_key_id, quota_type, period)
);

-- Webhook Endpoints table (for event system)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Endpoint configuration
    url TEXT NOT NULL,
    description TEXT,
    events TEXT[] NOT NULL, -- Event types to subscribe to
    api_version TEXT NOT NULL DEFAULT 'v1',
    
    -- Security
    secret_key TEXT NOT NULL, -- For webhook signature verification
    headers JSONB, -- Custom headers to include
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'failing', 'disabled')),
    
    -- Health tracking
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_delivery_at TIMESTAMPTZ,
    failure_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Webhook Deliveries table (event delivery log)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event information
    event_type TEXT NOT NULL,
    event_id UUID NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery attempt
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    
    -- Response information
    response_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    response_time_ms INTEGER,
    
    -- Error information
    error_message TEXT,
    
    -- Timestamps
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for all tables
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_time ON api_usage(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_hourly_key_hour ON api_usage_hourly(api_key_id, hour DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_events ON webhook_endpoints USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_status ON webhook_endpoints(status) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id, created_at DESC);

-- Create updated_at trigger for api_keys
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for api_quotas
CREATE TRIGGER update_api_quotas_updated_at
    BEFORE UPDATE ON api_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for webhook_endpoints
CREATE TRIGGER update_webhook_endpoints_updated_at
    BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only organization admins can view/manage API keys
CREATE POLICY "Organization admins can view API keys"
    ON api_keys FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = api_keys.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Organization admins can create API keys"
    ON api_keys FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = api_keys.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Organization admins can update API keys"
    ON api_keys FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = api_keys.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Organization admins can delete API keys"
    ON api_keys FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = api_keys.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- RLS for api_usage (read-only for organization members)
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view API usage"
    ON api_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM api_keys ak
            JOIN organization_members om ON om.organization_id = ak.organization_id
            WHERE ak.id = api_usage.api_key_id
            AND om.user_id = auth.uid()
            AND om.invitation_status = 'accepted'
        )
    );

-- RLS for webhook_endpoints
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization admins can manage webhooks"
    ON webhook_endpoints FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = webhook_endpoints.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- RLS for webhook_deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization admins can view webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = webhook_deliveries.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'blp')
RETURNS TEXT AS $$
DECLARE
    key TEXT;
    raw_key TEXT;
BEGIN
    -- Generate a random key (32 bytes = 256 bits)
    raw_key := encode(gen_random_bytes(32), 'base64');
    -- Remove special characters and make URL-safe
    raw_key := replace(replace(replace(raw_key, '+', ''), '/', ''), '=', '');
    -- Format: prefix_environment_randomkey
    key := prefix || '_' || CASE 
        WHEN current_setting('app.environment', true) = 'production' THEN 'live'
        ELSE 'test'
    END || '_' || raw_key;
    RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to track API usage
CREATE OR REPLACE FUNCTION track_api_usage(
    p_api_key_id UUID,
    p_endpoint TEXT,
    p_method TEXT,
    p_version TEXT,
    p_status_code INTEGER,
    p_response_time_ms INTEGER,
    p_request_size INTEGER DEFAULT NULL,
    p_response_size INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_origin TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    -- Insert usage record
    INSERT INTO api_usage (
        api_key_id,
        endpoint,
        method,
        version,
        status_code,
        response_time_ms,
        request_size_bytes,
        response_size_bytes,
        ip_address,
        user_agent,
        origin
    ) VALUES (
        p_api_key_id,
        p_endpoint,
        p_method,
        p_version,
        p_status_code,
        p_response_time_ms,
        p_request_size,
        p_response_size,
        p_ip_address,
        p_user_agent,
        p_origin
    ) RETURNING id INTO usage_id;
    
    -- Update last used timestamp on API key
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE id = p_api_key_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate hourly usage
CREATE OR REPLACE FUNCTION aggregate_api_usage_hourly()
RETURNS void AS $$
DECLARE
    current_hour TIMESTAMPTZ;
BEGIN
    current_hour := date_trunc('hour', NOW() - INTERVAL '1 hour');
    
    INSERT INTO api_usage_hourly (
        api_key_id,
        hour,
        total_requests,
        successful_requests,
        failed_requests,
        avg_response_time_ms,
        p95_response_time_ms,
        p99_response_time_ms,
        total_request_bytes,
        total_response_bytes,
        top_endpoints,
        status_codes
    )
    SELECT
        api_key_id,
        current_hour,
        COUNT(*),
        COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300),
        COUNT(*) FILTER (WHERE status_code >= 400),
        AVG(response_time_ms),
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms),
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms),
        COALESCE(SUM(request_size_bytes), 0),
        COALESCE(SUM(response_size_bytes), 0),
        (
            SELECT jsonb_agg(endpoint_data)
            FROM (
                SELECT jsonb_build_object('endpoint', endpoint, 'count', COUNT(*)) as endpoint_data
                FROM api_usage u2
                WHERE u2.api_key_id = u.api_key_id
                AND u2.created_at >= current_hour
                AND u2.created_at < current_hour + INTERVAL '1 hour'
                GROUP BY endpoint
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) top
        ),
        jsonb_object_agg(status_code::text, status_count)
    FROM api_usage u
    JOIN (
        SELECT api_key_id, status_code, COUNT(*) as status_count
        FROM api_usage
        WHERE created_at >= current_hour
        AND created_at < current_hour + INTERVAL '1 hour'
        GROUP BY api_key_id, status_code
    ) sc USING (api_key_id)
    WHERE u.created_at >= current_hour
    AND u.created_at < current_hour + INTERVAL '1 hour'
    GROUP BY u.api_key_id
    ON CONFLICT (api_key_id, hour) 
    DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        successful_requests = EXCLUDED.successful_requests,
        failed_requests = EXCLUDED.failed_requests,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        p95_response_time_ms = EXCLUDED.p95_response_time_ms,
        p99_response_time_ms = EXCLUDED.p99_response_time_ms,
        total_request_bytes = EXCLUDED.total_request_bytes,
        total_response_bytes = EXCLUDED.total_response_bytes,
        top_endpoints = EXCLUDED.top_endpoints,
        status_codes = EXCLUDED.status_codes;
END;
$$ LANGUAGE plpgsql;

-- Insert audit event types for API management
INSERT INTO audit_event_types (name, description, category, severity) VALUES
    ('api.key.created', 'API key created', 'api', 'INFO'),
    ('api.key.revoked', 'API key revoked', 'api', 'WARNING'),
    ('api.key.expired', 'API key expired', 'api', 'INFO'),
    ('api.key.used', 'API key used', 'api', 'INFO'),
    ('api.quota.exceeded', 'API quota exceeded', 'api', 'WARNING'),
    ('api.rate_limit.exceeded', 'API rate limit exceeded', 'api', 'WARNING'),
    ('webhook.created', 'Webhook endpoint created', 'api', 'INFO'),
    ('webhook.updated', 'Webhook endpoint updated', 'api', 'INFO'),
    ('webhook.deleted', 'Webhook endpoint deleted', 'api', 'INFO'),
    ('webhook.delivery.success', 'Webhook delivered successfully', 'api', 'INFO'),
    ('webhook.delivery.failed', 'Webhook delivery failed', 'api', 'WARNING')
ON CONFLICT (name) DO NOTHING;