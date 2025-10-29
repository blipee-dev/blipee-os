-- Create tables for Conversation Intelligence System

-- Conversation Memory table for storing conversation embeddings and context
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  embedding vector(1536), -- OpenAI text-embedding-3-large dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for conversation_memory
CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation ON conversation_memory(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_org ON conversation_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_embedding ON conversation_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Conversation Preferences table for personalization
CREATE TABLE IF NOT EXISTS conversation_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID,
  preference_type TEXT NOT NULL, -- 'style', 'verbosity', 'technical_level', 'visualization', etc.
  preference_value JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_type, conversation_id)
);

-- Create indexes for conversation_preferences
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_user ON conversation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_org ON conversation_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_conversation ON conversation_preferences(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_preferences_type ON conversation_preferences(preference_type);

-- Conversation State table for dialogue management
CREATE TABLE IF NOT EXISTS conversation_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state_type TEXT NOT NULL, -- 'context', 'intent', 'entities', 'dialogue_act'
  state_value JSONB NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for conversation_state
CREATE INDEX IF NOT EXISTS idx_conversation_state_conversation ON conversation_state(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_state_user ON conversation_state(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_state_type ON conversation_state(state_type);
CREATE INDEX IF NOT EXISTS idx_conversation_state_valid ON conversation_state(valid_until);

-- Conversation Feedback table for RLHF
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  message_index INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL, -- 'rating', 'correction', 'preference', 'report'
  feedback_value JSONB NOT NULL,
  applied_to_model BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for conversation_feedback
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conversation ON conversation_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_user ON conversation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_type ON conversation_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_applied ON conversation_feedback(applied_to_model);

-- Enable Row Level Security on all tables
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_memory
CREATE POLICY "Users can read their own conversation memory"
  ON conversation_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation memory"
  ON conversation_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation memory"
  ON conversation_memory FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for conversation_preferences
CREATE POLICY "Users can read their own preferences"
  ON conversation_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON conversation_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON conversation_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON conversation_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for conversation_state
CREATE POLICY "Users can read their own conversation state"
  ON conversation_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation state"
  ON conversation_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation state"
  ON conversation_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation state"
  ON conversation_state FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for conversation_feedback
CREATE POLICY "Users can read their own feedback"
  ON conversation_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON conversation_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to clean old conversation states
CREATE OR REPLACE FUNCTION clean_expired_conversation_states()
RETURNS void AS $$
BEGIN
  DELETE FROM conversation_state
  WHERE valid_until IS NOT NULL AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update conversation preferences based on feedback
CREATE OR REPLACE FUNCTION update_preferences_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.feedback_type = 'preference' THEN
    INSERT INTO conversation_preferences (
      user_id,
      organization_id,
      conversation_id,
      preference_type,
      preference_value,
      confidence_score,
      usage_count
    ) VALUES (
      NEW.user_id,
      NEW.organization_id,
      NEW.conversation_id,
      (NEW.feedback_value->>'type')::TEXT,
      NEW.feedback_value->'value',
      COALESCE((NEW.feedback_value->>'confidence')::FLOAT, 0.8),
      1
    )
    ON CONFLICT (user_id, preference_type, conversation_id) DO UPDATE
    SET preference_value = EXCLUDED.preference_value,
        confidence_score = (conversation_preferences.confidence_score + EXCLUDED.confidence_score) / 2,
        usage_count = conversation_preferences.usage_count + 1,
        last_used = NOW(),
        updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic preference updates
CREATE TRIGGER update_preferences_on_feedback
  AFTER INSERT ON conversation_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_from_feedback();

-- Add updated_at trigger for all tables
CREATE TRIGGER update_conversation_memory_updated_at
  BEFORE UPDATE ON conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_preferences_updated_at
  BEFORE UPDATE ON conversation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_state_updated_at
  BEFORE UPDATE ON conversation_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();