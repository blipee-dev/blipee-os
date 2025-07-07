-- Fix conversations foreign key to reference user_profiles instead of auth.users

-- Drop the existing foreign key constraint
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

-- Add new foreign key to user_profiles
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Also fix building_id if it references wrong table
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_building_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_building_id_fkey
FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;