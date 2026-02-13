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
- Tabelas: `benefits`, `consent_requests`
- Cadastro com validação de CPF (algoritmo completo)
- Busca por nome/CPF
- Mascaramento de CPF na listagem

### ✅ Fase 4 — Propostas (Core)
- Tabelas: `proposals`, `proposal_status_history`, `portability_contracts`, `simulations`
- Enums: `proposal_internal_status` (11 status), `proposal_bank_status` (8 status)
- Wizard 6 etapas: Cliente → Banco/Produto → Portabilidade → Simulação → Dados Bancários → Revisão
- Status machine com histórico de transições
- Página de gestão com filtros, dashboard cards, tabela

### ✅ Fase 5 — Comissões + Metas
- Tabelas: `commission_rules`, `commission_entries`, `goals`
- Schema pronto para cálculo automático

### ✅ Fase 6 — Tarefas + Alertas
- Tabelas: `tasks`, `alerts`
- Schema pronto para automações

### ✅ Fase 7 — Integrações
- Tabela: `integration_logs`
- Schema pronto para webhooks n8n

### ✅ Navegação Reestruturada
- `AppLayout` com sidebar + header unificados
- Rotas: /dashboard, /bancos, /clientes, /propostas, /propostas/nova
- Navegação role-based

---

## Próximos Passos (Backlog)
- [ ] Página de gestão de empresas (super admin)
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
