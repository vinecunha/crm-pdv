# 🏪 CRM-PDV - Sistema de Gestão Empresarial

Sistema completo para gestão de vendas, estoque, clientes e relatórios com foco em PDV (Ponto de Venda).

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral do negócio
- Gráficos de vendas e faturamento
- Alertas de estoque baixo
- Metas diárias, mensais e anuais

### 🛒 PDV (Ponto de Venda)
- Interface rápida para vendas
- Busca de produtos por código/nome
- Múltiplas formas de pagamento (Dinheiro, Cartão, PIX)
- Aplicação de cupons de desconto
- Carrinho de compras
- Gerenciamento de clientes no PDV
- Cupons de desconto integrados

### 📦 Produtos
- Cadastro completo de produtos
- Controle de estoque
- Categorias e marcas
- Preços de custo e venda
- Alertas de estoque mínimo
- Entrada de produtos (notas fiscais)

### 📉 Balanço de Estoque
- Sessões de contagem de inventário
- Registro de quantidades físicas
- Detecção automática de divergências
- Ajuste automático de estoque
- Histórico completo

### 👥 Clientes
- Cadastro de clientes
- Histórico de compras
- Comunicação integrada (WhatsApp, Email, SMS)
- Fidelidade e total gasto
- Análise RFV (Recência, Frequência, Valor)

### 📈 Relatórios
- Vendas por período
- Produtos mais vendidos
- Clientes mais fiéis
- Análise de estoque
- Exportação em PDF/CSV
- Comissões de vendas

### 🎫 Cupons
- Cupons de desconto (R$ ou %)
- Cupons globais ou restritos
- Validade configurável
- Limite de uso
- Cupons por cliente

### 👤 Usuários
- Controle de acesso por função
- Admin, Gerente, Operador
- Perfis com preferências (tema, idioma, timezone)
- Logs de todas as ações
- Registro de login e tentativas

### 📝 Logs do Sistema
- Registro de todas as operações
- Filtros por usuário, ação, data
- Auditoria completa
- Logs unificados (system_logs + access_logs)
- View unificada para consultas

### 💰 Comissões
- Regras de comissão configuráveis
- Comissões por venda
- Relatórios de pagamento
- Diferentes períodos (diário, mensal, anual)

### ✅ Tarefas
- Tarefas pessoais e de equipe
- Atribuição de usuários
- Controle de status e prioridade
- Histórico de atribuições
- Comentários em tarefas

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS v4
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estado**: React Query v5
- **Roteamento**: React Router v7
- **Gráficos**: Chart.js
- **Ícones**: Lucide React
- **TypeScript**: Tipagem completa

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/vinecunha/crm-pdv.git

# Entre na pasta
cd crm-pdv

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Execute o projeto
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Localização dos Arquivos
Todos os arquivos de migração estão em: `supabase/migrations/`

### Arquivos de Migração (ORDEM DE EXECUÇÃO)

1. **`00000000000000_functions.sql`** - Funções do banco
   - Funções para triggers (updated_at, auditoria, etc.)
   - Função `setup_company()` para criar nova empresa
   - Função `get_current_user_role()` para RLS
   - Sequence `registration_number_seq` para números de registro

2. **`20260101_initial_schema.sql`** - Schema principal
   - Todas as tabelas do sistema
   - Índices para performance
   - Triggers para automação
   - View `unified_logs` para logs unificados
   - Tabela `access_logs` para logs de acesso
   - **Ordem respeita dependências de chaves estrangeiras**

3. **`20260102_rls_policies.sql`** - Row Level Security
   - Políticas de segurança para todas as tabelas
   - Controle de acesso baseado em roles
   - Usuários veem apenas seus dados quando apropriado
   - Admins têm acesso total

4. **`20260104_auto_admin_first_user.sql`** - Primeiro usuário é admin
   - Trigger que torna o primeiro usuário admin automaticamente

### Tabelas Principais

- **companies** - Empresas (multi-tenant)
- **company_settings** - Configurações da empresa
- **profiles** - Perfis de usuários (relacionado ao auth.users)
- **customers** - Clientes
- **products** - Produtos
- **sales** - Vendas
- **sale_items** - Itens das vendas
- **budgets** - Orçamentos
- **budget_items** - Itens dos orçamentos
- **coupons** - Cupons de desconto
- **customer_coupons** - Cupons usados por cliente
- **coupon_allowed_customers** - Clientes permitidos em cupons
- **stock_movements** - Movimentações de estoque
- **stock_count_sessions** - Sessões de balanço
- **stock_count_items** - Itens contados no balanço
- **product_entries** - Entradas de produtos (notas fiscais)
- **cashier_closing** - Fechamento de caixa
- **pix_charges** - Cobranças PIX
- **notifications** - Notificações do sistema
- **tasks** - Tarefas
- **task_status_history** - Histórico de status das tarefas
- **task_comments** - Comentários em tarefas
- **task_assignment_history** - Histórico de atribuições
- **commissions** - Comissões
- **commission_rules** - Regras de comissão
- **goals** - Metas
- **permissions** - Permissões
- **role_permissions** - Permissões por role
- **login_attempts** - Tentativas de login
- **rate_limits** - Limites de taxa
- **system_logs** - Logs do sistema
- **access_logs** - Logs de acesso
- **system_settings** - Configurações do sistema

### Views

- **unified_logs** - View que unifica system_logs e access_logs para consultas completas

## 🏢 Como Criar uma Nova Company

### ⚡️ Método Recomendado (Automático)

1. **Acesse**: `https://seu-dominio.com/setup`
2. **Preencha os dados da empresa**:
   - Nome da Empresa *
   - CNPJ (opcional)
   - E-mail de contato
   - Telefone
   - Endereço completo
   - Cidade e Estado
   - CEP
   - Cores personalizadas (opcional)

