-- Missing autonomous agent support tables

CREATE TABLE IF NOT EXISTS agent_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  task_id TEXT,
  decision_id TEXT,
  outcome TEXT NOT NULL,
  human_feedback TEXT,
  metrics JSONB DEFAULT '{}',
  suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_learning_agent_name
  ON agent_learning(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_learning_created_at
  ON agent_learning(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_name
  ON agent_activity(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created_at
  ON agent_activity(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_task_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL,
  result JSONB,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_task_exec_task
  ON agent_task_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_exec_agent
  ON agent_task_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_task_exec_status
  ON agent_task_executions(status);

CREATE TABLE IF NOT EXISTS agent_decisions (
  id TEXT PRIMARY KEY,
  decision_type TEXT NOT NULL,
  description TEXT,
  selected_option JSONB,
  risk_level TEXT,
  confidence FLOAT,
  reasoning JSONB,
  requires_approval BOOLEAN,
  auto_execute BOOLEAN,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT,
  payload JSONB DEFAULT '{}',
  priority TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  response_required BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_collaborations (
  id TEXT PRIMARY KEY,
  initiating_agent TEXT NOT NULL,
  target_agents JSONB DEFAULT '[]',
  objective TEXT,
  required_capabilities JSONB DEFAULT '[]',
  timeframe TEXT,
  context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_collaborations_status
  ON agent_collaborations(status);

CREATE TABLE IF NOT EXISTS agent_collaboration_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_workload_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_workload_events_agent
  ON agent_workload_events(agent_name);

CREATE TABLE IF NOT EXISTS agent_workload_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_tasks INTEGER,
  active_agents INTEGER,
  load_balance_score FLOAT,
  bottlenecks JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

