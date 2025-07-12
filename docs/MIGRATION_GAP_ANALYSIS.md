# 🔍 Migration Gap Analysis - Database Schema Requirements

## Overview
This document analyzes the existing database migrations and identifies what additional tables are needed for the blipee OS domination roadmap features.

---

## Existing Agent-Related Tables

### From `20240711_autonomous_agents_tables.sql` ✅
- **autonomous_agents**: Full agent registry with all required fields
- **agent_tasks**: Comprehensive task management
- **agent_approvals**: Human-in-the-loop approvals
- **agent_knowledge**: Learning patterns storage
- **agent_execution_logs**: Detailed audit trail
- **agent_errors**: Error tracking

### From `20240711_create_agent_tables.sql` ✅
- **agent_configs**: Agent configuration management
- **agent_events**: Event logging
- **agent_results**: Task execution results
- **agent_approvals**: Duplicate (exists in both files)
- **agent_knowledge**: Duplicate (exists in both files)
- **agent_errors**: Duplicate (exists in both files)
- **agent_scheduled_tasks**: Scheduled task management

### From `20240711_create_agent_learning_tables.sql` ✅
- **agent_outcomes**: Learning outcomes tracking
- **agent_patterns**: Pattern recognition storage
- **agent_knowledge_base**: Knowledge repository

**Status**: ✅ Stream A (Autonomous Agents) has ALL required tables

---

## Missing Tables for New Features

### Stream B: ML Pipeline Tables ❌

#### Required Migration: `20240712_ml_pipeline_tables.sql`
```sql
-- ML Models Registry
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL CHECK (model_type IN ('emissions_prediction', 'anomaly_detection', 'optimization', 'recommendation')),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'validating', 'active', 'deprecated', 'failed')),
  framework TEXT NOT NULL DEFAULT 'tensorflow.js',
  architecture JSONB NOT NULL,
  hyperparameters JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB,
  training_data_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, model_type, version)
);

-- Feature Store
CREATE TABLE IF NOT EXISTS ml_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_set TEXT NOT NULL,
  features JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  validity_period INTERVAL NOT NULL DEFAULT '1 day',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Predictions Log
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ml_models(id),
  prediction_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  actual_value JSONB,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training Jobs
CREATE TABLE IF NOT EXISTS ml_training_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  config JSONB NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metrics JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL,
  evaluation_data JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Stream C: Industry Models Tables ❌

#### Required Migration: `20240713_industry_models_tables.sql`
```sql
-- GRI Standards Mapping
CREATE TABLE IF NOT EXISTS gri_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  standard_code TEXT NOT NULL UNIQUE, -- e.g., 'GRI 11', 'GRI 12'
  industry TEXT NOT NULL,
  version TEXT NOT NULL,
  topics JSONB NOT NULL,
  requirements JSONB NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Industry Models
CREATE TABLE IF NOT EXISTS industry_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_code TEXT NOT NULL UNIQUE,
  industry_name TEXT NOT NULL,
  gri_standard TEXT REFERENCES gri_standards(standard_code),
  model_type TEXT NOT NULL,
  configuration JSONB NOT NULL,
  material_topics JSONB NOT NULL,
  benchmarks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Industry Mapping
CREATE TABLE IF NOT EXISTS organization_industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  primary_industry TEXT NOT NULL REFERENCES industry_models(industry_code),
  secondary_industries TEXT[] DEFAULT '{}',
  classification_confidence DECIMAL(3,2),
  material_topics JSONB,
  custom_topics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Industry Benchmarks
CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_code TEXT NOT NULL REFERENCES industry_models(industry_code),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  period TEXT NOT NULL,
  statistics JSONB NOT NULL, -- mean, median, quartiles, etc.
  sample_size INTEGER NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(industry_code, metric_name, period)
);
```

### Stream D: Network Features Tables ❌

#### Required Migration: `20240714_network_features_tables.sql`
```sql
-- Network Nodes (Organizations in the network)
CREATE TABLE IF NOT EXISTS network_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  external_id TEXT, -- For non-platform organizations
  node_type TEXT NOT NULL CHECK (node_type IN ('organization', 'supplier', 'customer', 'partner')),
  node_name TEXT NOT NULL,
  industry TEXT,
  location JSONB,
  certifications TEXT[],
  esg_score DECIMAL(3,2),
  data_sharing_level TEXT NOT NULL DEFAULT 'none' CHECK (data_sharing_level IN ('full', 'anonymous', 'aggregated', 'none')),
  metadata JSONB DEFAULT '{}',
  joined_network_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Network Edges (Relationships)
