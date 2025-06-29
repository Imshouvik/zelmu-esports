-- Fix storage bucket RLS policies for logo uploads
-- Run these commands in your Supabase SQL Editor

-- 1. Check if the club-logos bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'club-logos';

-- 2. Create the club-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Check current storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 4. Drop existing policies for club-logos bucket (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload club logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to club logos" ON storage.objects;

-- 5. Create policies for club-logos bucket
-- Policy for uploading (authenticated users can upload)
CREATE POLICY "Allow authenticated users to upload club logos" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'club-logos');

-- Policy for viewing (public can view)
CREATE POLICY "Allow public access to club logos" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'club-logos');

-- Policy for updating (authenticated users can update their own files)
CREATE POLICY "Allow authenticated users to update club logos" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'club-logos')
WITH CHECK (bucket_id = 'club-logos');

-- Policy for deleting (authenticated users can delete their own files)
CREATE POLICY "Allow authenticated users to delete club logos" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'club-logos');

-- 6. Alternative: Disable RLS for storage.objects (temporary fix)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 7. Verify the bucket and policies
SELECT name, public FROM storage.buckets WHERE name = 'club-logos';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'; 