-- Conversations and Messages Schema
-- Complete schema for storing chat conversations and individual messages

-- ============================================================================
-- 1. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,  -- Generated on frontend as 'conv_${Date.now()}'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,

  -- Conversation metadata
  title TEXT,  -- Auto-generated from first message or user-set
  summary TEXT,  -- Summary of conversation

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stats
  message_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 2. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI metadata (for assistant messages)
  model TEXT,  -- e.g., 'gpt-4o', 'claude-sonnet-4'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb  -- For tool calls, attachments, etc.
);

-- ============================================================================
-- 3. CONVERSATION_MEMORIES TABLE (if not exists)
-- ============================================================================
-- This table stores long-term memory/summary of conversations
CREATE TABLE IF NOT EXISTS public.conversation_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Memory content
  title TEXT,
  summary TEXT NOT NULL,
  key_topics TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_building ON public.conversations(building_id) WHERE building_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.conversations(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- Conversation memories indexes
CREATE INDEX IF NOT EXISTS idx_conversation_memories_user ON public.conversation_memories(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_org ON public.conversation_memories(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_conversation ON public.conversation_memories(conversation_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_memories ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all conversations"
  ON public.conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Messages RLS policies
CREATE POLICY "Users can view messages from their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all messages"
  ON public.messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Conversation memories RLS policies
CREATE POLICY "Users can view their own conversation memories"
  ON public.conversation_memories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all conversation memories"
  ON public.conversation_memories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update conversation updated_at and message_count on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    updated_at = NOW(),
    last_message_at = NOW(),
    message_count = message_count + 1
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Update conversation_memories updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_conversation_memories_updated_at
  BEFORE UPDATE ON public.conversation_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.conversations IS 'Stores chat conversation metadata and participants';
COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE public.conversation_memories IS 'Stores long-term memory summaries of conversations';
