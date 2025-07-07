-- Supabase SQL Script to Create Demo User
-- Run this in your Supabase SQL Editor

-- 1. Create the user (if using Supabase Dashboard)
-- Note: You'll need to use Supabase Auth UI or API to create the user first
-- Email: demo@blipee.com
-- Password: demo123456

-- 2. Once user is created, run this to set up their profile and organization:

-- Get the user ID (replace with actual ID after creating user)
-- You can find this in Authentication > Users in Supabase Dashboard
DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
    demo_building_id uuid;
BEGIN
    -- Replace this with the actual user ID from Supabase Auth
    -- demo_user_id := 'YOUR-USER-ID-HERE';
    
    -- Or try to find by email (if user exists)
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@blipee.com' 
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'User not found. Please create user first via Supabase Auth.';
        RETURN;
    END IF;

    -- Create user profile with admin privileges
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        phone,
        timezone,
        notification_preferences,
        metadata,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo@blipee.com',
        'Demo User (Admin)',
        '+1234567890',
        'America/Los_Angeles',
        jsonb_build_object(
            'email', true,
            'sms', false,
            'push', true,
            'digest', 'weekly'
        ),
        jsonb_build_object(
            'is_admin', true,
            'is_super_user', true,
            'can_access_all_orgs', true,
            'can_impersonate', true,
            'api_access_level', 'unlimited',
            'feature_flags', jsonb_build_array('*'),
            'permissions', jsonb_build_array(
                'system.admin',
                'org.create',
                'org.delete',
                'org.manage_all',
                'user.manage_all',
                'data.export_all',
                'api.unlimited'
            )
        ),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        metadata = EXCLUDED.metadata,
        updated_at = now();

    -- Create organization with maximum tier and all features
    INSERT INTO public.organizations (
        id,
        name,
        type,
        subscription_tier,
        settings,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Demo Organization',
        'enterprise',
        'enterprise', -- Highest subscription tier
        jsonb_build_object(
            'features', jsonb_build_array(
                'ai_insights', 
                'sustainability_reporting', 
                'api_access',
                'advanced_analytics',
                'unlimited_users',
                'custom_integrations',
                'white_label',
                'priority_support',
                'data_export',
                'multi_building',
                'real_time_monitoring',
                'predictive_maintenance',
                'carbon_tracking',
                'esg_reporting',
                'regulatory_compliance'
            ),
            'branding', jsonb_build_object('primary_color', '#8B5CF6'),
            'limits', jsonb_build_object(
                'buildings', 9999,
                'users', 9999,
                'api_calls', 9999999,
                'storage_gb', 9999
            ),
            'permissions', jsonb_build_object(
                'can_create_buildings', true,
                'can_delete_buildings', true,
                'can_manage_users', true,
                'can_access_api', true,
                'can_export_data', true,
                'can_view_all_data', true,
                'can_modify_all_data', true,
                'is_super_admin', true
            )
        ),
        now(),
        now()
    ) RETURNING id INTO demo_org_id;

    -- Create organization membership with highest privileges
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        joined_at
    ) VALUES (
        demo_org_id,
        demo_user_id,
        'account_owner', -- Highest role in the system
        now()
    );

    -- Create a demo building
    INSERT INTO public.buildings (
        id,
        organization_id,
        name,
        address,
        city,
        country,
        size_sqft,
        floors,
        building_type,
        year_built,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_org_id,
        'Demo Headquarters',
        '123 Green Street',
        'San Francisco',
        'USA',
        50000,
        5,
        'office',
        2020,
        jsonb_build_object(
            'occupancy_type', 'commercial',
            'operating_hours', '8am-6pm',
            'certifications', jsonb_build_array('LEED Gold', 'Energy Star')
        ),
        now(),
        now()
    ) RETURNING id INTO demo_building_id;

    -- Grant additional system permissions if tables exist
    -- Check if there's a user_permissions or system_roles table
    BEGIN
        -- If you have a user_permissions table
        INSERT INTO public.user_permissions (
            user_id,
            permission,
            granted_at,
            granted_by
        ) VALUES 
            (demo_user_id, 'system.admin', now(), demo_user_id),
            (demo_user_id, 'api.unlimited', now(), demo_user_id),
            (demo_user_id, 'data.export_all', now(), demo_user_id),
            (demo_user_id, 'org.manage_all', now(), demo_user_id)
        ON CONFLICT DO NOTHING;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'user_permissions table does not exist - skipping';
    END;

    -- Set user as verified/trusted
    UPDATE auth.users 
    SET 
        email_confirmed_at = now(),
        raw_app_meta_data = raw_app_meta_data || 
            jsonb_build_object(
                'provider', 'email',
                'providers', array['email'],
                'role', 'admin',
                'access_level', 'super_admin'
            ),
        raw_user_meta_data = raw_user_meta_data || 
            jsonb_build_object(
                'full_name', 'Demo User (Admin)',
                'is_admin', true
            )
    WHERE id = demo_user_id;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Demo admin user setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'User Details:';
    RAISE NOTICE '  Email: demo@blipee.com';
    RAISE NOTICE '  Role: account_owner (highest level)';
    RAISE NOTICE '  Tier: enterprise (all features)';
    RAISE NOTICE '';
    RAISE NOTICE 'IDs for reference:';
    RAISE NOTICE '  User ID: %', demo_user_id;
    RAISE NOTICE '  Organization ID: %', demo_org_id;
    RAISE NOTICE '  Building ID: %', demo_building_id;
    RAISE NOTICE '==================================================';

END $$;