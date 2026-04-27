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
      dsps: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      legacy_dsp_payloads: {
        Row: {
          created_at: string
          dsp_id: string
          id: string
          payload_key: string
          raw_payload: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          dsp_id: string
          id?: string
          payload_key: string
          raw_payload?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          dsp_id?: string
          id?: string
          payload_key?: string
          raw_payload?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_dsp_payloads_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_phone_list_entries: {
        Row: {
          created_at: string
          dsp_id: string
          home_phone: string
          id: string
          label: string
          last_name: string
          mobile_phone: string
          sort_order: number
          updated_at: string
          work_phone: string
        }
        Insert: {
          created_at?: string
          dsp_id: string
          home_phone?: string
          id?: string
          label: string
          last_name?: string
          mobile_phone?: string
          sort_order?: number
          updated_at?: string
          work_phone?: string
        }
        Update: {
          created_at?: string
          dsp_id?: string
          home_phone?: string
          id?: string
          label?: string
          last_name?: string
          mobile_phone?: string
          sort_order?: number
          updated_at?: string
          work_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_phone_list_entries_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      module_states: {
        Row: {
          created_at: string
          dsp_id: string | null
          id: string
          module_code: string
          state_key: string
          state_payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dsp_id?: string | null
          id?: string
          module_code: string
          state_key: string
          state_payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dsp_id?: string | null
          id?: string
          module_code?: string
          state_key?: string
          state_payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_states_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string
          created_at: string
          dsp_id: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          dsp_id: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          dsp_id?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          created_at: string
          data: Json | null
          description: string | null
          dsp_id: string | null
          id: string
          module_code: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description?: string | null
          dsp_id?: string | null
          id?: string
          module_code?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string | null
          dsp_id?: string | null
          id?: string
          module_code?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      submitted_requests: {
        Row: {
          category: string
          created_at: string
          details: string | null
          dsp_id: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          dsp_id?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          dsp_id?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submitted_requests_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dsp_access: {
        Row: {
          dsp_id: string
          granted_at: string
          id: string
          user_id: string
        }
        Insert: {
          dsp_id: string
          granted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          dsp_id?: string
          granted_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dsp_access_dsp_id_fkey"
            columns: ["dsp_id"]
            isOneToOne: false
            referencedRelation: "dsps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          granted_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "dispatch_manager"
        | "dispatch_supervisor"
        | "dispatch_lead"
        | "dispatcher"
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
      app_role: [
        "admin",
        "dispatch_manager",
        "dispatch_supervisor",
        "dispatch_lead",
        "dispatcher",
      ],
    },
  },
} as const
