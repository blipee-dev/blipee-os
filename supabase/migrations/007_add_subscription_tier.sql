-- Add subscription_tier column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter';

-- Add some common subscription tiers
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier: starter, professional, enterprise';