SELECT 
  jsonb_build_object(
    'trigger_definition',
    'CREATE TRIGGER ' || 
    trigger_name || 
    E'\n   ' || 
    action_timing || 
    ' ON ' || 
    event_object_schema || '.' || event_object_table || 
    E'\n   FOR EACH ' || 
    action_orientation || 
    E'\n   EXECUTE FUNCTION ' || 
    action_statement
  ) as trigger_info
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

[
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trigger_update_budget_updated_at\n   BEFORE ON public.budgets\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_budget_updated_at()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_cashier_closing_updated_at\n   BEFORE ON public.cashier_closing\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_company_settings_updated_at\n   BEFORE ON public.company_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_coupons_updated_at\n   BEFORE ON public.coupons\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_coupons_updated_at()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_customer_communications_updated_at\n   BEFORE ON public.customer_communications\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_prevent_update_deleted_customer\n   BEFORE ON public.customers\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION prevent_update_deleted_customer()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_customers_updated_at\n   BEFORE ON public.customers\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trigger_update_goals_updated_at\n   BEFORE ON public.goals\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_goals_updated_at()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_login_attempts_updated_at\n   BEFORE ON public.login_attempts\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_prevent_duplicate_notifications\n   BEFORE ON public.notifications\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION prevent_duplicate_notifications()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_notifications_updated_at\n   BEFORE ON public.notifications\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER on_product_entry_insert\n   AFTER ON public.product_entries\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_stock_on_entry()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_entry_dates\n   BEFORE ON public.product_entries\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_entry_dates()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_entry_dates\n   BEFORE ON public.product_entries\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_entry_dates()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER audit_product_updates\n   AFTER ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION audit_product_changes()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER product_low_stock_notification\n   AFTER ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION notify_low_stock()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_product_changes\n   BEFORE ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_stock_changes()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_products_timestamp\n   BEFORE ON public.products\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_products_updated_at()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER on_profile_delete\n   BEFORE ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION handle_profile_delete()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER on_profile_update\n   AFTER ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION handle_profile_update()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trigger_initialize_user_preferences\n   BEFORE ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION initialize_user_preferences()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trigger_set_registration_number\n   BEFORE ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION set_registration_number()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_profiles_updated_at\n   BEFORE ON public.profiles\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER on_sale_item_insert\n   AFTER ON public.sale_items\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_stock_on_sale()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER new_sale_notification\n   AFTER ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION notify_new_sale()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER on_sale_insert\n   BEFORE ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION generate_sale_number()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_update_rfv_on_sale\n   AFTER ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_customer_rfv_on_sale()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_update_rfv_on_sale\n   AFTER ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_customer_rfv_on_sale()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_sale_amounts\n   BEFORE ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_sale_amounts()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_sale_amounts\n   BEFORE ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_sale_amounts()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_customer_last_purchase_trigger\n   AFTER ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_customer_last_purchase()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_customer_last_purchase_trigger\n   AFTER ON public.sales\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_customer_last_purchase()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_calculate_item_difference\n   BEFORE ON public.stock_count_items\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION calculate_item_difference()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_stock_count_items_updated_at\n   BEFORE ON public.stock_count_items\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_count_session_dates\n   BEFORE ON public.stock_count_sessions\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_count_session_dates()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_validate_count_session_dates\n   BEFORE ON public.stock_count_sessions\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION validate_count_session_dates()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_stock_count_sessions_updated_at\n   BEFORE ON public.stock_count_sessions\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER trg_enforce_single_system_settings\n   BEFORE ON public.system_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION enforce_single_system_settings()"
    }
  },
  {
    "trigger_info": {
      "trigger_definition": "CREATE TRIGGER update_system_settings_updated_at\n   BEFORE ON public.system_settings\n   FOR EACH ROW\n   EXECUTE FUNCTION EXECUTE FUNCTION update_updated_at_column()"
    }
  }
]