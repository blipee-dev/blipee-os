-- Migration: Autonomous Agents Database Schema (Final)
-- Description: Creates all necessary tables for the autonomous agents system with bulletproof error handling
-- Date: 2025-07-15
-- Version: 3.0 (Final)

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if we need to create the agent_definitions table
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
        RAISE NOTICE 'agent_definitions table created successfully';
    ELSE
        RAISE NOTICE 'agent_definitions table already exists, skipping creation';
    END IF;
END
$$;

-- Second, check if we need to create the agent_instances table
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
        RAISE NOTICE 'agent_instances table created successfully';
    ELSE
        RAISE NOTICE 'agent_instances table already exists, skipping creation';
    END IF;
END
$$;

-- Third, create the agent_scheduled_tasks table (depends on agent_instances)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') THEN
        RAISE NOTICE 'Creating agent_scheduled_tasks table...';
        CREATE TABLE agent_scheduled_tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
            task_type TEXT NOT NULL,
            task_name TEXT NOT NULL,
            schedule_pattern TEXT NOT NULL, -- Cron-like pattern
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            task_config JSONB DEFAULT '{}',
            next_run TIMESTAMPTZ NOT NULL,
            last_run TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'agent_scheduled_tasks table created successfully';
    ELSE
        RAISE NOTICE 'agent_scheduled_tasks table already exists, skipping creation';
    END IF;
END
$$;

-- Fourth, create the agent_task_executions table
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
        RAISE NOTICE 'agent_task_executions table created successfully';
    ELSE
        RAISE NOTICE 'agent_task_executions table already exists, skipping creation';
    END IF;
END
$$;

-- Fifth, create the agent_approvals table
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
        RAISE NOTICE 'agent_approvals table created successfully';
    ELSE
        RAISE NOTICE 'agent_approvals table already exists, skipping creation';
    END IF;
END
$$;

-- Sixth, create the agent_learning_patterns table
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
        RAISE NOTICE 'agent_learning_patterns table created successfully';
    ELSE
        RAISE NOTICE 'agent_learning_patterns table already exists, skipping creation';
    END IF;
END
$$;

-- Seventh, create the agent_metrics table
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
        RAISE NOTICE 'agent_metrics table created successfully';
    ELSE
        RAISE NOTICE 'agent_metrics table already exists, skipping creation';
    END IF;
END
$$;

-- Eighth, create the agent_decisions table
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
        RAISE NOTICE 'agent_decisions table created successfully';
    ELSE
        RAISE NOTICE 'agent_decisions table already exists, skipping creation';
    END IF;
END
$$;

-- Ninth, create the agent_collaborations table
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
        RAISE NOTICE 'agent_collaborations table created successfully';
    ELSE
        RAISE NOTICE 'agent_collaborations table already exists, skipping creation';
    END IF;
END
$$;

-- Create indexes for performance (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Creating performance indexes...';
    
    -- Indexes for agent_instances
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') THEN
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
    
    -- Indexes for agent_scheduled_tasks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_scheduled_tasks_agent') THEN
            CREATE INDEX idx_agent_scheduled_tasks_agent ON agent_scheduled_tasks(agent_instance_id);
            RAISE NOTICE 'Created index: idx_agent_scheduled_tasks_agent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_scheduled_tasks_next_run') THEN
            CREATE INDEX idx_agent_scheduled_tasks_next_run ON agent_scheduled_tasks(next_run) WHERE is_active = true;
            RAISE NOTICE 'Created index: idx_agent_scheduled_tasks_next_run';
        END IF;
    END IF;
    
    -- Indexes for agent_task_executions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_task_executions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_agent') THEN
            CREATE INDEX idx_agent_task_executions_agent ON agent_task_executions(agent_instance_id);
            RAISE NOTICE 'Created index: idx_agent_task_executions_agent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_status') THEN
            CREATE INDEX idx_agent_task_executions_status ON agent_task_executions(status);
            RAISE NOTICE 'Created index: idx_agent_task_executions_status';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_task_executions_created') THEN
            CREATE INDEX idx_agent_task_executions_created ON agent_task_executions(created_at DESC);
            RAISE NOTICE 'Created index: idx_agent_task_executions_created';
        END IF;
    END IF;
    
    -- Indexes for remaining tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_approvals_agent') THEN
            CREATE INDEX idx_agent_approvals_agent ON agent_approvals(agent_instance_id);
            RAISE NOTICE 'Created index: idx_agent_approvals_agent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_approvals_status') THEN
            CREATE INDEX idx_agent_approvals_status ON agent_approvals(status);
            RAISE NOTICE 'Created index: idx_agent_approvals_status';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_learning_patterns_agent') THEN
            CREATE INDEX idx_agent_learning_patterns_agent ON agent_learning_patterns(agent_instance_id);
            RAISE NOTICE 'Created index: idx_agent_learning_patterns_agent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_learning_patterns_success') THEN
            CREATE INDEX idx_agent_learning_patterns_success ON agent_learning_patterns(success_rate DESC);
            RAISE NOTICE 'Created index: idx_agent_learning_patterns_success';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_metrics') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_metrics_agent_time') THEN
            CREATE INDEX idx_agent_metrics_agent_time ON agent_metrics(agent_instance_id, recorded_at DESC);
            RAISE NOTICE 'Created index: idx_agent_metrics_agent_time';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_decisions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_decisions_agent') THEN
            CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_instance_id);
            RAISE NOTICE 'Created index: idx_agent_decisions_agent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_decisions_created') THEN
            CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);
            RAISE NOTICE 'Created index: idx_agent_decisions_created';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_collaborations_initiator') THEN
            CREATE INDEX idx_agent_collaborations_initiator ON agent_collaborations(initiator_agent_id);
            RAISE NOTICE 'Created index: idx_agent_collaborations_initiator';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_agent_collaborations_collaborator') THEN
            CREATE INDEX idx_agent_collaborations_collaborator ON agent_collaborations(collaborator_agent_id);
            RAISE NOTICE 'Created index: idx_agent_collaborations_collaborator';
        END IF;
    END IF;
    
    RAISE NOTICE 'Index creation completed successfully';
