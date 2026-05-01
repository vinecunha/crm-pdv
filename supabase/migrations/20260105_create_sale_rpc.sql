-- RPC function to create a sale (used in production)
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
  -- Validate items
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'Carrinho vazio');
  end if;

  -- Get customer name if exists
  if p_customer_id is not null then
    select name into v_customer_name from public.customers where id = p_customer_id;
  end if;

  -- Calculate total
  select sum((item->>'quantity')::numeric * (item->>'unit_price')::numeric)
  into v_total_amount
  from jsonb_array_elements(p_items) as item;

  v_final_amount := v_total_amount - coalesce(p_discount_amount, 0);

  -- Create sale
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

  -- Insert sale items
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

  -- Update coupon if used
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
