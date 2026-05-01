-- Fix RLS policy for company_settings to allow public read access during setup
-- Also update setup_company function to accept all parameters from the service

-- 1. Fix RLS policy for company_settings (allow anon read for setup check)
alter table public.company_settings disable row level security;
alter table public.company_settings enable row level security;

drop policy if exists "Allow authenticated read access" on public.company_settings;
drop policy if exists "Allow public read access" on public.company_settings;

create policy "Allow public read access" on public.company_settings
  for select to anon, authenticated using (true);

-- 2. Drop old setup_company function and create new one with correct parameters
drop function if exists public.setup_company(character varying, character varying, character varying, jsonb);

create or replace function public.setup_company(
  p_company_name character varying,
  p_cnpj character varying default null,
  p_email character varying default null,
  p_phone character varying default null,
  p_address text default null,
  p_city character varying(100) default null,
  p_state character varying(50) default null,
  p_zip_code character varying(20) default null,
  p_primary_color character varying(7) default '#2563eb',
  p_secondary_color character varying(7) default '#7c3aed',
  p_company_logo_url text default null,
  p_favicon text default null,
  p_domain character varying(255) default null,
  p_social_media jsonb default '{}'::jsonb,
  p_custom_css text default null
)
returns void as $$
declare
  v_slug text;
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
  on conflict (slug) do nothing;
  
  -- Insert into company_settings table
  insert into public.company_settings (
    company_name,
    company_logo_url,
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
    p_company_logo_url,
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
