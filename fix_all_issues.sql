-- Fix issues in Supabase database
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Fix RLS policy for company_settings (fixes 401 error)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.company_settings;
CREATE POLICY "Allow public read access" ON public.company_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Grant permissions
GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT ON public.company_settings TO authenticated;

-- 2. Fix profiles table (remove incorrect sequence reference)
-- The profiles.id is UUID from auth.users, should NOT have a sequence
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- 3. Verify company_settings policy
SELECT * FROM pg_policies WHERE tablename = 'company_settings';

-- 4. Verify profiles table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'id';
