-- Fix permissions for company_settings table
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant SELECT on company_settings table
GRANT SELECT ON public.company_settings TO anon, authenticated;

-- 3. Ensure RLS is enabled with correct policy
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.company_settings;
CREATE POLICY "Allow public read access" ON public.company_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 4. Verify the policy exists
SELECT * FROM pg_policies WHERE tablename = 'company_settings';

-- 5. Verify grants
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'company_settings' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
