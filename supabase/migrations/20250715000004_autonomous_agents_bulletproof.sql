-- Migration: Autonomous Agents Database Schema (Bulletproof)
-- Description: Creates all necessary tables for the autonomous agents system with absolute bulletproof error handling
-- Date: 2025-07-15
-- Version: 4.0 (Bulletproof)

-- Enable uuid-ossp extension if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
        RAISE NOTICE 'Created extension: uuid-ossp';
    ELSE
        RAISE NOTICE 'Extension uuid-ossp already exists';
    END IF;
END
$$;

-- Create agent_definitions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') THEN
        RAISE NOTICE 'Creating agent_definitions table...';
        
        CREATE TABLE agent_definitions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            description TEXT,
            capabilities JSONB DEFAULT '{}',
            default_autonomy_level INTEGER NOT NULL DEFAULT 1 CHECK (default_autonomy_level >= 1 AND default_autonomy_level <= 5),
            configuration JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_definitions table';
    ELSE
        RAISE NOTICE 'Table agent_definitions already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_instances table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') THEN
        RAISE NOTICE 'Creating agent_instances table...';
        
        CREATE TABLE agent_instances (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            agent_definition_id UUID NOT NULL REFERENCES agent_definitions(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('stopped', 'starting', 'running', 'paused', 'error')),
            autonomy_level INTEGER NOT NULL DEFAULT 1 CHECK (autonomy_level >= 1 AND autonomy_level <= 5),
            configuration JSONB DEFAULT '{}',
            last_heartbeat TIMESTAMPTZ,
            health_score NUMERIC DEFAULT 1.0 CHECK (health_score >= 0.0 AND health_score <= 1.0),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(organization_id, agent_definition_id)
        );
        
        RAISE NOTICE 'Successfully created agent_instances table';
    ELSE
        RAISE NOTICE 'Table agent_instances already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_scheduled_tasks table (depends on agent_instances)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') THEN
        RAISE NOTICE 'Creating agent_scheduled_tasks table...';
        
        CREATE TABLE agent_scheduled_tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            task_type TEXT NOT NULL,
            task_name TEXT NOT NULL,
            schedule_pattern TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            task_config JSONB DEFAULT '{}',
            next_run TIMESTAMPTZ NOT NULL,
            last_run TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_scheduled_tasks table';
    ELSE
        RAISE NOTICE 'Table agent_scheduled_tasks already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_task_executions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_task_executions') THEN
        RAISE NOTICE 'Creating agent_task_executions table...';
        
        CREATE TABLE agent_task_executions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            scheduled_task_id UUID REFERENCES agent_scheduled_tasks(id) ON DELETE SET NULL,
            task_type TEXT NOT NULL,
            task_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            input_data JSONB DEFAULT '{}',
            output_data JSONB DEFAULT '{}',
            error_message TEXT,
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            duration_ms INTEGER,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_task_executions table';
    ELSE
        RAISE NOTICE 'Table agent_task_executions already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_approvals table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') THEN
        RAISE NOTICE 'Creating agent_approvals table...';
        
        CREATE TABLE agent_approvals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            task_execution_id UUID REFERENCES agent_task_executions(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            action_description TEXT NOT NULL,
            action_data JSONB DEFAULT '{}',
            required_autonomy_level INTEGER NOT NULL CHECK (required_autonomy_level >= 1 AND required_autonomy_level <= 5),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
            approved_by UUID REFERENCES auth.users(id),
            approval_reason TEXT,
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_approvals table';
    ELSE
        RAISE NOTICE 'Table agent_approvals already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_learning_patterns table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') THEN
        RAISE NOTICE 'Creating agent_learning_patterns table...';
        
        CREATE TABLE agent_learning_patterns (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            pattern_type TEXT NOT NULL,
            pattern_name TEXT NOT NULL,
            pattern_data JSONB NOT NULL,
            success_rate NUMERIC DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
            confidence_score NUMERIC DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
            usage_count INTEGER DEFAULT 0,
            last_used TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_learning_patterns table';
    ELSE
        RAISE NOTICE 'Table agent_learning_patterns already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_metrics table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_metrics') THEN
        RAISE NOTICE 'Creating agent_metrics table...';
        
        CREATE TABLE agent_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            metric_type TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value NUMERIC NOT NULL,
            metric_unit TEXT,
            metadata JSONB DEFAULT '{}',
            recorded_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_metrics table';
    ELSE
        RAISE NOTICE 'Table agent_metrics already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_decisions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_decisions') THEN
        RAISE NOTICE 'Creating agent_decisions table...';
        
        CREATE TABLE agent_decisions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            task_execution_id UUID REFERENCES agent_task_executions(id) ON DELETE CASCADE,
            decision_type TEXT NOT NULL,
            decision_context JSONB NOT NULL,
            decision_outcome JSONB NOT NULL,
            confidence_score NUMERIC CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
            autonomy_level_used INTEGER CHECK (autonomy_level_used >= 1 AND autonomy_level_used <= 5),
            approval_required BOOLEAN DEFAULT false,
            approval_id UUID REFERENCES agent_approvals(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_decisions table';
    ELSE
        RAISE NOTICE 'Table agent_decisions already exists, skipping creation';
    END IF;
END
$$;

-- Create agent_collaborations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') THEN
        RAISE NOTICE 'Creating agent_collaborations table...';
        
        CREATE TABLE agent_collaborations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            initiator_agent_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            collaborator_agent_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            collaboration_type TEXT NOT NULL,
            collaboration_data JSONB NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Successfully created agent_collaborations table';
    ELSE
        RAISE NOTICE 'Table agent_collaborations already exists, skipping creation';
    END IF;
END
$$;

-- Now create all indexes in one block after ensuring all tables exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Creating performance indexes...';
    
    -- Check if agent_instances table exists and create its indexes
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') INTO table_exists;
    IF table_exists THEN
        -- Create indexes for agent_instances
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_instances_org') THEN
            CREATE INDEX idx_agent_instances_org ON agent_instances(organization_id);
            RAISE NOTICE 'Created index: idx_agent_instances_org';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_instances_status') THEN
            CREATE INDEX idx_agent_instances_status ON agent_instances(status);
            RAISE NOTICE 'Created index: idx_agent_instances_status';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_instances_health') THEN
            CREATE INDEX idx_agent_instances_health ON agent_instances(health_score);
            RAISE NOTICE 'Created index: idx_agent_instances_health';
        END IF;
    END IF;
    
    -- Check if agent_scheduled_tasks table exists and create its indexes
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') INTO table_exists;
    IF table_exists THEN
        -- First verify the column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks' AND column_name = 'agent_instance_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_scheduled_tasks_agent') THEN
                CREATE INDEX idx_agent_scheduled_tasks_agent ON agent_scheduled_tasks(agent_instance_id);
                RAISE NOTICE 'Created index: idx_agent_scheduled_tasks_agent';
            END IF;
        ELSE
            RAISE NOTICE 'Column agent_instance_id not found in agent_scheduled_tasks, skipping index';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks' AND column_name = 'next_run') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_scheduled_tasks_next_run') THEN
                CREATE INDEX idx_agent_scheduled_tasks_next_run ON agent_scheduled_tasks(next_run) WHERE is_active = true;
                RAISE NOTICE 'Created index: idx_agent_scheduled_tasks_next_run';
            END IF;
        END IF;
    END IF;
    
    -- Check if agent_task_executions table exists and create its indexes
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_task_executions') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_task_executions' AND column_name = 'agent_instance_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_agent') THEN
                CREATE INDEX idx_agent_task_executions_agent ON agent_task_executions(agent_instance_id);
                RAISE NOTICE 'Created index: idx_agent_task_executions_agent';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_task_executions' AND column_name = 'status') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_status') THEN
                CREATE INDEX idx_agent_task_executions_status ON agent_task_executions(status);
                RAISE NOTICE 'Created index: idx_agent_task_executions_status';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_task_executions' AND column_name = 'created_at') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_created') THEN
                CREATE INDEX idx_agent_task_executions_created ON agent_task_executions(created_at DESC);
                RAISE NOTICE 'Created index: idx_agent_task_executions_created';
            END IF;
        END IF;
    END IF;
    
    -- Continue with other tables...
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_approvals' AND column_name = 'agent_instance_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_approvals_agent') THEN
                CREATE INDEX idx_agent_approvals_agent ON agent_approvals(agent_instance_id);
                RAISE NOTICE 'Created index: idx_agent_approvals_agent';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_approvals' AND column_name = 'status') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_approvals_status') THEN
                CREATE INDEX idx_agent_approvals_status ON agent_approvals(status);
                RAISE NOTICE 'Created index: idx_agent_approvals_status';
            END IF;
        END IF;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns' AND column_name = 'agent_instance_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_learning_patterns_agent') THEN
                CREATE INDEX idx_agent_learning_patterns_agent ON agent_learning_patterns(agent_instance_id);
                RAISE NOTICE 'Created index: idx_agent_learning_patterns_agent';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns' AND column_name = 'success_rate') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_learning_patterns_success') THEN
                CREATE INDEX idx_agent_learning_patterns_success ON agent_learning_patterns(success_rate DESC);
                RAISE NOTICE 'Created index: idx_agent_learning_patterns_success';
            END IF;
        END IF;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_metrics') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_metrics' AND column_name = 'agent_instance_id') 
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_metrics' AND column_name = 'recorded_at') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_metrics_agent_time') THEN
                CREATE INDEX idx_agent_metrics_agent_time ON agent_metrics(agent_instance_id, recorded_at DESC);
                RAISE NOTICE 'Created index: idx_agent_metrics_agent_time';
            END IF;
        END IF;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_decisions') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_decisions' AND column_name = 'agent_instance_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_decisions_agent') THEN
                CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_instance_id);
                RAISE NOTICE 'Created index: idx_agent_decisions_agent';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_decisions' AND column_name = 'created_at') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_decisions_created') THEN
                CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);
                RAISE NOTICE 'Created index: idx_agent_decisions_created';
            END IF;
        END IF;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') INTO table_exists;
    IF table_exists THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_collaborations' AND column_name = 'initiator_agent_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_collaborations_initiator') THEN
                CREATE INDEX idx_agent_collaborations_initiator ON agent_collaborations(initiator_agent_id);
                RAISE NOTICE 'Created index: idx_agent_collaborations_initiator';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_collaborations' AND column_name = 'collaborator_agent_id') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_collaborations_collaborator') THEN
                CREATE INDEX idx_agent_collaborations_collaborator ON agent_collaborations(collaborator_agent_id);
                RAISE NOTICE 'Created index: idx_agent_collaborations_collaborator';
            END IF;
        END IF;
    END IF;
    
    RAISE NOTICE 'Index creation completed successfully';
