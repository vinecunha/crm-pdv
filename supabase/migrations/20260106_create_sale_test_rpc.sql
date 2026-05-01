-- RPC function to create a sale (used in tests)
-- This function is a wrapper around create_sale that returns the sale ID directly
-- instead of a JSONB object, making it easier to test
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
