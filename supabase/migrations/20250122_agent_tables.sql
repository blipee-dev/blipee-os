-- Agent Framework Tables
-- These tables support the autonomous agent ecosystem with real data storage

-- Agent Learnings (Store actual knowledge gained by agents)
CREATE TABLE IF NOT EXISTS agent_learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  insight TEXT NOT NULL,
  impact FLOAT NOT NULL CHECK (impact >= 0 AND impact <= 1),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_learnings
CREATE INDEX IF NOT EXISTS idx_agent_learnings_org ON agent_learnings(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_agent ON agent_learnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_impact ON agent_learnings(impact DESC);

-- Agent Tasks (Track all executed tasks)
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  result JSONB,
  execution_time_ms INTEGER,
  error TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_org ON agent_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_executed ON agent_tasks(executed_at DESC);

-- Agent Rules (Active decision-making rules derived from learnings)
CREATE TABLE IF NOT EXISTS agent_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rule_content TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_rules
CREATE INDEX IF NOT EXISTS idx_agent_rules_org ON agent_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_rules_active ON agent_rules(active);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  success_rate FLOAT,
  error_rate FLOAT,
  avg_response_time FLOAT,
  total_executions INTEGER,
  tasks_processed INTEGER,
  successful_tasks INTEGER,
  failed_tasks INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_performance
CREATE INDEX IF NOT EXISTS idx_agent_performance_org ON agent_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_created ON agent_performance(created_at DESC);

-- Agent Task Queue (Pending tasks to be executed)
CREATE TABLE IF NOT EXISTS agent_task_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  data JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_task_queue
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON agent_task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON agent_task_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_task_queue_scheduled ON agent_task_queue(scheduled_for);

-- Agent Approvals (Human-in-the-loop approvals)
CREATE TABLE IF NOT EXISTS agent_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task JSONB NOT NULL,
  required_approvers TEXT[],
  priority TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_approvals
CREATE INDEX IF NOT EXISTS idx_approvals_status ON agent_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_org ON agent_approvals(organization_id);

-- Regulatory Updates (For RegulatoryForesight agent)
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  region TEXT,
  effective_date DATE,
  summary TEXT,
  impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  required_actions TEXT[],
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for regulatory_updates
CREATE INDEX IF NOT EXISTS idx_regulatory_org ON regulatory_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_deadline ON regulatory_updates(deadline);

-- Compliance Alerts
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for compliance_alerts
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_org ON compliance_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);

-- Compliance Tasks
CREATE TABLE IF NOT EXISTS compliance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  requirement TEXT,
  current_status TEXT,
  gap_description TEXT,
  priority INTEGER,
  estimated_effort TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for compliance_tasks
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_org ON compliance_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_priority ON compliance_tasks(priority DESC);

-- Compliance Action Plans
CREATE TABLE IF NOT EXISTS compliance_action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  requirement TEXT,
  plan TEXT,
  priority INTEGER,
  estimated_effort TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Automations
CREATE TABLE IF NOT EXISTS compliance_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  configuration JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Energy Consumption Data (For CostSavingFinder)
-- Create new table specifically for agent system
CREATE TABLE IF NOT EXISTS agent_energy_consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  device_id UUID REFERENCES devices(id),
  consumption FLOAT NOT NULL, -- kWh
  cost FLOAT, -- currency
  peak_demand FLOAT, -- kW
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_energy_consumption
CREATE INDEX IF NOT EXISTS idx_agent_energy_org ON agent_energy_consumption(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_energy_measured ON agent_energy_consumption(measured_at DESC);

-- Agent Operational Costs
CREATE TABLE IF NOT EXISTS agent_operational_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'USD',
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_operational_costs
CREATE INDEX IF NOT EXISTS idx_agent_costs_org ON agent_operational_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_costs_category ON agent_operational_costs(category);

-- Agent Cost Initiatives
CREATE TABLE IF NOT EXISTS agent_cost_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  projected_savings FLOAT,
  implementation_cost FLOAT,
  lifespan_years INTEGER,
  roi FLOAT,
  payback_months FLOAT,
  npv FLOAT,
  status TEXT DEFAULT 'pending',
  implementation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Cost Opportunities
CREATE TABLE IF NOT EXISTS agent_cost_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT,
  description TEXT,
  current_cost FLOAT,
  potential_savings FLOAT,
  implementation_cost FLOAT,
  roi FLOAT,
  payback_period FLOAT,
  priority TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Energy Analyses
CREATE TABLE IF NOT EXISTS agent_energy_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_data JSONB,
  insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Orchestration Metrics
CREATE TABLE IF NOT EXISTS orchestration_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tasks_processed INTEGER,
  successful_tasks INTEGER,
  failed_tasks INTEGER,
  avg_execution_time FLOAT,
  execution_time_ms INTEGER,
  active_agents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for orchestration_metrics
CREATE INDEX IF NOT EXISTS idx_orchestration_org ON orchestration_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_created ON orchestration_metrics(created_at DESC);

-- Agent Task Results
CREATE TABLE IF NOT EXISTS agent_task_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  task_type TEXT,
  priority TEXT,
  success BOOLEAN,
  execution_time_ms INTEGER,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_task_results
CREATE INDEX IF NOT EXISTS idx_task_results_org ON agent_task_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_results_agent ON agent_task_results(agent_id);

-- Agent Alerts (Performance degradation, critical events)
CREATE TABLE IF NOT EXISTS agent_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Coordinations (Multi-agent workflows)
CREATE TABLE IF NOT EXISTS agent_coordinations (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT,
  description TEXT,
  participating_agents TEXT[],
  trigger_conditions JSONB,
  coordination_rules JSONB,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Workflow Executions
CREATE TABLE IF NOT EXISTS agent_workflow_executions (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  participating_agents TEXT[],
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE agent_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_energy_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_cost_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_cost_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_energy_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_coordinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-level access
CREATE POLICY "Organization members can view agent data"
  ON agent_learnings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can view agent tasks"
  ON agent_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Add similar policies for other tables...
-- (For brevity, showing pattern - would add for all tables)

-- Additional composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_learnings_created ON agent_learnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_status ON agent_tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_energy_consumption_device ON agent_energy_consumption(device_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_operational_costs_period ON agent_operational_costs(period_start, period_end);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;