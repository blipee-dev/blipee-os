-- Create any missing tables needed for complete data population

-- 1. Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by UUID REFERENCES public.user_profiles(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- 2. Remove the auth.users foreign key constraint from user_profiles (if it exists)
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 3. Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- 4. Create message_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- 5. Create ui_components table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ui_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    props JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_components_conversation ON public.ui_components(conversation_id);

-- 6. Add missing columns to existing tables (only if tables exist)
DO $$ 
BEGIN
    -- Add columns to conversations if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        ALTER TABLE public.conversations
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    END IF;

    -- Add columns to equipment if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        ALTER TABLE public.equipment
        ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
    END IF;

    -- Add columns to audit_logs if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 7. Create function to allow demo user creation
CREATE OR REPLACE FUNCTION create_demo_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    user_phone TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, email, full_name, phone, 
        onboarding_completed, preferred_language, timezone
    ) VALUES (
        user_id, user_email, user_full_name, user_phone,
        true, 'en', 'Europe/Lisbon'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Enable RLS on new tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_components ENABLE ROW LEVEL SECURITY;

-- 9. Create basic RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- 10. Create basic RLS policies for message_reactions
CREATE POLICY "Users can view reactions" ON public.message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add their own reactions" ON public.message_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 11. Create basic RLS policies for ui_components
CREATE POLICY "Users can view UI components in their conversations" ON public.ui_components
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );