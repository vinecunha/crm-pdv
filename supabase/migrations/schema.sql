create table public.budget_items (
  id bigserial not null,
  budget_id bigint null,
  product_id bigint null,
  product_name text not null,
  product_code text null,
  quantity numeric(10, 3) not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  unit text null,
  created_at timestamp with time zone null default now(),
  constraint budget_items_pkey primary key (id),
  constraint budget_items_budget_id_fkey foreign KEY (budget_id) references budgets (id) on delete CASCADE,
  constraint budget_items_product_id_fkey foreign KEY (product_id) references products (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_budget_items_budget_id on public.budget_items using btree (budget_id) TABLESPACE pg_default;

create index IF not exists idx_budget_items_product_id on public.budget_items using btree (product_id) TABLESPACE pg_default;

create table public.budgets (
  id bigserial not null,
  budget_number serial not null,
  customer_id bigint null,
  customer_name text null,
  customer_phone text null,
  customer_email text null,
  total_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) null default 0,
  discount_percent numeric(5, 2) null,
  coupon_code text null,
  final_amount numeric(10, 2) not null default 0,
  status text null default 'pending'::text,
  valid_until date null default (CURRENT_DATE + '7 days'::interval),
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  approved_by uuid null,
  approved_at timestamp with time zone null,
  converted_sale_id bigint null,
  constraint budgets_pkey primary key (id),
  constraint budgets_budget_number_key unique (budget_number),
  constraint budgets_approved_by_fkey foreign KEY (approved_by) references auth.users (id),
  constraint budgets_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete set null,
  constraint budgets_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint budgets_converted_sale_id_fkey foreign KEY (converted_sale_id) references sales (id),
  constraint budgets_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'expired'::text,
          'converted'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_budgets_customer_id on public.budgets using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_budgets_status on public.budgets using btree (status) TABLESPACE pg_default;

create index IF not exists idx_budgets_created_by on public.budgets using btree (created_by) TABLESPACE pg_default;

create trigger trigger_update_budget_updated_at BEFORE
update on budgets for EACH row
execute FUNCTION update_budget_updated_at ();

create table public.cashier_closing (
  id bigserial not null,
  closing_date date not null,
  start_time timestamp with time zone null,
  end_time timestamp with time zone null,
  total_sales numeric(10, 2) null default 0,
  total_discounts numeric(10, 2) null default 0,
  total_cancellations numeric(10, 2) null default 0,
  total_cash numeric(10, 2) null default 0,
  total_card numeric(10, 2) null default 0,
  total_pix numeric(10, 2) null default 0,
  expected_total numeric(10, 2) null default 0,
  declared_total numeric(10, 2) null default 0,
  difference numeric(10, 2) null default 0,
  notes text null,
  closed_by uuid null,
  closed_at timestamp with time zone null default now(),
  status character varying(20) null default 'closed'::character varying,
  details jsonb null,
  created_at timestamp with time zone null default now(),
  constraint cashier_closing_pkey primary key (id),
  constraint cashier_closing_closed_by_fkey foreign KEY (closed_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_cashier_closing_date on public.cashier_closing using btree (closing_date) TABLESPACE pg_default;

create index IF not exists idx_cashier_closing_closed_by on public.cashier_closing using btree (closed_by) TABLESPACE pg_default;

create index IF not exists idx_cashier_closing_closed_at on public.cashier_closing using btree (closed_at desc) TABLESPACE pg_default;

create trigger update_cashier_closing_updated_at BEFORE
update on cashier_closing for EACH row
execute FUNCTION update_updated_at_column ();

create table public.companies (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  slug character varying(100) not null,
  domain character varying(255) null,
  settings jsonb null default '{}'::jsonb,
  status character varying(20) null default 'active'::character varying,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint companies_pkey primary key (id),
  constraint companies_domain_key unique (domain),
  constraint companies_slug_key unique (slug)
) TABLESPACE pg_default;

create table public.company_settings (
  id uuid not null default gen_random_uuid (),
  company_name character varying(255) not null,
  company_logo text null,
  company_logo_url text null,
  favicon text null,
  domain character varying(255) null,
  email character varying(255) null,
  phone character varying(50) null,
  address text null,
  city character varying(100) null,
  state character varying(50) null,
  zip_code character varying(20) null,
  cnpj character varying(20) null,
  social_media jsonb null default '{}'::jsonb,
  primary_color character varying(7) null default '#2563eb'::character varying,
  secondary_color character varying(7) null default '#7c3aed'::character varying,
  custom_css text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint company_settings_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_company_settings_updated_at BEFORE
update on company_settings for EACH row
execute FUNCTION update_updated_at_column ();

create table public.coupon_allowed_customers (
  id bigserial not null,
  coupon_id bigint null,
  customer_id bigint null,
  created_at timestamp with time zone null default now(),
  constraint coupon_allowed_customers_pkey primary key (id),
  constraint coupon_allowed_customers_coupon_id_customer_id_key unique (coupon_id, customer_id),
  constraint coupon_allowed_customers_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_allowed_customers_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_allowed_customers on public.coupon_allowed_customers using btree (coupon_id, customer_id) TABLESPACE pg_default;


create table public.coupons (
  id bigserial not null,
  code character varying(50) not null,
  name character varying(255) not null,
  description text null,
  discount_type character varying(20) not null,
  discount_value numeric(10, 2) not null,
  max_discount numeric(10, 2) null,
  min_purchase numeric(10, 2) null default 0,
  is_global boolean null default true,
  is_active boolean null default true,
  valid_from timestamp with time zone null,
  valid_to timestamp with time zone null,
  usage_limit integer null,
  used_count integer null default 0,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_at timestamp with time zone null default now(),
  updated_by uuid null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  constraint coupons_pkey primary key (id),
  constraint coupons_code_key unique (code),
  constraint coupons_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint coupons_deleted_by_fkey foreign KEY (deleted_by) references auth.users (id),
  constraint coupons_updated_by_fkey foreign KEY (updated_by) references auth.users (id),
  constraint coupons_discount_type_check check (
    (
      (discount_type)::text = any (
        (
          array[
            'fixed'::character varying,
            'percent'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_coupons_code on public.coupons using btree (code) TABLESPACE pg_default;

create index IF not exists idx_coupons_active on public.coupons using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_coupons_validity on public.coupons using btree (valid_from, valid_to) TABLESPACE pg_default;

create index IF not exists idx_coupons_is_global on public.coupons using btree (is_global) TABLESPACE pg_default;

create trigger update_coupons_updated_at BEFORE
update on coupons for EACH row
execute FUNCTION update_coupons_updated_at ();


create table public.customer_communications (
  id uuid not null default gen_random_uuid (),
  customer_id bigint not null,
  channel character varying(20) not null,
  subject text null,
  content text not null,
  status character varying(20) null default 'sent'::character varying,
  sent_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  details jsonb null,
  constraint customer_communications_pkey primary key (id),
  constraint customer_communications_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE,
  constraint customer_communications_sent_by_fkey foreign KEY (sent_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_customer_communications_customer_id on public.customer_communications using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_customer_communications_channel on public.customer_communications using btree (channel) TABLESPACE pg_default;

create index IF not exists idx_customer_communications_created_at on public.customer_communications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_customer_communications_details on public.customer_communications using gin (details) TABLESPACE pg_default;

create trigger update_customer_communications_updated_at BEFORE
update on customer_communications for EACH row
execute FUNCTION update_updated_at_column ();


create table public.customer_coupons (
  id bigserial not null,
  coupon_id bigint null,
  customer_id bigint null,
  sale_id bigint null,
  used_at timestamp with time zone null default now(),
  constraint customer_coupons_pkey primary key (id),
  constraint customer_coupons_coupon_id_fkey foreign KEY (coupon_id) references coupons (id),
  constraint customer_coupons_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint customer_coupons_sale_id_fkey foreign KEY (sale_id) references sales (id)
) TABLESPACE pg_default;

create index IF not exists idx_customer_coupons on public.customer_coupons using btree (coupon_id, customer_id) TABLESPACE pg_default;

create table public.customers (
  id bigserial not null,
  name character varying(255) not null,
  email character varying(255) not null,
  phone character varying(20) not null,
  document character varying(18) null,
  address character varying(255) null,
  city character varying(100) null,
  state character varying(2) null,
  zip_code character varying(10) null,
  birth_date date null,
  status character varying(20) null default 'active'::character varying,
  total_purchases numeric(10, 2) null default 0,
  last_purchase date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  rfv_score character(3) null,
  rfv_recency integer null,
  rfv_frequency integer null,
  rfv_monetary numeric(10, 2) null,
  constraint customers_pkey primary key (id),
  constraint customers_email_key unique (email),
  constraint customers_deleted_by_fkey foreign KEY (deleted_by) references auth.users (id),
  constraint customers_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'inactive'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_customers_email on public.customers using btree (email) TABLESPACE pg_default;

create index IF not exists idx_customers_phone on public.customers using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_customers_status on public.customers using btree (status) TABLESPACE pg_default;

create index IF not exists idx_customers_name on public.customers using btree (name) TABLESPACE pg_default;

create index IF not exists idx_customers_deleted on public.customers using btree (deleted_at) TABLESPACE pg_default
where
  (deleted_at is not null);

create trigger trg_prevent_update_deleted_customer BEFORE
update on customers for EACH row
execute FUNCTION prevent_update_deleted_customer ();

create trigger update_customers_updated_at BEFORE
update on customers for EACH row
execute FUNCTION update_updated_at_column ();


create table public.login_attempts (
  id uuid not null default gen_random_uuid (),
  email character varying(255) not null,
  ip_address character varying(45) null,
  user_agent text null,
  attempts integer null default 0,
  is_blocked boolean null default false,
  blocked_until timestamp with time zone null,
  last_attempt timestamp with time zone null default now(),
  unlocked_by uuid null,
  unlocked_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint login_attempts_pkey primary key (id),
  constraint login_attempts_unlocked_by_fkey foreign KEY (unlocked_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_login_attempts_email on public.login_attempts using btree (email) TABLESPACE pg_default;

create index IF not exists idx_login_attempts_blocked on public.login_attempts using btree (is_blocked) TABLESPACE pg_default;

create index IF not exists idx_login_attempts_last_attempt on public.login_attempts using btree (last_attempt desc) TABLESPACE pg_default;

create trigger update_login_attempts_updated_at BEFORE
update on login_attempts for EACH row
execute FUNCTION update_updated_at_column ();

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  title character varying(255) not null,
  message text not null,
  type character varying(50) null default 'info'::character varying,
  read boolean null default false,
  read_at timestamp with time zone null,
  link text null,
  entity_id text null,
  entity_type character varying(100) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_read on public.notifications using btree (read) TABLESPACE pg_default;

create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_prevent_duplicate_notifications BEFORE INSERT on notifications for EACH row
execute FUNCTION prevent_duplicate_notifications ();

create trigger update_notifications_updated_at BEFORE
update on notifications for EACH row
execute FUNCTION update_updated_at_column ();

create table public.permissions (
  id serial not null,
  name character varying(100) not null,
  description text null,
  module character varying(50) null,
  created_at timestamp with time zone null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_name_key unique (name)
) TABLESPACE pg_default;


create table public.pix_charges (
  id bigserial not null,
  sale_id bigint null,
  txid text not null,
  qrcode text null,
  qrcode_text text null,
  amount numeric(10, 2) not null,
  status text null default 'pending'::text,
  expires_at timestamp with time zone null default (now() + '00:30:00'::interval),
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint pix_charges_pkey primary key (id),
  constraint pix_charges_txid_key unique (txid),
  constraint pix_charges_sale_id_fkey foreign KEY (sale_id) references sales (id)
) TABLESPACE pg_default;

create index IF not exists idx_pix_charges_txid on public.pix_charges using btree (txid) TABLESPACE pg_default;

create index IF not exists idx_pix_charges_sale_id on public.pix_charges using btree (sale_id) TABLESPACE pg_default;

create index IF not exists idx_pix_charges_status on public.pix_charges using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pix_charges_expires_at on public.pix_charges using btree (expires_at) TABLESPACE pg_default;


create table public.product_entries (
  id bigserial not null,
  product_id bigint not null,
  invoice_number character varying(50) not null,
  invoice_series character varying(10) null,
  supplier_name character varying(255) null,
  supplier_cnpj character varying(18) null,
  batch_number character varying(50) null,
  manufacture_date date null,
  expiration_date date null,
  quantity numeric(10, 2) not null,
  unit_cost numeric(10, 2) not null,
  total_cost numeric(10, 2) not null,
  entry_date date null default CURRENT_DATE,
  notes text null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  constraint product_entries_pkey primary key (id),
  constraint product_entries_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint product_entries_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_entries_product_id on public.product_entries using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_entries_invoice on public.product_entries using btree (invoice_number) TABLESPACE pg_default;

create trigger on_product_entry_insert
after INSERT on product_entries for EACH row
execute FUNCTION update_stock_on_entry ();

create trigger trg_validate_entry_dates BEFORE INSERT
or
update on product_entries for EACH row
execute FUNCTION validate_entry_dates ();

create table public.products (
  id bigserial not null,
  code character varying(50) null,
  name character varying(255) not null,
  description text null,
  category character varying(100) null,
  unit character varying(20) null default 'UN'::character varying,
  price numeric(10, 2) null default 0,
  cost_price numeric(10, 2) null default 0,
  stock_quantity numeric(10, 2) null default 0,
  reserved_quantity numeric(10, 2) null default 0,
  min_stock numeric(10, 2) null default 0,
  max_stock numeric(10, 2) null default 0,
  location character varying(100) null,
  brand character varying(100) null,
  weight numeric(10, 3) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_by uuid null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  constraint products_pkey primary key (id),
  constraint products_code_key unique (code),
  constraint products_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint products_deleted_by_fkey foreign KEY (deleted_by) references auth.users (id),
  constraint products_updated_by_fkey foreign KEY (updated_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_products_code on public.products using btree (code) TABLESPACE pg_default;

create index IF not exists idx_products_name on public.products using btree (name) TABLESPACE pg_default;

create index IF not exists idx_products_category on public.products using btree (category) TABLESPACE pg_default;

create index IF not exists idx_products_is_active on public.products using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_products_deleted on public.products using btree (deleted_at) TABLESPACE pg_default
where
  (deleted_at is not null);

create trigger audit_product_updates
after
update on products for EACH row
execute FUNCTION audit_product_changes ();

create trigger product_low_stock_notification
after
update on products for EACH row
execute FUNCTION notify_low_stock ();

create trigger trg_validate_product_changes BEFORE
update on products for EACH row
execute FUNCTION validate_stock_changes ();

create trigger update_products_timestamp BEFORE
update on products for EACH row
execute FUNCTION update_products_updated_at ();

create table public.profiles (
  id uuid not null,
  email text null,
  role text null default 'operador'::text,
  full_name text null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone text null,
  document text null,
  birth_date date null,
  address text null,
  city text null,
  state text null,
  zip_code text null,
  country text null default 'Brasil'::text,
  language text null default 'pt-BR'::text,
  timezone text null default 'America/Sao_Paulo'::text,
  notifications_enabled boolean null default true,
  dark_mode boolean null default false,
  last_login timestamp with time zone null,
  login_count integer null default 0,
  metadata jsonb null default '{}'::jsonb,
  display_name text null,
  status character varying(20) null default 'active'::character varying,
  registration_number character varying(20) null,
  sidebar_collapsed boolean null default false,
  table_density text null default 'comfortable'::text,
  theme_mode text null default 'manual'::text,
  constraint profiles_pkey primary key (id),
  constraint profiles_registration_number_key unique (registration_number),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id),
  constraint check_table_density check (
    (
      table_density = any (
        array[
          'compact'::text,
          'comfortable'::text,
          'spacious'::text
        ]
      )
    )
  ),
  constraint check_theme_mode check (
    (
      theme_mode = any (
        array['auto'::text, 'system'::text, 'manual'::text]
      )
    )
  ),
  constraint profiles_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'inactive'::character varying,
            'blocked'::character varying,
            'locked'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_id on public.profiles using btree (id) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_profiles_phone on public.profiles using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_profiles_document on public.profiles using btree (document) TABLESPACE pg_default;

create index IF not exists idx_profiles_city on public.profiles using btree (city) TABLESPACE pg_default;

create index IF not exists idx_profiles_state on public.profiles using btree (state) TABLESPACE pg_default;

create index IF not exists idx_profiles_status on public.profiles using btree (status) TABLESPACE pg_default;

create index IF not exists idx_profiles_registration on public.profiles using btree (registration_number) TABLESPACE pg_default;

create trigger on_profile_delete BEFORE DELETE on profiles for EACH row
execute FUNCTION handle_profile_delete ();

create trigger on_profile_update
after
update on profiles for EACH row when (old.* is distinct from new.*)
execute FUNCTION handle_profile_update ();

create trigger trigger_initialize_user_preferences BEFORE INSERT on profiles for EACH row
execute FUNCTION initialize_user_preferences ();

create trigger trigger_set_registration_number BEFORE INSERT on profiles for EACH row
execute FUNCTION set_registration_number ();

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();

create table public.rate_limits (
  id bigserial not null,
  user_id uuid null,
  action text not null,
  ip_address inet null,
  created_at timestamp with time zone null default now(),
  constraint rate_limits_pkey primary key (id),
  constraint rate_limits_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_user_action on public.rate_limits using btree (user_id, action, created_at) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_ip_action on public.rate_limits using btree (ip_address, action, created_at) TABLESPACE pg_default;

create table public.role_permissions (
  id serial not null,
  role_name character varying(50) not null,
  permission_id integer null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_name_permission_id_key unique (role_name, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.sale_items (
  id bigserial not null,
  sale_id bigint not null,
  product_id bigint not null,
  product_name character varying(255) not null,
  product_code character varying(50) null,
  quantity numeric(10, 2) not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone null default now(),
  constraint sale_items_pkey primary key (id),
  constraint sale_items_product_id_fkey foreign KEY (product_id) references products (id),
  constraint sale_items_sale_id_fkey foreign KEY (sale_id) references sales (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_sale_items_sale_id on public.sale_items using btree (sale_id) TABLESPACE pg_default;

create index IF not exists idx_sale_items_product_id on public.sale_items using btree (product_id) TABLESPACE pg_default;

create trigger on_sale_item_insert
after INSERT on sale_items for EACH row
execute FUNCTION update_stock_on_sale ();

create table public.sales (
  id bigserial not null,
  sale_number character varying(50) not null,
  customer_id bigint null,
  customer_name character varying(255) null,
  customer_phone character varying(20) null,
  total_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) null default 0,
  discount_percent numeric(5, 2) null default 0,
  coupon_code character varying(50) null,
  final_amount numeric(10, 2) not null default 0,
  payment_method character varying(50) null default 'cash'::character varying,
  payment_status character varying(20) null default 'pending'::character varying,
  status character varying(20) null default 'completed'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_at timestamp with time zone null default now(),
  cancelled_at timestamp without time zone null,
  cancelled_by uuid null,
  cancellation_reason text null,
  cancellation_notes text null,
  approved_by uuid null,
  constraint sales_pkey primary key (id),
  constraint sales_sale_number_key unique (sale_number),
  constraint sales_approved_by_fkey foreign KEY (approved_by) references auth.users (id),
  constraint sales_cancelled_by_fkey foreign KEY (cancelled_by) references auth.users (id),
  constraint sales_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint sales_customer_id_fkey foreign KEY (customer_id) references customers (id)
) TABLESPACE pg_default;

create index IF not exists idx_sales_sale_number on public.sales using btree (sale_number) TABLESPACE pg_default;

create index IF not exists idx_sales_customer_id on public.sales using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_sales_created_at on public.sales using btree (created_at) TABLESPACE pg_default;

create trigger new_sale_notification
after INSERT on sales for EACH row when (new.status::text = 'completed'::text)
execute FUNCTION notify_new_sale ();

create trigger on_sale_insert BEFORE INSERT on sales for EACH row
execute FUNCTION generate_sale_number ();

create trigger trg_update_rfv_on_sale
after INSERT
or
update OF status on sales for EACH row
execute FUNCTION update_customer_rfv_on_sale ();

create trigger trg_validate_sale_amounts BEFORE INSERT
or
update on sales for EACH row
execute FUNCTION validate_sale_amounts ();

create trigger update_customer_last_purchase_trigger
after INSERT
or
update on sales for EACH row
execute FUNCTION update_customer_last_purchase ();

create table public.stock_count_items (
  id uuid not null default gen_random_uuid (),
  count_session_id uuid not null,
  product_id bigint not null,
  system_quantity numeric(10, 2) not null default 0,
  system_cost numeric(10, 2) null default 0,
  counted_quantity numeric(10, 2) null,
  difference numeric(10, 2) null,
  status character varying(50) not null default 'pending'::character varying,
  notes text null,
  counted_by uuid null,
  counted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint stock_count_items_pkey primary key (id),
  constraint stock_count_items_count_session_id_product_id_key unique (count_session_id, product_id),
  constraint stock_count_items_count_session_id_fkey foreign KEY (count_session_id) references stock_count_sessions (id) on delete CASCADE,
  constraint stock_count_items_counted_by_fkey foreign KEY (counted_by) references auth.users (id),
  constraint stock_count_items_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_stock_count_items_session_id on public.stock_count_items using btree (count_session_id) TABLESPACE pg_default;

create index IF not exists idx_stock_count_items_product_id on public.stock_count_items using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_stock_count_items_status on public.stock_count_items using btree (status) TABLESPACE pg_default;

create trigger trg_calculate_item_difference BEFORE
update on stock_count_items for EACH row
execute FUNCTION calculate_item_difference ();

create trigger update_stock_count_items_updated_at BEFORE
update on stock_count_items for EACH row
execute FUNCTION update_updated_at_column ();

create table public.stock_count_sessions (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  description text null,
  location character varying(255) null,
  responsible character varying(255) not null,
  status character varying(50) not null default 'in_progress'::character varying,
  created_by uuid null,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  completed_by uuid null,
  cancelled_at timestamp with time zone null,
  cancelled_by uuid null,
  total_items integer null default 0,
  counted_items integer null default 0,
  diverged_items integer null default 0,
  adjustments jsonb null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint stock_count_sessions_pkey primary key (id),
  constraint stock_count_sessions_cancelled_by_fkey foreign KEY (cancelled_by) references auth.users (id),
  constraint stock_count_sessions_completed_by_fkey foreign KEY (completed_by) references auth.users (id),
  constraint stock_count_sessions_created_by_fkey foreign KEY (created_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_stock_count_sessions_status on public.stock_count_sessions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_stock_count_sessions_created_at on public.stock_count_sessions using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_validate_count_session_dates BEFORE INSERT
or
update on stock_count_sessions for EACH row
execute FUNCTION validate_count_session_dates ();

create trigger update_stock_count_sessions_updated_at BEFORE
update on stock_count_sessions for EACH row
execute FUNCTION update_updated_at_column ();

create table public.stock_movements (
  id bigserial not null,
  product_id bigint not null,
  movement_type character varying(20) not null,
  quantity numeric(10, 2) not null,
  quantity_before numeric(10, 2) not null,
  quantity_after numeric(10, 2) not null,
  reference_id uuid null,
  reference_type character varying(50) null,
  reason text null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  sale_id bigint null,
  constraint stock_movements_pkey primary key (id),
  constraint stock_movements_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint stock_movements_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_stock_movements_product_id on public.stock_movements using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_stock_movements_created_at on public.stock_movements using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_stock_movements_reference on public.stock_movements using btree (reference_type, reference_id) TABLESPACE pg_default;

create table public.system_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  user_email text null,
  user_role text null,
  action text not null,
  entity_type text null,
  entity_id text null,
  old_data jsonb null,
  new_data jsonb null,
  ip_address text null,
  user_agent text null,
  details jsonb null,
  created_at timestamp with time zone null default now(),
  constraint system_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_system_logs_user_id on public.system_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_system_logs_created_at on public.system_logs using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_system_logs_action on public.system_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_system_logs_entity_type on public.system_logs using btree (entity_type) TABLESPACE pg_default;

create index IF not exists idx_system_logs_user_action on public.system_logs using btree (user_id, action, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_system_logs_details_gin on public.system_logs using gin (details) TABLESPACE pg_default;

create table public.system_settings (
  id uuid not null default gen_random_uuid (),
  currency character varying(3) null default 'BRL'::character varying,
  date_format character varying(20) null default 'DD/MM/YYYY'::character varying,
  time_format character varying(10) null default '24h'::character varying,
  language character varying(10) null default 'pt-BR'::character varying,
  timezone character varying(50) null default 'America/Sao_Paulo'::character varying,
  updated_at timestamp with time zone null default now(),
  constraint system_settings_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_enforce_single_system_settings BEFORE INSERT on system_settings for EACH row
execute FUNCTION enforce_single_system_settings ();

create trigger update_system_settings_updated_at BEFORE
update on system_settings for EACH row
execute FUNCTION update_updated_at_column ();

-- ================================================
-- VIEW: unified_logs (Logs Unificados do Sistema)
-- ================================================

-- 1. Dropar a view existente (se necessário)
DROP VIEW IF EXISTS public.unified_logs;

-- 2. Criar a view
CREATE OR REPLACE VIEW public.unified_logs AS
SELECT 
  id,
  user_id,
  user_email,
  user_role,
  action,
  entity_type,
  entity_id,
  action_label,
  old_data,
  new_data,
  ip_address,
  user_agent,
  details,
  created_at,
  severity,
  component,
  original_source
FROM public.system_logs

UNION ALL

SELECT 
  id,
  user_id,
  user_email,
  user_role,
  action,
  entity_type,
  entity_id,
  action_label,
  old_data,
  new_data,
  ip_address,
  user_agent,
  details,
  created_at,
  severity,
  component,
  'access_logs' AS original_source
FROM public.access_logs;

-- 3. Comentário da view
COMMENT ON VIEW public.unified_logs IS 'View unificada que consolida logs de system_logs e access_logs';

-- 4. Tornar a view segura (respeita RLS das tabelas base)
ALTER VIEW public.unified_logs SET (security_invoker = true);


-- Criar a tabela access_logs
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  action_label TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  severity TEXT,
  component TEXT,
  original_source TEXT DEFAULT 'access_logs'
);

-- Habilitar RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para access_logs
CREATE POLICY "Usuários veem seus próprios access logs" 
ON public.access_logs FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins veem todos access logs" 
ON public.access_logs FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sistema pode inserir access logs" 
ON public.access_logs FOR INSERT TO authenticated 
WITH CHECK (true);

create table public.goals (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  goal_type text not null,
  target_amount numeric(10, 2) not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_by uuid null,
  constraint goals_pkey primary key (id),
  constraint goals_user_id_goal_type_key unique (user_id, goal_type),
  constraint goals_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint goals_updated_by_fkey foreign KEY (updated_by) references auth.users (id),
  constraint goals_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint goals_goal_type_check check (
    (
      goal_type = any (
        array['daily'::text, 'monthly'::text, 'yearly'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_goals_user_id on public.goals using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_goals_type on public.goals using btree (goal_type) TABLESPACE pg_default;

create trigger trigger_update_goals_updated_at BEFORE
update on goals for EACH row
execute FUNCTION update_goals_updated_at ();

create table public.tasks (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  type text not null,
  priority text null default 'medium'::text,
  status text null default 'pending'::text,
  assigned_to uuid[] null,
  assigned_to_name text null,
  created_by uuid null,
  created_by_name text null,
  due_date date null,
  completed_at timestamp with time zone null,
  completed_by uuid null,
  category text null default 'geral'::text,
  tags text[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  assigned_to_names text[] null,
  priority_order integer null default 2,
  visibility text null default 'assigned'::text,
  assigned_by uuid null,
  assigned_by_name text null,
  constraint tasks_pkey primary key (id),
  constraint tasks_assigned_by_fkey foreign KEY (assigned_by) references auth.users (id),
  constraint tasks_priority_check check (
    (
      priority = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'urgent'::text
        ]
      )
    )
  ),
  constraint tasks_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in_progress'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint tasks_type_check check (
    (
      type = any (array['personal'::text, 'team'::text])
    )
  ),
  constraint tasks_visibility_check check (
    (
      visibility = any (
        array['assigned'::text, 'team'::text, 'all'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tasks_type on public.tasks using btree (type, status) TABLESPACE pg_default;

create index IF not exists idx_tasks_created_by on public.tasks using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_tasks_assigned_to on public.tasks using btree (assigned_to, status, due_date) TABLESPACE pg_default;

create trigger task_assignment_trigger
after
update on tasks for EACH row
execute FUNCTION log_task_assignment ();

create trigger task_status_trigger
after
update on tasks for EACH row
execute FUNCTION log_task_status_change ();

create table public.task_status_history (
  id uuid not null default gen_random_uuid (),
  task_id uuid null,
  changed_by uuid null,
  changed_by_name text null,
  old_status text null,
  new_status text null,
  created_at timestamp with time zone null default now(),
  constraint task_status_history_pkey primary key (id),
  constraint task_status_history_changed_by_fkey foreign KEY (changed_by) references auth.users (id),
  constraint task_status_history_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.task_comments (
  id uuid not null default gen_random_uuid (),
  task_id uuid null,
  user_id uuid null,
  user_name text null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint task_comments_pkey primary key (id),
  constraint task_comments_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint task_comments_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.task_assignment_history (
  id uuid not null default gen_random_uuid (),
  task_id uuid null,
  assigned_by uuid null,
  assigned_by_name text null,
  assigned_to uuid null,
  assigned_to_name text null,
  action text null,
  created_at timestamp with time zone null default now(),
  constraint task_assignment_history_pkey primary key (id),
  constraint task_assignment_history_assigned_by_fkey foreign KEY (assigned_by) references auth.users (id),
  constraint task_assignment_history_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint task_assignment_history_action_check check (
    (
      action = any (
        array[
          'assigned'::text,
          'unassigned'::text,
          'claimed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_task_assignment_history_task_id on public.task_assignment_history using btree (task_id, created_at desc) TABLESPACE pg_default;

create table public.commissions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  sale_id bigint null,
  amount numeric(10, 2) not null,
  percentage numeric(5, 2) not null,
  period text not null,
  status text null default 'pending'::text,
  paid_at timestamp with time zone null,
  paid_by uuid null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint commissions_pkey primary key (id),
  constraint commissions_paid_by_fkey foreign KEY (paid_by) references auth.users (id),
  constraint commissions_sale_id_fkey foreign KEY (sale_id) references sales (id) on delete CASCADE,
  constraint commissions_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint commissions_period_check check (
    (
      (period ~ '^\d{4}-\d{2}$'::text)
      or (
        period = any (
          array['daily'::text, 'monthly'::text, 'yearly'::text]
        )
      )
    )
  ),
  constraint commissions_status_check check (
    (
      status = any (
        array['pending'::text, 'paid'::text, 'cancelled'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_commissions_user_id on public.commissions using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_commissions_status on public.commissions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_commissions_period on public.commissions using btree (period) TABLESPACE pg_default;

create table public.commission_rules (
  id uuid not null default gen_random_uuid (),
  name text not null,
  percentage numeric(5, 2) not null,
  min_sales numeric(10, 2) null default 0,
  max_sales numeric(10, 2) null default null::numeric,
  applies_to text[] null default array['all'::text],
  is_active boolean null default true,
  priority integer null default 1,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  description text null,
  rule_type text null default 'percentage'::text,
  constraint commission_rules_pkey primary key (id),
  constraint commission_rules_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint commission_rules_percentage_check check (
    (
      (percentage >= (0)::numeric)
      and (percentage <= (100)::numeric)
    )
  ),
  constraint commission_rules_rule_type_check check (
    (
      rule_type = any (array['percentage'::text, 'fixed'::text])
    )
  )
) TABLESPACE pg_default;
