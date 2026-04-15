[
  {
    "trigger_definition": "CREATE TRIGGER tr_check_filters\n   23 ON public.subscription\n   FOR EACH ROW\n   EXECUTE FUNCTION subscription_check_filters();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_objects_updated_at\n   19 ON public.objects\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER enforce_bucket_name_length_trigger\n   23 ON public.buckets\n   FOR EACH ROW\n   EXECUTE FUNCTION enforce_bucket_name_length();"
  },
  {
    "trigger_definition": "CREATE TRIGGER protect_buckets_delete\n   10 ON public.buckets\n   FOR EACH STATEMENT\n   EXECUTE FUNCTION protect_delete();"
  },
  {
    "trigger_definition": "CREATE TRIGGER protect_objects_delete\n   10 ON public.objects\n   FOR EACH STATEMENT\n   EXECUTE FUNCTION protect_delete();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_company_settings_updated_at\n   19 ON public.company_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_auth_user_created\n   5 ON public.users\n   FOR EACH ROW\n   EXECUTE FUNCTION handle_new_user();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_profiles_updated_at\n   19 ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_profile_update\n   17 ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION handle_profile_update();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_profile_delete\n   11 ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION handle_profile_delete();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_notifications_updated_at\n   19 ON public.notifications\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_system_settings_updated_at\n   19 ON public.system_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_customers_updated_at\n   19 ON public.customers\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_products_timestamp\n   19 ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION update_products_updated_at();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_stock_count_sessions_updated_at\n   19 ON public.stock_count_sessions\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_stock_count_items_updated_at\n   19 ON public.stock_count_items\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_sale_insert\n   7 ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION generate_sale_number();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_product_entry_insert\n   5 ON public.product_entries\n   FOR EACH ROW\n   EXECUTE FUNCTION update_stock_on_entry();"
  },
  {
    "trigger_definition": "CREATE TRIGGER on_sale_item_insert\n   5 ON public.sale_items\n   FOR EACH ROW\n   EXECUTE FUNCTION update_stock_on_sale();"
  },
  {
    "trigger_definition": "CREATE TRIGGER product_low_stock_notification\n   17 ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION notify_low_stock();"
  },
  {
    "trigger_definition": "CREATE TRIGGER new_sale_notification\n   5 ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION notify_new_sale();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_coupons_updated_at\n   19 ON public.coupons\n   FOR EACH ROW\n   EXECUTE FUNCTION update_coupons_updated_at();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_customer_communications_updated_at\n   19 ON public.customer_communications\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_cashier_closing_updated_at\n   19 ON public.cashier_closing\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_customer_last_purchase_trigger\n   21 ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION update_customer_last_purchase();"
  },
  {
    "trigger_definition": "CREATE TRIGGER update_login_attempts_updated_at\n   19 ON public.login_attempts\n   FOR EACH ROW\n   EXECUTE FUNCTION update_updated_at_column();"
  },
  {
    "trigger_definition": "CREATE TRIGGER audit_product_updates\n   17 ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION audit_product_changes();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trigger_update_budget_updated_at\n   19 ON public.budgets\n   FOR EACH ROW\n   EXECUTE FUNCTION update_budget_updated_at();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trigger_set_registration_number\n   7 ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION set_registration_number();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_prevent_update_deleted_customer\n   19 ON public.customers\n   FOR EACH ROW\n   EXECUTE FUNCTION prevent_update_deleted_customer();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_prevent_duplicate_notifications\n   7 ON public.notifications\n   FOR EACH ROW\n   EXECUTE FUNCTION prevent_duplicate_notifications();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_validate_entry_dates\n   23 ON public.product_entries\n   FOR EACH ROW\n   EXECUTE FUNCTION validate_entry_dates();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_validate_product_changes\n   19 ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION validate_stock_changes();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_validate_sale_amounts\n   23 ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION validate_sale_amounts();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_calculate_item_difference\n   19 ON public.stock_count_items\n   FOR EACH ROW\n   EXECUTE FUNCTION calculate_item_difference();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_validate_count_session_dates\n   23 ON public.stock_count_sessions\n   FOR EACH ROW\n   EXECUTE FUNCTION validate_count_session_dates();"
  },
  {
    "trigger_definition": "CREATE TRIGGER trg_enforce_single_system_settings\n   7 ON public.system_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION enforce_single_system_settings();"
  }
]