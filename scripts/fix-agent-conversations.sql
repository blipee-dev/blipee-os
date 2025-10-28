-- Check current agent conversations
-- This will show you which conversations exist and which agents they're for

SELECT
  id,
  title,
  type,
  metadata->>'agent_id' as agent_id,
  metadata->>'agent_name' as agent_name,
  created_at,
  updated_at
FROM conversations
WHERE type = 'agent_proactive'
ORDER BY created_at DESC;

-- If you see multiple messages going to the same conversation,
-- you can manually create separate conversations for each agent like this:

-- First, let's see which agent IDs are sending messages
SELECT DISTINCT
  agent_id,
  COUNT(*) as message_count
FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations WHERE type = 'agent_proactive'
)
GROUP BY agent_id
ORDER BY message_count DESC;

-- The agent IDs should be:
-- carbon-hunter
-- compliance-guardian
-- cost-finder
-- predictive-maintenance
-- supply-chain
-- regulatory
-- optimizer
-- esg-chief
