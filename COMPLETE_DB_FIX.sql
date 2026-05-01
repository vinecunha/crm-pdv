-- Complete database fix for CRM-PDV
-- Run this in Supabase Dashboard → SQL Editor

-- =============================================
-- 1. CREATE MISSING FUNCTIONS
-- =============================================

-- Function to get current user role (fixed with plpgsql)
create or replace function public.get_current_user_role()
returns text as $$
begin
  return (select role from public.profiles where id = auth.uid() limit 1);
end;
$$ language plpgsql security definer stable set search_path = '';

-- Function to setup company (with correct parameter name p_company_logo_url)
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
  v_company_id uuid;
begin
  v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  
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
  
  if v_company_id is null then
    select id into v_company_id from public.companies where slug = v_slug limit 1;
  end if;
  
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

-- Function to create sale (for production)
create or replace function public.create_sale(
  p_customer_id bigint default null,
  p_created_by uuid,
  p_items jsonb,
  p_payment_method text default 'cash',
  p_discount_amount numeric(10,2) default 0,
  p_coupon_code text default null,
  p_notes text default null
)
returns jsonb as $$
declare
  v_sale_id bigint;
  v_sale_number text;
  v_customer_name text;
  v_total_amount numeric(10,2) := 0;
  v_final_amount numeric(10,2) := 0;
  v_item jsonb;
  v_product_name text;
  v_product_code text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'Carrinho vazio');
  end if;

  if p_customer_id is not null then
    select name into v_customer_name from public.customers where id = p_customer_id;
  end if;

  select sum((item->>'quantity')::numeric * (item->>'unit_price')::numeric)
  into v_total_amount
  from jsonb_array_elements(p_items) as item;

  v_final_amount := v_total_amount - coalesce(p_discount_amount, 0);

  insert into public.sales (
    customer_id, customer_name, customer_phone,
    total_amount, discount_amount, final_amount,
    payment_method, created_by, notes
  )
  values (
    p_customer_id,
    v_customer_name,
    (select phone from public.customers where id = p_customer_id),
    v_total_amount,
    p_discount_amount,
    v_final_amount,
    p_payment_method,
    p_created_by,
    p_notes
  )
  returning id, sale_number into v_sale_id, v_sale_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select name, code into v_product_name, v_product_code
    from public.products where id = (v_item->>'product_id')::bigint;

    insert into public.sale_items (sale_id, product_id, product_name, product_code, quantity, unit_price, total_price)
    values (
      v_sale_id,
      (v_item->>'product_id')::bigint,
      v_product_name,
      v_product_code,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric
    );
  end loop;

  if p_coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = p_coupon_code;
  end if;

  return jsonb_build_object(
    'id', v_sale_id,
    'sale_number', v_sale_number,
    'total_amount', v_total_amount,
    'final_amount', v_final_amount,
    'status', 'completed'
  );
end;
$$ language plpgsql security definer set search_path = '';

-- Function to create sale test (for tests)
create or replace function public.create_sale_test(
  p_customer_id bigint default null,
  p_created_by uuid,
  p_items jsonb,
  p_payment_method text default 'cash',
  p_discount_amount numeric(10,2) default 0,
  p_coupon_code text default null,
  p_notes text default null
)
returns bigint as $$
declare
  v_result jsonb;
  v_sale_id bigint;
begin
  select public.create_sale(
    p_customer_id,
    p_created_by,
    p_items,
    p_payment_method,
    p_discount_amount,
    p_coupon_code,
    p_notes
  ) into v_result;
  
  v_sale_id := (v_result->>'id')::bigint;
  return v_sale_id;
exception
  when others then
    return null;
end;
$$ language plpgsql security definer set search_path = '';

-- =============================================
-- 2. FIX RLS POLICIES
-- =============================================

-- Company settings - allow public read
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.company_settings;
CREATE POLICY "Allow public read access" ON public.company_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Commissions - fix permissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin manage commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users update own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Allow insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin manage all commissions" ON public.commissions;

CREATE POLICY "Users see own commissions" ON public.commissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Users update own commissions" ON public.commissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow insert commissions" ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin manage all commissions" ON public.commissions
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- =============================================
-- 3. GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.company_settings TO anon, authenticated;
GRANT ALL ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;

-- =============================================
-- 4. VERIFY SETUP
-- =============================================

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('setup_company', 'create_sale', 'create_sale_test', 'get_current_user_role')
ORDER BY routine_name;

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('company_settings', 'commissions')
ORDER BY tablename, policyname;

-- Check grants
SELECT grantee, table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('company_settings', 'commissions')
ORDER BY table_name, grantee;
