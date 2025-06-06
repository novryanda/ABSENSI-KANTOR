export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          approval_steps: Json
          created_at: string
          department_id: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          approval_steps: Json
          created_at?: string
          department_id?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_active?: boolean
          name: string
          updated_at: string
        }
        Update: {
          approval_steps?: Json
          created_at?: string
          department_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string
          document_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          rejected_at: string | null
          status: Database["public"]["Enums"]["approval_status"]
          step_order: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          document_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          step_order: number
          updated_at: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          document_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_leave_request_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_permission_request_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "permission_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_work_letter_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "work_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          check_in_address: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string | null
          check_out_address: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          working_hours_minutes: number
        }
        Insert: {
          attendance_date: string
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          working_hours_minutes?: number
        }
        Update: {
          attendance_date?: string
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
          working_hours_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          head_user_id: string | null
          id: string
          is_active: boolean
          name: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id: string
          is_active?: boolean
          name: string
          parent_department_id?: string | null
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_user_id_fkey"
            columns: ["head_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          attachment_file: string | null
          created_at: string
          current_approver_id: string | null
          description: string | null
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          rejected_at: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string
          total_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          attachment_file?: string | null
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          rejected_at?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          total_days: number
          updated_at: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          attachment_file?: string | null
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          total_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_type_configs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_days_per_year: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          max_days_per_year?: number
          name: string
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_days_per_year?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id: string
          message: string
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      office_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          updated_at: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      permission_requests: {
        Row: {
          approved_at: string | null
          attachment_file: string | null
          created_at: string
          current_approver_id: string | null
          description: string | null
          end_time: string
          id: string
          permission_date: string
          permission_type: Database["public"]["Enums"]["permission_type"]
          reason: string
          rejected_at: string | null
          rejection_reason: string | null
          start_time: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          attachment_file?: string | null
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          end_time: string
          id: string
          permission_date: string
          permission_type: Database["public"]["Enums"]["permission_type"]
          reason: string
          rejected_at?: string | null
          rejection_reason?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          updated_at: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          attachment_file?: string | null
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          end_time?: string
          id?: string
          permission_date?: string
          permission_type?: Database["public"]["Enums"]["permission_type"]
          reason?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_requests_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          permissions?: Json
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          expires: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          expires: string
          id: string
          session_token: string
          user_id: string
        }
        Update: {
          expires?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          data_type: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          data_type?: string
          description?: string | null
          id: string
          key: string
          updated_at: string
          value?: string | null
        }
        Update: {
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_leave_balances: {
        Row: {
          allocated_days: number
          created_at: string
          id: string
          leave_type_id: string
          remaining_days: number
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          allocated_days?: number
          created_at?: string
          id: string
          leave_type_id: string
          remaining_days?: number
          updated_at: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          allocated_days?: number
          created_at?: string
          id?: string
          leave_type_id?: string
          remaining_days?: number
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_type_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leave_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          login_at: string
          logout_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          login_at?: string
          logout_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          login_at?: string
          logout_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          department_id: string | null
          email: string
          email_verified: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          hire_date: string | null
          id: string
          image: string | null
          last_login: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          nip: string | null
          phone: string | null
          role_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          email_verified?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          hire_date?: string | null
          id: string
          image?: string | null
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nip?: string | null
          phone?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          email_verified?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          hire_date?: string | null
          id?: string
          image?: string | null
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          nip?: string | null
          phone?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      verificationtokens: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      work_letters: {
        Row: {
          approved_at: string | null
          attachment_file: string | null
          content: string
          created_at: string
          current_approver_id: string | null
          effective_date: string
          expiry_date: string | null
          id: string
          letter_number: string | null
          letter_type: Database["public"]["Enums"]["work_letter_type"]
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          attachment_file?: string | null
          content: string
          created_at?: string
          current_approver_id?: string | null
          effective_date: string
          expiry_date?: string | null
          id: string
          letter_number?: string | null
          letter_type: Database["public"]["Enums"]["work_letter_type"]
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject: string
          submitted_at?: string
          updated_at: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          attachment_file?: string | null
          content?: string
          created_at?: string
          current_approver_id?: string | null
          effective_date?: string
          expiry_date?: string | null
          id?: string
          letter_number?: string | null
          letter_type?: Database["public"]["Enums"]["work_letter_type"]
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_letters_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active?: boolean
          start_time: string
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      attendance_status: "present" | "late" | "absent" | "half_day"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      document_type: "leave" | "permission" | "work_letter"
      gender: "L" | "P"
      leave_type:
        | "annual"
        | "sick"
        | "maternity"
        | "paternity"
        | "emergency"
        | "unpaid"
      notification_status: "unread" | "read"
      notification_type: "info" | "warning" | "success" | "error"
      permission_type: "personal" | "medical" | "family" | "official" | "others"
      request_status: "pending" | "approved" | "rejected" | "cancelled"
      user_status: "active" | "inactive" | "terminated"
      work_letter_type:
        | "assignment"
        | "travel"
        | "training"
        | "official"
        | "others"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      attendance_status: ["present", "late", "absent", "half_day"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      document_type: ["leave", "permission", "work_letter"],
      gender: ["L", "P"],
      leave_type: [
        "annual",
        "sick",
        "maternity",
        "paternity",
        "emergency",
        "unpaid",
      ],
      notification_status: ["unread", "read"],
      notification_type: ["info", "warning", "success", "error"],
      permission_type: ["personal", "medical", "family", "official", "others"],
      request_status: ["pending", "approved", "rejected", "cancelled"],
      user_status: ["active", "inactive", "terminated"],
      work_letter_type: [
        "assignment",
        "travel",
        "training",
        "official",
        "others",
      ],
    },
  },
} as const