END
$$;

-- Apply updated_at triggers (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Applying updated_at triggers...';
    
    -- Check if the update_updated_at_column function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE 'Found update_updated_at_column function, applying triggers...';
        
        -- Create triggers only if table exists and trigger doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_definitions_updated_at') THEN
                CREATE TRIGGER update_agent_definitions_updated_at BEFORE UPDATE ON agent_definitions
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_definitions_updated_at';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_instances_updated_at') THEN
                CREATE TRIGGER update_agent_instances_updated_at BEFORE UPDATE ON agent_instances
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_instances_updated_at';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_scheduled_tasks_updated_at') THEN
                CREATE TRIGGER update_agent_scheduled_tasks_updated_at BEFORE UPDATE ON agent_scheduled_tasks
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_scheduled_tasks_updated_at';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_approvals_updated_at') THEN
                CREATE TRIGGER update_agent_approvals_updated_at BEFORE UPDATE ON agent_approvals
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_approvals_updated_at';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_learning_patterns_updated_at') THEN
                CREATE TRIGGER update_agent_learning_patterns_updated_at BEFORE UPDATE ON agent_learning_patterns
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_learning_patterns_updated_at';
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_collaborations_updated_at') THEN
                CREATE TRIGGER update_agent_collaborations_updated_at BEFORE UPDATE ON agent_collaborations
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                RAISE NOTICE 'Created trigger: update_agent_collaborations_updated_at';
            END IF;
        END IF;
        
        RAISE NOTICE 'Trigger creation completed successfully';
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found, skipping triggers';
    END IF;
END
$$;

-- Insert the 4 core agent definitions (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Inserting core agent definitions...';
    
    -- Check if agent definitions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') THEN
        -- Check if agent definitions already exist
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'esg_chief_of_staff') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'ESG Chief of Staff',
                'esg_chief_of_staff',
                'Senior AI executive responsible for comprehensive ESG strategy, metrics analysis, and executive reporting',
                '{
                    "analysis": ["esg_metrics", "trend_analysis", "anomaly_detection", "executive_reporting"],
                    "monitoring": ["compliance_tracking", "performance_monitoring", "risk_assessment"],
                    "optimization": ["strategy_optimization", "resource_allocation", "improvement_recommendations"],
                    "reporting": ["executive_summaries", "board_reports", "stakeholder_updates"]
                }',
                3,
                '{
                    "analysis_frequency": "daily",
                    "report_generation": "weekly",
                    "anomaly_threshold": 0.2,
                    "confidence_minimum": 0.7
                }'
            );
            RAISE NOTICE 'Inserted agent definition: ESG Chief of Staff';
        ELSE
            RAISE NOTICE 'ESG Chief of Staff already exists, skipping insertion';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'compliance_guardian') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Compliance Guardian',
                'compliance_guardian',
                'AI compliance officer ensuring adherence to ESG frameworks, regulations, and reporting standards',
                '{
                    "frameworks": ["GRI", "TCFD", "CSRD", "SEC_Climate", "CDP"],
                    "monitoring": ["regulatory_changes", "deadline_tracking", "compliance_gaps"],
                    "validation": ["data_quality", "framework_alignment", "reporting_accuracy"],
                    "alerts": ["compliance_risks", "deadline_warnings", "regulatory_updates"]
                }',
                4,
                '{
                    "monitoring_frequency": "hourly",
                    "deadline_warning_days": 30,
                    "risk_threshold": 0.3,
                    "validation_strictness": "high"
                }'
            );
            RAISE NOTICE 'Inserted agent definition: Compliance Guardian';
        ELSE
            RAISE NOTICE 'Compliance Guardian already exists, skipping insertion';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'carbon_hunter') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Carbon Hunter',
                'carbon_hunter',
                'AI specialist focused on carbon emission identification, reduction opportunities, and optimization',
                '{
                    "detection": ["emission_sources", "carbon_intensity", "scope_classification"],
                    "optimization": ["reduction_opportunities", "efficiency_improvements", "supplier_optimization"],
                    "monitoring": ["carbon_footprint", "emission_trends", "reduction_progress"],
                    "recommendations": ["technology_upgrades", "process_improvements", "offset_strategies"]
                }',
                3,
                '{
                    "scan_frequency": "continuous",
                    "optimization_threshold": 0.05,
                    "reduction_target": 0.1,
                    "recommendation_confidence": 0.8
                }'
            );
            RAISE NOTICE 'Inserted agent definition: Carbon Hunter';
        ELSE
            RAISE NOTICE 'Carbon Hunter already exists, skipping insertion';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM agent_definitions WHERE type = 'supply_chain_investigator') THEN
            INSERT INTO agent_definitions (name, type, description, capabilities, default_autonomy_level, configuration) VALUES
            (
                'Supply Chain Investigator',
                'supply_chain_investigator',
                'AI analyst specializing in supply chain sustainability assessment, risk identification, and optimization',
                '{
                    "assessment": ["supplier_scoring", "sustainability_metrics", "risk_analysis"],
                    "monitoring": ["supplier_performance", "supply_chain_risks", "compliance_tracking"],
                    "optimization": ["supplier_selection", "relationship_management", "improvement_programs"],
                    "intelligence": ["market_analysis", "alternative_suppliers", "cost_optimization"]
                }',
                2,
                '{
                    "assessment_frequency": "weekly",
                    "risk_monitoring": "daily",
                    "scoring_methodology": "weighted_esg",
                    "improvement_threshold": 0.15
                }'
            );
            RAISE NOTICE 'Inserted agent definition: Supply Chain Investigator';
        ELSE
            RAISE NOTICE 'Supply Chain Investigator already exists, skipping insertion';
        END IF;
        
        RAISE NOTICE 'Agent definitions insertion completed successfully';
    ELSE
        RAISE NOTICE 'agent_definitions table does not exist, skipping agent definitions insertion';
    END IF;
