[
  {
    "Tabela": "budget_items",
    "Política": "Usuários autenticados podem criar itens de orçamento",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "budget_items",
    "Política": "Usuários autenticados podem ver itens de orçamento",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "budgets",
    "Política": "Usuários autenticados podem atualizar orçamentos",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "budgets",
    "Política": "Usuários autenticados podem criar orçamentos",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "budgets",
    "Política": "Usuários autenticados podem ver orçamentos",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "cashier_closing",
    "Política": "Usuários autenticados podem criar fechamentos",
    "Comando": "INSERT",
    "Roles": "{public}"
  },
  {
    "Tabela": "cashier_closing",
    "Política": "Usuários autenticados podem ver fechamentos",
    "Comando": "SELECT",
    "Roles": "{public}"
  },
  {
    "Tabela": "companies",
    "Política": "Anon não pode modificar empresa",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "companies",
    "Política": "Anon pode ver empresa",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "companies",
    "Política": "Apenas admins podem criar empresa",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Apenas admins podem editar empresa",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Apenas service_role pode deletar empresas",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Ninguém pode deletar empresa",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "companies",
    "Política": "Service role tem acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "companies",
    "Política": "Todos podem ver empresas",
    "Comando": "SELECT",
    "Roles": "{anon,authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Usuários autenticados podem atualizar empresas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Usuários autenticados podem criar empresas",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "companies",
    "Política": "Usuários podem ver dados da empresa",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Anon não pode modificar configurações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Anon pode ver configurações públicas",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Apenas admins podem criar configuração",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Apenas admins podem editar configurações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Ninguém pode deletar configuração",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Service role pode criar configuração inicial",
    "Comando": "INSERT",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "company_settings",
    "Política": "Usuários podem ver configurações",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Admins e gerentes podem associar clientes a cupons",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Admins e gerentes podem remover associações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Anon não pode acessar cupons permitidos",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Apenas admins podem atualizar associações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "coupon_allowed_customers",
    "Política": "Usuários podem ver cupons permitidos por cliente",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Admins e gerentes podem atualizar cupons",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Admins e gerentes podem criar cupons",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Admins e gerentes podem ver todos os cupons",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Anon não pode modificar cupons",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "coupons",
    "Política": "Anon pode ver cupons globais ativos",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "coupons",
    "Política": "Ninguém pode deletar cupons fisicamente",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "coupons",
    "Política": "Usuários podem ver cupons ativos e não deletados",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "coupons",
    "Política": "Validar limite de uso ao criar",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Admins e gerentes podem atualizar comunicações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Anon não pode acessar comunicações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Auto preencher sent_by",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Ninguém pode deletar comunicações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Operadores veem apenas comunicações enviadas",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Remetente pode atualizar status da sua comunicação",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Usuários podem registrar comunicações",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_communications",
    "Política": "Usuários podem ver comunicações",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Anon não pode acessar histórico de cupons",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Apenas admins podem atualizar registro de uso",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Ninguém pode deletar histórico de cupons",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Usuários podem registrar uso de cupons",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customer_coupons",
    "Política": "Usuários podem ver uso de cupons",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Admins e gerentes podem ver todos os clientes",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Anon não pode acessar clientes",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "customers",
    "Política": "Anon pode verificar se email existe",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "customers",
    "Política": "Apenas admins podem inativar clientes",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Ninguém pode deletar clientes fisicamente",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Permitir select para todos",
    "Comando": "SELECT",
    "Roles": "{public}"
  },
  {
    "Tabela": "customers",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "customers",
    "Política": "Usuários podem atualizar clientes ativos",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Usuários podem cadastrar clientes",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "customers",
    "Política": "Usuários podem ver clientes ativos",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "login_attempts",
    "Política": "Admin pode atualizar tentativas",
    "Comando": "UPDATE",
    "Roles": "{public}"
  },
  {
    "Tabela": "login_attempts",
    "Política": "Admin pode ver tentativas",
    "Comando": "SELECT",
    "Roles": "{public}"
  },
  {
    "Tabela": "login_attempts",
    "Política": "Sistema pode inserir tentativas",
    "Comando": "INSERT",
    "Roles": "{public}"
  },
  {
    "Tabela": "notifications",
    "Política": "Admins e gerentes podem ver todas notificações",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Admins podem deletar qualquer notificação",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Admins podem gerenciar todas notificações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Anon não pode acessar notificações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "notifications",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "notifications",
    "Política": "Sistema pode criar notificações",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Usuário pode deletar suas notificações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Usuário pode marcar suas notificações como lidas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "notifications",
    "Política": "Usuário vê apenas suas notificações",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "permissions",
    "Política": "Anon não pode modificar permissões",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "permissions",
    "Política": "Anon pode ver catálogo de permissões",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "permissions",
    "Política": "Apenas admins podem atualizar permissões",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "permissions",
    "Política": "Apenas admins podem criar permissões",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "permissions",
    "Política": "Apenas admins podem deletar permissões",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "permissions",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "permissions",
    "Política": "Usuários podem ver catálogo de permissões",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Anon pode ver status de cobrança",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Ninguém pode deletar cobranças PIX",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Usuários podem atualizar cobranças PIX",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Usuários podem criar cobranças PIX",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "pix_charges",
    "Política": "Usuários podem ver cobranças PIX",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Anon não pode acessar entradas",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Apenas admins e gerentes veem custos",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Apenas admins podem atualizar entradas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Auto preencher created_by",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Ninguém pode deletar entradas",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Usuários com permissão podem registrar entradas",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Usuários podem ver entradas de produtos",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "product_entries",
    "Política": "Validar dados da entrada",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "products",
    "Política": "Usuários com permissão podem atualizar produtos",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Admins atualizam qualquer perfil",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Apenas admins criam perfis",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Ninguém deleta perfis",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Service role acesso total profiles",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "profiles",
    "Política": "Usuário atualiza seu perfil",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Usuário vê seu próprio perfil",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "Usuários veem todos os perfis",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "profiles",
    "Política": "admin_can_view_all_documents",
    "Comando": "SELECT",
    "Roles": "{public}"
  },
  {
    "Tabela": "profiles",
    "Política": "users_can_update_own_profile",
    "Comando": "UPDATE",
    "Roles": "{public}"
  },
  {
    "Tabela": "profiles",
    "Política": "users_can_view_own_profile",
    "Comando": "SELECT",
    "Roles": "{public}"
  },
  {
    "Tabela": "rate_limits",
    "Política": "Service role can manage rate limits",
    "Comando": "ALL",
    "Roles": "{public}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Anon não pode modificar associações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Anon pode ver permissões das roles",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Apenas admins podem atribuir permissões",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Apenas admins podem atualizar associações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Apenas admins podem remover permissões",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "role_permissions",
    "Política": "Usuários podem ver permissões das roles",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sale_items",
    "Política": "Admins podem remover qualquer item",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sale_items",
    "Política": "Apenas admins podem atualizar itens de venda",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sale_items",
    "Política": "Usuários podem inserir itens em vendas",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sale_items",
    "Política": "Usuários podem remover itens de vendas pendentes",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sale_items",
    "Política": "Usuários podem ver itens de vendas",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Anon não pode acessar vendas",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "sales",
    "Política": "Apenas admins podem aprovar vendas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Apenas admins podem cancelar vendas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Ninguém pode deletar vendas",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "sales",
    "Política": "Usuários podem atualizar vendas ativas",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Usuários podem criar vendas",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "sales",
    "Política": "Usuários podem ver vendas",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Admins podem deletar itens",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Anon não pode acessar itens de contagem",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Ninguém pode deletar itens de contagem",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Usuários com permissão podem adicionar itens",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Usuários podem atualizar itens em contagem",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Usuários podem finalizar contagem de item",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_items",
    "Política": "Usuários podem ver itens de contagem",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Admins podem deletar sessões canceladas",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Anon não pode acessar sessões de contagem",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Apenas admins podem cancelar sessões",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Ninguém pode deletar sessões de contagem",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Usuários com permissão podem criar sessões",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Usuários podem atualizar sessões em andamento",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Usuários podem finalizar sessões",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_count_sessions",
    "Política": "Usuários podem ver sessões de contagem",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Admins podem deletar movimentações manuais",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Anon não pode acessar movimentações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Ninguém pode atualizar movimentações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Ninguém pode deletar movimentações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Sistema e autorizados podem registrar movimentações",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "stock_movements",
    "Política": "Usuários podem ver movimentações de estoque",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Admins podem deletar logs antigos",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Admins podem ver todos os logs",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Anon não pode acessar logs",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Gerentes podem ver logs de operadores",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Ninguém pode atualizar logs",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Sistema pode inserir logs",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_logs",
    "Política": "Usuários podem ver seus próprios logs",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Admins podem deletar configurações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Anon não pode modificar configurações",
    "Comando": "ALL",
    "Roles": "{anon}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Anon pode ver configurações",
    "Comando": "SELECT",
    "Roles": "{anon}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Apenas admins podem atualizar configurações",
    "Comando": "UPDATE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Apenas admins podem criar configurações",
    "Comando": "INSERT",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Ninguém pode deletar configurações",
    "Comando": "DELETE",
    "Roles": "{authenticated}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Service role acesso total",
    "Comando": "ALL",
    "Roles": "{service_role}"
  },
  {
    "Tabela": "system_settings",
    "Política": "Usuários podem ver configurações do sistema",
    "Comando": "SELECT",
    "Roles": "{authenticated}"
  }
]