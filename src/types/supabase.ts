export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      buildings: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string | null
          metadata: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address?: string | null
          metadata?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string | null
          metadata?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string | null
          building_id: string | null
          messages: Json
          context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          building_id?: string | null
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          building_id?: string | null
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          building_id: string
          type: string
          name: string
          manufacturer: string | null
          model: string | null
          capabilities: Json
          state: Json
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          type: string
          name: string
          manufacturer?: string | null
          model?: string | null
          capabilities?: Json
          state?: Json
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          type?: string
          name?: string
          manufacturer?: string | null
          model?: string | null
          capabilities?: Json
          state?: Json
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      metrics: {
        Row: {
          time: string
          device_id: string | null
          metric_type: string
          value: number
          metadata: Json
        }
        Insert: {
          time: string
          device_id?: string | null
          metric_type: string
          value: number
          metadata?: Json
        }
        Update: {
          time?: string
          device_id?: string | null
          metric_type?: string
          value?: number
          metadata?: Json
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_organizations: {
        Row: {
          user_id: string
          organization_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          organization_id: string
          role?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          organization_id?: string
          role?: string
          created_at?: string
        }
      }
    }
    Views: {
      building_summary: {
        Row: {
          id: string | null
          name: string | null
          organization_id: string | null
          device_count: number | null
          online_devices: number | null
          last_activity: string | null
        }
      }
    }
    Functions: {
      create_demo_data: {
        Args: {
          user_id: string
        }
        Returns: void
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