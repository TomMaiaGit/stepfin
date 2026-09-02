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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          answer: string | null
          created_at: string
          group_id: string
          id: string
          insight_type: string | null
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          group_id: string
          id?: string
          insight_type?: string | null
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          group_id?: string
          id?: string
          insight_type?: string | null
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          group_id: string
          id: number
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          group_id: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          group_id?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          account_id: string | null
          actual_amount: number | null
          amount: number
          barcode: string | null
          card_id: string | null
          category_id: string | null
          competence: string | null
          created_at: string
          created_by: string
          description: string
          document_file_path: string | null
          due_date: string
          group_id: string
          id: string
          notes: string | null
          paid_at: string | null
          paid_transaction_id: string | null
          payment_date: string | null
          payment_receipt_path: string | null
          recurrence_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          actual_amount?: number | null
          amount: number
          barcode?: string | null
          card_id?: string | null
          category_id?: string | null
          competence?: string | null
          created_at?: string
          created_by: string
          description: string
          document_file_path?: string | null
          due_date: string
          group_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_transaction_id?: string | null
          payment_date?: string | null
          payment_receipt_path?: string | null
          recurrence_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          actual_amount?: number | null
          amount?: number
          barcode?: string | null
          card_id?: string | null
          category_id?: string | null
          competence?: string | null
          created_at?: string
          created_by?: string
          description?: string
          document_file_path?: string | null
          due_date?: string
          group_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_transaction_id?: string | null
          payment_date?: string | null
          payment_receipt_path?: string | null
          recurrence_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_paid_transaction_id_fkey"
            columns: ["paid_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      caixinha_deposits: {
        Row: {
          account_id: string | null
          amount: number
          caixinha_id: string
          created_at: string
          deposit_date: string
          id: string
          member_id: string
          note: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          caixinha_id: string
          created_at?: string
          deposit_date?: string
          id?: string
          member_id: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          caixinha_id?: string
          created_at?: string
          deposit_date?: string
          id?: string
          member_id?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixinha_deposits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixinha_deposits_caixinha_id_fkey"
            columns: ["caixinha_id"]
            isOneToOne: false
            referencedRelation: "caixinhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixinha_deposits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      caixinha_goals: {
        Row: {
          caixinha_id: string
          created_at: string
          goal_name: string
          id: string
          monthly_target: number | null
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string
        }
        Insert: {
          caixinha_id: string
          created_at?: string
          goal_name: string
          id?: string
          monthly_target?: number | null
          status?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          caixinha_id?: string
          created_at?: string
          goal_name?: string
          id?: string
          monthly_target?: number | null
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixinha_goals_caixinha_id_fkey"
            columns: ["caixinha_id"]
            isOneToOne: false
            referencedRelation: "caixinhas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixinhas: {
        Row: {
          color: string
          created_at: string
          created_by: string
          current_balance: number
          description: string | null
          funding_account_id: string | null
          goal_type: string
          group_id: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          current_balance?: number
          description?: string | null
          funding_account_id?: string | null
          goal_type?: string
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          current_balance?: number
          description?: string | null
          funding_account_id?: string | null
          goal_type?: string
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixinhas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixinhas_funding_account_id_fkey"
            columns: ["funding_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixinhas_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          group_id: string
          id: string
          paid_at: string | null
          paid_transaction_id: string | null
          payment_account_id: string | null
          reference_month: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          card_id: string
          closing_date: string
          created_at?: string
          due_date: string
          group_id: string
          id?: string
          paid_at?: string | null
          paid_transaction_id?: string | null
          payment_account_id?: string | null
          reference_month: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          card_id?: string
          closing_date?: string
          created_at?: string
          due_date?: string
          group_id?: string
          id?: string
          paid_at?: string | null
          paid_transaction_id?: string | null
          payment_account_id?: string | null
          reference_month?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoices_paid_transaction_id_fkey"
            columns: ["paid_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invoices_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          brand: string | null
          card_type: string
          closing_day: number | null
          color: string
          created_at: string
          credit_limit: number | null
          due_day: number | null
          group_id: string
          id: string
          is_active: boolean
          issuer: string | null
          last_four: string | null
          name: string
          owner_member_id: string
          payment_account_id: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          card_type?: string
          closing_day?: number | null
          color?: string
          created_at?: string
          credit_limit?: number | null
          due_day?: number | null
          group_id: string
          id?: string
          is_active?: boolean
          issuer?: string | null
          last_four?: string | null
          name: string
          owner_member_id: string
          payment_account_id?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          card_type?: string
          closing_day?: number | null
          color?: string
          created_at?: string
          credit_limit?: number | null
          due_day?: number | null
          group_id?: string
          id?: string
          is_active?: boolean
          issuer?: string | null
          last_four?: string | null
          name?: string
          owner_member_id?: string
          payment_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          group_id: string | null
          icon: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_type: string
          color: string
          created_at: string
          group_id: string
          icon: string | null
          id: string
          include_in_available: boolean
          initial_balance: number
          institution: string | null
          is_active: boolean
          name: string
          owner_member_id: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          color?: string
          created_at?: string
          group_id: string
          icon?: string | null
          id?: string
          include_in_available?: boolean
          initial_balance?: number
          institution?: string | null
          is_active?: boolean
          name: string
          owner_member_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          color?: string
          created_at?: string
          group_id?: string
          icon?: string | null
          id?: string
          include_in_available?: boolean
          initial_balance?: number
          institution?: string | null
          is_active?: boolean
          name?: string
          owner_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_accounts_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string
          expires_at: string
          group_id: string
          id: string
          invited_by: string
          invited_email: string
          permission_level: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          group_id: string
          id?: string
          invited_by: string
          invited_email: string
          permission_level?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          invited_email?: string
          permission_level?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          joined_at: string
          permission_level: string
          removed_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          permission_level?: string
          removed_at?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          permission_level?: string
          removed_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel_email: boolean
          channel_in_app: boolean
          channel_whatsapp: boolean
          created_at: string
          days_before_due: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_email?: boolean
          channel_in_app?: boolean
          channel_whatsapp?: boolean
          created_at?: string
          days_before_due?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_email?: boolean
          channel_in_app?: boolean
          channel_whatsapp?: boolean
          created_at?: string
          days_before_due?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          group_id: string
          id: string
          is_read: boolean
          related_bill_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_read?: boolean
          related_bill_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_read?: boolean
          related_bill_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_bill_id_fkey"
            columns: ["related_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurrences: {
        Row: {
          account_id: string | null
          amount: number
          amount_mode: string
          auto_generate: boolean
          card_id: string | null
          category_id: string | null
          created_at: string
          created_by: string
          description: string
          end_date: string | null
          frequency: string
          group_id: string
          id: string
          is_active: boolean
          next_due_date: string | null
          payment_method: string | null
          recurrence_day: number
          recurrence_type: string
          start_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_mode?: string
          auto_generate?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          description: string
          end_date?: string | null
          frequency?: string
          group_id: string
          id?: string
          is_active?: boolean
          next_due_date?: string | null
          payment_method?: string | null
          recurrence_day: number
          recurrence_type?: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_mode?: string
          auto_generate?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          end_date?: string | null
          frequency?: string
          group_id?: string
          id?: string
          is_active?: boolean
          next_due_date?: string | null
          payment_method?: string | null
          recurrence_day?: number
          recurrence_type?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrences_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheet_imports: {
        Row: {
          created_at: string
          file_path: string
          group_id: string
          id: string
          member_id: string
          rows_imported: number | null
          status: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          group_id: string
          id?: string
          member_id: string
          rows_imported?: number | null
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          group_id?: string
          id?: string
          member_id?: string
          rows_imported?: number | null
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_imports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spreadsheet_imports_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_splits: {
        Row: {
          created_at: string
          id: string
          is_settled: boolean
          owed_by_member_id: string | null
          owed_by_name: string | null
          share_amount: number
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_settled?: boolean
          owed_by_member_id?: string | null
          owed_by_name?: string | null
          share_amount: number
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_settled?: boolean
          owed_by_member_id?: string | null
          owed_by_name?: string | null
          share_amount?: number
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_owed_by_member_id_fkey"
            columns: ["owed_by_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          description: string
          destination_account_id: string | null
          entry_method: string
          group_id: string
          id: string
          installment_count: number | null
          installment_number: number | null
          invoice_id: string | null
          is_shared: boolean
          kind: string
          member_id: string
          notes: string | null
          payment_method: string | null
          receipt_file_path: string | null
          source_import_id: string | null
          status: string
          transaction_date: string
          transfer_key: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          destination_account_id?: string | null
          entry_method?: string
          group_id: string
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          invoice_id?: string | null
          is_shared?: boolean
          kind?: string
          member_id: string
          notes?: string | null
          payment_method?: string | null
          receipt_file_path?: string | null
          source_import_id?: string | null
          status?: string
          transaction_date: string
          transfer_key?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          destination_account_id?: string | null
          entry_method?: string
          group_id?: string
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          invoice_id?: string | null
          is_shared?: boolean
          kind?: string
          member_id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_file_path?: string | null
          source_import_id?: string | null
          status?: string
          transaction_date?: string
          transfer_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "financial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_source_import_id_fkey"
            columns: ["source_import_id"]
            isOneToOne: false
            referencedRelation: "spreadsheet_imports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { token: string }; Returns: string }
      calculate_account_balance: {
        Args: { p_account_id: string; p_exclude_transaction?: string }
        Returns: number
      }
      cancel_group_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          created_at: string
          expires_at: string
          group_id: string
          id: string
          invited_by: string
          invited_email: string
          permission_level: string
          status: string
          token: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "group_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_financial_group: { Args: { group_name: string }; Returns: string }
      generate_recurrence_bills: { Args: { p_until?: string }; Returns: number }
      get_account_balances: {
        Args: { p_group_id: string }
        Returns: {
          account_type: string
          balance: number
          color: string
          id: string
          include_in_available: boolean
          name: string
        }[]
      }
      get_group_dashboard: {
        Args: { group_id: string; month: string }
        Returns: Json
      }
      has_write_permission: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      is_group_owner: { Args: { p_group_id: string }; Returns: boolean }
      mark_bill_paid: {
        Args: {
          bill_id: string
          p_account_id: string
          p_actual_amount?: number
          p_payment_date?: string
          p_receipt_file_path?: string
        }
        Returns: {
          account_id: string | null
          actual_amount: number | null
          amount: number
          barcode: string | null
          card_id: string | null
          category_id: string | null
          competence: string | null
          created_at: string
          created_by: string
          description: string
          document_file_path: string | null
          due_date: string
          group_id: string
          id: string
          notes: string | null
          paid_at: string | null
          paid_transaction_id: string | null
          payment_date: string | null
          payment_receipt_path: string | null
          recurrence_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bills"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_card_invoice: {
        Args: {
          p_account_id: string
          p_invoice_id: string
          p_payment_date?: string
        }
        Returns: {
          card_id: string
          closing_date: string
          created_at: string
          due_date: string
          group_id: string
          id: string
          paid_at: string | null
          paid_transaction_id: string | null
          payment_account_id: string | null
          reference_month: string
          status: string
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "card_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_caixinha_deposit: {
        Args: {
          amount: number
          caixinha_id: string
          deposit_date?: string
          note?: string
        }
        Returns: string
      }
      remove_group_member: {
        Args: { p_member_id: string }
        Returns: {
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          joined_at: string
          permission_level: string
          removed_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "group_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transaction_account_effect: {
        Args: {
          p_account: string
          p_amount: number
          p_destination: string
          p_kind: string
          p_status: string
          p_target: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
