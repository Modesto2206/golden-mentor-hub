# Plataforma CORBAN - Crédito Consignado Enterprise

## Visão Geral
Plataforma SaaS multi-tenant para gestão de crédito consignado no modelo CORBAN.

## Status das Fases

### ✅ Fase 0 — Sistema Original
- Auth básico (vendedor/administrador)
- Dashboard com vendas, metas, ranking
- Drag-and-drop layout customization

### ✅ Fase 1 — Multi-Tenant + RBAC
- Tabela `companies` com empresa padrão
- 10 roles: raiz, admin_global, admin_empresa, gerente, vendedor, auditor, compliance, financeiro, operacoes, administrador
- 298 permissões granulares (role × resource × action) em `role_permissions`
- Tabela `audit_logs` imutável
- `company_id` em todas as tabelas existentes
- Funções: `is_super_admin()`, `has_permission()`, `get_user_company_id()`
- RLS completo em todas as tabelas
- AuthContext atualizado com suporte a todos os roles

### ✅ Fase 2 — Bancos + Produtos
- Tabelas: `banks`, `products`, `api_credentials`
- Enums: `loan_modality`, `covenant`
- Página "Bancos Disponíveis" com filtros, busca, grid/list toggle, ordenação
- CRUD de bancos (admin)

### ✅ Fase 3 — Clientes
- Tabela `clients` com CPF único por empresa
- Campos `convenio` e `modalidade` no cadastro de clientes
- Filtros combináveis: convênio, modalidade, status
- Tabelas: `benefits`, `consent_requests`
- Cadastro com validação de CPF (algoritmo completo)
- Busca por nome/CPF
- Mascaramento de CPF na listagem

### ✅ Fase 4 — Propostas (Core)
- Tabelas: `proposals`, `proposal_status_history`, `portability_contracts`, `simulations`
- Enums: `proposal_internal_status` (11 status), `proposal_bank_status` (8 status)
- Wizard 6 etapas
- Status machine com histórico de transições
- Página de gestão com filtros, dashboard cards, tabela

### ✅ Fase 5 — Comissões + Metas
- Tabelas: `commission_rules`, `commission_entries`, `goals`

### ✅ Fase 6 — Tarefas + Alertas
- Tabelas: `tasks`, `alerts`

### ✅ Fase 7 — Integrações
- Tabela: `integration_logs`

### ✅ Fase 8 — Enterprise SaaS Architecture
- **Planos com limites**: basico (2), profissional (5), enterprise (10) usuários
- **max_users** e **status** na tabela `companies`
- **Validação de limite** no Edge Function `add-user` (server-side)
- **company_id sempre do backend** — nunca confia no frontend
- **Suspensão de empresa**: status suspended/canceled bloqueia write operations
- **Banner de suspensão** no AppLayout
- **Funções DB**: `get_company_user_count()`, `can_add_user()`, `is_company_active()`
- **Índices compostos** (company_id, created_at) em todas as tabelas core
- **Relatório Financeiro**: receita, comissões, ticket médio, novos clientes, agrupamentos por vendedor/modalidade/convênio
- **Dashboard Super Admin**: total empresas, ativas/suspensas, MRR, receita por plano, crescimento mensal, tabela de empresas

### ✅ Navegação Reestruturada
- `AppLayout` com sidebar + header unificados
- Rotas: /dashboard, /bancos, /clientes, /propostas, /propostas/nova, /relatorio, /super-admin
- Navegação role-based

---

## Próximos Passos (Backlog)
- [ ] CRUD de empresas no Super Admin (editar plano, suspender, cancelar)
- [ ] Subdomain per company (company.cred.com)
- [ ] White-label support
- [ ] Feature flags per plan
- [ ] CRUD completo de produtos por banco
- [ ] Detalhes/edição de proposta individual
- [ ] Status machine com transições validadas (edge function)
- [ ] Cálculo automático de comissões ao atingir "paga_liberada"
- [ ] Dashboard de comissões por vendedor
- [ ] Tarefas automáticas (pendências, documentos)
- [ ] Webhooks n8n para integrações
- [ ] IN100 module com OTP
- [ ] Exportação CSV/Excel de propostas
- [ ] Anonimização de dados (LGPD)
- [ ] Audit log viewer para auditores
- [ ] Public API
