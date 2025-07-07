-- Corrected Demo User Creation Script for Actual Schema
-- This script works with the real table structure

DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
    demo_building_id uuid;
BEGIN
    -- First, try to find if user already exists
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@blipee.com' 
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'User not found in auth.users.';
        RAISE NOTICE 'Please create user first via:';
        RAISE NOTICE '1. Supabase Dashboard (Authentication > Users > Invite)';
        RAISE NOTICE '2. Or signup at http://localhost:3000/signup';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user with ID: %', demo_user_id;

    -- Create/Update user profile with admin settings in preferences
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        phone,
        preferences,
        ai_personality_settings,
        onboarding_completed,
        onboarding_data,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo@blipee.com',
        'Demo Admin User',
        '+1234567890',
        jsonb_build_object(
            'theme', 'dark',
            'notifications', true,
            'is_admin', true,
            'is_super_user', true,
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
        jsonb_build_object(
            'personality', 'professional',
            'response_style', 'detailed',
            'proactive_insights', true
        ),
        true,
        jsonb_build_object(
            'role', 'account_owner',
            'company_type', 'enterprise'
        ),
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        preferences = EXCLUDED.preferences,
        updated_at = now();

    -- Create organization with maximum tier
    INSERT INTO public.organizations (
        id,
        name,
        slug,
        subscription_tier,
        subscription_status,
        settings,
        metadata,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Demo Enterprise Organization',
        'demo-enterprise',
        'enterprise', -- Highest tier
        'active',
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
            'limits', jsonb_build_object(
                'buildings', 9999,
                'users', 9999,
                'api_calls', 9999999,
                'storage_gb', 9999
            )
        ),
        jsonb_build_object(
            'is_demo', true,
            'admin_access', true,
            'all_features_enabled', true
        ),
        demo_user_id,
        now(),
        now()
    ) RETURNING id INTO demo_org_id;

    -- Create organization membership with highest role
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        permissions,
        joined_at,
        created_at,
        updated_at
    ) VALUES (
        demo_org_id,
        demo_user_id,
        'account_owner', -- Highest role
        jsonb_build_object(
            'can_manage_billing', true,
            'can_manage_members', true,
            'can_manage_buildings', true,
            'can_view_all_data', true,
            'can_export_data', true,
            'can_delete_org', true
        ),
        now(),
        now(),
        now()
    );

    -- Create a demo building
    INSERT INTO public.buildings (
        id,
        organization_id,
        name,
        slug,
        address_line1,
        city,
        state_province,
        postal_code,
        country,
        timezone,
        metadata,
        systems_config,
        baseline_data,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_org_id,
        'Demo Headquarters',
        'demo-hq',
        '123 Sustainability Street',
        'San Francisco',
        'CA',
        '94105',
        'US',
        'America/Los_Angeles',
        jsonb_build_object(
            'size_sqft', 75000,
            'floors', 10,
            'year_built', 2020,
            'occupancy_type', 'commercial',
            'certifications', jsonb_build_array('LEED Platinum', 'Energy Star', 'WELL Gold'),
            'features', jsonb_build_array('Solar Panels', 'Rainwater Harvesting', 'Smart HVAC')
        ),
        jsonb_build_object(
            'hvac', jsonb_build_object('type', 'VRF', 'brand', 'Daikin'),
            'lighting', jsonb_build_object('type', 'LED', 'controls', 'Smart'),
            'solar', jsonb_build_object('capacity_kw', 500, 'panels', 1200)
        ),
        jsonb_build_object(
            'annual_energy_kwh', 2500000,
            'annual_water_gallons', 1000000,
            'baseline_year', 2023
        ),
        now(),
        now()
    ) RETURNING id INTO demo_building_id;

    -- Update auth.users metadata for admin access
    UPDATE auth.users 
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'provider', 'email',
                'providers', array['email'],
                'role', 'admin',
                'access_level', 'super_admin'
            ),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'full_name', 'Demo Admin User',
                'is_admin', true
            ),
        updated_at = now()
    WHERE id = demo_user_id;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Demo admin user setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE '  Email: demo@blipee.com';
    RAISE NOTICE '  Password: [use the password you created]';
    RAISE NOTICE '';
    RAISE NOTICE 'Access Level:';
    RAISE NOTICE '  Role: account_owner (highest)';
    RAISE NOTICE '  Tier: enterprise (all features)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Resources:';
    RAISE NOTICE '  User ID: %', demo_user_id;
    RAISE NOTICE '  Organization: Demo Enterprise Organization';
    RAISE NOTICE '  Building: Demo Headquarters';
    RAISE NOTICE '==================================================';

END $$;