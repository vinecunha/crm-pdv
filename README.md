# 🏪 Sistema de Gestão Empresarial

Sistema completo para gestão de vendas, estoque, clientes e relatórios.

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral do negócio
- Gráficos de vendas e faturamento
- Alertas de estoque baixo

### 🛒 PDV (Ponto de Venda)
- Interface rápida para vendas
- Busca de produtos por código/nome
- Múltiplas formas de pagamento
- Aplicação de cupons de desconto
- Carrinho de compras

### 📦 Produtos
- Cadastro completo de produtos
- Controle de estoque
- Categorias e marcas
- Preços de custo e venda
- Alertas de estoque mínimo

### 🔄 Balanço de Estoque
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

### 📈 Relatórios
- Vendas por período
- Produtos mais vendidos
- Clientes mais fiéis
- Análise de estoque
- Exportação em PDF/CSV

### 🎫 Cupons
- Cupons de desconto (R$ ou %)
- Cupons globais ou restritos
- Validade configurável
- Limite de uso

### 👤 Usuários
- Controle de acesso por função
- Admin, Gerente, Operador
- Logs de todas as ações

### 📝 Logs do Sistema
- Registro de todas as operações
- Filtros por usuário, ação, data
- Auditoria completa

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Gráficos**: Chart.js
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git

# Entre na pasta
cd seu-repositorio

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Execute o projeto
npm run dev

```

## 📚 Vendors
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🗄️ Estrutura do Banco de Dados
- O sistema utiliza as seguintes tabelas principais:

- products - Produtos

- customers - Clientes

- sales - Vendas

- sale_items - Itens das vendas

- stock_movements - Movimentações de estoque

- stock_count_sessions - Sessões de balanço

- stock_count_items - Itens contados no balanço

- coupons - Cupons de desconto

- profiles - Perfis de usuários

- system_logs - Logs do sistema

**Scripts SQL disponíveis em /sql/**

## 🔐 Permissões
- Função	| Permissões
- Admin	    | Acesso total ao sistema
- Gerente	| Gerenciar produtos, clientes, vendas, relatórios
- Operador	| Apenas PDV e consultas básicas

## 🤝 Contribuindo
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença
Este projeto está sob a licença MIT.

## 👨‍💻 Autor
Vinicius Martins