END
$$;

-- Enable Row Level Security (RLS) on all tables (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Enabling Row Level Security...';
    
    -- Enable RLS only if table exists and RLS not already enabled
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_definitions' AND rowsecurity = true) THEN
            ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_definitions';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_instances' AND rowsecurity = true) THEN
            ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_instances';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_scheduled_tasks') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_scheduled_tasks' AND rowsecurity = true) THEN
            ALTER TABLE agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_scheduled_tasks';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_task_executions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_task_executions' AND rowsecurity = true) THEN
            ALTER TABLE agent_task_executions ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_task_executions';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_approvals') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_approvals' AND rowsecurity = true) THEN
            ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_approvals';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_learning_patterns') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_learning_patterns' AND rowsecurity = true) THEN
            ALTER TABLE agent_learning_patterns ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_learning_patterns';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_metrics') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_metrics' AND rowsecurity = true) THEN
            ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_metrics';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_decisions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_decisions' AND rowsecurity = true) THEN
            ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_decisions';
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_collaborations') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_collaborations' AND rowsecurity = true) THEN
            ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on agent_collaborations';
        END IF;
    END IF;
    
    RAISE NOTICE 'Row Level Security setup completed successfully';
END
$$;

-- Create RLS policies (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Creating RLS policies...';
    
    -- Agent definitions are public
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_definitions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agent definitions are public') THEN
            CREATE POLICY "Agent definitions are public" ON agent_definitions FOR ALL USING (true);
            RAISE NOTICE 'Created policy: Agent definitions are public';
        END IF;
    END IF;
    
    -- Agent instances access based on organization membership
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_instances') THEN
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
    
    RAISE NOTICE 'RLS policies creation completed successfully';
END
$$;

-- Create helper functions (with comprehensive error handling)
DO $$
BEGIN
    RAISE NOTICE 'Creating helper functions...';
END
$$;

CREATE OR REPLACE FUNCTION initialize_agents_for_organization(org_id UUID)
RETURNS void AS $$
BEGIN
    -- Create instances for all agent definitions
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
    -- Calculate next run time (simplified - would need proper cron parsing)
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
    
    RAISE NOTICE 'Scheduled task: % for agent: %', p_task_name, p_agent_instance_id;
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
    
    RAISE NOTICE 'Started task execution: % for agent: %', p_task_name, p_agent_instance_id;
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
    
    RAISE NOTICE 'Updated health for agent: % to score: %', p_agent_instance_id, p_health_score;
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
    
    RAISE NOTICE 'Recorded decision: % for agent: %', p_decision_type, p_agent_instance_id;
    RETURN decision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 AUTONOMOUS AGENTS MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'All 9 agent tables have been created with proper relationships';
    RAISE NOTICE 'All 5 helper functions have been created';
    RAISE NOTICE 'All performance indexes have been created';
    RAISE NOTICE 'Row Level Security has been enabled';
    RAISE NOTICE 'All 4 core agent definitions have been inserted';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npm run dev';
    RAISE NOTICE '2. Visit: http://localhost:3001/dashboard/agents';
    RAISE NOTICE '3. Test agent functionality';
    RAISE NOTICE '===============================================';
END
$$;