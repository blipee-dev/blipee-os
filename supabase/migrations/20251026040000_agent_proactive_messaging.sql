-- =====================================================
-- Agent Proactive Messaging System
-- =====================================================
-- Enables autonomous agents to generate proactive messages
-- that appear in user chats like a colleague sending updates
--
-- Features:
-- - Agent-initiated messages (role: 'agent')
-- - Priority levels (info, alert, critical)
-- - Notifications table for in-app alerts
-- - Conversation type for agent updates
-- =====================================================

-- Add 'agent' role and priority to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS agent_id TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('info', 'alert', 'critical'));

-- Add comment to explain agent role
COMMENT ON COLUMN messages.agent_id IS 'ID of the autonomous agent that generated this message (e.g., carbon-hunter, compliance-guardian)';
COMMENT ON COLUMN messages.priority IS 'Priority level for agent-generated messages: info (routine), alert (needs attention), critical (urgent action required)';

-- Add index for agent messages
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id, created_at DESC) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority, created_at DESC) WHERE priority IS NOT NULL;

-- Add 'agent_proactive' conversation type
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'agent_proactive'));

-- Add index for agent conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type, user_id);

-- Add comment
COMMENT ON COLUMN conversations.type IS 'Conversation type: chat (user-initiated), agent_proactive (agent-initiated updates)';

-- =====================================================
-- Notifications Table
-- =====================================================
-- Stores in-app notifications from agents
-- Users see these in a notification bell/dropdown

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('info', 'alert', 'critical')),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(user_id, priority, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(user_id, type);

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications from autonomous agents and system events';
COMMENT ON COLUMN notifications.type IS 'Notification type: agent_message, system_alert, compliance_deadline, etc.';
COMMENT ON COLUMN notifications.priority IS 'Notification priority: info, alert, critical';

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Service role can insert for any user

-- =====================================================
-- Agent Scheduled Tasks Table Update
-- =====================================================
-- Update schedules to bi-weekly for monthly data analysis

-- Check if agent_scheduled_tasks table exists, if not create it
CREATE TABLE IF NOT EXISTS agent_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  schedule_pattern TEXT NOT NULL, -- Cron pattern
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  data JSONB DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_org ON agent_scheduled_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_agent ON agent_scheduled_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON agent_scheduled_tasks(next_run) WHERE enabled = TRUE;

-- Enable RLS
ALTER TABLE agent_scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view scheduled tasks"
  ON agent_scheduled_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Sample Data / Default Schedules
-- =====================================================
-- These will be inserted when organizations initialize agents
-- But we can create a template function for it

CREATE OR REPLACE FUNCTION initialize_agent_schedules(p_organization_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert default agent schedules for an organization
  INSERT INTO agent_scheduled_tasks (organization_id, agent_id, task_type, schedule_pattern, priority, data)
  VALUES
    -- Carbon Hunter - Bi-weekly (1st & 15th at 9 AM)
    (p_organization_id, 'carbon-hunter', 'emissions_scan', '0 9 1,15 * *', 'high', '{"scanType": "monthly_data_check", "autoDiscover": true}'::jsonb),

    -- Compliance Guardian - Bi-weekly (5th & 20th at 8 AM)
    (p_organization_id, 'compliance-guardian', 'compliance_check', '0 8 5,20 * *', 'high', '{"frameworks": ["GRI", "TCFD", "CDP", "SASB"]}'::jsonb),

    -- Cost Finder - Bi-weekly (3rd & 18th at 2 PM)
    (p_organization_id, 'cost-finder', 'cost_optimization_scan', '0 14 3,18 * *', 'medium', '{"analyzeMonthlyData": true}'::jsonb),

    -- Predictive Maintenance - Every 4 hours
    (p_organization_id, 'predictive-maintenance', 'equipment_analysis', '0 */4 * * *', 'high', '{"monitorType": "real-time"}'::jsonb),

    -- Optimizer - Every 2 hours
    (p_organization_id, 'optimizer', 'performance_optimization', '0 */2 * * *', 'medium', '{"optimizationType": "real-time"}'::jsonb),

    -- Regulatory Foresight - Daily at 8 AM
    (p_organization_id, 'regulatory', 'regulatory_updates', '0 8 * * *', 'high', '{"monitorRegulations": true}'::jsonb),

    -- Supply Chain - Weekly Wednesday at 10 AM
    (p_organization_id, 'supply-chain', 'supplier_risk_assessment', '0 10 * * 3', 'medium', '{"assessRisks": true}'::jsonb),

    -- ESG Chief - Weekly Monday at 9 AM
    (p_organization_id, 'esg-chief', 'strategic_review', '0 9 * * 1', 'high', '{"coordinateAgents": true}'::jsonb)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON TABLE notifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE notifications TO authenticated;

GRANT ALL ON TABLE agent_scheduled_tasks TO service_role;
GRANT SELECT ON TABLE agent_scheduled_tasks TO authenticated;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON TABLE agent_scheduled_tasks IS 'Defines recurring scheduled tasks for autonomous agents. Tasks run via cron patterns and generate proactive messages for users.';
COMMENT ON FUNCTION initialize_agent_schedules IS 'Initialize default agent schedules for a new organization. Schedules adjusted for bi-weekly monthly data analysis.';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a notification as read for the current user';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
