-- Migration: Autonomous Agents Database Schema
-- Description: Creates all necessary tables for the autonomous agents system
-- Date: 2025-07-15

-- Agent definitions and configurations
CREATE TABLE IF NOT EXISTS agent_definitions (
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

-- Agent instances per organization
CREATE TABLE IF NOT EXISTS agent_instances (
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

-- Scheduled tasks for agents
CREATE TABLE IF NOT EXISTS agent_scheduled_tasks (
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

-- Agent task executions and history
CREATE TABLE IF NOT EXISTS agent_task_executions (
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

-- Agent approval workflows
CREATE TABLE IF NOT EXISTS agent_approvals (
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

-- Agent learning patterns and outcomes
CREATE TABLE IF NOT EXISTS agent_learning_patterns (
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

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent decisions and actions log
CREATE TABLE IF NOT EXISTS agent_decisions (
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

-- Agent collaboration and communication
CREATE TABLE IF NOT EXISTS agent_collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_agent_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  collaborator_agent_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  collaboration_type TEXT NOT NULL,
  collaboration_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agent_instances_org ON agent_instances(organization_id);
CREATE INDEX idx_agent_instances_status ON agent_instances(status);
CREATE INDEX idx_agent_instances_health ON agent_instances(health_score);
CREATE INDEX idx_agent_scheduled_tasks_agent ON agent_scheduled_tasks(agent_instance_id);
CREATE INDEX idx_agent_scheduled_tasks_next_run ON agent_scheduled_tasks(next_run) WHERE is_active = true;
CREATE INDEX idx_agent_task_executions_agent ON agent_task_executions(agent_instance_id);
CREATE INDEX idx_agent_task_executions_status ON agent_task_executions(status);
CREATE INDEX idx_agent_task_executions_created ON agent_task_executions(created_at DESC);
CREATE INDEX idx_agent_approvals_agent ON agent_approvals(agent_instance_id);
CREATE INDEX idx_agent_approvals_status ON agent_approvals(status);
CREATE INDEX idx_agent_learning_patterns_agent ON agent_learning_patterns(agent_instance_id);
CREATE INDEX idx_agent_learning_patterns_success ON agent_learning_patterns(success_rate DESC);
CREATE INDEX idx_agent_metrics_agent_time ON agent_metrics(agent_instance_id, recorded_at DESC);
CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_instance_id);
CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);
CREATE INDEX idx_agent_collaborations_initiator ON agent_collaborations(initiator_agent_id);
CREATE INDEX idx_agent_collaborations_collaborator ON agent_collaborations(collaborator_agent_id);

-- Apply updated_at triggers
CREATE TRIGGER update_agent_definitions_updated_at BEFORE UPDATE ON agent_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_instances_updated_at BEFORE UPDATE ON agent_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_scheduled_tasks_updated_at BEFORE UPDATE ON agent_scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_approvals_updated_at BEFORE UPDATE ON agent_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_learning_patterns_updated_at BEFORE UPDATE ON agent_learning_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_collaborations_updated_at BEFORE UPDATE ON agent_collaborations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert the 4 core agent definitions
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
),
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
),
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
),
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

-- Row Level Security (RLS) policies
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;

-- RLS policies for multi-tenant data isolation
CREATE POLICY "Agent definitions are public" ON agent_definitions FOR ALL USING (true);

CREATE POLICY "Agent instances access" ON agent_instances FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agent scheduled tasks access" ON agent_scheduled_tasks FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent task executions access" ON agent_task_executions FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent approvals access" ON agent_approvals FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent learning patterns access" ON agent_learning_patterns FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent metrics access" ON agent_metrics FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent decisions access" ON agent_decisions FOR ALL USING (
  agent_instance_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

CREATE POLICY "Agent collaborations access" ON agent_collaborations FOR ALL USING (
  initiator_agent_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  ) OR
  collaborator_agent_id IN (
    SELECT ai.id FROM agent_instances ai
    JOIN user_organizations uo ON ai.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT ALL ON agent_definitions TO authenticated;
GRANT ALL ON agent_instances TO authenticated;
GRANT ALL ON agent_scheduled_tasks TO authenticated;
GRANT ALL ON agent_task_executions TO authenticated;
GRANT ALL ON agent_approvals TO authenticated;
GRANT ALL ON agent_learning_patterns TO authenticated;
GRANT ALL ON agent_metrics TO authenticated;
GRANT ALL ON agent_decisions TO authenticated;
GRANT ALL ON agent_collaborations TO authenticated;

-- Create function to initialize agents for new organizations
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
  FROM agent_definitions ad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to schedule agent tasks
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
  
  RETURN task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to execute agent tasks
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

-- Create function to update agent health
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

-- Create function to record agent decisions
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