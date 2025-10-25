-- Fix for jose.pinto@plmj.pt - User has no organization_id causing API 404 errors
-- This script will either assign an existing organization or create a new one

-- First, check if PLMJ organization exists
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Get the user ID for jose.pinto@plmj.pt
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'jose.pinto@plmj.pt'
    LIMIT 1;

    IF user_id IS NULL THEN
        RAISE NOTICE 'User jose.pinto@plmj.pt not found in auth.users';
        RETURN;
    END IF;

    -- Check if PLMJ organization exists
    SELECT id INTO org_id
    FROM organizations
    WHERE name = 'PLMJ' OR name ILIKE '%PLMJ%'
    LIMIT 1;

    -- If organization doesn't exist, create it
    IF org_id IS NULL THEN
        INSERT INTO organizations (
            id,
            name,
            display_name,
            slug,
            industry,
            country,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'PLMJ',
            'PLMJ - Sociedade de Advogados',
            'plmj',
            'Legal Services',
            'Portugal',
            NOW(),
            NOW()
        ) RETURNING id INTO org_id;

        RAISE NOTICE 'Created new organization PLMJ with ID: %', org_id;
    ELSE
        RAISE NOTICE 'Found existing organization with ID: %', org_id;
    END IF;

    -- Update the user record to assign the organization
    UPDATE users
    SET
        organization_id = org_id,
        updated_at = NOW()
    WHERE id = user_id;

    RAISE NOTICE 'Successfully assigned organization % to user jose.pinto@plmj.pt', org_id;

    -- Verify the update
    PERFORM 1
    FROM users
    WHERE id = user_id AND organization_id = org_id;

    IF FOUND THEN
        RAISE NOTICE 'Verification successful - user now has organization_id';
    ELSE
        RAISE WARNING 'Verification failed - please check the update';
    END IF;

END $$;

-- Verify the fix by checking the user's organization
SELECT
    u.id,
    u.email,
    u.organization_id,
    o.name as organization_name,
    o.display_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'jose.pinto@plmj.pt';