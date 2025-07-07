export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          organization_id: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          slug: string;
          owner_id: string;
          subscription_tier: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          slug: string;
          owner_id: string;
          subscription_tier?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          subscription_tier?: string;
          metadata?: Json | null;
        };
      };
      uploaded_files: {
        Row: {
          id: string;
          created_at: string;
          conversation_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          public_url: string | null;
          extracted_data: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          conversation_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          public_url?: string | null;
          extracted_data?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          conversation_id?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          storage_path?: string;
          public_url?: string | null;
          extracted_data?: Json | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          created_at: string;
          organization_id: string;
          user_id: string | null;
          email: string;
          name: string | null;
          role: string;
          custom_permissions: string[] | null;
          status: string;
          invited_by: string;
          joined_at: string | null;
          last_active: string | null;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          organization_id: string;
          user_id?: string | null;
          email: string;
          name?: string | null;
          role: string;
          custom_permissions?: string[] | null;
          status?: string;
          invited_by: string;
          joined_at?: string | null;
          last_active?: string | null;
          removed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          organization_id?: string;
          user_id?: string | null;
          email?: string;
          name?: string | null;
          role?: string;
          custom_permissions?: string[] | null;
          status?: string;
          invited_by?: string;
          joined_at?: string | null;
          last_active?: string | null;
          removed_at?: string | null;
        };
      };
      team_invitations: {
        Row: {
          id: string;
          created_at: string;
          organization_id: string;
          email: string;
          role: string;
          custom_permissions: string[] | null;
          invited_by: string;
          status: string;
          expires_at: string;
          accepted_at: string | null;
          code: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          organization_id: string;
          email: string;
          role: string;
          custom_permissions?: string[] | null;
          invited_by: string;
          status?: string;
          expires_at: string;
          accepted_at?: string | null;
          code?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          organization_id?: string;
          email?: string;
          role?: string;
          custom_permissions?: string[] | null;
          invited_by?: string;
          status?: string;
          expires_at?: string;
          accepted_at?: string | null;
          code?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
