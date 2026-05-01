-- RLS (Row Level Security) Policies for CRM-PDV
-- Enable RLS on all tables and create appropriate policies

-- =============================================
-- HELPER FUNCTION FOR ROLE CHECKS
-- =============================================

create or replace function public.get_current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable set search_path = '';

-- =============================================
-- COMPANIES
-- =============================================
alter table public.companies enable row level security;

create policy "Allow authenticated read access" on public.companies
  for select to authenticated using (true);

create policy "Allow admin full access" on public.companies
  for all to authenticated
  using (public.get_current_user_role() = 'admin')
  with check (public.get_current_user_role() = 'admin');

-- =============================================
-- COMPANY SETTINGS
-- =============================================
alter table public.company_settings enable row level security;

create policy "Allow public read access" on public.company_settings
  for select to anon, authenticated using (true);

create policy "Allow admin full access" on public.company_settings
  for all to authenticated
  using (public.get_current_user_role() = 'admin')
  with check (public.get_current_user_role() = 'admin');

-- =============================================
-- CUSTOMERS
-- =============================================
alter table public.customers enable row level security;

create policy "Allow authenticated read access" on public.customers
  for select to authenticated using (true);

create policy "Allow authenticated insert" on public.customers
  for insert to authenticated with check (true);

create policy "Allow authenticated update" on public.customers
  for update to authenticated
  using (deleted_at is null)
  with check (deleted_at is null);

create policy "Allow admin delete" on public.customers
  for delete to authenticated
  using (public.get_current_user_role() = 'admin');

-- =============================================
-- PRODUCTS
-- =============================================
alter table public.products enable row level security;

create policy "Allow authenticated read access" on public.products
  for select to authenticated using (true);

create policy "Allow gerente and admin insert" on public.products
  for insert to authenticated
  with check (public.get_current_user_role() in ('admin', 'gerente'));

create policy "Allow gerente and admin update" on public.products
  for update to authenticated
  using (public.get_current_user_role() in ('admin', 'gerente') and deleted_at is null)
  with check (public.get_current_user_role() in ('admin', 'gerente'));

create policy "Allow admin delete" on public.products
  for delete to authenticated
  using (public.get_current_user_role() = 'admin');

-- =============================================
-- SALES
-- =============================================
alter table public.sales enable row level security;

create policy "Allow authenticated read access" on public.sales
  for select to authenticated using (true);

create policy "Allow authenticated insert" on public.sales
  for insert to authenticated with check (created_by = auth.uid());

create policy "Allow owner or admin update" on public.sales
  for update to authenticated
  using (created_by = auth.uid() or public.get_current_user_role() = 'admin')
  with check (created_by = auth.uid() or public.get_current_user_role() = 'admin');

create policy "Allow admin delete" on public.sales
  for delete to authenticated
  using (public.get_current_user_role() = 'admin');

-- =============================================
-- SALE ITEMS
-- =============================================
alter table public.sale_items enable row level security;

create policy "Allow authenticated read access" on public.sale_items
  for select to authenticated 
  using (exists (select 1 from public.sales where id = sale_id));

create policy "Allow sale owner insert" on public.sale_items
  for insert to authenticated
  with check (exists (select 1 from public.sales where id = sale_id and created_by = auth.uid()));

-- =============================================
-- BUDGETS
-- =============================================
alter table public.budgets enable row level security;

create policy "Allow authenticated read access" on public.budgets
  for select to authenticated using (true);

create policy "Allow authenticated insert" on public.budgets
  for insert to authenticated with check (created_by = auth.uid());

create policy "Allow owner or admin update" on public.budgets
  for update to authenticated
  using (created_by = auth.uid() or public.get_current_user_role() = 'admin')
  with check (created_by = auth.uid() or public.get_current_user_role() = 'admin');

-- =============================================
-- COUPONS
-- =============================================
alter table public.coupons enable row level security;

create policy "Allow authenticated read access" on public.coupons
  for select to authenticated using (true);

create policy "Allow admin manage coupons" on public.coupons
  for all to authenticated
  using (public.get_current_user_role() = 'admin')
  with check (public.get_current_user_role() = 'admin');

-- =============================================
-- NOTIFICATIONS
-- =============================================
alter table public.notifications enable row level security;

create policy "Users see own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "Users update own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "System can insert notifications" on public.notifications
  for insert to authenticated with check (true);

-- =============================================
-- PROFILES
-- =============================================
alter table public.profiles enable row level security;

create policy "Users see own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin see all profiles" on public.profiles
  for select to authenticated
  using (public.get_current_user_role() = 'admin');

-- =============================================
-- TASKS
-- =============================================
alter table public.tasks enable row level security;

create policy "Users see own or assigned tasks" on public.tasks
  for select to authenticated
  using (
    created_by = auth.uid() or 
    auth.uid() = any(assigned_to) or
    public.get_current_user_role() in ('admin', 'gerente')
  );

create policy "Users create tasks" on public.tasks
  for insert to authenticated
  with check (created_by = auth.uid());

create policy "Creator or admin update" on public.tasks
  for update to authenticated
  using (
    created_by = auth.uid() or 
    public.get_current_user_role() in ('admin', 'gerente')
  )
  with check (
    created_by = auth.uid() or 
    public.get_current_user_role() in ('admin', 'gerente')
  );

-- =============================================
-- GOALS
-- =============================================
alter table public.goals enable row level security;

create policy "Users see own goals" on public.goals
  for select to authenticated
  using (user_id = auth.uid() or public.get_current_user_role() = 'admin');

create policy "Users create own goals" on public.goals
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users update own goals" on public.goals
  for update to authenticated
  using (user_id = auth.uid() or public.get_current_user_role() = 'admin')
  with check (user_id = auth.uid() or public.get_current_user_role() = 'admin');

-- =============================================
-- CASHIER CLOSING
-- =============================================
alter table public.cashier_closing enable row level security;

create policy "Allow authenticated read" on public.cashier_closing
  for select to authenticated using (true);

create policy "Allow authenticated insert" on public.cashier_closing
  for insert to authenticated with check (closed_by = auth.uid());

create policy "Allow admin update" on public.cashier_closing
  for update to authenticated
  using (public.get_current_user_role() = 'admin');

-- =============================================
-- STOCK COUNT SESSIONS
-- =============================================
alter table public.stock_count_sessions enable row level security;

create policy "Allow authenticated read" on public.stock_count_sessions
  for select to authenticated using (true);

create policy "Allow gerente and admin manage" on public.stock_count_sessions
  for all to authenticated
  using (public.get_current_user_role() in ('admin', 'gerente'))
  with check (public.get_current_user_role() in ('admin', 'gerente'));

-- =============================================
-- SYSTEM LOGS
-- =============================================
alter table public.system_logs enable row level security;

create policy "Admin see all logs" on public.system_logs
  for select to authenticated
  using (public.get_current_user_role() = 'admin');

create policy "System can insert logs" on public.system_logs
  for insert to authenticated with check (true);

-- =============================================
-- COMMISSIONS
-- =============================================
alter table public.commissions enable row level security;

create policy "Users see own commissions" on public.commissions
  for select to authenticated
  using (user_id = auth.uid() or public.get_current_user_role() = 'admin');

create policy "Users update own commissions" on public.commissions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Allow insert commissions" on public.commissions
  for insert to authenticated
  with check (true);

create policy "Admin manage all commissions" on public.commissions
  for all to authenticated
  using (public.get_current_user_role() = 'admin')
  with check (public.get_current_user_role() = 'admin');
