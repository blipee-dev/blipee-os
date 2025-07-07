-- Alternative: Create Demo Data Without Auth User
-- This creates all the necessary data using a fake UUID

DO $$
DECLARE
    demo_user_id uuid;
    demo_org_id uuid;
    demo_building_id uuid;
BEGIN
    -- Use a static UUID for demo user (you can change this)
    demo_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Creating demo data with bypass auth...';
    RAISE NOTICE 'Demo User ID: %', demo_user_id;
    
    -- Create user profile (even without auth.users entry)
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        phone,
        timezone,
        notification_preferences,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo@blipee.com',
        'Demo Admin User',
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
            'bypass_auth', true,
            'demo_account', true,
            'permissions', array[
                'system.admin',
                'org.create',
                'org.delete',
                'org.manage_all',
                'user.manage_all',
                'data.export_all',
                'api.unlimited'
            ]
        ),
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        metadata = EXCLUDED.metadata,
        updated_at = now();

    -- Create organization
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
        'Demo Enterprise Organization',
        'enterprise',
        'enterprise',
        jsonb_build_object(
            'features', array[
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
            ],
            'branding', jsonb_build_object('primary_color', '#8B5CF6'),
            'limits', jsonb_build_object(
                'buildings', 9999,
                'users', 9999,
                'api_calls', 9999999,
                'storage_gb', 9999
            ),
            'permissions', jsonb_build_object(
                'all_access', true
            )
        ),
        now(),
        now()
    ) RETURNING id INTO demo_org_id;

    -- Create organization membership
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        joined_at
    ) VALUES (
        demo_org_id,
        demo_user_id,
        'account_owner',
        now()
    ) ON CONFLICT DO NOTHING;

    -- Create demo building
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
        '123 Sustainability Street',
        'San Francisco',
        'USA',
        75000,
        10,
        'office',
        2020,
        jsonb_build_object(
            'occupancy_type', 'commercial',
            'operating_hours', '24/7',
            'certifications', array['LEED Platinum', 'Energy Star', 'WELL Gold'],
            'features', array['Solar Panels', 'Rainwater Harvesting', 'Smart HVAC']
        ),
        now(),
        now()
    ) RETURNING id INTO demo_building_id;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ Demo data created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Since auth.users creation failed,';
    RAISE NOTICE 'you have two options to access the app:';
    RAISE NOTICE '';
    RAISE NOTICE 'Option 1: Development Mode (Recommended)';
    RAISE NOTICE '  - Use the static User ID in your code';
    RAISE NOTICE '  - Bypass auth for development';
    RAISE NOTICE '';
    RAISE NOTICE 'Option 2: Create a Regular User';
    RAISE NOTICE '  - Sign up normally at /signup';
    RAISE NOTICE '  - Then link to this demo data';
    RAISE NOTICE '';
    RAISE NOTICE 'Demo Data IDs:';
    RAISE NOTICE '  User ID: %', demo_user_id;
    RAISE NOTICE '  Organization ID: %', demo_org_id;
    RAISE NOTICE '  Building ID: %', demo_building_id;
    RAISE NOTICE '==================================================';

END $$;

-- Also create a view to easily access demo data
CREATE OR REPLACE VIEW demo_access AS
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid as demo_user_id,
    o.id as organization_id,
    o.name as organization_name,
    b.id as building_id,
    b.name as building_name
FROM organizations o
JOIN buildings b ON b.organization_id = o.id
WHERE o.name = 'Demo Enterprise Organization'
LIMIT 1;