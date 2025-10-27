-- Add read tracking to messages table for notification badges

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Add index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
ON public.messages(read)
WHERE read = false;

-- Add index for unread agent messages specifically
CREATE INDEX IF NOT EXISTS idx_messages_unread_agent
ON public.messages(agent_id, read)
WHERE agent_id IS NOT NULL AND read = false;

-- Add comment
COMMENT ON COLUMN public.messages.read IS 'Whether the message has been read by the user (for notification badges)';