3. **Clique em "Salvar e Continuar"**
   - A empresa será criada automaticamente
   - Você será redirecionado para `/login`

4. **Cadastre o primeiro usuário**:
   - No login, clique em "Criar conta"
   - Use um e-mail válido
   - ✅ **O primeiro usuário será admin automaticamente!**
   - Não precisa alterar nada no banco

---

### 🔧 Método Manual (SQL)

Se preferir criar via SQL Editor no Supabase:

```sql
-- 1. Criar a empresa (usa a função setup_company)
SELECT setup_company(
  'Minha Empresa'::character varying,
  'minha-empresa'::character varying,
  'minhaempresa.com'::character varying,
  '{"primary_color": "#2563eb", "secondary_color": "#7c3aed"}'::jsonb
);

-- 2. O primeiro usuário a se cadastrar será admin automaticamente
-- (isso é feito pelo trigger trg_auto_admin_first_user)
```

**Para cadastrar o primeiro admin:**
1. Acesse a interface web
2. Cadastre-se com seu e-mail
3. ✅ O sistema detecta que é o primeiro usuário e define como `admin` automaticamente

---

### 📋 Arquivos de Migração (ORDEM DE EXECUÇÃO)

Todos os arquivos estão em: `supabase/migrations/`

| Ordem | Arquivo | Descrição |
|-------|---------|-------------|
| 1️⃣ | `00000000000000_functions.sql` | Funções e triggers |
| 2️⃣ | `20260101_initial_schema.sql` | Schema principal + tabelas |
| 3️⃣ | `20260102_rls_policies.sql` | Row Level Security |
| 4️⃣ | `20260104_auto_admin_first_user.sql` | Trigger para primeiro admin |

**Para um novo ambiente:**
```bash
npx supabase db push --linked --yes
```

---

### 🔐 Verificação

Após criar a company e o admin, verifique:

```sql
-- Ver companies criadas
SELECT * FROM public.companies;

-- Ver configurações
SELECT * FROM public.company_settings;

-- Ver usuários e roles (primeiro será admin)
SELECT id, email, role FROM public.profiles;
```

---

### ⚠️ Importante

- ✅ O **primeiro usuário** a se cadastrar será **admin automaticamente**
- ✅ Não é necessário alterar manualmente o banco
- ✅ O trigger `trg_auto_admin_first_user` cuida disso
- ✅ Se já existirem usuários, novos cadastros serão `operador` por padrão

3. **Ou insira manualmente**:
```sql
-- Inserir na tabela companies
INSERT INTO public.companies (name, slug, domain, settings)
VALUES (
  'Minha Empresa',
  'minha-empresa',
  'minhaempresa.com',
  '{"primary_color": "#2563eb"}'::jsonb
)
RETURNING id;

-- Inserir configurações
INSERT INTO public.company_settings (company_name, domain)
VALUES ('Minha Empresa', 'minhaempresa.com');
```

4. **Crie o primeiro usuário admin**:
   - Cadastre-se via interface do sistema
   - No Supabase, altere a role para 'admin':
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@minhaempresa.com';
```

### Arquivos Necessários para Nova Company

Para um novo ambiente, você precisa executar **apenas** os arquivos de migração em ordem:

1. ✅ `supabase/migrations/00000000000000_functions.sql`
2. ✅ `supabase/migrations/20260101_initial_schema.sql`
3. ✅ `supabase/migrations/20260102_rls_policies.sql`

Ou simplismente use:
```bash
npx supabase db push --linked --yes --include-all
```

## 🔐 Permissões

| Função | Permissões |
|--------|-------------|
| **admin** | Acesso total ao sistema |
| **gerente** | Gerenciar produtos, clientes, vendas, relatórios, estoque |
| **operador** | Apenas PDV e consultas básicas |

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Políticas baseadas na role do usuário
- Usuários só veem seus próprios dados quando apropriado
- Admins têm visão completa

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Vinicius Martins**
- GitHub: [@vinecunha](https://github.com/vinecunha)
- Projeto: [crm-pdv](https://github.com/vinecunha/crm-pdv)

## 📝 Changelog

### Últimas Atualizações
- ✅ Limpeza de arquivos SQL desnecessários (removido schema.sql da pasta migrations)
- ✅ Padronização dos nomes dos arquivos de migração
- ✅ Correção de sintaxe SQL (removido company_logo_url duplicado)
- ✅ Reordenação de tabelas para respeitar dependências FK
- ✅ Criação de sequence própria para registration_number
- ✅ Adição da tabela budget_items que estava faltando
- ✅ Implementação completa de RLS policies
- ✅ Função setup_company() para criação de novas empresas
- ✅ View unified_logs para logs unificados
- ✅ Correção de tipos TypeScript
- ✅ Performance: Substituição de polling por Supabase Realtime
- ✅ Remoção de armazenamento inseguro (secureStorage)
- ✅ Limpeza de imports não utilizados
- ✅ Criação de hooks PDV (usePDVCoupon, usePDVCustomer, usePDVCart)
- ✅ Página de setup /setup para configuração inicial
- ✅ Documentação de AI context (agents.md) em múltiplos locais

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Executa em modo desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview da build
npm run test         # Executa testes (vitest)
npm run lint         # Lint do código
```

## 📚 Estrutura do Projeto

```
crm-pdv/
├── src/
│   ├── components/    # Componentes React
│   ├── contexts/      # Contextos (Auth, Company)
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilitários e configurações
│   ├── pages/         # Páginas da aplicação
│   └── types/         # Tipos TypeScript
├── supabase/
│   └── migrations/    # Migrações do banco de dados
├── public/            # Arquivos estáticos
└── docs/             # Documentação adicional
```
