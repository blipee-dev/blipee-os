-- Final Demo User Creation Script - Works with Your Actual Schema
-- Run this after creating user via signup or Supabase dashboard

DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
    demo_building_id uuid;
BEGIN
    -- Find the demo user
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@blipee.com' 
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found in auth.users.';
        RAISE NOTICE '';
        RAISE NOTICE 'Please create user first:';
        RAISE NOTICE '1. Go to http://localhost:3000/signup';
        RAISE NOTICE '2. Email: demo@blipee.com';
        RAISE NOTICE '3. Password: demo123456';
        RAISE NOTICE '';
        RAISE NOTICE 'Then run this script again.';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found user with ID: %', demo_user_id;

    -- Create/Update user profile with admin privileges
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
            'language', 'en',
            'timezone', 'America/Los_Angeles',
            'is_admin', true,
            'is_super_user', true,
            'access_level', 'enterprise',
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
            'company_type', 'enterprise',
            'setup_complete', true
        ),
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        preferences = EXCLUDED.preferences,
        onboarding_completed = true,
        updated_at = now();

    RAISE NOTICE '✅ User profile created/updated';

    -- Create organization with enterprise features
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
        'demo-enterprise-' || substr(md5(random()::text), 1, 8), -- Unique slug
        'enterprise',
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
            ),
            'branding', jsonb_build_object(
                'primary_color', '#8B5CF6',
                'logo_url', null
            )
        ),
        jsonb_build_object(
            'is_demo', true,
            'created_via', 'admin_script',
            'tier', 'enterprise'
        ),
        demo_user_id,
        now(),
        now()
    ) ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO demo_org_id;

    IF demo_org_id IS NULL THEN
        -- Organization might already exist, find it
        SELECT id INTO demo_org_id
        FROM public.organizations
        WHERE created_by = demo_user_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RAISE NOTICE '✅ Organization created/found: %', demo_org_id;

    -- Create organization membership with maximum privileges
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        permissions,
        is_owner,
        invitation_status,
        joined_at,
        created_at,
        updated_at
    ) VALUES (
        demo_org_id,
        demo_user_id,
        'account_owner', -- Highest role
        jsonb_build_object(
            'billing', jsonb_build_object(
                'can_view', true,
                'can_manage', true
            ),
            'members', jsonb_build_object(
                'can_view', true,
                'can_invite', true,
                'can_remove', true,
                'can_change_roles', true
            ),
            'buildings', jsonb_build_object(
                'can_view_all', true,
                'can_create', true,
                'can_edit', true,
                'can_delete', true
            ),
            'data', jsonb_build_object(
                'can_view_all', true,
                'can_export', true,
                'can_delete', true
            ),
            'api', jsonb_build_object(
                'can_access', true,
                'rate_limit', 'unlimited'
            ),
            'admin', true
        ),
        true, -- is_owner
        'accepted',
        now(),
        now(),
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_owner = true,
        updated_at = now();

    RAISE NOTICE '✅ Organization membership created';

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
        'demo-hq-' || substr(md5(random()::text), 1, 8),
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
            'building_type', 'office',
            'occupancy_type', 'commercial',
            'certifications', jsonb_build_array('LEED Platinum', 'Energy Star', 'WELL Gold'),
            'features', jsonb_build_array('Solar Panels', 'Rainwater Harvesting', 'Smart HVAC', 'EV Charging')
        ),
        jsonb_build_object(
            'hvac', jsonb_build_object(
                'type', 'VRF',
                'brand', 'Daikin',
                'zones', 45
            ),
            'lighting', jsonb_build_object(
                'type', 'LED',
                'controls', 'Smart/Daylight Harvesting'
            ),
            'solar', jsonb_build_object(
                'capacity_kw', 500,
                'panels', 1200,
                'battery_kwh', 1000
            ),
            'bms', jsonb_build_object(
                'vendor', 'Siemens',
                'integration', 'Full API Access'
            )
        ),
        jsonb_build_object(
            'annual_energy_kwh', 2500000,
            'annual_water_gallons', 1000000,
            'baseline_year', 2023,
            'energy_intensity', 33.3,
            'carbon_intensity', 0.42
        ),
        now(),
        now()
    ) RETURNING id INTO demo_building_id;

    RAISE NOTICE '✅ Demo building created';

    -- Update auth.users metadata for maximum privileges
    UPDATE auth.users 
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'provider', 'email',
                'providers', jsonb_build_array('email'),
                'role', 'admin',
                'access_level', 'super_admin',
                'tier', 'enterprise'
            ),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'full_name', 'Demo Admin User',
                'is_admin', true,
                'organization_id', demo_org_id
            ),
        updated_at = now()
    WHERE id = demo_user_id;

    RAISE NOTICE '✅ Auth metadata updated';

    -- Create initial ESG data for demo
    INSERT INTO public.esg_metrics (
        organization_id,
        metric_date,
        category,
        metric_name,
        metric_value,
        unit,
        created_by
    ) VALUES
    (demo_org_id, CURRENT_DATE, 'environmental', 'total_emissions', 2847, 'tCO2e', demo_user_id),
    (demo_org_id, CURRENT_DATE, 'environmental', 'renewable_energy', 45, '%', demo_user_id),
    (demo_org_id, CURRENT_DATE, 'social', 'employee_satisfaction', 85, '%', demo_user_id),
    (demo_org_id, CURRENT_DATE, 'governance', 'board_diversity', 40, '%', demo_user_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Demo ESG data created';

    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '🎉 DEMO ADMIN USER SETUP COMPLETE!';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Login Credentials:';
    RAISE NOTICE '   Email: demo@blipee.com';
    RAISE NOTICE '   Password: [the password you created]';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Access Level:';
    RAISE NOTICE '   Role: account_owner (highest level)';
    RAISE NOTICE '   Organization: Demo Enterprise Organization';
    RAISE NOTICE '   Subscription: Enterprise (all features unlocked)';
    RAISE NOTICE '   Permissions: Full admin access';
    RAISE NOTICE '';
    RAISE NOTICE '🏢 Resources Created:';
    RAISE NOTICE '   • 1 Enterprise Organization';
    RAISE NOTICE '   • 1 Demo Building (75,000 sqft)';
    RAISE NOTICE '   • 4 ESG Metrics';
    RAISE NOTICE '   • Full admin permissions';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now:';
    RAISE NOTICE '   • Access all authenticated pages';
    RAISE NOTICE '   • Upload and analyze sustainability reports';
    RAISE NOTICE '   • Manage users and buildings';
    RAISE NOTICE '   • Use all premium features';
    RAISE NOTICE '   • Access full API with unlimited calls';
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error occurred: %', SQLERRM;
        RAISE NOTICE 'Please check the error and try again.';
END $$;