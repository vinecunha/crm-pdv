-- Force drop ALL setup_company functions using dynamic SQL
do $$
declare
  func_record record;
  drop_sql text;
begin
  for func_record in 
    select 
      p.oid::regprocedure as func_signature
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'setup_company'
    and n.nspname = 'public'
  loop
    drop_sql := 'drop function if exists ' || func_record.func_signature || ' cascade';
    execute drop_sql;
    raise notice 'Dropped: %', func_record.func_signature;
  end loop;
  
  raise notice 'All setup_company functions dropped successfully.';
end;
$$;

-- Verify all dropped
do $$
declare
  func_count integer;
begin
  select count(*) into func_count
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
  where p.proname = 'setup_company'
  and n.nspname = 'public';
  
  if func_count > 0 then
    raise exception 'ERROR: Still % setup_company functions exist!', func_count;
  else
    raise notice 'SUCCESS: All setup_company functions dropped.';
  end if;
end;
$$;

-- Create single correct setup_company function with TEXT parameters
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
  p_company_logo_url text default null,
  p_favicon text default null,
  p_domain text default null,
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
