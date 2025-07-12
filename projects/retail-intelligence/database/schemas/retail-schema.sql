-- Retail Intelligence Database Schema
-- This schema defines all tables for the retail module

-- Create schema
CREATE SCHEMA IF NOT EXISTS retail;

-- Set search path
SET search_path TO retail, public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Stores table (links to main buildings table)
CREATE TABLE retail.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    mall_id UUID REFERENCES retail.malls(id),
    store_type VARCHAR(50) NOT NULL DEFAULT 'retail',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    floor_area_sqm DECIMAL(10,2),
    operating_hours JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Malls table (for capture rate calculations)
CREATE TABLE retail.malls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    location JSONB,
    total_stores INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FOOT TRAFFIC TABLES
-- =====================================================

-- Sensors configuration
CREATE TABLE retail.sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL, -- 'vs133', 'axis', 'hikvision', etc
    location VARCHAR(255), -- 'main_entrance', 'side_entrance', etc
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, sensor_id)
);

-- Raw foot traffic data
CREATE TABLE retail.foot_traffic_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES retail.sensors(id),
    timestamp TIMESTAMPTZ NOT NULL,
    count_in INTEGER DEFAULT 0,
    count_out INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2), -- Percentage accuracy
    raw_data JSONB, -- Original sensor data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, sensor_id, timestamp)
);

-- Aggregated foot traffic (hourly)
CREATE TABLE retail.foot_traffic_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    count_in INTEGER DEFAULT 0,
    count_out INTEGER DEFAULT 0,
    occupancy INTEGER DEFAULT 0,
    dwell_time_minutes DECIMAL(10,2),
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date, hour)
);

-- Daily foot traffic summary
CREATE TABLE retail.foot_traffic_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_in INTEGER DEFAULT 0,
    total_out INTEGER DEFAULT 0,
    peak_hour INTEGER,
    peak_occupancy INTEGER,
    avg_dwell_time_minutes DECIMAL(10,2),
    weather_conditions JSONB,
    is_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- =====================================================
-- SALES TABLES
-- =====================================================

-- POS integrations
CREATE TABLE retail.pos_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    pos_type VARCHAR(50) NOT NULL, -- 'shopify', 'square', 'custom'
    integration_status VARCHAR(50) DEFAULT 'pending',
    credentials JSONB, -- Encrypted
    last_sync_at TIMESTAMPTZ,
    sync_frequency_minutes INTEGER DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, pos_type)
);

-- Sales transactions
CREATE TABLE retail.sales_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    pos_transaction_id VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    items_count INTEGER DEFAULT 1,
    customer_id VARCHAR(255),
    staff_id VARCHAR(255),
    payment_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, pos_transaction_id)
);

-- Sales items (line items)
CREATE TABLE retail.sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES retail.sales_transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    category VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hourly sales summary
CREATE TABLE retail.sales_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    transactions_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    avg_transaction_value DECIMAL(10,2),
    items_sold INTEGER DEFAULT 0,
    unique_customers INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date, hour)
);

-- =====================================================
-- CAPTURE RATE TABLES
-- =====================================================

-- Mall traffic data
CREATE TABLE retail.mall_traffic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id UUID NOT NULL REFERENCES retail.malls(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    total_traffic INTEGER DEFAULT 0,
    source VARCHAR(50), -- 'sensor', 'estimate', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mall_id, date, hour)
);

-- Capture rate calculations
CREATE TABLE retail.capture_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    mall_traffic INTEGER,
    store_entries INTEGER,
    capture_rate DECIMAL(5,2), -- Percentage
    rank_in_mall INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date, hour)
);

-- =====================================================
-- TARGETS & PERFORMANCE
-- =====================================================

-- Smart targets
CREATE TABLE retail.targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'sales', 'traffic', 'conversion'
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_value DECIMAL(12,2) NOT NULL,
    stretch_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    achievement_rate DECIMAL(5,2),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff performance
