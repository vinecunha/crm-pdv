-- Fix profiles table in test database
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check current structure of profiles table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'id';

-- 2. Remove any default value on profiles.id (it should NOT have a sequence)
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- 3. Ensure id is UUID type (not serial/bigserial)
-- If needed, fix the type (be careful - this drops the default)
-- ALTER TABLE public.profiles ALTER COLUMN id TYPE uuid USING id::uuid;

-- 4. Verify the fix
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'id';

-- 5. Fix company_settings RLS (fixes 401 error)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.company_settings;
CREATE POLICY "Allow public read access" ON public.company_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 6. Grant permissions
GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT ON public.company_settings TO authenticated;

-- 7. Verify RLS policy
SELECT * FROM pg_policies WHERE tablename = 'company_settings';