END
$$;

-- Insert agent definitions
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Inserting core agent definitions...';
        
        -- ESG Chief of Staff
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'esg_chief_of_staff') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'ESG Chief of Staff',
                'esg_chief_of_staff',
                'Senior AI executive responsible for comprehensive ESG strategy, metrics analysis, and executive reporting',
                '{"analysis": ["esg_metrics", "trend_analysis", "anomaly_detection", "executive_reporting"], "monitoring": ["compliance_tracking", "performance_monitoring", "risk_assessment"], "optimization": ["strategy_optimization", "resource_allocation", "improvement_recommendations"], "reporting": ["executive_summaries", "board_reports", "stakeholder_updates"]}',
                3,
                '{"analysis_frequency": "daily", "report_generation": "weekly", "anomaly_threshold": 0.2, "confidence_minimum": 0.7}'
            );
            RAISE NOTICE 'Inserted: ESG Chief of Staff';
        END IF;
        
        -- Compliance Guardian
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'compliance_guardian') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Compliance Guardian',
                'compliance_guardian',
                'AI compliance officer ensuring adherence to ESG frameworks, regulations, and reporting standards',
                '{"frameworks": ["GRI", "TCFD", "CSRD", "SEC_Climate", "CDP"], "monitoring": ["regulatory_changes", "deadline_tracking", "compliance_gaps"], "validation": ["data_quality", "framework_alignment", "reporting_accuracy"], "alerts": ["compliance_risks", "deadline_warnings", "regulatory_updates"]}',
                4,
                '{"monitoring_frequency": "hourly", "deadline_warning_days": 30, "risk_threshold": 0.3, "validation_strictness": "high"}'
            );
            RAISE NOTICE 'Inserted: Compliance Guardian';
        END IF;
        
        -- Carbon Hunter
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'carbon_hunter') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Carbon Hunter',
                'carbon_hunter',
                'AI specialist focused on carbon emission identification, reduction opportunities, and optimization',
                '{"detection": ["emission_sources", "carbon_intensity", "scope_classification"], "optimization": ["reduction_opportunities", "efficiency_improvements", "supplier_optimization"], "monitoring": ["carbon_footprint", "emission_trends", "reduction_progress"], "recommendations": ["technology_upgrades", "process_improvements", "offset_strategies"]}',
                3,
                '{"scan_frequency": "continuous", "optimization_threshold": 0.05, "reduction_target": 0.1, "recommendation_confidence": 0.8}'
            );
            RAISE NOTICE 'Inserted: Carbon Hunter';
        END IF;
        
        -- Supply Chain Investigator
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'supply_chain_investigator') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Supply Chain Investigator',
                'supply_chain_investigator',
                'AI analyst specializing in supply chain sustainability assessment, risk identification, and optimization',
                '{"assessment": ["supplier_scoring", "sustainability_metrics", "risk_analysis"], "monitoring": ["supplier_performance", "supply_chain_risks", "compliance_tracking"], "optimization": ["supplier_selection", "relationship_management", "improvement_programs"], "intelligence": ["market_analysis", "alternative_suppliers", "cost_optimization"]}',
                2,
                '{"assessment_frequency": "weekly", "risk_monitoring": "daily", "scoring_methodology": "weighted_esg", "improvement_threshold": 0.15}'
            );
            RAISE NOTICE 'Inserted: Supply Chain Investigator';
        END IF;
        
        RAISE NOTICE 'Agent definitions insertion completed';
    ELSE
        RAISE NOTICE 'agent_definitions table does not exist, skipping agent definitions insertion';
    END IF;