CREATE TABLE retail.staff_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    staff_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    transactions_count INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    avg_transaction_value DECIMAL(10,2),
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, staff_id, date)
);

-- =====================================================
-- ANALYTICS & INSIGHTS
-- =====================================================

-- AI predictions
CREATE TABLE retail.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- 'traffic', 'sales', 'conversion'
    target_timestamp TIMESTAMPTZ NOT NULL,
    predicted_value DECIMAL(12,2),
    confidence_level DECIMAL(5,2), -- Percentage
    actual_value DECIMAL(12,2),
    error_rate DECIMAL(5,2),
    model_version VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomalies detected
CREATE TABLE retail.anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    detected_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    metrics JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendations
CREATE TABLE retail.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES retail.stores(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expected_impact JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'implemented'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actioned_at TIMESTAMPTZ,
    actioned_by UUID REFERENCES public.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Foot traffic indexes
CREATE INDEX idx_foot_traffic_raw_timestamp ON retail.foot_traffic_raw(store_id, timestamp DESC);
CREATE INDEX idx_foot_traffic_hourly_date ON retail.foot_traffic_hourly(store_id, date DESC, hour);
CREATE INDEX idx_foot_traffic_daily_date ON retail.foot_traffic_daily(store_id, date DESC);

-- Sales indexes
CREATE INDEX idx_sales_transactions_timestamp ON retail.sales_transactions(store_id, timestamp DESC);
CREATE INDEX idx_sales_hourly_date ON retail.sales_hourly(store_id, date DESC, hour);
CREATE INDEX idx_sales_items_product ON retail.sales_items(product_id);

-- Performance indexes
CREATE INDEX idx_capture_rates_date ON retail.capture_rates(store_id, date DESC);
CREATE INDEX idx_targets_period ON retail.targets(store_id, period_start, period_end);
CREATE INDEX idx_predictions_target ON retail.predictions(store_id, target_timestamp);

-- =====================================================
-- VIEWS
-- =====================================================

-- Current occupancy view
CREATE VIEW retail.current_occupancy AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    COALESCE(SUM(ft.count_in - ft.count_out), 0) as current_occupancy,
    MAX(ft.timestamp) as last_updated
FROM retail.stores s
LEFT JOIN retail.foot_traffic_raw ft ON s.id = ft.store_id
    AND ft.timestamp > NOW() - INTERVAL '1 day'
GROUP BY s.id, s.name;

-- Today's performance view
CREATE VIEW retail.today_performance AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    COALESCE(ft.total_in, 0) as foot_traffic,
    COALESCE(COUNT(DISTINCT st.id), 0) as transactions,
    COALESCE(SUM(st.amount), 0) as revenue,
    CASE 
        WHEN ft.total_in > 0 THEN (COUNT(DISTINCT st.id)::DECIMAL / ft.total_in * 100)
        ELSE 0 
    END as conversion_rate
FROM retail.stores s
LEFT JOIN retail.foot_traffic_daily ft ON s.id = ft.store_id 
    AND ft.date = CURRENT_DATE
LEFT JOIN retail.sales_transactions st ON s.id = st.store_id 
    AND DATE(st.timestamp) = CURRENT_DATE
GROUP BY s.id, s.name, ft.total_in;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON retail.stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON retail.sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE retail.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail.foot_traffic_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail.sales_transactions ENABLE ROW LEVEL SECURITY;

-- Store access policy
CREATE POLICY store_access_policy ON retail.stores
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Foot traffic access policy
CREATE POLICY foot_traffic_access_policy ON retail.foot_traffic_raw
    FOR ALL
    USING (
        store_id IN (
            SELECT s.id 
            FROM retail.stores s
            WHERE s.organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Sales access policy
CREATE POLICY sales_access_policy ON retail.sales_transactions
    FOR ALL
    USING (
        store_id IN (
            SELECT s.id 
            FROM retail.stores s
            WHERE s.organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );