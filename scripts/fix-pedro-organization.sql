-- Fix organization for pedro@blipee.com user

-- First, get the user ID
DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@blipee.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: %', v_user_id;
    
    -- Check if user has any organizations
    SELECT organization_id INTO v_org_id 
    FROM organization_members 
    WHERE user_id = v_user_id 
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        -- Create an organization for the user
        INSERT INTO organizations (name, slug, subscription_tier, metadata)
        VALUES (
            'Pedro''s Company',
            'pedros-company',
            'starter',
            jsonb_build_object(
                'created_by', v_user_id,
                'created_at', now()
            )
        )
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created organization: %', v_org_id;
        
        -- Add user as member
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            invitation_status,
            joined_at
        ) VALUES (
            v_org_id,
            v_user_id,
            'subscription_owner',
            'accepted',
            now()
        );
        
        RAISE NOTICE 'Added user as subscription owner';
        
        -- Update user profile with default organization
        UPDATE user_profiles
        SET metadata = COALESCE(metadata, '{}'::jsonb) || 
            jsonb_build_object('default_organization_id', v_org_id)
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Updated user profile';
    ELSE
        RAISE NOTICE 'User already has organization: %', v_org_id;
        
        -- Ensure membership status is accepted
        UPDATE organization_members
        SET invitation_status = 'accepted'
        WHERE user_id = v_user_id AND organization_id = v_org_id;
        
        RAISE NOTICE 'Ensured membership status is accepted';
    END IF;
END $$;

-- Verify the fix
SELECT 
    u.email,
    up.*,
    om.organization_id,
    om.role,
    om.invitation_status,
    o.name as org_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'pedro@blipee.com';