CREATE TABLE IF NOT EXISTS network_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_node_id UUID NOT NULL REFERENCES network_nodes(id),
  target_node_id UUID NOT NULL REFERENCES network_nodes(id),
  edge_type TEXT NOT NULL CHECK (edge_type IN ('supplies_to', 'buys_from', 'partners_with', 'subsidiary_of')),
  relationship_strength DECIMAL(3,2),
  volume_info JSONB,
  sustainability_score DECIMAL(3,2),
  risk_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- Privacy Layers
CREATE TABLE IF NOT EXISTS network_privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_category TEXT NOT NULL,
  sharing_level TEXT NOT NULL CHECK (sharing_level IN ('public', 'network', 'partners', 'private')),
  anonymization_method TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, data_category)
);

-- Peer Groups
CREATE TABLE IF NOT EXISTS network_peer_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  criteria JSONB NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Peer Group Members
CREATE TABLE IF NOT EXISTS network_peer_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peer_group_id UUID NOT NULL REFERENCES network_peer_groups(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  similarity_score DECIMAL(3,2),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(peer_group_id, organization_id)
);

-- Anonymous Benchmarks
CREATE TABLE IF NOT EXISTS network_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_type TEXT NOT NULL,
  industry TEXT,
  metric_name TEXT NOT NULL,
  period TEXT NOT NULL,
  participant_count INTEGER NOT NULL,
  statistics JSONB NOT NULL,
  confidence_level DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(benchmark_type, industry, metric_name, period)
);

-- Supply Chain Assessments
CREATE TABLE IF NOT EXISTS network_supplier_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_node_id UUID NOT NULL REFERENCES network_nodes(id),
  assessment_type TEXT NOT NULL,
  scores JSONB NOT NULL,
  risks JSONB,
  recommendations JSONB,
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL
);

-- Data Marketplace
CREATE TABLE IF NOT EXISTS network_data_marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_org_id UUID NOT NULL REFERENCES organizations(id),
  dataset_name TEXT NOT NULL,
  dataset_type TEXT NOT NULL,
  description TEXT,
  data_period TEXT NOT NULL,
  quality_score DECIMAL(3,2),
  price_credits INTEGER,
  access_type TEXT NOT NULL CHECK (access_type IN ('one_time', 'subscription', 'exchange')),
  metadata JSONB DEFAULT '{}',
  listed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Data Exchange Transactions
CREATE TABLE IF NOT EXISTS network_data_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES network_data_marketplace(id),
  buyer_org_id UUID NOT NULL REFERENCES organizations(id),
  transaction_type TEXT NOT NULL,
  credits_exchanged INTEGER,
  access_granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ
);

-- Industry Consortiums
CREATE TABLE IF NOT EXISTS network_consortiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consortium_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  charter JSONB NOT NULL,
  governance JSONB NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consortium Members
CREATE TABLE IF NOT EXISTS network_consortium_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consortium_id UUID NOT NULL REFERENCES network_consortiums(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  member_role TEXT NOT NULL,
  voting_power INTEGER DEFAULT 1,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(consortium_id, organization_id)
);
```

### Additional Cross-Stream Tables ❌

#### Required Migration: `20240715_integration_tables.sql`
```sql
-- Agent-ML Integration
CREATE TABLE IF NOT EXISTS agent_ml_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES autonomous_agents(id),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  request_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  prediction JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Network Intelligence Cache
CREATE TABLE IF NOT EXISTS network_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL,
  data JSONB NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Regulatory Compliance Tracking
CREATE TABLE IF NOT EXISTS regulatory_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  regulation TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL,
  last_assessment TIMESTAMPTZ,
  next_deadline TIMESTAMPTZ,
  compliance_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration Execution Order

1. **Week 1, Day 2**: ML Pipeline tables (Stream B dependency)
2. **Week 2, Day 7**: Industry Models tables (Stream C dependency)
3. **Week 3, Day 11**: Network Features tables (Stream D)
4. **Week 3, Day 12**: Integration tables (Cross-stream)

---

## Summary

### Existing ✅
- All Stream A (Autonomous Agents) tables exist
- Basic authentication and organization structure exists
- Monitoring and compliance tables exist

### Missing ❌
- All Stream B (ML Pipeline) tables
- All Stream C (Industry Models) tables
- All Stream D (Network Features) tables
- Cross-stream integration tables

### Action Required
Create 4 new migration files totaling approximately 40+ new tables to support the domination roadmap features.

---

**Document Version**: 1.0
**Last Updated**: ${new Date().toISOString()}
**Migration Lead**: [Assign Name]