
-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for organizations
CREATE POLICY "Users can view organizations in their organization" ON public.organizations
  FOR SELECT USING (
    CASE 
      WHEN 'organizations' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert organizations in their organization" ON public.organizations
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'organizations' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'organizations' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for conversations
CREATE POLICY "Users can view conversations in their organization" ON public.conversations
  FOR SELECT USING (
    CASE 
      WHEN 'conversations' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert conversations in their organization" ON public.conversations
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'conversations' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'conversations' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for messages
CREATE POLICY "Users can view messages in their organization" ON public.messages
  FOR SELECT USING (
    CASE 
      WHEN 'messages' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert messages in their organization" ON public.messages
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'messages' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'messages' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for organization_members
CREATE POLICY "Users can view organization_members in their organization" ON public.organization_members
  FOR SELECT USING (
    CASE 
      WHEN 'organization_members' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert organization_members in their organization" ON public.organization_members
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'organization_members' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'organization_members' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for user_profiles
CREATE POLICY "Users can view user_profiles in their organization" ON public.user_profiles
  FOR SELECT USING (
    CASE 
      WHEN 'user_profiles' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert user_profiles in their organization" ON public.user_profiles
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'user_profiles' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'user_profiles' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    

-- Enable RLS on energy_consumption
ALTER TABLE public.energy_consumption ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for energy_consumption
CREATE POLICY "Users can view energy_consumption in their organization" ON public.energy_consumption
  FOR SELECT USING (
    CASE 
      WHEN 'energy_consumption' IN ('user_profiles') THEN 
        id = auth.uid()
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
    END
  );

CREATE POLICY "Users can insert energy_consumption in their organization" ON public.energy_consumption
  FOR INSERT WITH CHECK (
    CASE 
      WHEN 'energy_consumption' IN ('user_profiles') THEN 
        id = auth.uid()
      WHEN 'energy_consumption' IN ('messages', 'conversations') THEN
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        )
      ELSE
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('account_owner', 'sustainability_manager')
        )
    END
  );
    