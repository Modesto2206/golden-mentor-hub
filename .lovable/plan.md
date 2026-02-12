# Plataforma CORBAN - Crédito Consignado Enterprise

## Visão Geral
Plataforma SaaS multi-tenant para gestão de crédito consignado no modelo CORBAN.

## Fases de Implementação

### ✅ Fase 0 — Sistema Atual
- Auth básico (vendedor/administrador)
- Dashboard com vendas, metas, ranking
- Drag-and-drop layout customization

---

### 🔧 Fase 1 — Multi-Tenant + RBAC (PRIORIDADE)
**Objetivo**: Reestruturar a base de dados para suportar múltiplas empresas, roles granulares e permissões.

**Tabelas**:
- `companies` — Cadastro de empresas
- `user_roles` (atualizar) — Roles expandidos
- `role_permissions` — Permissões granulares por recurso e ação
- `audit_logs` — Log imutável de ações

**Mudanças**:
- Adicionar `company_id` nas tabelas existentes
- Criar novo enum de roles expandido
- RLS com isolamento por company_id
- Função de verificação de permissões

---

### 📋 Fase 2 — Bancos + Produtos
- `banks`, `products`, `api_credentials`
- Página "Bancos Disponíveis" com filtros

---

### 👤 Fase 3 — Clientes
- `clients`, `benefits`, `consent_requests`
- Cadastro com validação CPF

---

### 📑 Fase 4 — Propostas (Core)
- `proposals`, `proposal_status_history`, `portability_contracts`, `simulations`
- Wizard 6 etapas, máquina de status

---

### 💰 Fase 5 — Comissões + Metas
- `commission_rules`, `commission_entries`, `goals`

---

### 📋 Fase 6 — Tarefas + Alertas

---

### 🔌 Fase 7 — Integrações + n8n

---

### 🔐 Fase 8 — LGPD + Segurança Avançada
