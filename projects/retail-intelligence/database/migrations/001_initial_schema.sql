-- Retail Intelligence Database Schema
-- Compatible with existing Python/Telegram system

-- Create retail schema
CREATE SCHEMA IF NOT EXISTS retail;
SET search_path TO retail, public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES (Matching existing SQLite structure)
-- =====================================================

-- Sales data (matching existing sales_data table)
CREATE TABLE retail.sales_data (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    data TIMESTAMP NOT NULL,
    codigo VARCHAR(100) NOT NULL,
    referencia_documento VARCHAR(255) NOT NULL,
    documento_original VARCHAR(255),
    tipo_documento VARCHAR(100) NOT NULL,
    hora VARCHAR(20) NOT NULL,
    vendedor_codigo VARCHAR(100) NOT NULL,
    vendedor_nome_curto VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    descritivo TEXT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    valor_venda_com_iva DECIMAL(12,2) NOT NULL,
    valor_venda_sem_iva DECIMAL(12,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) NOT NULL,
    percentual_desconto DECIMAL(5,2) NOT NULL,
    motivo_desconto VARCHAR(255),
    -- Additional fields for new system
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- People counting data (matching existing people_counting_data table)
CREATE TABLE retail.people_counting_data (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    ip VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_in INTEGER NOT NULL,
    line1_in INTEGER NOT NULL,
    line2_in INTEGER NOT NULL,
    line3_in INTEGER NOT NULL,
    line4_in INTEGER NOT NULL,
    line4_out INTEGER NOT NULL,
    -- Additional fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- Heatmap data (matching existing heatmap_data table)
CREATE TABLE retail.heatmap_data (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    ip VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Regional people counting data
CREATE TABLE retail.regional_people_counting_data (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    ip VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    region1 INTEGER NOT NULL,
    region2 INTEGER NOT NULL,
    region3 INTEGER NOT NULL,
    region4 INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics results (matching existing analytics_results table)
CREATE TABLE retail.analytics_results (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    total_vendas_com_iva DECIMAL(12,2),
    total_vendas_sem_iva DECIMAL(12,2),
    transacoes_vendas INTEGER,
    visitantes INTEGER,
    taxa_conversao DECIMAL(5,2),
    tempo_medio_permanencia DECIMAL(10,2),
    ticket_medio_com_iva DECIMAL(10,2),
    ticket_medio_sem_iva DECIMAL(10,2),
    unidades_por_transacao DECIMAL(10,2),
    indice_devolucoes DECIMAL(5,2),
    indice_descontos DECIMAL(5,2),
    entry_rate DECIMAL(5,2),
    total_passagens INTEGER,
    ultima_coleta TIMESTAMP,
    top_vendedores TEXT,
    top_produtos TEXT,
    ocupacao_regioes TEXT,
    top_2_regioes_ocupadas TEXT,
    menos_2_regioes_ocupadas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Last update tracking
CREATE TABLE retail.last_update (
    id SERIAL PRIMARY KEY,
    loja VARCHAR(255) NOT NULL UNIQUE,
    last_update_time TIMESTAMP NOT NULL
);

-- Processed files tracking
CREATE TABLE retail.processed_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) UNIQUE NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NEW TABLES for Blipee-OS Integration
-- =====================================================

-- Store metadata (enhanced version)
CREATE TABLE retail.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_name VARCHAR(255) NOT NULL UNIQUE, -- Maps to existing 'loja' field
    organization_id UUID, -- For Blipee-OS multi-tenancy
    code VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Lisbon',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User access mapping (Telegram to Web)
CREATE TABLE retail.user_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_user_id VARCHAR(100),
    telegram_username VARCHAR(255),
    blipee_user_id UUID,
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(telegram_user_id),
    UNIQUE(blipee_user_id)
);

-- Telegram bot state (for maintaining bot functionality)
CREATE TABLE retail.telegram_bot_state (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    state VARCHAR(100),
    context JSONB DEFAULT '{}',
    last_interaction TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chat_id)
);

-- API keys for external integrations
CREATE TABLE retail.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Sales data indexes
CREATE INDEX idx_sales_loja_data ON retail.sales_data(loja, data);
CREATE INDEX idx_sales_referencia ON retail.sales_data(referencia_documento);
CREATE INDEX idx_sales_vendedor ON retail.sales_data(vendedor_codigo);

-- People counting indexes
CREATE INDEX idx_people_loja_time ON retail.people_counting_data(loja, start_time);
CREATE INDEX idx_people_ip ON retail.people_counting_data(ip);

-- Heatmap indexes
CREATE INDEX idx_heatmap_loja_time ON retail.heatmap_data(loja, start_time);

-- Regional counting indexes
CREATE INDEX idx_regional_loja_time ON retail.regional_people_counting_data(loja, start_time);

-- Analytics indexes
CREATE INDEX idx_analytics_loja_date ON retail.analytics_results(loja, data_inicio);

-- =====================================================
-- VIEWS for Backward Compatibility
-- =====================================================

-- View to maintain compatibility with existing queries
CREATE VIEW retail.store_mapping AS
SELECT 
    loja_name as loja,
    id as store_id,
    code,
    metadata
FROM retail.stores;

-- =====================================================
-- FUNCTIONS for Data Migration
-- =====================================================

-- Function to populate stores table from existing data
CREATE OR REPLACE FUNCTION retail.populate_stores_from_data()
RETURNS void AS $$
BEGIN
    INSERT INTO retail.stores (loja_name, code)
    SELECT DISTINCT 
        loja,
        CASE 
            WHEN loja LIKE 'OML01%' THEN 'OML01'
            WHEN loja LIKE 'OML02%' THEN 'OML02'
            WHEN loja LIKE 'OML03%' THEN 'OML03'
            WHEN loja LIKE 'ONL01%' THEN 'ONL01'
            WHEN loja LIKE 'ONL02%' THEN 'ONL02'
            ELSE SUBSTRING(loja, 1, 5)
        END as code
    FROM (
        SELECT DISTINCT loja FROM retail.sales_data
        UNION
        SELECT DISTINCT loja FROM retail.people_counting_data
        UNION
        SELECT DISTINCT loja FROM retail.analytics_results
    ) all_stores
    ON CONFLICT (loja_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_data_updated_at BEFORE UPDATE ON retail.sales_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON retail.stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISSIONS (adjust based on your users)
-- =====================================================

-- Grant permissions to application user
-- GRANT ALL ON SCHEMA retail TO your_app_user;
-- GRANT ALL ON ALL TABLES IN SCHEMA retail TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA retail TO your_app_user;