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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      moneyzap_categories: {
        Row: {
          color: string
          created_at: string | null
          entidade: number
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          entidade?: number
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          entidade?: number
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      moneyzap_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          target_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          target_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          target_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moneyzap_settings: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          encrypted: boolean | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      moneyzap_settings_history: {
        Row: {
          action: string
          category: string
          changed_at: string | null
          changed_by: string | null
          id: string
          key: string
          new_value: string | null
          old_value: string | null
          setting_id: string | null
        }
        Insert: {
          action: string
          category: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          key: string
          new_value?: string | null
          old_value?: string | null
          setting_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          key?: string
          new_value?: string | null
          old_value?: string | null
          setting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moneyzap_settings_history_setting_id_fkey"
            columns: ["setting_id"]
            isOneToOne: false
            referencedRelation: "moneyzap_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      moneyzap_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moneyzap_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          entidade: number
          goal_id: string | null
          id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          entidade?: number
          goal_id?: string | null
          id?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          entidade?: number
          goal_id?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moneyzap_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "moneyzap_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moneyzap_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "moneyzap_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      moneyzap_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          purpose: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purpose?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purpose?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moneyzap_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moneyzap_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moneyzap_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      moneyzap_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          indicacao: string | null
          is_active: boolean
          name: string | null
          phone: string | null
          profile_image: string | null
          referral_bonus_days: number | null
          referral_bonus_expires_at: string | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          indicacao?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          profile_image?: string | null
          referral_bonus_days?: number | null
          referral_bonus_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          indicacao?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          profile_image?: string | null
          referral_bonus_days?: number | null
          referral_bonus_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_moneyzap_users_referred_by"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "moneyzap_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_moneyzap_users_referred_by"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      referral_stats: {
        Row: {
          email: string | null
          id: string | null
          name: string | null
          recent_referrals: number | null
          referral_bonus_days: number | null
          referral_bonus_expires_at: string | null
          referral_code: string | null
          total_referrals: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      confirm_user_email: { Args: { user_email: string }; Returns: boolean }
      create_initial_admin_user: {
        Args: { admin_email?: string }
        Returns: undefined
      }
      create_update_goal_amount_function: { Args: never; Returns: undefined }
      decrypt_setting_value: {
        Args: { p_encrypted_value: string }
        Returns: string
      }
      encrypt_setting_value: { Args: { p_value: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_upload_path: {
        Args: { file_extension: string; user_id: string }
        Returns: string
      }
      get_by_email: {
        Args: { p_email: string }
        Returns: {
          current_period_end: string
          email: string
          plan_type: string
          subscription_status: string
          user_id: string
        }[]
      }
      get_file_public_url: { Args: { file_path: string }; Returns: string }
      get_setting: {
        Args: { p_category: string; p_key: string }
        Returns: string
      }
      get_settings_by_category: {
        Args: { p_category: string }
        Returns: {
          description: string
          encrypted: boolean
          key: string
          value: string
          value_type: string
        }[]
      }
      get_user_subscription_status: {
        Args: { p_user_id?: string }
        Returns: {
          current_period_end: string
          is_active: boolean
          plan_type: string
          status: string
          subscription_id: string
        }[]
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      migrate_existing_auth_users: { Args: never; Returns: undefined }
      promote_to_admin: { Args: { target_email: string }; Returns: boolean }
      recover_missing_users: {
        Args: never
        Returns: {
          recovered_count: number
        }[]
      }
      register_upload: {
        Args: {
          p_file_name: string
          p_file_path: string
          p_file_size?: number
          p_mime_type?: string
          p_purpose?: string
        }
        Returns: string
      }
      update_goal_amount: {
        Args: { p_amount_change: number; p_goal_id: string }
        Returns: number
      }
      update_subscription_status: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_current_period_end?: string
          p_current_period_start?: string
          p_status: string
          p_stripe_subscription_id: string
        }
        Returns: string
      }
      upsert_setting: {
        Args: {
          p_category: string
          p_description?: string
          p_encrypted?: boolean
          p_key: string
          p_value: string
          p_value_type?: string
        }
        Returns: string
      }
      validate_file_type: {
        Args: { allowed_extensions?: string[]; file_name: string }
        Returns: boolean
      }
      verify_installation: {
        Args: never
        Returns: {
          component: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      user_role: "user" | "admin" | "support"
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
      user_role: ["user", "admin", "support"],
    },
  },
} as const
