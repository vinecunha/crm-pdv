-- Functions for CRM-PDV system
-- These must be created before tables that reference them in triggers

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update budget updated_at
create or replace function update_budget_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update coupons updated_at
create or replace function update_coupons_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update products updated_at
create or replace function update_products_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update goals updated_at
create or replace function update_goals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to prevent update on deleted customers
create or replace function prevent_update_deleted_customer()
returns trigger as $$
begin
  if old.deleted_at is not null then
    raise exception 'Cannot update a deleted customer';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to validate stock changes
create or replace function validate_stock_changes()
returns trigger as $$
begin
  if new.stock_quantity < 0 then
    raise exception 'Stock quantity cannot be negative';
  end if;
  if new.min_stock > new.max_stock and new.max_stock > 0 then
    raise exception 'Min stock cannot be greater than max stock';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to notify low stock
create or replace function notify_low_stock()
returns trigger as $$
begin
  if new.stock_quantity <= new.min_stock and new.min_stock > 0 then
    insert into public.notifications (user_id, title, message, type, entity_type, entity_id)
    select 
      p.id,
      'Estoque Baixo',
      'O produto ' || new.name || ' está com estoque baixo (' || new.stock_quantity || ' unidades)',
      'warning',
      'product',
      new.id::text
    from public.profiles p
    where p.role in ('admin', 'gerente');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to audit product changes
create or replace function audit_product_changes()
returns trigger as $$
begin
  insert into public.system_logs (user_id, user_email, action, entity_type, entity_id, old_data, new_data)
  values (
    auth.uid(),
    (select email from public.profiles where id = auth.uid()),
    'product_updated',
    'product',
    new.id::text,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update stock on entry
create or replace function update_stock_on_entry()
returns trigger as $$
begin
  update public.products
  set stock_quantity = stock_quantity + new.quantity
  where id = new.product_id;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to validate entry dates
create or replace function validate_entry_dates()
returns trigger as $$
begin
  if new.manufacture_date > current_date then
    raise exception 'Manufacture date cannot be in the future';
  end if;
  if new.expiration_date is not null and new.expiration_date < new.manufacture_date then
    raise exception 'Expiration date cannot be before manufacture date';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to calculate item difference
create or replace function calculate_item_difference()
returns trigger as $$
begin
  if new.counted_quantity is not null then
    new.difference = new.counted_quantity - new.system_quantity;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to validate count session dates
create or replace function validate_count_session_dates()
returns trigger as $$
begin
  if new.completed_at is not null and new.completed_at < new.started_at then
    raise exception 'Completion date cannot be before start date';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to generate sale number
create or replace function generate_sale_number()
returns trigger as $$
begin
  new.sale_number = 'S' || to_char(current_date, 'YYYYMMDD') || lpad(nextval('sales_id_seq')::text, 6, '0');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update customer RFV on sale
create or replace function update_customer_rfv_on_sale()
returns trigger as $$
declare
  recency integer;
  frequency integer;
  monetary numeric(10,2);
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    select 
      extract(day from current_date - max(created_at::date))::integer,
      count(*),
      sum(final_amount)
    into recency, frequency, monetary
    from public.sales
    where customer_id = new.customer_id and status = 'completed';
    
    update public.customers
    set 
      rfv_recency = recency,
      rfv_frequency = frequency,
      rfv_monetary = monetary,
      rfv_score = 
        case 
          when recency <= 30 then '5'
          when recency <= 60 then '4'
          when recency <= 90 then '3'
          when recency <= 180 then '2'
          else '1'
        end ||
        case 
          when frequency >= 10 then '5'
          when frequency >= 5 then '4'
          when frequency >= 2 then '3'
          when frequency >= 1 then '2'
          else '1'
        end ||
        case 
          when monetary >= 1000 then '5'
          when monetary >= 500 then '4'
          when monetary >= 200 then '3'
          when monetary >= 100 then '2'
          else '1'
        end,
      last_purchase = current_date,
      total_purchases = total_purchases + new.final_amount
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to validate sale amounts
create or replace function validate_sale_amounts()
returns trigger as $$
begin
  if new.final_amount != new.total_amount - coalesce(new.discount_amount, 0) then
    new.final_amount = new.total_amount - coalesce(new.discount_amount, 0);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to set sale created_by_name
create or replace function set_sale_created_by_name()
returns trigger as $$
begin
  new.created_by_name = (select full_name from public.profiles where id = new.created_by);
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update customer last purchase
create or replace function update_customer_last_purchase()
returns trigger as $$
begin
  if new.status = 'completed' then
    update public.customers
    set last_purchase = new.created_at::date
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to notify new sale
create or replace function notify_new_sale()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, entity_type, entity_id)
  select 
    p.id,
    'Nova Venda',
    'Nova venda realizada: ' || new.sale_number || ' - R$ ' || new.final_amount,
    'info',
    'sale',
    new.id::text
  from public.profiles p
  where p.role in ('admin', 'gerente');
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to update stock on sale
create or replace function update_stock_on_sale()
returns trigger as $$
begin
  update public.products
  set 
    stock_quantity = stock_quantity - new.quantity,
    reserved_quantity = reserved_quantity - new.quantity
  where id = new.product_id;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to enforce single system settings
