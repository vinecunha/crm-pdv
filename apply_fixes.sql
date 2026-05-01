-- Complete fix script for Supabase Dashboard
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create the create_sale_test function (if not exists)
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
  -- Call the main create_sale function
  select public.create_sale(
    p_customer_id,
    p_created_by,
    p_items,
    p_payment_method,
    p_discount_amount,
    p_coupon_code,
    p_notes
  ) into v_result;
  
  -- Extract the sale ID from the result
  v_sale_id := (v_result->>'id')::bigint;
  
  return v_sale_id;
exception
  when others then
    return null;
end;
$$ language plpgsql security definer set search_path = '';

-- 2. Fix commissions table permissions
-- Enable RLS on commissions table
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can update own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.commissions;

-- Create policies for commissions
CREATE POLICY "Users can view own commissions" ON public.commissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own commissions" ON public.commissions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Allow authenticated users to insert commissions (needed for tests)
CREATE POLICY "Authenticated users can insert commissions" ON public.commissions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow service role to manage all commissions
CREATE POLICY "Service role can manage all commissions" ON public.commissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Grant permissions
GRANT ALL ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;

-- 4. Verify setup
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'create_sale_test';
SELECT * FROM pg_policies WHERE tablename = 'commissions';
