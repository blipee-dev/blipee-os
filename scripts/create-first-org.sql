-- First, get the user ID for pedro@blipee.com
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists
SELECT id, email FROM auth.users WHERE email = 'pedro@blipee.com';

-- Step 2: Create an organization (replace USER_ID with the actual ID from step 1)
INSERT INTO public.organizations (
    name,
    slug,
    legal_name,
    industry_primary,
    company_size,
    website,
    primary_contact_email,
    subscription_tier,
    subscription_status,
    created_by
) VALUES (
    'Blipee Technologies',
    'blipee-tech',
    'Blipee Technologies Inc.',
    'Technology',
    '10-50',
    'https://blipee.com',
    'pedro@blipee.com',
    'premium',
    'active',
    'USER_ID_HERE' -- Replace with actual user ID
) RETURNING id;

-- Step 3: Link user to organization (replace both IDs)
INSERT INTO public.user_organizations (
    user_id,
    organization_id,
    role
) VALUES (
    'USER_ID_HERE', -- Replace with actual user ID
    'ORG_ID_HERE',  -- Replace with ID returned from step 2
    'account_owner'
);