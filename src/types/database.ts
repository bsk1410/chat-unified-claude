// ============================================================================
// Database Types
// Auto-generated types for Supabase database
// Run: npx supabase gen types typescript --linked > src/types/database.ts
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'EMAIL_CHANGE' | 'PROFILE_UPDATE' | 'SETTINGS_CHANGE';
          table_name: string | null;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'EMAIL_CHANGE' | 'PROFILE_UPDATE' | 'SETTINGS_CHANGE';
          table_name?: string | null;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'EMAIL_CHANGE' | 'PROFILE_UPDATE' | 'SETTINGS_CHANGE';
          table_name?: string | null;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          display_name: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          timezone: string;
          locale: string;
          theme: 'light' | 'dark' | 'system';
          preferences: Json;
          onboarding_completed: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          email?: string | null;
          display_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          timezone?: string;
          locale?: string;
          theme?: 'light' | 'dark' | 'system';
          preferences?: Json;
          onboarding_completed?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string | null;
          display_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          timezone?: string;
          locale?: string;
          theme?: 'light' | 'dark' | 'system';
          preferences?: Json;
          onboarding_completed?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      user_profiles_active: {
        Row: {
          id: string | null;
          user_id: string | null;
          email: string | null;
          display_name: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          timezone: string | null;
          locale: string | null;
          theme: 'light' | 'dark' | 'system' | null;
          preferences: Json | null;
          onboarding_completed: boolean | null;
          last_seen_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      apply_audit_trigger: {
        Args: {
          table_name: string;
        };
        Returns: undefined;
      };
      apply_standard_rls: {
        Args: {
          table_name: string;
        };
        Returns: undefined;
      };
      apply_updated_at_trigger: {
        Args: {
          table_name: string;
        };
        Returns: undefined;
      };
      create_active_view: {
        Args: {
          table_name: string;
        };
        Returns: undefined;
      };
      get_max_file_size: {
        Args: {
          bucket_name: string;
        };
        Returns: number;
      };
      is_owner: {
        Args: {
          record_user_id: string;
        };
        Returns: boolean;
      };
      is_valid_image_type: {
        Args: {
          filename: string;
        };
        Returns: boolean;
      };
      log_auth_event: {
        Args: {
          p_action: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      update_last_seen: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ----------------------------------------------------------------------------
// Helper Types
// ----------------------------------------------------------------------------

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

// ----------------------------------------------------------------------------
// Convenience Type Aliases
// ----------------------------------------------------------------------------

export type UserProfile = Tables<'user_profiles'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

export type AuditLog = Tables<'audit_log'>;
export type AuditLogInsert = TablesInsert<'audit_log'>;
