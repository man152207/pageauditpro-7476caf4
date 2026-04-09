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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_metrics: {
        Row: {
          ai_insights: string | null
          audit_id: string
          computed_metrics: Json | null
          data_availability: Json | null
          demographics: Json | null
          fetched_at: string
          id: string
          raw_metrics: Json | null
        }
        Insert: {
          ai_insights?: string | null
          audit_id: string
          computed_metrics?: Json | null
          data_availability?: Json | null
          demographics?: Json | null
          fetched_at?: string
          id?: string
          raw_metrics?: Json | null
        }
        Update: {
          ai_insights?: string | null
          audit_id?: string
          computed_metrics?: Json | null
          data_availability?: Json | null
          demographics?: Json | null
          fetched_at?: string
          id?: string
          raw_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_metrics_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_schedules: {
        Row: {
          connection_id: string | null
          created_at: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_schedules_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_type: Database["public"]["Enums"]["audit_type"]
          created_at: string
          fb_connection_id: string | null
          id: string
          input_data: Json
          is_pro_unlocked: boolean
          organization_id: string | null
          page_name: string | null
          page_url: string | null
          recommendations: Json | null
          score_breakdown: Json | null
          score_total: number | null
          user_id: string
        }
        Insert: {
          audit_type?: Database["public"]["Enums"]["audit_type"]
          created_at?: string
          fb_connection_id?: string | null
          id?: string
          input_data?: Json
          is_pro_unlocked?: boolean
          organization_id?: string | null
          page_name?: string | null
          page_url?: string | null
          recommendations?: Json | null
          score_breakdown?: Json | null
          score_total?: number | null
          user_id: string
        }
        Update: {
          audit_type?: Database["public"]["Enums"]["audit_type"]
          created_at?: string
          fb_connection_id?: string | null
          id?: string
          input_data?: Json
          is_pro_unlocked?: boolean
          organization_id?: string | null
          page_name?: string | null
          page_url?: string | null
          recommendations?: Json | null
          score_breakdown?: Json | null
          score_total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          color: string | null
          created_at: string
          date: string
          id: string
          scheduled_post_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          id?: string
          scheduled_post_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          id?: string
          scheduled_post_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_connections: {
        Row: {
          access_token_encrypted: string | null
          connected_at: string
          created_at: string
          id: string
          is_active: boolean
          organization_id: string | null
          page_id: string
          page_name: string
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          page_id: string
          page_name: string
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          page_id?: string
          page_name?: string
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      free_audit_grants: {
        Row: {
          created_at: string | null
          grant_month: string
          granted_by: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          grant_month: string
          granted_by: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          grant_month?: string
          granted_by?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          branding_settings: Json | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          branding_settings?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          branding_settings?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gateway: string
          gateway_payment_id: string | null
          gateway_response: Json | null
          id: string
          organization_id: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gateway: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          organization_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gateway?: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          organization_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json | null
          id: string
          is_active: boolean
          limits: Json | null
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          limits?: Json | null
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          limits?: Json | null
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          organization_id: string | null
          phone: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: string | null
          phone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          is_public: boolean
          pdf_url: string | null
          share_slug: string | null
          views_count: number
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          pdf_url?: string | null
          share_slug?: string | null
          views_count?: number
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          pdf_url?: string | null
          share_slug?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          content: string
          created_at: string
          error_message: string | null
          fb_connection_id: string | null
          id: string
          media_urls: string[] | null
          platform: string
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          error_message?: string | null
          fb_connection_id?: string | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          error_message?: string | null
          fb_connection_id?: string | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          is_sensitive: boolean
          key: string
          scope: string
          scope_id: string | null
          updated_at: string
          updated_by: string | null
          value_encrypted: string | null
        }
        Insert: {
          id?: string
          is_sensitive?: boolean
          key: string
          scope?: string
          scope_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_encrypted?: string | null
        }
        Update: {
          id?: string
          is_sensitive?: boolean
          key?: string
          scope?: string
          scope_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_encrypted?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          gateway: string | null
          gateway_subscription_id: string | null
          id: string
          organization_id: string | null
          plan_id: string
          renews_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          gateway?: string | null
          gateway_subscription_id?: string | null
          id?: string
          organization_id?: string | null
          plan_id: string
          renews_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          gateway?: string | null
          gateway_subscription_id?: string | null
          id?: string
          organization_id?: string | null
          plan_id?: string
          renews_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      audit_type: "manual" | "automatic"
      billing_type: "free" | "one_time" | "monthly" | "yearly"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      post_status: "draft" | "scheduled" | "published" | "failed"
      subscription_status: "active" | "cancelled" | "expired" | "pending"
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
      app_role: ["super_admin", "admin", "user"],
      audit_type: ["manual", "automatic"],
      billing_type: ["free", "one_time", "monthly", "yearly"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      post_status: ["draft", "scheduled", "published", "failed"],
      subscription_status: ["active", "cancelled", "expired", "pending"],
    },
  },
} as const