create or replace function enforce_single_system_settings()
returns trigger as $$
begin
  if (select count(*) from public.system_settings) > 0 and tg_op = 'INSERT' then
    raise exception 'Only one row is allowed in system_settings';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to prevent duplicate notifications
create or replace function prevent_duplicate_notifications()
returns trigger as $$
begin
  if exists (
    select 1 from public.notifications
    where user_id = new.user_id 
      and title = new.title 
      and entity_id = new.entity_id
      and created_at > now() - interval '1 minute'
  ) then
    return null;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to handle profile delete
create or replace function handle_profile_delete()
returns trigger as $$
begin
  insert into public.system_logs (user_id, user_email, action, entity_type, entity_id, old_data)
  values (
    old.id,
    old.email,
    'profile_deleted',
    'profile',
    old.id::text,
    to_jsonb(old)
  );
  return old;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to handle profile update
create or replace function handle_profile_update()
returns trigger as $$
begin
  insert into public.system_logs (user_id, user_email, action, entity_type, entity_id, old_data, new_data)
  values (
    new.id,
    new.email,
    'profile_updated',
    'profile',
    new.id::text,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to initialize user preferences
create or replace function initialize_user_preferences()
returns trigger as $$
begin
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Create sequence for registration numbers
create sequence if not exists public.registration_number_seq;

-- Function to set registration number
create or replace function set_registration_number()
returns trigger as $$
begin
  if new.registration_number is null then
    new.registration_number = 'REG' || to_char(current_date, 'YYYYMMDD') || lpad(nextval('public.registration_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to log task assignment
create or replace function log_task_assignment()
returns trigger as $$
begin
  if old.assigned_to is distinct from new.assigned_to then
    insert into public.task_assignment_history (task_id, assigned_by, assigned_by_name, assigned_to, assigned_to_name, action)
    values (
      new.id,
      auth.uid(),
      (select full_name from public.profiles where id = auth.uid()),
      new.assigned_to[1],
      (select full_name from public.profiles where id = new.assigned_to[1]),
      'assigned'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to log task status change
create or replace function log_task_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into public.task_status_history (task_id, changed_by, changed_by_name, old_status, new_status)
    values (
      new.id,
      auth.uid(),
      (select full_name from public.profiles where id = auth.uid()),
      old.status,
      new.status
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Function to get current user role (for RLS policies)
create or replace function public.get_current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable set search_path = '';

-- Function to setup company (used in initial setup flow)
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
  p_company_logo text default null,
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
  
  -- Insert into company_settings table
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