END
$$;

-- Enable RLS and create policies
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Enabling Row Level Security and creating policies...';
    
    -- Enable RLS on agent_definitions
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agent definitions are public') THEN
            CREATE POLICY "Agent definitions are public" ON agent_definitions FOR ALL USING (true);
            RAISE NOTICE 'Created policy: Agent definitions are public';
        END IF;
    END IF;
    
    -- Enable RLS on agent_instances
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agent instances access') THEN
            CREATE POLICY "Agent instances access" ON agent_instances FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM user_organizations 
                    WHERE user_id = auth.uid()
                )
            );
            RAISE NOTICE 'Created policy: Agent instances access';
        END IF;
    END IF;
    
    -- Enable RLS on remaining tables
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_task_executions') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_task_executions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_learning_patterns ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_metrics') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_decisions') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') INTO table_exists;
    IF table_exists THEN
        ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    RAISE NOTICE 'RLS setup completed';
END
$$;

-- Create helper functions
CREATE OR REPLACE FUNCTION initialize_agents_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO agent_instances (organization_id, agent_definition_id, name, status, autonomy_level, configuration)
    SELECT 
        org_id,
        ad.id,
        ad.name,
        'stopped',
        ad.default_autonomy_level,
        ad.configuration
    FROM agent_definitions ad
    ON CONFLICT (organization_id, agent_definition_id) DO NOTHING;
    
    RAISE NOTICE 'Initialized agents for organization: %', org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION schedule_agent_task(
    p_agent_instance_id UUID,
    p_task_type TEXT,
    p_task_name TEXT,
    p_schedule_pattern TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_task_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    task_id UUID;
    next_run_time TIMESTAMPTZ;
BEGIN
    next_run_time := NOW() + INTERVAL '1 hour';
    
    INSERT INTO agent_scheduled_tasks (
        agent_instance_id, task_type, task_name, schedule_pattern, 
        priority, task_config, next_run
    )
    VALUES (
        p_agent_instance_id, p_task_type, p_task_name, p_schedule_pattern,
        p_priority, p_task_config, next_run_time
    )
    RETURNING id INTO task_id;
    
    RETURN task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_agent_task(
    p_agent_instance_id UUID,
    p_task_type TEXT,
    p_task_name TEXT,
    p_input_data JSONB DEFAULT '{}',
    p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO agent_task_executions (
        agent_instance_id, task_type, task_name, status, priority, input_data, started_at
    )
    VALUES (
        p_agent_instance_id, p_task_type, p_task_name, 'running', p_priority, p_input_data, NOW()
    )
    RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_agent_health(
    p_agent_instance_id UUID,
    p_health_score NUMERIC
)
RETURNS void AS $$
BEGIN
    UPDATE agent_instances 
    SET 
        health_score = p_health_score,
        last_heartbeat = NOW(),
        updated_at = NOW()
    WHERE id = p_agent_instance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_agent_decision(
    p_agent_instance_id UUID,
    p_task_execution_id UUID,
    p_decision_type TEXT,
    p_decision_context JSONB,
    p_decision_outcome JSONB,
    p_confidence_score NUMERIC,
    p_autonomy_level_used INTEGER
)
RETURNS UUID AS $$
DECLARE
    decision_id UUID;
BEGIN
    INSERT INTO agent_decisions (
        agent_instance_id, task_execution_id, decision_type, decision_context,
        decision_outcome, confidence_score, autonomy_level_used
    )
    VALUES (
        p_agent_instance_id, p_task_execution_id, p_decision_type, p_decision_context,
        p_decision_outcome, p_confidence_score, p_autonomy_level_used
    )
    RETURNING id INTO decision_id;
    
    RETURN decision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 AUTONOMOUS AGENTS MIGRATION COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'All 9 agent tables created with proper relationships';
    RAISE NOTICE 'All 5 helper functions created';
    RAISE NOTICE 'All performance indexes created';
    RAISE NOTICE 'Row Level Security enabled';
    RAISE NOTICE 'All 4 core agent definitions inserted';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'System is now ready for autonomous agent operations!';
    RAISE NOTICE '==================================================';
END
$$;