-- Migration: Add user deletion function
-- Allows users to delete their own account and all associated data
-- Created: 2026-02-04

-- =====================================================
-- Create function to delete user and cascade all data
-- =====================================================

-- This function allows a user to delete their own account
-- It will cascade delete all related data due to foreign key constraints
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all user data (cascades due to FK constraints)
  -- 1. Delete email enrichments (has FK to email_metadata)
  DELETE FROM email_enrichments WHERE user_id = current_user_id;
  
  -- 2. Delete email metadata
  DELETE FROM email_metadata WHERE user_id = current_user_id;
  
  -- 3. Delete outlook connections
  DELETE FROM outlook_connections WHERE user_id = current_user_id;
  
  -- 4. Delete view preferences (if table exists)
  DELETE FROM view_preferences WHERE user_id = current_user_id;
  
  -- 5. Delete the user from auth.users
  -- Note: This only works because function is SECURITY DEFINER
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Log the deletion
  RAISE NOTICE 'User % and all associated data deleted', current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user() IS 'Allows authenticated user to delete their own account and all associated data. Used for testing and account deletion feature.';
