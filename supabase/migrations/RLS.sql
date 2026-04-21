SELECT 
  jsonb_agg(
    jsonb_build_object(
      'Tabela', tablename,
      'Política', policyname,
      'Comando', cmd,
      'Roles', roles,
      'USING', qual,
      'WITH_CHECK', with_check
    )
    ORDER BY tablename, policyname
  ) AS policies_json
FROM pg_policies
WHERE schemaname = 'public';

[
  {
    "policies_json": [
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "budget_items",
        "Comando": "INSERT",
        "Política": "Usuários autenticados podem criar itens de orçamento",
        "WITH_CHECK": "(budget_id IN ( SELECT budgets.id\n   FROM budgets\n  WHERE (budgets.created_by = auth.uid())))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "budget_items",
        "Comando": "SELECT",
        "Política": "Usuários autenticados podem ver itens de orçamento",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((auth.uid() = created_by) OR (auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.role = ANY (ARRAY['admin'::text, 'gerente'::text])))))",
        "Tabela": "budgets",
        "Comando": "UPDATE",
        "Política": "Usuários autenticados podem atualizar orçamentos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "budgets",
        "Comando": "INSERT",
        "Política": "Usuários autenticados podem criar orçamentos",
        "WITH_CHECK": "(auth.uid() = created_by)"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "budgets",
        "Comando": "SELECT",
        "Política": "Usuários autenticados podem ver orçamentos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": null,
        "Tabela": "cashier_closing",
        "Comando": "INSERT",
        "Política": "Usuários autenticados podem criar fechamentos",
        "WITH_CHECK": "(auth.role() = 'authenticated'::text)"
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(auth.role() = 'authenticated'::text)",
        "Tabela": "cashier_closing",
        "Comando": "SELECT",
        "Política": "Usuários autenticados podem ver fechamentos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "companies",
        "Comando": "ALL",
        "Política": "Anon não pode modificar empresa",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "((status)::text = 'active'::text)",
        "Tabela": "companies",
        "Comando": "SELECT",
        "Política": "Anon pode ver empresa",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "companies",
        "Comando": "INSERT",
        "Política": "Apenas admins podem criar empresa",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "companies",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem editar empresa",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "companies",
        "Comando": "DELETE",
        "Política": "Apenas service_role pode deletar empresas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "companies",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar empresa",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "companies",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "companies",
        "Comando": "ALL",
        "Política": "Service role tem acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "anon",
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "companies",
        "Comando": "SELECT",
        "Política": "Todos podem ver empresas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "companies",
        "Comando": "UPDATE",
        "Política": "Usuários autenticados podem atualizar empresas",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "companies",
        "Comando": "INSERT",
        "Política": "Usuários autenticados podem criar empresas",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "companies",
        "Comando": "SELECT",
        "Política": "Usuários podem ver dados da empresa",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "company_settings",
        "Comando": "ALL",
        "Política": "Anon não pode modificar configurações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "true",
        "Tabela": "company_settings",
        "Comando": "SELECT",
        "Política": "Anon pode ver configurações públicas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "company_settings",
        "Comando": "INSERT",
        "Política": "Apenas admins podem criar configuração",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "company_settings",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem editar configurações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "company_settings",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar configuração",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "company_settings",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": null,
        "Tabela": "company_settings",
        "Comando": "INSERT",
        "Política": "Service role pode criar configuração inicial",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "company_settings",
        "Comando": "SELECT",
        "Política": "Usuários podem ver configurações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "coupon_allowed_customers",
        "Comando": "ALL",
        "Política": "Admins e gerentes podem gerenciar associações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "coupon_allowed_customers",
        "Comando": "ALL",
        "Política": "Anon não pode acessar cupons permitidos",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "coupon_allowed_customers",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar associações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "coupon_allowed_customers",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "coupon_allowed_customers",
        "Comando": "SELECT",
        "Política": "Todos autenticados podem ver associações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "coupons",
        "Comando": "UPDATE",
        "Política": "Admins e gerentes podem atualizar cupons",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "coupons",
        "Comando": "INSERT",
        "Política": "Admins e gerentes podem criar cupons",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "coupons",
        "Comando": "DELETE",
        "Política": "Admins podem deletar cupons",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "coupons",
        "Comando": "ALL",
        "Política": "Anon não pode modificar cupons",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "((is_active = true) AND (deleted_at IS NULL))",
        "Tabela": "coupons",
        "Comando": "SELECT",
        "Política": "Anon pode ver cupons ativos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "coupons",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "coupons",
        "Comando": "SELECT",
        "Política": "Todos autenticados podem ver cupons",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "coupons",
        "Comando": "INSERT",
        "Política": "Validar limite de uso ao criar",
        "WITH_CHECK": "(((usage_limit IS NULL) OR (usage_limit > 0)) AND ((max_discount IS NULL) OR (max_discount >= (0)::numeric)) AND ((min_purchase IS NULL) OR (min_purchase >= (0)::numeric)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "customer_communications",
        "Comando": "UPDATE",
        "Política": "Admins e gerentes podem atualizar comunicações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "customer_communications",
        "Comando": "ALL",
        "Política": "Anon não pode acessar comunicações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "customer_communications",
        "Comando": "INSERT",
        "Política": "Auto preencher sent_by",
        "WITH_CHECK": "((sent_by = auth.uid()) OR (sent_by IS NULL))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "customer_communications",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar comunicações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = 'sent'::text) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))))",
        "Tabela": "customer_communications",
        "Comando": "SELECT",
        "Política": "Operadores veem apenas comunicações enviadas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((sent_by = auth.uid()) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[])))",
        "Tabela": "customer_communications",
        "Comando": "UPDATE",
        "Política": "Remetente pode atualizar status da sua comunicação",
        "WITH_CHECK": "((sent_by = auth.uid()) AND ((status)::text = ANY ((ARRAY['sent'::character varying, 'failed'::character varying])::text[])))"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "customer_communications",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "customer_communications",
        "Comando": "INSERT",
        "Política": "Usuários podem registrar comunicações",
        "WITH_CHECK": "(((channel)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying, 'whatsapp'::character varying, 'phone'::character varying, 'push'::character varying, 'internal'::character varying])::text[])) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "customer_communications",
        "Comando": "SELECT",
        "Política": "Usuários podem ver comunicações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "customer_coupons",
        "Comando": "ALL",
        "Política": "Anon não pode acessar histórico de cupons",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "customer_coupons",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar registro de uso",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "customer_coupons",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar histórico de cupons",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "customer_coupons",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "customer_coupons",
        "Comando": "INSERT",
        "Política": "Usuários podem registrar uso de cupons",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM coupons c\n  WHERE ((c.id = customer_coupons.coupon_id) AND (c.deleted_at IS NULL) AND (c.is_active = true) AND ((c.valid_from IS NULL) OR (c.valid_from <= now())) AND ((c.valid_to IS NULL) OR (c.valid_to >= now())) AND ((c.usage_limit IS NULL) OR (c.used_count < c.usage_limit))))) AND (EXISTS ( SELECT 1\n   FROM customers cust\n  WHERE (cust.id = customer_coupons.customer_id))) AND ((sale_id IS NULL) OR (EXISTS ( SELECT 1\n   FROM sales s\n  WHERE (s.id = customer_coupons.sale_id)))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "customer_coupons",
        "Comando": "SELECT",
        "Política": "Usuários podem ver uso de cupons",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "customers",
        "Comando": "SELECT",
        "Política": "Admins e gerentes podem ver todos os clientes",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "customers",
        "Comando": "ALL",
        "Política": "Anon não pode acessar clientes",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "((deleted_at IS NULL) AND ((status)::text = 'active'::text))",
        "Tabela": "customers",
        "Comando": "SELECT",
        "Política": "Anon pode verificar se email existe",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(deleted_at IS NULL)",
        "Tabela": "customers",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem inativar clientes",
        "WITH_CHECK": "\nCASE\n    WHEN ((status)::text = 'inactive'::text) THEN (EXISTS ( SELECT 1\n       FROM profiles\n      WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))\n    ELSE true\nEND"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "customers",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar clientes fisicamente",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "true",
        "Tabela": "customers",
        "Comando": "SELECT",
        "Política": "Permitir select para todos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "customers",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((deleted_at IS NULL) AND ((status)::text = 'active'::text))",
        "Tabela": "customers",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar clientes ativos",
        "WITH_CHECK": "((deleted_at IS NULL) AND ((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "customers",
        "Comando": "INSERT",
        "Política": "Usuários podem cadastrar clientes",
        "WITH_CHECK": "((deleted_at IS NULL) AND (email IS NOT NULL) AND (name IS NOT NULL))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((deleted_at IS NULL) AND ((status)::text = 'active'::text))",
        "Tabela": "customers",
        "Comando": "SELECT",
        "Política": "Usuários podem ver clientes ativos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "goals",
        "Comando": "DELETE",
        "Política": "enable_delete_for_admins",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "goals",
        "Comando": "INSERT",
        "Política": "enable_insert_for_admins_managers",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'gerente'::text])))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "goals",
        "Comando": "SELECT",
        "Política": "enable_select_for_authenticated",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'gerente'::text])))))",
        "Tabela": "goals",
        "Comando": "UPDATE",
        "Política": "enable_update_for_admins_managers",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'gerente'::text])))))"
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "login_attempts",
        "Comando": "UPDATE",
        "Política": "Admin pode atualizar tentativas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "login_attempts",
        "Comando": "SELECT",
        "Política": "Admin pode ver tentativas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": null,
        "Tabela": "login_attempts",
        "Comando": "INSERT",
        "Política": "Sistema pode inserir tentativas",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "notifications",
        "Comando": "SELECT",
        "Política": "Admins e gerentes podem ver todas notificações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "notifications",
        "Comando": "DELETE",
        "Política": "Admins podem deletar qualquer notificação",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "notifications",
        "Comando": "UPDATE",
        "Política": "Admins podem gerenciar todas notificações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "notifications",
        "Comando": "ALL",
        "Política": "Anon não pode acessar notificações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "notifications",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "notifications",
        "Comando": "INSERT",
        "Política": "Sistema pode criar notificações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((user_id = auth.uid()) AND (read = true))",
        "Tabela": "notifications",
        "Comando": "DELETE",
        "Política": "Usuário pode deletar suas notificações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((user_id = auth.uid()) AND (read = false))",
        "Tabela": "notifications",
        "Comando": "UPDATE",
        "Política": "Usuário pode marcar suas notificações como lidas",
        "WITH_CHECK": "((user_id = auth.uid()) AND (read = true) AND (read_at IS NOT NULL))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(user_id = auth.uid())",
        "Tabela": "notifications",
        "Comando": "SELECT",
        "Política": "Usuário vê apenas suas notificações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "permissions",
        "Comando": "ALL",
        "Política": "Anon não pode modificar permissões",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "true",
        "Tabela": "permissions",
        "Comando": "SELECT",
        "Política": "Anon pode ver catálogo de permissões",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "permissions",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar permissões",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "permissions",
        "Comando": "INSERT",
        "Política": "Apenas admins podem criar permissões",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "permissions",
        "Comando": "DELETE",
        "Política": "Apenas admins podem deletar permissões",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "permissions",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "permissions",
        "Comando": "SELECT",
        "Política": "Usuários podem ver catálogo de permissões",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "true",
        "Tabela": "pix_charges",
        "Comando": "SELECT",
        "Política": "Anon pode ver status de cobrança",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "pix_charges",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar cobranças PIX",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "pix_charges",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "pix_charges",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar cobranças PIX",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "pix_charges",
        "Comando": "INSERT",
        "Política": "Usuários podem criar cobranças PIX",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "pix_charges",
        "Comando": "SELECT",
        "Política": "Usuários podem ver cobranças PIX",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "product_entries",
        "Comando": "ALL",
        "Política": "Anon não pode acessar entradas",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))",
        "Tabela": "product_entries",
        "Comando": "SELECT",
        "Política": "Apenas admins e gerentes veem custos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "product_entries",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar entradas",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "product_entries",
        "Comando": "INSERT",
        "Política": "Auto preencher created_by",
        "WITH_CHECK": "((created_by = auth.uid()) OR (created_by IS NULL))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "product_entries",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar entradas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "product_entries",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "product_entries",
        "Comando": "INSERT",
        "Política": "Usuários com permissão podem registrar entradas",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('products.manage_stock'::text))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "product_entries",
        "Comando": "SELECT",
        "Política": "Usuários podem ver entradas de produtos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "product_entries",
        "Comando": "INSERT",
        "Política": "Validar dados da entrada",
        "WITH_CHECK": "((quantity > (0)::numeric) AND (unit_cost >= (0)::numeric) AND (total_cost = (quantity * unit_cost)) AND (invoice_number IS NOT NULL) AND ((invoice_number)::text <> ''::text) AND ((expiration_date IS NULL) OR (expiration_date > manufacture_date)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR (deleted_at IS NULL))",
        "Tabela": "products",
        "Comando": "SELECT",
        "Política": "Admins e gerentes podem ver todos os produtos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon",
          "authenticated"
        ],
        "USING": "((deleted_at IS NULL) AND (is_active = true))",
        "Tabela": "products",
        "Comando": "SELECT",
        "Política": "Todos podem ver produtos ativos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('products.update'::text))",
        "Tabela": "products",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar produtos",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('products.update'::text))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "products",
        "Comando": "INSERT",
        "Política": "Usuários podem inserir produtos",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('products.create'::text))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text))))",
        "Tabela": "profiles",
        "Comando": "UPDATE",
        "Política": "Admins atualizam qualquer perfil",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "profiles",
        "Comando": "INSERT",
        "Política": "Apenas admins criam perfis",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "profiles",
        "Comando": "DELETE",
        "Política": "Ninguém deleta perfis",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "profiles",
        "Comando": "ALL",
        "Política": "Service role acesso total profiles",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(auth.uid() = id)",
        "Tabela": "profiles",
        "Comando": "UPDATE",
        "Política": "Users can update own preferences",
        "WITH_CHECK": "(auth.uid() = id)"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(id = auth.uid())",
        "Tabela": "profiles",
        "Comando": "UPDATE",
        "Política": "Usuário atualiza seu perfil",
        "WITH_CHECK": "(id = auth.uid())"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(id = auth.uid())",
        "Tabela": "profiles",
        "Comando": "SELECT",
        "Política": "Usuário vê seu próprio perfil",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "profiles",
        "Comando": "SELECT",
        "Política": "Usuários veem todos os perfis",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(is_admin() OR (auth.uid() = id))",
        "Tabela": "profiles",
        "Comando": "SELECT",
        "Política": "admin_can_view_all_documents",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(auth.uid() = id)",
        "Tabela": "profiles",
        "Comando": "UPDATE",
        "Política": "users_can_update_own_profile",
        "WITH_CHECK": "(auth.uid() = id)"
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "(auth.uid() = id)",
        "Tabela": "profiles",
        "Comando": "SELECT",
        "Política": "users_can_view_own_profile",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "public"
        ],
        "USING": "true",
        "Tabela": "rate_limits",
        "Comando": "ALL",
        "Política": "Service role can manage rate limits",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "role_permissions",
        "Comando": "ALL",
        "Política": "Anon não pode modificar associações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "true",
        "Tabela": "role_permissions",
        "Comando": "SELECT",
        "Política": "Anon pode ver permissões das roles",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "role_permissions",
        "Comando": "INSERT",
        "Política": "Apenas admins podem atribuir permissões",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "role_permissions",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar associações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "role_permissions",
        "Comando": "DELETE",
        "Política": "Apenas admins podem remover permissões",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "role_permissions",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "role_permissions",
        "Comando": "SELECT",
        "Política": "Usuários podem ver permissões das roles",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "sale_items",
        "Comando": "DELETE",
        "Política": "Admins podem remover qualquer item",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) AND (EXISTS ( SELECT 1\n   FROM sales s\n  WHERE ((s.id = sale_items.sale_id) AND ((s.status)::text = ANY ((ARRAY['pending'::character varying, 'open'::character varying])::text[]))))))",
        "Tabela": "sale_items",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar itens de venda",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) AND (quantity > (0)::numeric) AND (unit_price >= (0)::numeric) AND (total_price = (quantity * unit_price)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "sale_items",
        "Comando": "INSERT",
        "Política": "Usuários podem inserir itens em vendas",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM sales s\n  WHERE ((s.id = sale_items.sale_id) AND ((s.status)::text = ANY ((ARRAY['pending'::character varying, 'open'::character varying])::text[]))))) AND (EXISTS ( SELECT 1\n   FROM products p\n  WHERE ((p.id = sale_items.product_id) AND (p.is_active = true) AND (p.deleted_at IS NULL)))) AND (quantity > (0)::numeric) AND (unit_price >= (0)::numeric) AND (total_price = (quantity * unit_price)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM sales s\n  WHERE ((s.id = sale_items.sale_id) AND ((s.status)::text = ANY ((ARRAY['pending'::character varying, 'open'::character varying])::text[]))))) AND ((EXISTS ( SELECT 1\n   FROM sales s\n  WHERE ((s.id = sale_items.sale_id) AND (s.created_by = auth.uid())))) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))))",
        "Tabela": "sale_items",
        "Comando": "DELETE",
        "Política": "Usuários podem remover itens de vendas pendentes",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "sale_items",
        "Comando": "SELECT",
        "Política": "Usuários podem ver itens de vendas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "sales",
        "Comando": "ALL",
        "Política": "Anon não pode acessar vendas",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = 'pending'::text) AND (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))))",
        "Tabela": "sales",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem aprovar vendas",
        "WITH_CHECK": "(((status)::text = 'completed'::text) AND (approved_by = auth.uid()))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text <> ALL ((ARRAY['cancelled'::character varying, 'refunded'::character varying])::text[])) AND (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))))",
        "Tabela": "sales",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem cancelar vendas",
        "WITH_CHECK": "(((status)::text = 'cancelled'::text) AND (cancelled_at IS NOT NULL) AND (cancelled_by = auth.uid()) AND (cancellation_reason IS NOT NULL))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "sales",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar vendas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "sales",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text <> ALL ((ARRAY['cancelled'::character varying, 'refunded'::character varying])::text[])) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))))",
        "Tabela": "sales",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar vendas ativas",
        "WITH_CHECK": "(((status)::text <> ALL ((ARRAY['cancelled'::character varying, 'refunded'::character varying])::text[])) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "sales",
        "Comando": "INSERT",
        "Política": "Usuários podem criar vendas",
        "WITH_CHECK": "((created_by = auth.uid()) AND (total_amount >= (0)::numeric) AND (final_amount >= (0)::numeric) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying])::text[])) AND ((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying])::text[])))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "sales",
        "Comando": "SELECT",
        "Política": "Usuários podem ver vendas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) AND ((status)::text = 'pending'::text))",
        "Tabela": "stock_count_items",
        "Comando": "DELETE",
        "Política": "Admins podem deletar itens",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "stock_count_items",
        "Comando": "ALL",
        "Política": "Anon não pode acessar itens de contagem",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "stock_count_items",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar itens de contagem",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "stock_count_items",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "stock_count_items",
        "Comando": "INSERT",
        "Política": "Usuários com permissão podem adicionar itens",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM stock_count_sessions scs\n  WHERE ((scs.id = stock_count_items.count_session_id) AND ((scs.status)::text = 'open'::text)))) AND ((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('inventory.adjust'::text)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM stock_count_sessions scs\n  WHERE ((scs.id = stock_count_items.count_session_id) AND ((scs.status)::text = 'open'::text)))) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying])::text[])))",
        "Tabela": "stock_count_items",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar itens em contagem",
        "WITH_CHECK": "((EXISTS ( SELECT 1\n   FROM stock_count_sessions scs\n  WHERE ((scs.id = stock_count_items.count_session_id) AND ((scs.status)::text = 'open'::text)))) AND ((counted_quantity IS NULL) OR (counted_quantity >= (0)::numeric)) AND (((status)::text <> 'counted'::text) OR ((counted_quantity IS NOT NULL) AND (counted_by IS NOT NULL) AND (counted_at IS NOT NULL))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying])::text[])) AND (EXISTS ( SELECT 1\n   FROM stock_count_sessions scs\n  WHERE ((scs.id = stock_count_items.count_session_id) AND ((scs.status)::text = 'open'::text)))))",
        "Tabela": "stock_count_items",
        "Comando": "UPDATE",
        "Política": "Usuários podem finalizar contagem de item",
        "WITH_CHECK": "(((status)::text = 'counted'::text) AND (counted_quantity IS NOT NULL) AND (counted_by = auth.uid()) AND (counted_at IS NOT NULL) AND (difference = (COALESCE(counted_quantity, (0)::numeric) - system_quantity)))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "stock_count_items",
        "Comando": "SELECT",
        "Política": "Usuários podem ver itens de contagem",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) AND ((status)::text = 'cancelled'::text) AND (cancelled_at < (now() - '30 days'::interval)))",
        "Tabela": "stock_count_sessions",
        "Comando": "DELETE",
        "Política": "Admins podem deletar sessões canceladas",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "stock_count_sessions",
        "Comando": "ALL",
        "Política": "Anon não pode acessar sessões de contagem",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = 'in_progress'::text) AND (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))))",
        "Tabela": "stock_count_sessions",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem cancelar sessões",
        "WITH_CHECK": "(((status)::text = 'cancelled'::text) AND (cancelled_at IS NOT NULL) AND (cancelled_by = auth.uid()))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "stock_count_sessions",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar sessões de contagem",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "stock_count_sessions",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "stock_count_sessions",
        "Comando": "INSERT",
        "Política": "Usuários com permissão podem criar sessões",
        "WITH_CHECK": "(((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('inventory.adjust'::text)) AND (created_by = auth.uid()) AND (name IS NOT NULL) AND ((name)::text <> ''::text) AND (responsible IS NOT NULL) AND ((status)::text = 'in_progress'::text))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = 'in_progress'::text) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))))",
        "Tabela": "stock_count_sessions",
        "Comando": "UPDATE",
        "Política": "Usuários podem atualizar sessões em andamento",
        "WITH_CHECK": "((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(((status)::text = 'in_progress'::text) AND ((created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text])))))))",
        "Tabela": "stock_count_sessions",
        "Comando": "UPDATE",
        "Política": "Usuários podem finalizar sessões",
        "WITH_CHECK": "(((status)::text = 'completed'::text) AND (completed_at IS NOT NULL) AND (completed_by = auth.uid()))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "stock_count_sessions",
        "Comando": "SELECT",
        "Política": "Usuários podem ver sessões de contagem",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) AND ((reference_type)::text = 'manual'::text) AND (created_at > (now() - '01:00:00'::interval)))",
        "Tabela": "stock_movements",
        "Comando": "DELETE",
        "Política": "Admins podem deletar movimentações manuais",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "stock_movements",
        "Comando": "ALL",
        "Política": "Anon não pode acessar movimentações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "stock_movements",
        "Comando": "UPDATE",
        "Política": "Ninguém pode atualizar movimentações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "stock_movements",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar movimentações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "stock_movements",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "stock_movements",
        "Comando": "INSERT",
        "Política": "Sistema e autorizados podem registrar movimentações",
        "WITH_CHECK": "((((reference_type)::text = ANY ((ARRAY['sale'::character varying, 'product_entry'::character varying, 'stock_count'::character varying, 'adjustment'::character varying])::text[])) AND (created_by IS NOT NULL)) OR (((reference_type)::text = 'manual'::text) AND ((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'manager'::text]))))) OR has_permission('inventory.adjust'::text)) AND (quantity <> (0)::numeric) AND (quantity_before >= (0)::numeric) AND (quantity_after >= (0)::numeric) AND ((quantity_after - quantity_before) = quantity) AND (created_by = auth.uid())))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "stock_movements",
        "Comando": "SELECT",
        "Política": "Usuários podem ver movimentações de estoque",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) AND (created_at < (now() - '90 days'::interval)))",
        "Tabela": "system_logs",
        "Comando": "DELETE",
        "Política": "Admins podem deletar logs antigos",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "system_logs",
        "Comando": "SELECT",
        "Política": "Admins podem ver todos os logs",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "system_logs",
        "Comando": "ALL",
        "Política": "Anon não pode acessar logs",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'manager'::text)))) AND ((user_role <> 'admin'::text) OR (user_id = auth.uid())))",
        "Tabela": "system_logs",
        "Comando": "SELECT",
        "Política": "Gerentes podem ver logs de operadores",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "system_logs",
        "Comando": "UPDATE",
        "Política": "Ninguém pode atualizar logs",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "system_logs",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "system_logs",
        "Comando": "INSERT",
        "Política": "Sistema pode inserir logs",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(user_id = auth.uid())",
        "Tabela": "system_logs",
        "Comando": "SELECT",
        "Política": "Usuários podem ver seus próprios logs",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "system_settings",
        "Comando": "DELETE",
        "Política": "Admins podem deletar configurações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "false",
        "Tabela": "system_settings",
        "Comando": "ALL",
        "Política": "Anon não pode modificar configurações",
        "WITH_CHECK": "false"
      },
      {
        "Roles": [
          "anon"
        ],
        "USING": "true",
        "Tabela": "system_settings",
        "Comando": "SELECT",
        "Política": "Anon pode ver configurações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))",
        "Tabela": "system_settings",
        "Comando": "UPDATE",
        "Política": "Apenas admins podem atualizar configurações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "system_settings",
        "Comando": "INSERT",
        "Política": "Apenas admins podem criar configurações",
        "WITH_CHECK": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "false",
        "Tabela": "system_settings",
        "Comando": "DELETE",
        "Política": "Ninguém pode deletar configurações",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "service_role"
        ],
        "USING": "true",
        "Tabela": "system_settings",
        "Comando": "ALL",
        "Política": "Service role acesso total",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "system_settings",
        "Comando": "SELECT",
        "Política": "Usuários podem ver configurações do sistema",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "tasks",
        "Comando": "DELETE",
        "Política": "allow_delete_tasks",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": null,
        "Tabela": "tasks",
        "Comando": "INSERT",
        "Política": "allow_insert_tasks",
        "WITH_CHECK": "true"
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "tasks",
        "Comando": "SELECT",
        "Política": "allow_select_tasks",
        "WITH_CHECK": null
      },
      {
        "Roles": [
          "authenticated"
        ],
        "USING": "true",
        "Tabela": "tasks",
        "Comando": "UPDATE",
        "Política": "allow_update_tasks",
        "WITH_CHECK": "true"
      }
    ]
  }
]