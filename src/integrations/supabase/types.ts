export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          proposal_id: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          proposal_id?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          proposal_id?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      api_credentials: {
        Row: {
          bank_id: string
          company_id: string
          created_at: string
          credential_type: string
          id: string
          is_active: boolean
          is_sandbox: boolean
          name: string
          updated_at: string
        }
        Insert: {
          bank_id: string
          company_id: string
          created_at?: string
          credential_type?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          bank_id?: string
          company_id?: string
          created_at?: string
          credential_type?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource: string
          resource_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource: string
          resource_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource?: string
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          base_url: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          possui_api: boolean
          priority: number
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          possui_api?: boolean
          priority?: number
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          possui_api?: boolean
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          available_margin: number | null
          benefit_number: string | null
          benefit_type: string | null
          card_margin: number | null
          client_id: string
          company_id: string
          covenant: Database["public"]["Enums"]["covenant"] | null
          created_at: string
          gross_value: number | null
          id: string
          is_blocked: boolean
          net_value: number | null
          queried_at: string | null
          updated_at: string
        }
        Insert: {
          available_margin?: number | null
          benefit_number?: string | null
          benefit_type?: string | null
          card_margin?: number | null
          client_id: string
          company_id: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          gross_value?: number | null
          id?: string
          is_blocked?: boolean
          net_value?: number | null
          queried_at?: string | null
          updated_at?: string
        }
        Update: {
          available_margin?: number | null
          benefit_number?: string | null
          benefit_type?: string | null
          card_margin?: number | null
          client_id?: string
          company_id?: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          gross_value?: number | null
          id?: string
          is_blocked?: boolean
          net_value?: number | null
          queried_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          birth_date: string | null
          company_id: string
          cpf: string
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          internal_notes: string | null
          is_active: boolean
          nationality: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          company_id: string
          cpf: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          company_id?: string
          cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_entries: {
        Row: {
          base_value: number
          commission_value: number
          company_id: string
          created_at: string
          id: string
          paid_at: string | null
          percentage: number
          proposal_id: string | null
          rule_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          base_value: number
          commission_value: number
          company_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage: number
          proposal_id?: string | null
          rule_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          base_value?: number
          commission_value?: number
          company_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage?: number
          proposal_id?: string | null
          rule_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          bank_id: string | null
          company_id: string
          covenant: Database["public"]["Enums"]["covenant"] | null
          created_at: string
          fixed_value: number | null
          id: string
          is_active: boolean
          modality: Database["public"]["Enums"]["loan_modality"] | null
          percentage: number
          updated_at: string
        }
        Insert: {
          bank_id?: string | null
          company_id: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          fixed_value?: number | null
          id?: string
          is_active?: boolean
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          percentage: number
          updated_at?: string
        }
        Update: {
          bank_id?: string | null
          company_id?: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          fixed_value?: number | null
          id?: string
          is_active?: boolean
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_requests: {
        Row: {
          client_id: string
          company_id: string
          consent_type: string
          consented_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          otp_attempts: number
          status: string
        }
        Insert: {
          client_id: string
          company_id: string
          consent_type: string
          consented_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          otp_attempts?: number
          status?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          consent_type?: string
          consented_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          otp_attempts?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          company_id: string
          created_at: string
          id: string
          month: number
          seller_id: string | null
          target_proposals: number | null
          target_value: number
          updated_at: string
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          month: number
          seller_id?: string | null
          target_proposals?: number | null
          target_value?: number
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          month?: number
          seller_id?: string | null
          target_proposals?: number | null
          target_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          company_id: string | null
          correlation_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          operation: string
          provider: string
          request_data: Json | null
          response_data: Json | null
          status_code: number | null
        }
        Insert: {
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          operation: string
          provider: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
        }
        Update: {
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          operation?: string
          provider?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          month: number
          target_value: number
          updated_at: string
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          month: number
          target_value?: number
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          month?: number
          target_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      portability_contracts: {
        Row: {
          confirmed_online: boolean
          contract_number: string
          created_at: string
          id: string
          installment_value: number | null
          original_bank: string
          outstanding_balance: number | null
          proposal_id: string
          remaining_term: number | null
          updated_at: string
        }
        Insert: {
          confirmed_online?: boolean
          contract_number: string
          created_at?: string
          id?: string
          installment_value?: number | null
          original_bank: string
          outstanding_balance?: number | null
          proposal_id: string
          remaining_term?: number | null
          updated_at?: string
        }
        Update: {
          confirmed_online?: boolean
          contract_number?: string
          created_at?: string
          id?: string
          installment_value?: number | null
          original_bank?: string
          outstanding_balance?: number | null
          proposal_id?: string
          remaining_term?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portability_contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bank_id: string
          company_id: string
          covenant: Database["public"]["Enums"]["covenant"]
          created_at: string
          id: string
          is_active: boolean
          max_rate: number | null
          max_term: number | null
          min_rate: number | null
          min_term: number | null
          modality: Database["public"]["Enums"]["loan_modality"]
          name: string
          updated_at: string
        }
        Insert: {
          bank_id: string
          company_id: string
          covenant: Database["public"]["Enums"]["covenant"]
          created_at?: string
          id?: string
          is_active?: boolean
          max_rate?: number | null
          max_term?: number | null
          min_rate?: number | null
          min_term?: number | null
          modality: Database["public"]["Enums"]["loan_modality"]
          name: string
          updated_at?: string
        }
        Update: {
          bank_id?: string
          company_id?: string
          covenant?: Database["public"]["Enums"]["covenant"]
          created_at?: string
          id?: string
          is_active?: boolean
          max_rate?: number | null
          max_term?: number | null
          min_rate?: number | null
          min_term?: number | null
          modality?: Database["public"]["Enums"]["loan_modality"]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_bank_status:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          new_status: Database["public"]["Enums"]["proposal_internal_status"]
          notes: string | null
          old_bank_status:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          old_status:
            | Database["public"]["Enums"]["proposal_internal_status"]
            | null
          proposal_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_bank_status?:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          new_status: Database["public"]["Enums"]["proposal_internal_status"]
          notes?: string | null
          old_bank_status?:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          old_status?:
            | Database["public"]["Enums"]["proposal_internal_status"]
            | null
          proposal_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_bank_status?:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          new_status?: Database["public"]["Enums"]["proposal_internal_status"]
          notes?: string | null
          old_bank_status?:
            | Database["public"]["Enums"]["proposal_bank_status"]
            | null
          old_status?:
            | Database["public"]["Enums"]["proposal_internal_status"]
            | null
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_status_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_value: number | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_id: string | null
          bank_status: Database["public"]["Enums"]["proposal_bank_status"]
          benefit_id: string | null
          client_id: string
          company_id: string
          covenant: Database["public"]["Enums"]["covenant"] | null
          created_at: string
          erro_banco: string | null
          external_proposal_id: string | null
          id: string
          installment_value: number | null
          interest_rate: number | null
          internal_status: Database["public"]["Enums"]["proposal_internal_status"]
          modality: Database["public"]["Enums"]["loan_modality"] | null
          observations: string | null
          payload_enviado: Json | null
          pix_key: string | null
          product_id: string | null
          protocolo_banco: string | null
          released_value: number | null
          requested_value: number | null
          resposta_banco: Json | null
          seller_id: string
          term_months: number | null
          updated_at: string
        }
        Insert: {
          approved_value?: number | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_id?: string | null
          bank_status?: Database["public"]["Enums"]["proposal_bank_status"]
          benefit_id?: string | null
          client_id: string
          company_id: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          erro_banco?: string | null
          external_proposal_id?: string | null
          id?: string
          installment_value?: number | null
          interest_rate?: number | null
          internal_status?: Database["public"]["Enums"]["proposal_internal_status"]
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          observations?: string | null
          payload_enviado?: Json | null
          pix_key?: string | null
          product_id?: string | null
          protocolo_banco?: string | null
          released_value?: number | null
          requested_value?: number | null
          resposta_banco?: Json | null
          seller_id: string
          term_months?: number | null
          updated_at?: string
        }
        Update: {
          approved_value?: number | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_id?: string | null
          bank_status?: Database["public"]["Enums"]["proposal_bank_status"]
          benefit_id?: string | null
          client_id?: string
          company_id?: string
          covenant?: Database["public"]["Enums"]["covenant"] | null
          created_at?: string
          erro_banco?: string | null
          external_proposal_id?: string | null
          id?: string
          installment_value?: number | null
          interest_rate?: number | null
          internal_status?: Database["public"]["Enums"]["proposal_internal_status"]
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          observations?: string | null
          payload_enviado?: Json | null
          pix_key?: string | null
          product_id?: string | null
          protocolo_banco?: string | null
          released_value?: number | null
          requested_value?: number | null
          resposta_banco?: Json | null
          seller_id?: string
          term_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: Database["public"]["Enums"]["app_action"]
          created_at: string
          id: string
          resource: Database["public"]["Enums"]["app_resource"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action: Database["public"]["Enums"]["app_action"]
          created_at?: string
          id?: string
          resource: Database["public"]["Enums"]["app_resource"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: Database["public"]["Enums"]["app_action"]
          created_at?: string
          id?: string
          resource?: Database["public"]["Enums"]["app_resource"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_name: string
          commission_percentage: number
          commission_value: number | null
          company_id: string | null
          covenant_type: Database["public"]["Enums"]["covenant_type"]
          created_at: string
          financial_institution: string | null
          id: string
          observations: string | null
          operation_type: Database["public"]["Enums"]["operation_type"] | null
          released_value: number
          sale_date: string
          seller_id: string
          status: Database["public"]["Enums"]["sale_status"]
          updated_at: string
        }
        Insert: {
          client_name: string
          commission_percentage: number
          commission_value?: number | null
          company_id?: string | null
          covenant_type: Database["public"]["Enums"]["covenant_type"]
          created_at?: string
          financial_institution?: string | null
          id?: string
          observations?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"] | null
          released_value: number
          sale_date: string
          seller_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Update: {
          client_name?: string
          commission_percentage?: number
          commission_value?: number | null
          company_id?: string | null
          covenant_type?: Database["public"]["Enums"]["covenant_type"]
          created_at?: string
          financial_institution?: string | null
          id?: string
          observations?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"] | null
          released_value?: number
          sale_date?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          approved_value: number | null
          bank_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          installment_value: number | null
          interest_rate: number | null
          modality: Database["public"]["Enums"]["loan_modality"] | null
          proposal_id: string | null
          requested_value: number | null
          simulation_data: Json | null
          term_months: number | null
        }
        Insert: {
          approved_value?: number | null
          bank_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          installment_value?: number | null
          interest_rate?: number | null
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          proposal_id?: string | null
          requested_value?: number | null
          simulation_data?: Json | null
          term_months?: number | null
        }
        Update: {
          approved_value?: number | null
          bank_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          installment_value?: number | null
          interest_rate?: number | null
          modality?: Database["public"]["Enums"]["loan_modality"] | null
          proposal_id?: string | null
          requested_value?: number | null
          simulation_data?: Json | null
          term_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          proposal_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          proposal_id?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          proposal_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_permission: {
        Args: {
          _action: Database["public"]["Enums"]["app_action"]
          _resource: Database["public"]["Enums"]["app_resource"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_vendedor: { Args: never; Returns: boolean }
    }
    Enums: {
      app_action: "view" | "create" | "update" | "delete"
      app_resource:
        | "empresas"
        | "usuarios"
        | "credenciais_api"
        | "bancos"
        | "produtos"
        | "clientes"
        | "propostas"
        | "contratos_portabilidade"
        | "comissoes"
        | "metas"
        | "relatorios"
        | "auditoria"
        | "tarefas"
        | "integracoes"
        | "configuracoes"
      app_role:
        | "vendedor"
        | "administrador"
        | "raiz"
        | "admin_global"
        | "admin_empresa"
        | "gerente"
        | "auditor"
        | "compliance"
        | "financeiro"
        | "operacoes"
      covenant: "INSS" | "SIAPE" | "CLT" | "OUTROS"
      covenant_type:
        | "INSS"
        | "Forças Armadas"
        | "SIAPE"
        | "CLT"
        | "FGTS"
        | "Outros"
      loan_modality:
        | "margem_livre"
        | "portabilidade"
        | "port_refinanciamento"
        | "cartao_consignado"
        | "fgts_antecipacao"
        | "credito_trabalhador"
      operation_type:
        | "Novo"
        | "Refinanciamento"
        | "Compra de Dívida"
        | "Saque FGTS"
        | "Portabilidade"
      proposal_bank_status:
        | "nao_enviado"
        | "recebido"
        | "pendente_documentos"
        | "pendente_assinatura"
        | "em_analise"
        | "aprovado"
        | "reprovado"
        | "pago"
      proposal_internal_status:
        | "rascunho"
        | "pre_cadastrada"
        | "cadastrada"
        | "enviada_analise"
        | "em_analise"
        | "pendente_formalizacao"
        | "pendente_assinatura"
        | "aprovada"
        | "reprovada"
        | "cancelada"
        | "paga_liberada"
      sale_status: "em_andamento" | "pago" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_action: ["view", "create", "update", "delete"],
      app_resource: [
        "empresas",
        "usuarios",
        "credenciais_api",
        "bancos",
        "produtos",
        "clientes",
        "propostas",
        "contratos_portabilidade",
        "comissoes",
        "metas",
        "relatorios",
        "auditoria",
        "tarefas",
        "integracoes",
        "configuracoes",
      ],
      app_role: [
        "vendedor",
        "administrador",
        "raiz",
        "admin_global",
        "admin_empresa",
        "gerente",
        "auditor",
        "compliance",
        "financeiro",
        "operacoes",
      ],
      covenant: ["INSS", "SIAPE", "CLT", "OUTROS"],
      covenant_type: [
        "INSS",
        "Forças Armadas",
        "SIAPE",
        "CLT",
        "FGTS",
        "Outros",
      ],
      loan_modality: [
        "margem_livre",
        "portabilidade",
        "port_refinanciamento",
        "cartao_consignado",
        "fgts_antecipacao",
        "credito_trabalhador",
      ],
      operation_type: [
        "Novo",
        "Refinanciamento",
        "Compra de Dívida",
        "Saque FGTS",
        "Portabilidade",
      ],
      proposal_bank_status: [
        "nao_enviado",
        "recebido",
        "pendente_documentos",
        "pendente_assinatura",
        "em_analise",
        "aprovado",
        "reprovado",
        "pago",
      ],
      proposal_internal_status: [
        "rascunho",
        "pre_cadastrada",
        "cadastrada",
        "enviada_analise",
        "em_analise",
        "pendente_formalizacao",
        "pendente_assinatura",
        "aprovada",
        "reprovada",
        "cancelada",
        "paga_liberada",
      ],
      sale_status: ["em_andamento", "pago", "cancelado"],
    },
  },
} as const
