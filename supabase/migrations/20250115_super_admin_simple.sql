-- ============================================================================
-- SUPER ADMIN SETUP - SIMPLE VERSION
-- Run this first to set up basic super admin functionality
-- ============================================================================

-- PART 1: Add is_super_admin column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- PART 2: Set pedro@blipee.com as super_admin
UPDATE user_profiles
SET is_super_admin = true
WHERE id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

-- PART 3: Create the is_super_admin function
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT is_super_admin
         FROM user_profiles
         WHERE id = user_id),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PART 4: Grant permissions
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- PART 5: Verify setup
SELECT
    id,
    email,
    full_name,
    is_super_admin
FROM user_profiles
WHERE id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';