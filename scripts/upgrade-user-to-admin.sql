-- Simple script to upgrade any existing user to admin
-- Run after creating user via signup

DO $$
DECLARE
    user_id_to_upgrade uuid;
BEGIN
    -- Find user by email
    SELECT id INTO user_id_to_upgrade
    FROM auth.users 
    WHERE email = 'demo@blipee.com'
    LIMIT 1;
    
    IF user_id_to_upgrade IS NULL THEN
        -- Try finding in user_profiles
        SELECT id INTO user_id_to_upgrade
        FROM user_profiles 
        WHERE email = 'demo@blipee.com'
        LIMIT 1;
    END IF;
    
    IF user_id_to_upgrade IS NOT NULL THEN
        -- Update auth metadata
        UPDATE auth.users 
        SET 
            raw_app_meta_data = raw_app_meta_data || '{"role": "admin", "access_level": "super_admin"}'::jsonb,
            raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
        WHERE id = user_id_to_upgrade;
        
        -- Update profile
        UPDATE user_profiles 
        SET 
            metadata = jsonb_build_object(
                'is_admin', true,
                'is_super_user', true,
                'permissions', array['system.admin']
            )
        WHERE id = user_id_to_upgrade;
        
        -- Update organization membership to highest role
        UPDATE organization_members 
        SET role = 'account_owner'
        WHERE user_id = user_id_to_upgrade;
        
        -- Update organization to enterprise tier
        UPDATE organizations 
        SET 
            subscription_tier = 'enterprise',
            settings = settings || jsonb_build_object(
                'features', array[
                    'ai_insights', 
                    'sustainability_reporting', 
                    'api_access',
                    'advanced_analytics',
                    'unlimited_users'
                ],
                'permissions', jsonb_build_object(
                    'all_access', true
                )
            )
        WHERE id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = user_id_to_upgrade
        );
        
        RAISE NOTICE '✅ User upgraded to admin successfully!';
        RAISE NOTICE 'User ID: %', user_id_to_upgrade;
    ELSE
        RAISE NOTICE '❌ User not found. Please create account first.';
    END IF;
END $$;