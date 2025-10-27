-- Add type column to conversations table for categorizing conversation types
-- Allows distinguishing between user-initiated chats and agent-initiated proactive updates

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'user_chat' CHECK (type IN ('user_chat', 'agent_proactive', 'system'));

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON public.conversations(type);

-- Add comment
COMMENT ON COLUMN public.conversations.type IS 'Type of conversation: user_chat (regular chat), agent_proactive (AI agent updates), or system (system messages)';
