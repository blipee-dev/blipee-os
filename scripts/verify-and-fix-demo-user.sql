-- Verify and Fix Demo User
-- The user exists! Just need to ensure everything is set up correctly

-- 1. Find the demo user
DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO demo_user_id
    FROM auth.users
    WHERE email = 'demo@blipee.com'
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user with ID: %', demo_user_id;
    
    -- 2. Update the user's password (in case it's different)
    UPDATE auth.users
    SET 
        encrypted_password = crypt('demo123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = demo_user_id;
    
    RAISE NOTICE '✅ Password updated to: demo123456';
    
    -- 3. Ensure user profile exists with correct data
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        preferences,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo@blipee.com',
        'Demo Admin User',
        jsonb_build_object(
            'is_admin', true,
            'is_super_user', true,
            'permissions', array['system.admin']
        ),
        true,
        now(),
        now()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Demo Admin User',
        preferences = jsonb_build_object(
            'is_admin', true,
            'is_super_user', true,
            'permissions', array['system.admin']
        ),
        onboarding_completed = true,
        updated_at = now();
    
    RAISE NOTICE '✅ User profile updated with admin privileges';
    
    -- 4. Check if user has an organization
    SELECT om.organization_id INTO demo_org_id
    FROM organization_members om
    WHERE om.user_id = demo_user_id
    LIMIT 1;
    
    IF demo_org_id IS NULL THEN
        RAISE NOTICE '📦 Creating organization...';
        
        -- Create organization
        INSERT INTO organizations (
            id,
            name,
            slug,
            subscription_tier,
            subscription_status,
            settings,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Demo Enterprise Org',
            'demo-' || substr(md5(random()::text), 1, 8),
            'enterprise',
            'active',
            jsonb_build_object(
                'features', array[
                    'ai_insights',
                    'sustainability_reporting',
                    'api_access',
                    'unlimited_users',
                    'all_features'
                ]
            ),
            demo_user_id,
            now(),
            now()
        ) RETURNING id INTO demo_org_id;
        
        -- Create membership
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_owner,
            joined_at,
            created_at,
            updated_at
        ) VALUES (
            demo_org_id,
            demo_user_id,
            'account_owner',
            true,
            now(),
            now(),
            now()
        );
        
        RAISE NOTICE '✅ Organization created';
    ELSE
        -- Update existing membership to admin
        UPDATE organization_members
        SET 
            role = 'account_owner',
            is_owner = true,
            updated_at = now()
        WHERE user_id = demo_user_id;
        
        RAISE NOTICE '✅ Organization membership updated';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 DEMO USER READY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: demo@blipee.com';
    RAISE NOTICE 'Password: demo123456';
    RAISE NOTICE 'Role: Admin (account_owner)';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now sign in at /signin';
    RAISE NOTICE '========================================';
    
END $$;

-- 5. Verify everything is set up
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.full_name,
    up.preferences->>'is_admin' as is_admin,
    om.role,
    om.is_owner,
    o.name as organization_name,
    o.subscription_tier
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'demo@blipee.com';