-- Add agent support to messages table
-- Required for autonomous agents to send proactive chat messages

-- Step 1: Add 'agent' to the message_role enum
ALTER TYPE message_role ADD VALUE IF NOT EXISTS 'agent';

-- Step 2: Add agent_id column (optional - only set for agent-initiated messages)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS agent_id TEXT;

-- Step 3: Add priority column for agent messages (info, alert, critical)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('info', 'alert', 'critical'));

-- Step 4: Add index for agent messages
CREATE INDEX IF NOT EXISTS idx_messages_agent
ON public.messages(agent_id)
WHERE agent_id IS NOT NULL;

-- Step 5: Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_messages_priority
ON public.messages(priority)
WHERE priority IS NOT NULL;

-- Step 6: Add column comments
COMMENT ON COLUMN public.messages.agent_id IS 'Agent identifier for agent-initiated proactive messages (e.g., carbon-hunter, cost-finder)';
COMMENT ON COLUMN public.messages.priority IS 'Priority level for agent messages: info (FYI), alert (needs attention), critical (urgent action)';
