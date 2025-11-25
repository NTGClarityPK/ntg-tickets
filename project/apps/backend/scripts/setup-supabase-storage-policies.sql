-- ============================================
-- Supabase Storage RLS Policies Setup
-- ============================================
-- Run this script in Supabase SQL Editor to set up Row Level Security
-- for your storage buckets
-- ============================================

-- ============================================
-- 1. TICKET ATTACHMENTS BUCKET POLICIES
-- ============================================

-- Policy: Allow authenticated users to upload attachments
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  -- Optional: Add additional checks here
  -- For example, check if user has permission to upload to specific ticket
  true
);

-- Policy: Allow users to read attachments they have access to
-- Note: This is a basic policy. You may want to add more specific checks
-- based on ticket ownership/assignment
CREATE POLICY "Users can read ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- Policy: Allow users to update their own uploads (optional)
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  -- Add check for ownership if needed
);

-- Policy: Allow users to delete their own uploads or admins to delete any
CREATE POLICY "Users can delete ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  -- Add ownership/admin check if needed
);

-- ============================================
-- 2. USER AVATARS BUCKET POLICIES (if using)
-- ============================================

-- Policy: Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  -- Check that the file path matches the user's ID
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow anyone to read avatars (public bucket)
-- If bucket is public, this may not be needed
CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-avatars');

-- Policy: Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. HELPER FUNCTIONS (Optional)
-- ============================================

-- Function to check if user has access to a ticket
-- This assumes you have a tickets table in your public schema
CREATE OR REPLACE FUNCTION public.user_has_ticket_access(
  ticket_id_param uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = ticket_id_param
      AND (
        t.requester_id = user_id_param
        OR t.assigned_to_id = user_id_param
        OR EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id = user_id_param
            AND (
              'SUPPORT_STAFF' = ANY(u.roles)
              OR 'SUPPORT_MANAGER' = ANY(u.roles)
              OR 'ADMIN' = ANY(u.roles)
            )
        )
      )
  ) INTO has_access;
  
  RETURN COALESCE(has_access, false);
END;
$$;

-- ============================================
-- 4. ENHANCED POLICIES WITH TICKET ACCESS CHECK
-- ============================================
-- Uncomment these if you want more granular control

-- Enhanced upload policy with ticket access check
-- CREATE POLICY "Users can upload attachments to accessible tickets"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'ticket-attachments' AND
--   public.user_has_ticket_access(
--     (storage.foldername(name))[1]::uuid,
--     auth.uid()
--   )
-- );

-- Enhanced read policy with ticket access check
-- CREATE POLICY "Users can read attachments from accessible tickets"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'ticket-attachments' AND
--   public.user_has_ticket_access(
--     (storage.foldername(name))[1]::uuid,
--     auth.uid()
--   )
-- );

-- ============================================
-- NOTES:
-- ============================================
-- 1. Make sure your buckets exist before running this script
-- 2. Adjust policies based on your security requirements
-- 3. The helper function assumes your tickets table structure
-- 4. Test policies after creation
-- 5. For production, consider more restrictive policies
-- ============================================

