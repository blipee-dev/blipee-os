-- Complete fix for jose.pinto@plmj.pt organization issue
-- This creates all necessary tables if they don't exist and assigns organization

-- 1. Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    industry VARCHAR(255),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insert or update PLMJ organization
INSERT INTO organizations (
    name,
    display_name,
    slug,
    industry,
    country
) VALUES (
    'PLMJ',
    'PLMJ - Sociedade de Advogados',
    'plmj',
    'Legal Services',
    'Portugal'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Get the user ID from auth.users and create/update user record
DO $$
DECLARE
    user_id UUID;
    org_id UUID;
BEGIN
    -- Get the auth user ID
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'jose.pinto@plmj.pt'
    LIMIT 1;

    IF user_id IS NULL THEN
        RAISE NOTICE 'User jose.pinto@plmj.pt not found in auth.users. Please ensure the user has signed up.';
        RETURN;
    END IF;

    -- Get the PLMJ organization ID
    SELECT id INTO org_id
    FROM organizations
    WHERE name = 'PLMJ'
    LIMIT 1;

    -- Insert or update the user record
    INSERT INTO users (id, email, organization_id, role)
    VALUES (user_id, 'jose.pinto@plmj.pt', org_id, 'sustainability_manager')
    ON CONFLICT (id) DO UPDATE
    SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Successfully configured user jose.pinto@plmj.pt with PLMJ organization';
END $$;

-- 5. Verify the setup
SELECT
    u.id,
    u.email,
    u.organization_id,
    u.role,
    o.name as organization_name,
    o.display_name as organization_display_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'jose.pinto@plmj.pt';