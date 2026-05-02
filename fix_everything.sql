-- Complete fix for Supabase database
-- Run this in Supabase Dashboard → SQL Editor when pool is unblocked

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS public.setup_company CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role CASCADE;

-- 2. Create setup_company function with CORRECT parameter name (company_logo)
create or replace function public.setup_company(
  p_company_name text,
  p_cnpj text default null,
  p_email text default null,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_zip_code text default null,
  p_primary_color text default '#2563eb',
  p_secondary_color text default '#7c3aed',
  p_company_logo text default null,  -- CORRECT: matches client
  p_favicon text default null,
  p_domain text default null,
  p_social_media jsonb default '{}'::jsonb,
  p_custom_css text default null
)
returns void as $$
declare
  v_slug text;
  v_company_id uuid;
begin
  -- Generate slug from company name
  v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  
  -- Insert into companies table
  insert into public.companies (name, slug, domain, settings)
  values (
    p_company_name,
    v_slug,
    p_domain,
    jsonb_build_object(
      'cnpj', p_cnpj,
      'email', p_email,
      'phone', p_phone,
      'address', p_address,
      'city', p_city,
      'state', p_state,
      'zip_code', p_zip_code,
      'social_media', p_social_media,
      'custom_css', p_custom_css
    )
  )
  on conflict (slug) do nothing
  returning id into v_company_id;
  
  -- If company already existed, get its id
  if v_company_id is null then
    select id into v_company_id from public.companies where slug = v_slug limit 1;
  end if;
  
  -- Insert into company_settings table (use company_logo to match client)
  insert into public.company_settings (
    company_name,
    company_logo,
    favicon,
    domain,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    cnpj,
    social_media,
    primary_color,
    secondary_color,
    custom_css
  ) values (
    p_company_name,
    p_company_logo,
    p_favicon,
    p_domain,
    p_email,
    p_phone,
    p_address,
    p_city,
    p_state,
    p_zip_code,
    p_cnpj,
    p_social_media,
    p_primary_color,
    p_secondary_color,
    p_custom_css
  )
  on conflict do nothing;
end;
$$ language plpgsql security definer set search_path = '';

-- 3. Create get_current_user_role function (using plpgsql to defer validation)
create or replace function public.get_current_user_role()
returns text as $$
begin
  return (select role from public.profiles where id = auth.uid() limit 1);
end;
$$ language plpgsql security definer stable set search_path = '';

-- 4. Fix RLS policy for company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.company_settings;
CREATE POLICY "Allow public read access" ON public.company_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 5. Grant permissions
GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT ON public.company_settings TO authenticated;

-- 6. Verify setup
SELECT routine_name, routine_definition FROM information_schema.routines 
WHERE routine_name = 'setup_company';

SELECT * FROM pg_policies WHERE tablename = 'company_settings';
