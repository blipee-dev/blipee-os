
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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          agent_id: string
          created_at: string | null
          description: string
          id: string
          metrics: Json | null
          organization_id: string
          recommendations: string[] | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id: string
          created_at?: string | null
          description: string
          id?: string
          metrics?: Json | null
          organization_id: string
          recommendations?: string[] | null
          severity: string
          title: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id?: string
          created_at?: string | null
          description?: string
          id?: string
          metrics?: Json | null
          organization_id?: string
          recommendations?: string[] | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_analyses: {
        Row: {
          agent_id: string
          analysis_type: string
          context: Json | null
          created_at: string | null
          id: string
          insights: string[] | null
          organization_id: string
          results: Json
        }
        Insert: {
          agent_id: string
          analysis_type: string
          context?: Json | null
          created_at?: string | null
          id?: string
          insights?: string[] | null
          organization_id: string
          results: Json
        }
        Update: {
          agent_id?: string
          analysis_type?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          insights?: string[] | null
          organization_id?: string
          results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agent_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_approvals: {
        Row: {
          agent_id: string
          approval_notes: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          organization_id: string
          requested_by: string | null
          status: string | null
          task: Json
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          approval_notes?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          requested_by?: string | null
          status?: string | null
          task: Json
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          approval_notes?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          requested_by?: string | null
          status?: string | null
          task?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_collaborations: {
        Row: {
          collaboration_data: Json
          collaboration_type: string
          collaborator_agent_id: string
          created_at: string | null
          id: string
          initiator_agent_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          collaboration_data: Json
          collaboration_type: string
          collaborator_agent_id: string
          created_at?: string | null
          id?: string
          initiator_agent_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          collaboration_data?: Json
          collaboration_type?: string
          collaborator_agent_id?: string
          created_at?: string | null
          id?: string
          initiator_agent_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_collaborations_collaborator_agent_id_fkey"
            columns: ["collaborator_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_collaborations_initiator_agent_id_fkey"
            columns: ["initiator_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_configs: {
        Row: {
          agent_id: string
          agent_type: string
          capabilities: Json
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          execution_interval: number | null
          id: string
          max_autonomy_level: number | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          agent_type: string
          capabilities?: Json
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          execution_interval?: number | null
          id?: string
          max_autonomy_level?: number | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          agent_type?: string
          capabilities?: Json
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          execution_interval?: number | null
          id?: string
          max_autonomy_level?: number | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_decisions: {
        Row: {
          agent_instance_id: string
          approval_id: string | null
          approval_required: boolean | null
          autonomy_level_used: number | null
          confidence_score: number | null
          created_at: string | null
          decision_context: Json
          decision_outcome: Json
          decision_type: string
          id: string
          task_execution_id: string | null
        }
        Insert: {
          agent_instance_id: string
          approval_id?: string | null
          approval_required?: boolean | null
          autonomy_level_used?: number | null
          confidence_score?: number | null
          created_at?: string | null
          decision_context: Json
          decision_outcome: Json
          decision_type: string
          id?: string
          task_execution_id?: string | null
        }
        Update: {
          agent_instance_id?: string
          approval_id?: string | null
          approval_required?: boolean | null
          autonomy_level_used?: number | null
          confidence_score?: number | null
          created_at?: string | null
          decision_context?: Json
          decision_outcome?: Json
          decision_type?: string
          id?: string
          task_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_decisions_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_decisions_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "agent_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_decisions_task_execution_id_fkey"
            columns: ["task_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_task_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_definitions: {
        Row: {
          capabilities: Json | null
          configuration: Json | null
          created_at: string | null
          default_autonomy_level: number
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          default_autonomy_level?: number
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          default_autonomy_level?: number
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_errors: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string | null
          error: string
          id: string
          organization_id: string
          stack: string | null
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string | null
          error: string
          id?: string
          organization_id: string
          stack?: string | null
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string | null
          error?: string
          id?: string
          organization_id?: string
          stack?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_errors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          agent_id: string
          created_at: string | null
          details: Json | null
          event: string
          id: string
          organization_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          details?: Json | null
          event: string
          id?: string
          organization_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          details?: Json | null
          event?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_instances: {
        Row: {
          agent_definition_id: string
          autonomy_level: number
          configuration: Json | null
          created_at: string | null
          health_score: number | null
          id: string
          last_heartbeat: string | null
          name: string
          organization_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_definition_id: string
          autonomy_level?: number
          configuration?: Json | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_heartbeat?: string | null
          name: string
          organization_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_definition_id?: string
          autonomy_level?: number
          configuration?: Json | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_heartbeat?: string | null
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_instances_agent_definition_id_fkey"
            columns: ["agent_definition_id"]
            isOneToOne: false
            referencedRelation: "agent_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          learning: Json
          organization_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          learning: Json
          organization_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          learning?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_base: {
        Row: {
          agent_id: string
          category: string
          confidence: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          knowledge: Json
          organization_id: string
          source: string
          validated_at: string | null
        }
        Insert: {
          agent_id: string
          category: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          knowledge: Json
          organization_id: string
          source: string
          validated_at?: string | null
        }
        Update: {
          agent_id?: string
          category?: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          knowledge?: Json
          organization_id?: string
          source?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_learning_patterns: {
        Row: {
          agent_instance_id: string
          confidence_score: number | null
          created_at: string | null
          id: string
          last_used: string | null
          pattern_data: Json
          pattern_name: string
          pattern_type: string
          success_rate: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          agent_instance_id: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          pattern_data: Json
          pattern_name: string
          pattern_type: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          agent_instance_id?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          pattern_data?: Json
          pattern_name?: string
          pattern_type?: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_learning_patterns_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_metrics: {
        Row: {
          agent_instance_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          agent_instance_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          agent_instance_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outcomes: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string | null
          execution_time: number
          id: string
          impact: Json | null
          organization_id: string
          success: boolean
          task_type: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string | null
          execution_time: number
          id?: string
          impact?: Json | null
          organization_id: string
          success: boolean
          task_type: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string | null
          execution_time?: number
          id?: string
          impact?: Json | null
          organization_id?: string
          success?: boolean
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_patterns: {
        Row: {
          agent_id: string
          applicable_to: string[] | null
          confidence: number | null
          context: Json | null
          created_at: string | null
          id: string
          last_used: string | null
          organization_id: string
          outcomes: Json | null
          pattern: string
          use_count: number | null
        }
        Insert: {
          agent_id: string
          applicable_to?: string[] | null
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          organization_id: string
          outcomes?: Json | null
          pattern: string
          use_count?: number | null
        }
        Update: {
          agent_id?: string
          applicable_to?: string[] | null
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          organization_id?: string
          outcomes?: Json | null
          pattern?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_results: {
        Row: {
          actions: Json | null
          agent_id: string
          created_at: string | null
          execution_time_ms: number | null
          id: string
          insights: string[] | null
          next_steps: string[] | null
          organization_id: string
          success: boolean
          task_id: string
        }
        Insert: {
          actions?: Json | null
          agent_id: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          insights?: string[] | null
          next_steps?: string[] | null
          organization_id: string
          success: boolean
          task_id: string
        }
        Update: {
          actions?: Json | null
          agent_id?: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          insights?: string[] | null
          next_steps?: string[] | null
          organization_id?: string
          success?: boolean
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_scheduled_tasks: {
        Row: {
          agent_id: string
          created_at: string | null
          data: Json | null
          enabled: boolean | null
          id: string
          last_run: string | null
          next_run: string | null
          organization_id: string
          priority: string | null
          requires_approval: boolean | null
          schedule_pattern: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          data?: Json | null
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          organization_id: string
          priority?: string | null
          requires_approval?: boolean | null
          schedule_pattern: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          data?: Json | null
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          organization_id?: string
          priority?: string | null
          requires_approval?: boolean | null
          schedule_pattern?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_scheduled_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_executions: {
        Row: {
          agent_instance_id: string
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          priority: string
          retry_count: number | null
          scheduled_task_id: string | null
          started_at: string | null
          status: string
          task_name: string
          task_type: string
        }
        Insert: {
          agent_instance_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          priority?: string
          retry_count?: number | null
          scheduled_task_id?: string | null
          started_at?: string | null
          status?: string
          task_name: string
          task_type: string
        }
        Update: {
          agent_instance_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          priority?: string
          retry_count?: number | null
          scheduled_task_id?: string | null
          started_at?: string | null
          status?: string
          task_name?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_executions_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_task_executions_scheduled_task_id_fkey"
            columns: ["scheduled_task_id"]
            isOneToOne: false
            referencedRelation: "agent_scheduled_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          message_id: string
          metadata: Json | null
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message_id: string
          metadata?: Json | null
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message_id?: string
          metadata?: Json | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      air_emissions: {
        Row: {
          cas_number: string | null
          compliance_status: string | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          emission_source_id: string | null
          facility_id: string | null
          id: string
          measurement_method: string | null
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          pollutant_name: string | null
          pollutant_type: string
          quantity: number
          quantity_unit: string
          regulatory_limit: number | null
          regulatory_limit_unit: string | null
          tags: string[] | null
          uncertainty_percent: number | null
          updated_at: string | null
        }
        Insert: {
          cas_number?: string | null
          compliance_status?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          emission_source_id?: string | null
          facility_id?: string | null
          id?: string
          measurement_method?: string | null
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          pollutant_name?: string | null
          pollutant_type: string
          quantity: number
          quantity_unit: string
          regulatory_limit?: number | null
          regulatory_limit_unit?: string | null
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          cas_number?: string | null
          compliance_status?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          emission_source_id?: string | null
          facility_id?: string | null
          id?: string
          measurement_method?: string | null
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          pollutant_name?: string | null
          pollutant_type?: string
          quantity?: number
          quantity_unit?: string
          regulatory_limit?: number | null
          regulatory_limit_unit?: string | null
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "air_emissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "air_emissions_emission_source_id_fkey"
            columns: ["emission_source_id"]
            isOneToOne: false
            referencedRelation: "emission_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "air_emissions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "air_emissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          channels: string[] | null
          condition: string
          created_at: string | null
          description: string | null
          duration: number | null
          enabled: boolean | null
          id: string
          metadata: Json | null
          metric: string
          name: string
          severity: string
          threshold: number
          updated_at: string | null
        }
        Insert: {
          channels?: string[] | null
          condition: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          metric: string
          name: string
          severity: string
          threshold: number
          updated_at?: string | null
        }
        Update: {
          channels?: string[] | null
          condition?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          metric?: string
          name?: string
          severity?: string
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string | null
          current_value: number | null
          details: Json | null
          id: string
          message: string
          metric: string | null
          name: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          threshold: number | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          details?: Json | null
          id?: string
          message: string
          metric?: string | null
          name: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          threshold?: number | null
          timestamp: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          details?: Json | null
          id?: string
          message?: string
          metric?: string | null
          name?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold?: number | null
          timestamp?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_ips: unknown[] | null
          allowed_origins: string[] | null
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_four: string
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit_override: number | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          scopes: string[] | null
          status: Database["public"]["Enums"]["api_key_status"]
          version: string
        }
        Insert: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_four: string
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit_override?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["api_key_status"]
          version?: string
        }
        Update: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_four?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit_override?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["api_key_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_quotas: {
        Row: {
          api_key_id: string
          created_at: string
          current_usage: number
          id: string
          limit_value: number
          period: string
          quota_type: string
          reset_at: string
          updated_at: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          current_usage?: number
          id?: string
          limit_value: number
          period: string
          quota_type: string
          reset_at: string
          updated_at?: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          current_usage?: number
          id?: string
          limit_value?: number
          period?: string
          quota_type?: string
          reset_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_quotas_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          origin: string | null
          rate_limit_remaining: number | null
          rate_limit_reset: string | null
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number
          status_code: number
          user_agent: string | null
          version: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          origin?: string | null
          rate_limit_remaining?: number | null
          rate_limit_reset?: string | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms: number
          status_code: number
          user_agent?: string | null
          version: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          origin?: string | null
          rate_limit_remaining?: number | null
          rate_limit_reset?: string | null
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number
          status_code?: number
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_hourly: {
        Row: {
          api_key_id: string
          avg_response_time_ms: number | null
          failed_requests: number
          hour: string
          id: string
          p95_response_time_ms: number | null
          p99_response_time_ms: number | null
          status_codes: Json | null
          successful_requests: number
          top_endpoints: Json | null
          total_request_bytes: number | null
          total_requests: number
          total_response_bytes: number | null
        }
        Insert: {
          api_key_id: string
          avg_response_time_ms?: number | null
          failed_requests?: number
          hour: string
          id?: string
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          status_codes?: Json | null
          successful_requests?: number
          top_endpoints?: Json | null
          total_request_bytes?: number | null
          total_requests?: number
          total_response_bytes?: number | null
        }
        Update: {
          api_key_id?: string
          avg_response_time_ms?: number | null
          failed_requests?: number
          hour?: string
          id?: string
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          status_codes?: Json | null
          successful_requests?: number
          top_endpoints?: Json | null
          total_request_bytes?: number | null
          total_requests?: number
          total_response_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_hourly_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_event_types: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          name: string
          severity: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          name: string
          severity: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown | null
          actor_type: string
          actor_user_agent: string | null
          api_key_id: string | null
          building_id: string | null
          changes: Json | null
          error_code: string | null
          error_message: string | null
          error_stack_trace: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          request_id: string | null
          result: string
          session_id: string | null
          severity: string
          target_id: string | null
          target_name: string | null
          target_type: string | null
          timestamp: string
          type: string
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown | null
          actor_type: string
          actor_user_agent?: string | null
          api_key_id?: string | null
          building_id?: string | null
          changes?: Json | null
          error_code?: string | null
          error_message?: string | null
          error_stack_trace?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          request_id?: string | null
          result: string
          session_id?: string | null
          severity: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          timestamp?: string
          type: string
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown | null
          actor_type?: string
          actor_user_agent?: string | null
          api_key_id?: string | null
          building_id?: string | null
          changes?: Json | null
          error_code?: string | null
          error_message?: string | null
          error_stack_trace?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          request_id?: string | null
          result?: string
          session_id?: string | null
          severity?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          timestamp?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_history: {
        Row: {
          backup_id: string
          backup_type: string
          compressed: boolean | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          format: string
          id: string
          metadata: Json | null
          size_bytes: number | null
          status: string | null
          tables: string[] | null
        }
        Insert: {
          backup_id: string
          backup_type: string
          compressed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          format: string
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          status?: string | null
          tables?: string[] | null
        }
        Update: {
          backup_id?: string
          backup_type?: string
          compressed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          format?: string
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          status?: string | null
          tables?: string[] | null
        }
        Relationships: []
      }
      benchmark_cohorts: {
        Row: {
          created_at: string | null
          criteria: Json | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      benchmark_contributions: {
        Row: {
          id: string
          industry: string
          metrics: Json
          organization_id: string
          privacy_applied: boolean | null
          region: string
          size: string
          timestamp: string | null
        }
        Insert: {
          id?: string
          industry: string
          metrics: Json
          organization_id: string
          privacy_applied?: boolean | null
          region: string
          size: string
          timestamp?: string | null
        }
        Update: {
          id?: string
          industry?: string
          metrics?: Json
          organization_id?: string
          privacy_applied?: boolean | null
          region?: string
          size?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_contributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_data_points: {
        Row: {
          created_at: string | null
          data_source: string | null
          id: string
          metric_id: string
          organization_id: string
          period_quarter: number | null
          period_year: number
          value: number
          verification_method: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          metric_id: string
          organization_id: string
          period_quarter?: number | null
          period_year: number
          value: number
          verification_method?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          metric_id?: string
          organization_id?: string
          period_quarter?: number | null
          period_year?: number
          value?: number
          verification_method?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_data_points_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "industry_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_data_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      biodiversity_sites: {
        Row: {
          area_hectares: number | null
          assessment_method: string | null
          biodiversity_management_plan: boolean | null
          biodiversity_value: string | null
          created_at: string | null
          distance_to_protected_area_km: number | null
          endemic_species: number | null
          facility_id: string | null
          id: string
          iucn_red_list_species: number | null
          key_biodiversity_area: boolean | null
          last_assessment_date: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          migratory_species: number | null
          monitoring_program: boolean | null
          near_protected_area: boolean | null
          next_assessment_date: string | null
          organization_id: string
          protected_area_name: string | null
          protected_area_type: string | null
          restoration_activities: boolean | null
          site_name: string
          site_type: string | null
          updated_at: string | null
        }
        Insert: {
          area_hectares?: number | null
          assessment_method?: string | null
          biodiversity_management_plan?: boolean | null
          biodiversity_value?: string | null
          created_at?: string | null
          distance_to_protected_area_km?: number | null
          endemic_species?: number | null
          facility_id?: string | null
          id?: string
          iucn_red_list_species?: number | null
          key_biodiversity_area?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          migratory_species?: number | null
          monitoring_program?: boolean | null
          near_protected_area?: boolean | null
          next_assessment_date?: string | null
          organization_id: string
          protected_area_name?: string | null
          protected_area_type?: string | null
          restoration_activities?: boolean | null
          site_name: string
          site_type?: string | null
          updated_at?: string | null
        }
        Update: {
          area_hectares?: number | null
          assessment_method?: string | null
          biodiversity_management_plan?: boolean | null
          biodiversity_value?: string | null
          created_at?: string | null
          distance_to_protected_area_km?: number | null
          endemic_species?: number | null
          facility_id?: string | null
          id?: string
          iucn_red_list_species?: number | null
          key_biodiversity_area?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          migratory_species?: number | null
          monitoring_program?: boolean | null
          near_protected_area?: boolean | null
          next_assessment_date?: string | null
          organization_id?: string
          protected_area_name?: string | null
          protected_area_type?: string | null
          restoration_activities?: boolean | null
          site_name?: string
          site_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biodiversity_sites_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biodiversity_sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          building_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          occupancy_type: string | null
          organization_id: string
          postal_code: string | null
          square_footage: number | null
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          building_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          occupancy_type?: string | null
          organization_id: string
          postal_code?: string | null
          square_footage?: number | null
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          building_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          occupancy_type?: string | null
          organization_id?: string
          postal_code?: string | null
          square_footage?: number | null
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          active: boolean | null
          cohort_id: string
          id: string
          joined_at: string | null
          organization_id: string
        }
        Insert: {
          active?: boolean | null
          cohort_id: string
          id?: string
          joined_at?: string | null
          organization_id: string
        }
        Update: {
          active?: boolean | null
          cohort_id?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "benchmark_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          created_at: string | null
          findings: Json | null
          framework: string
          generated_at: string
          id: string
          period_end: string
          period_start: string
          recommendations: string[] | null
          summary: Json
        }
        Insert: {
          created_at?: string | null
          findings?: Json | null
          framework: string
          generated_at?: string
          id?: string
          period_end: string
          period_start: string
          recommendations?: string[] | null
          summary: Json
        }
        Update: {
          created_at?: string | null
          findings?: Json | null
          framework?: string
          generated_at?: string
          id?: string
          period_end?: string
          period_start?: string
          recommendations?: string[] | null
          summary?: Json
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          ai_provider_usage: Json | null
          avg_conversation_length: number
          created_at: string
          date: string
          id: string
          organization_id: string
          response_times: Json | null
          sentiment_distribution: Json | null
          top_topics: string[] | null
          total_conversations: number
          total_messages: number
          updated_at: string
          user_id: string
          user_satisfaction_score: number | null
        }
        Insert: {
          ai_provider_usage?: Json | null
          avg_conversation_length?: number
          created_at?: string
          date?: string
          id?: string
          organization_id: string
          response_times?: Json | null
          sentiment_distribution?: Json | null
          top_topics?: string[] | null
          total_conversations?: number
          total_messages?: number
          updated_at?: string
          user_id: string
          user_satisfaction_score?: number | null
        }
        Update: {
          ai_provider_usage?: Json | null
          avg_conversation_length?: number
          created_at?: string
          date?: string
          id?: string
          organization_id?: string
          response_times?: Json | null
          sentiment_distribution?: Json | null
          top_topics?: string[] | null
          total_conversations?: number
          total_messages?: number
          updated_at?: string
          user_id?: string
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_contexts: {
        Row: {
          context_data: Json
          conversation_id: string
          created_at: string
          expires_at: string
          id: string
          organization_id: string
          relevance_score: number
          token_estimate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          context_data: Json
          conversation_id: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id: string
          relevance_score?: number
          token_estimate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          context_data?: Json
          conversation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string
          relevance_score?: number
          token_estimate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_contexts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_memories: {
        Row: {
          created_at: string
          entities: Json | null
          id: string
          key_topics: string[] | null
          metadata: Json | null
          organization_id: string
          preferences: Json | null
          sentiment: Json | null
          summary: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entities?: Json | null
          id?: string
          key_topics?: string[] | null
          metadata?: Json | null
          organization_id: string
          preferences?: Json | null
          sentiment?: Json | null
          summary: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entities?: Json | null
          id?: string
          key_topics?: string[] | null
          metadata?: Json | null
          organization_id?: string
          preferences?: Json | null
          sentiment?: Json | null
          summary?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_entities: string[] | null
          context_type: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          organization_id: string
          parent_conversation_id: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          summary: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_entities?: string[] | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          organization_id: string
          parent_conversation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_entities?: string[] | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          organization_id?: string
          parent_conversation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_parent_conversation_id_fkey"
            columns: ["parent_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_contributions: {
        Row: {
          anonymization_metadata: Json | null
          category: string
          created_at: string | null
          data: Json
          description: string | null
          id: string
          privacy_applied: boolean | null
          provider_id: string
          quality_score: number | null
          time_range: Json | null
        }
        Insert: {
          anonymization_metadata?: Json | null
          category: string
          created_at?: string | null
          data: Json
          description?: string | null
          id?: string
          privacy_applied?: boolean | null
          provider_id: string
          quality_score?: number | null
          time_range?: Json | null
        }
        Update: {
          anonymization_metadata?: Json | null
          category?: string
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          privacy_applied?: boolean | null
          provider_id?: string
          quality_score?: number | null
          time_range?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_contributions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          requested_at: string
          scheduled_for: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          requested_at?: string
          scheduled_for: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_exchange_agreements: {
        Row: {
          consumer_id: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          provider_id: string
          status: string | null
          terms: Json | null
        }
        Insert: {
          consumer_id: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          provider_id: string
          status?: string | null
          terms?: Json | null
        }
        Update: {
          consumer_id?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          provider_id?: string
          status?: string | null
          terms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_exchange_agreements_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_exchange_agreements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          expires_at: string | null
          format: string
          id: string
          metadata: Json | null
          requested_at: string
          scope: string[] | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          metadata?: Json | null
          requested_at?: string
          scope?: string[] | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          metadata?: Json | null
          requested_at?: string
          scope?: string[] | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      data_listings: {
        Row: {
          access: Json | null
          active: boolean | null
          category: string
          created_at: string | null
          data_type: string
          description: string | null
          geography: string[] | null
          id: string
          industry: string[] | null
          metadata: Json | null
          pricing: Json | null
          privacy_guarantees: Json | null
          provider_id: string
          quality: Json | null
          time_range: Json | null
          title: string
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          access?: Json | null
          active?: boolean | null
          category: string
          created_at?: string | null
          data_type: string
          description?: string | null
          geography?: string[] | null
          id?: string
          industry?: string[] | null
          metadata?: Json | null
          pricing?: Json | null
          privacy_guarantees?: Json | null
          provider_id: string
          quality?: Json | null
          time_range?: Json | null
          title: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          access?: Json | null
          active?: boolean | null
          category?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          geography?: string[] | null
          id?: string
          industry?: string[] | null
          metadata?: Json | null
          pricing?: Json | null
          privacy_guarantees?: Json | null
          provider_id?: string
          quality?: Json | null
          time_range?: Json | null
          title?: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_activities: {
        Row: {
          created_at: string | null
          cross_border_transfers: boolean | null
          data_categories: string[]
          data_subjects: string[]
          id: string
          legal_basis: string
          name: string
          purpose: string
          recipients: string[] | null
          retention_period: string
          safeguards: string[] | null
          transfer_mechanisms: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cross_border_transfers?: boolean | null
          data_categories: string[]
          data_subjects: string[]
          id?: string
          legal_basis: string
          name: string
          purpose: string
          recipients?: string[] | null
          retention_period: string
          safeguards?: string[] | null
          transfer_mechanisms?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cross_border_transfers?: boolean | null
          data_categories?: string[]
          data_subjects?: string[]
          id?: string
          legal_basis?: string
          name?: string
          purpose?: string
          recipients?: string[] | null
          retention_period?: string
          safeguards?: string[] | null
          transfer_mechanisms?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean | null
          created_at: string | null
          data_type: string
          exceptions: string[] | null
          framework: string
          id: string
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          auto_delete?: boolean | null
          created_at?: string | null
          data_type: string
          exceptions?: string[] | null
          framework: string
          id?: string
          retention_days: number
          updated_at?: string | null
        }
        Update: {
          auto_delete?: boolean | null
          created_at?: string | null
          data_type?: string
          exceptions?: string[] | null
          framework?: string
          id?: string
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      data_transactions: {
        Row: {
          access_details: Json | null
          consumer_id: string
          credits: number | null
          id: string
          listing_id: string
          provider_id: string
          status: string
          timestamp: string | null
          transaction_type: string
        }
        Insert: {
          access_details?: Json | null
          consumer_id: string
          credits?: number | null
          id?: string
          listing_id: string
          provider_id: string
          status: string
          timestamp?: string | null
          transaction_type: string
        }
        Update: {
          access_details?: Json | null
          consumer_id?: string
          credits?: number | null
          id?: string
          listing_id?: string
          provider_id?: string
          status?: string
          timestamp?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_transactions_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "data_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      database_health_metrics: {
        Row: {
          checked_at: string | null
          id: string
          is_healthy: boolean | null
          metric_name: string
          metric_value: number
          threshold_critical: number | null
          threshold_warning: number | null
          unit: string | null
        }
        Insert: {
          checked_at?: string | null
          id?: string
          is_healthy?: boolean | null
          metric_name: string
          metric_value: number
          threshold_critical?: number | null
          threshold_warning?: number | null
          unit?: string | null
        }
        Update: {
          checked_at?: string | null
          id?: string
          is_healthy?: boolean | null
          metric_name?: string
          metric_value?: number
          threshold_critical?: number | null
          threshold_warning?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      document_uploads: {
        Row: {
          building_id: string | null
          created_at: string | null
          document_type: string
          error_message: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          organization_id: string
          processing_status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          document_type: string
          error_message?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          organization_id: string
          processing_status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          document_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          organization_id?: string
          processing_status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_uploads_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          confidentiality_level: string | null
          created_at: string | null
          created_by: string
          delete_after: string | null
          description: string | null
          document_group_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_data: Json | null
          extracted_text: string | null
          extraction_status: string | null
          file_hash: string
          file_name: string
          file_size_bytes: number
          id: string
          is_current_version: boolean | null
          metadata: Json | null
          mime_type: string
          organization_id: string
          previous_version_id: string | null
          related_to_ids: string[] | null
          related_to_type: string | null
          retention_period_days: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          storage_path: string
          storage_provider: string | null
          storage_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          confidentiality_level?: string | null
          created_at?: string | null
          created_by: string
          delete_after?: string | null
          description?: string | null
          document_group_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_data?: Json | null
          extracted_text?: string | null
          extraction_status?: string | null
          file_hash: string
          file_name: string
          file_size_bytes: number
          id?: string
          is_current_version?: boolean | null
          metadata?: Json | null
          mime_type: string
          organization_id: string
          previous_version_id?: string | null
          related_to_ids?: string[] | null
          related_to_type?: string | null
          retention_period_days?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          storage_path: string
          storage_provider?: string | null
          storage_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version_number?: number
        }
        Update: {
          confidentiality_level?: string | null
          created_at?: string | null
          created_by?: string
          delete_after?: string | null
          description?: string | null
          document_group_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_data?: Json | null
          extracted_text?: string | null
          extraction_status?: string | null
          file_hash?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          is_current_version?: boolean | null
          metadata?: Json | null
          mime_type?: string
          organization_id?: string
          previous_version_id?: string | null
          related_to_ids?: string[] | null
          related_to_type?: string | null
          retention_period_days?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          storage_path?: string
          storage_provider?: string | null
          storage_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emission_factors: {
        Row: {
          activity_type: string
          assumptions: string | null
          calculation_method: string | null
          category: Database["public"]["Enums"]["emission_source_category"]
          code: string | null
          created_at: string | null
          factor_unit: string
          factor_value: number
          id: string
          metadata: Json | null
          name: string
          quality_rating: number | null
          regions: string[] | null
          scope: Database["public"]["Enums"]["emission_scope"]
          source_document: string | null
          source_organization: string
          source_year: number | null
          subcategory: string | null
          uncertainty_percent: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          activity_type: string
          assumptions?: string | null
          calculation_method?: string | null
          category: Database["public"]["Enums"]["emission_source_category"]
          code?: string | null
          created_at?: string | null
          factor_unit: string
          factor_value: number
          id?: string
          metadata?: Json | null
          name: string
          quality_rating?: number | null
          regions?: string[] | null
          scope: Database["public"]["Enums"]["emission_scope"]
          source_document?: string | null
          source_organization: string
          source_year?: number | null
          subcategory?: string | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          activity_type?: string
          assumptions?: string | null
          calculation_method?: string | null
          category?: Database["public"]["Enums"]["emission_source_category"]
          code?: string | null
          created_at?: string | null
          factor_unit?: string
          factor_value?: number
          id?: string
          metadata?: Json | null
          name?: string
          quality_rating?: number | null
          regions?: string[] | null
          scope?: Database["public"]["Enums"]["emission_scope"]
          source_document?: string | null
          source_organization?: string
          source_year?: number | null
          subcategory?: string | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      emission_sources: {
        Row: {
          category: Database["public"]["Enums"]["emission_source_category"]
          code: string | null
          created_at: string | null
          description: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          is_estimated: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          parent_source_id: string | null
          scope: Database["public"]["Enums"]["emission_scope"]
          subcategory: string | null
          supplier_id: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["emission_source_category"]
          code?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          is_estimated?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          parent_source_id?: string | null
          scope: Database["public"]["Enums"]["emission_scope"]
          subcategory?: string | null
          supplier_id?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["emission_source_category"]
          code?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          is_estimated?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          parent_source_id?: string | null
          scope?: Database["public"]["Enums"]["emission_scope"]
          subcategory?: string | null
          supplier_id?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emission_sources_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emission_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emission_sources_parent_source_id_fkey"
            columns: ["parent_source_id"]
            isOneToOne: false
            referencedRelation: "emission_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      emissions: {
        Row: {
          activity_description: string | null
          activity_unit: string
          activity_value: number
          approved_at: string | null
          approved_by: string | null
          calculation_method: string | null
          ch4_tonnes: number | null
          co2_tonnes: number | null
          co2e_tonnes: number
          created_at: string | null
          created_by: string
          data_quality: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id: string | null
          emission_factor_source: string | null
          emission_factor_unit: string
          evidence_documents: string[] | null
          id: string
          metadata: Json | null
          n2o_tonnes: number | null
          notes: string | null
          organization_id: string
          other_ghg: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags: string[] | null
          uncertainty_percent: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_unit: string
          activity_value: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes: number
          created_at?: string | null
          created_by: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id: string
          other_ghg?: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_unit?: string
          activity_value?: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes?: number
          created_at?: string | null
          created_by?: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor?: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit?: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id?: string
          other_ghg?: Json | null
          period_end?: string
          period_start?: string
          source_id?: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      emissions_2023: {
        Row: {
          activity_description: string | null
          activity_unit: string
          activity_value: number
          approved_at: string | null
          approved_by: string | null
          calculation_method: string | null
          ch4_tonnes: number | null
          co2_tonnes: number | null
          co2e_tonnes: number
          created_at: string | null
          created_by: string
          data_quality: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id: string | null
          emission_factor_source: string | null
          emission_factor_unit: string
          evidence_documents: string[] | null
          id: string
          metadata: Json | null
          n2o_tonnes: number | null
          notes: string | null
          organization_id: string
          other_ghg: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags: string[] | null
          uncertainty_percent: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_unit: string
          activity_value: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes: number
          created_at?: string | null
          created_by: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id: string
          other_ghg?: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_unit?: string
          activity_value?: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes?: number
          created_at?: string | null
          created_by?: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor?: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit?: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id?: string
          other_ghg?: Json | null
          period_end?: string
          period_start?: string
          source_id?: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      emissions_2024: {
        Row: {
          activity_description: string | null
          activity_unit: string
          activity_value: number
          approved_at: string | null
          approved_by: string | null
          calculation_method: string | null
          ch4_tonnes: number | null
          co2_tonnes: number | null
          co2e_tonnes: number
          created_at: string | null
          created_by: string
          data_quality: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id: string | null
          emission_factor_source: string | null
          emission_factor_unit: string
          evidence_documents: string[] | null
          id: string
          metadata: Json | null
          n2o_tonnes: number | null
          notes: string | null
          organization_id: string
          other_ghg: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags: string[] | null
          uncertainty_percent: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_unit: string
          activity_value: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes: number
          created_at?: string | null
          created_by: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id: string
          other_ghg?: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_unit?: string
          activity_value?: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes?: number
          created_at?: string | null
          created_by?: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor?: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit?: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id?: string
          other_ghg?: Json | null
          period_end?: string
          period_start?: string
          source_id?: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      emissions_2025: {
        Row: {
          activity_description: string | null
          activity_unit: string
          activity_value: number
          approved_at: string | null
          approved_by: string | null
          calculation_method: string | null
          ch4_tonnes: number | null
          co2_tonnes: number | null
          co2e_tonnes: number
          created_at: string | null
          created_by: string
          data_quality: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id: string | null
          emission_factor_source: string | null
          emission_factor_unit: string
          evidence_documents: string[] | null
          id: string
          metadata: Json | null
          n2o_tonnes: number | null
          notes: string | null
          organization_id: string
          other_ghg: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags: string[] | null
          uncertainty_percent: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_unit: string
          activity_value: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes: number
          created_at?: string | null
          created_by: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id: string
          other_ghg?: Json | null
          period_end: string
          period_start: string
          source_id: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_unit?: string
          activity_value?: number
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string | null
          ch4_tonnes?: number | null
          co2_tonnes?: number | null
          co2e_tonnes?: number
          created_at?: string | null
          created_by?: string
          data_quality?: Database["public"]["Enums"]["data_quality_tier"]
          emission_factor?: number
          emission_factor_id?: string | null
          emission_factor_source?: string | null
          emission_factor_unit?: string
          evidence_documents?: string[] | null
          id?: string
          metadata?: Json | null
          n2o_tonnes?: number | null
          notes?: string | null
          organization_id?: string
          other_ghg?: Json | null
          period_end?: string
          period_start?: string
          source_id?: string
          tags?: string[] | null
          uncertainty_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      emissions_data: {
        Row: {
          activity_data: number
          activity_unit: string
          building_id: string | null
          calculation_method: string | null
          category: string
          co2e_kg: number
          created_at: string | null
          created_by: string | null
          data_source: string | null
          emission_factor: number
          emission_factor_unit: string
          evidence_url: string | null
          id: string
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          scope: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          activity_data: number
          activity_unit: string
          building_id?: string | null
          calculation_method?: string | null
          category: string
          co2e_kg: number
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          emission_factor: number
          emission_factor_unit: string
          evidence_url?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          scope: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_data?: number
          activity_unit?: string
          building_id?: string | null
          calculation_method?: string | null
          category?: string
          co2e_kg?: number
          created_at?: string | null
          created_by?: string | null
          data_source?: string | null
          emission_factor?: number
          emission_factor_unit?: string
          evidence_url?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          scope?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emissions_data_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissions_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_consumption: {
        Row: {
          consumption_mwh: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount: number | null
          cost_currency: string | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          energy_type: string
          facility_id: string | null
          id: string
          invoice_reference: string | null
          is_renewable: boolean | null
          metadata: Json | null
          meter_id: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates: Json | null
          renewable_source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          consumption_mwh?: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          consumption_mwh?: number | null
          consumption_unit?: string
          consumption_value?: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type?: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      energy_consumption_2024: {
        Row: {
          consumption_mwh: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount: number | null
          cost_currency: string | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          energy_type: string
          facility_id: string | null
          id: string
          invoice_reference: string | null
          is_renewable: boolean | null
          metadata: Json | null
          meter_id: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates: Json | null
          renewable_source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          consumption_mwh?: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          consumption_mwh?: number | null
          consumption_unit?: string
          consumption_value?: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type?: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      energy_consumption_2025: {
        Row: {
          consumption_mwh: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount: number | null
          cost_currency: string | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          energy_type: string
          facility_id: string | null
          id: string
          invoice_reference: string | null
          is_renewable: boolean | null
          metadata: Json | null
          meter_id: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates: Json | null
          renewable_source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          consumption_mwh?: number | null
          consumption_unit: string
          consumption_value: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id: string
          period_end: string
          period_start: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          consumption_mwh?: number | null
          consumption_unit?: string
          consumption_value?: number
          cost_amount?: number | null
          cost_currency?: string | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          energy_type?: string
          facility_id?: string | null
          id?: string
          invoice_reference?: string | null
          is_renewable?: boolean | null
          metadata?: Json | null
          meter_id?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          renewable_certificates?: Json | null
          renewable_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          building_certifications: Json | null
          city: string | null
          code: string | null
          country: string
          created_at: string | null
          deleted_at: string | null
          energy_star_score: number | null
          facility_status: Database["public"]["Enums"]["facility_status"] | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          floors_above_ground: number | null
          floors_below_ground: number | null
          gross_floor_area_m2: number | null
          id: string
          latitude: number | null
          lease_expiry_date: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          occupancy_capacity: number | null
          operating_hours: Json | null
          organization_id: string
          ownership_type: string | null
          parent_facility_id: string | null
          postal_code: string | null
          primary_use_percent: number | null
          state_province: string | null
          timezone: string | null
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          building_certifications?: Json | null
          city?: string | null
          code?: string | null
          country: string
          created_at?: string | null
          deleted_at?: string | null
          energy_star_score?: number | null
          facility_status?:
            | Database["public"]["Enums"]["facility_status"]
            | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          floors_above_ground?: number | null
          floors_below_ground?: number | null
          gross_floor_area_m2?: number | null
          id?: string
          latitude?: number | null
          lease_expiry_date?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          occupancy_capacity?: number | null
          operating_hours?: Json | null
          organization_id: string
          ownership_type?: string | null
          parent_facility_id?: string | null
          postal_code?: string | null
          primary_use_percent?: number | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          building_certifications?: Json | null
          city?: string | null
          code?: string | null
          country?: string
          created_at?: string | null
          deleted_at?: string | null
          energy_star_score?: number | null
          facility_status?:
            | Database["public"]["Enums"]["facility_status"]
            | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          floors_above_ground?: number | null
          floors_below_ground?: number | null
          gross_floor_area_m2?: number | null
          id?: string
          latitude?: number | null
          lease_expiry_date?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          occupancy_capacity?: number | null
          operating_hours?: Json | null
          organization_id?: string
          ownership_type?: string | null
          parent_facility_id?: string | null
          postal_code?: string | null
          primary_use_percent?: number | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_parent_facility_id_fkey"
            columns: ["parent_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      global_suppliers: {
        Row: {
          active: boolean | null
          capabilities: string[] | null
          capacity: Json | null
          certifications: string[] | null
          created_at: string | null
          esg_score: Json | null
          id: string
          industry: string | null
          location: Json | null
          name: string
          products: string[] | null
          reliability: Json | null
          size: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          active?: boolean | null
          capabilities?: string[] | null
          capacity?: Json | null
          certifications?: string[] | null
          created_at?: string | null
          esg_score?: Json | null
          id?: string
          industry?: string | null
          location?: Json | null
          name: string
          products?: string[] | null
          reliability?: Json | null
          size?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          active?: boolean | null
          capabilities?: string[] | null
          capacity?: Json | null
          certifications?: string[] | null
          created_at?: string | null
          esg_score?: Json | null
          id?: string
          industry?: string | null
          location?: Json | null
          name?: string
          products?: string[] | null
          reliability?: Json | null
          size?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      gri_sector_standards: {
        Row: {
          core_disclosures: Json | null
          created_at: string | null
          description: string | null
          effective_date: string | null
          id: string
          material_topics: Json | null
          sector_code: string
          sector_name: string
          sector_specific_disclosures: Json | null
          updated_at: string | null
        }
        Insert: {
          core_disclosures?: Json | null
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          material_topics?: Json | null
          sector_code: string
          sector_name: string
          sector_specific_disclosures?: Json | null
          updated_at?: string | null
        }
        Update: {
          core_disclosures?: Json | null
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          id?: string
          material_topics?: Json | null
          sector_code?: string
          sector_name?: string
          sector_specific_disclosures?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      health_check: {
        Row: {
          id: number
          last_check: string | null
          status: string | null
        }
        Insert: {
          id?: number
          last_check?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          last_check?: string | null
          status?: string | null
        }
        Relationships: []
      }
      industry_analysis_results: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          esg_scores: Json | null
          id: string
          industry_id: string | null
          material_topics: Json | null
          ml_model_version: string | null
          organization_id: string
          peer_comparison: Json | null
          recommendations: Json | null
          required_disclosures: Json | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          esg_scores?: Json | null
          id?: string
          industry_id?: string | null
          material_topics?: Json | null
          ml_model_version?: string | null
          organization_id: string
          peer_comparison?: Json | null
          recommendations?: Json | null
          required_disclosures?: Json | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          esg_scores?: Json | null
          id?: string
          industry_id?: string | null
          material_topics?: Json | null
          ml_model_version?: string | null
          organization_id?: string
          peer_comparison?: Json | null
          recommendations?: Json | null
          required_disclosures?: Json | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_analysis_results_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_analysis_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          average_value: number | null
          company_size: string | null
          created_at: string | null
          data_quality_score: number | null
          id: string
          industry_id: string
          last_updated: string | null
          metric_id: string
          percentile_10: number | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          period_quarter: number | null
          period_year: number
          region: string | null
          sample_size: number
        }
        Insert: {
          average_value?: number | null
          company_size?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          industry_id: string
          last_updated?: string | null
          metric_id: string
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          period_quarter?: number | null
          period_year: number
          region?: string | null
          sample_size: number
        }
        Update: {
          average_value?: number | null
          company_size?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          industry_id?: string
          last_updated?: string | null
          metric_id?: string
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          period_quarter?: number | null
          period_year?: number
          region?: string | null
          sample_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "industry_benchmarks_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_benchmarks_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "industry_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_classifications: {
        Row: {
          classification_system: string
          code: string
          created_at: string | null
          description: string | null
          gri_sector_id: string | null
          id: string
          keywords: string[] | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          classification_system: string
          code: string
          created_at?: string | null
          description?: string | null
          gri_sector_id?: string | null
          id?: string
          keywords?: string[] | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          classification_system?: string
          code?: string
          created_at?: string | null
          description?: string | null
          gri_sector_id?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_classifications_gri_sector_id_fkey"
            columns: ["gri_sector_id"]
            isOneToOne: false
            referencedRelation: "gri_sector_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_classifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "industry_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_metrics: {
        Row: {
          benchmark_available: boolean | null
          calculation_method: string | null
          category: string | null
          created_at: string | null
          gri_alignment: string[] | null
          id: string
          industry_id: string
          lower_is_better: boolean | null
          metric_code: string
          metric_name: string
          metric_type: string | null
          regulatory_required: boolean | null
          typical_range: Json | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          benchmark_available?: boolean | null
          calculation_method?: string | null
          category?: string | null
          created_at?: string | null
          gri_alignment?: string[] | null
          id?: string
          industry_id: string
          lower_is_better?: boolean | null
          metric_code: string
          metric_name: string
          metric_type?: string | null
          regulatory_required?: boolean | null
          typical_range?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          benchmark_available?: boolean | null
          calculation_method?: string | null
          category?: string | null
          created_at?: string | null
          gri_alignment?: string[] | null
          id?: string
          industry_id?: string
          lower_is_better?: boolean | null
          metric_code?: string
          metric_name?: string
          metric_type?: string | null
          regulatory_required?: boolean | null
          typical_range?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_metrics_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industry_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          effective_date: string
          id: string
          type: string
          updated_at: string | null
          version: string
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          effective_date: string
          id?: string
          type: string
          updated_at?: string | null
          version: string
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          effective_date?: string
          id?: string
          type?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      marketplace_accounts: {
        Row: {
          created_at: string | null
          credits: number | null
          id: string
          organization_id: string
          reputation_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          id?: string
          organization_id: string
          reputation_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          id?: string
          organization_id?: string
          reputation_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_topics: {
        Row: {
          applicable_industries: string[] | null
          assessment_id: string
          boundary_description: string | null
          category: string | null
          created_at: string | null
          external_boundary: boolean | null
          gri_sector_standard: string | null
          gri_standard: string | null
          id: string
          impact_on_business: number | null
          importance_to_stakeholders: number | null
          industry_specific: boolean | null
          internal_boundary: boolean | null
          kpis: Json | null
          management_approach: string | null
          metadata: Json | null
          overall_priority: number | null
          targets_set: boolean | null
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          applicable_industries?: string[] | null
          assessment_id: string
          boundary_description?: string | null
          category?: string | null
          created_at?: string | null
          external_boundary?: boolean | null
          gri_sector_standard?: string | null
          gri_standard?: string | null
          id?: string
          impact_on_business?: number | null
          importance_to_stakeholders?: number | null
          industry_specific?: boolean | null
          internal_boundary?: boolean | null
          kpis?: Json | null
          management_approach?: string | null
          metadata?: Json | null
          overall_priority?: number | null
          targets_set?: boolean | null
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          applicable_industries?: string[] | null
          assessment_id?: string
          boundary_description?: string | null
          category?: string | null
          created_at?: string | null
          external_boundary?: boolean | null
          gri_sector_standard?: string | null
          gri_standard?: string | null
          id?: string
          impact_on_business?: number | null
          importance_to_stakeholders?: number | null
          industry_specific?: boolean | null
          internal_boundary?: boolean | null
          kpis?: Json | null
          management_approach?: string | null
          metadata?: Json | null
          overall_priority?: number | null
          targets_set?: boolean | null
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_topics_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "materiality_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      materiality_assessments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assessment_date: string
          assessment_year: number
          created_at: string | null
          created_by: string | null
          id: string
          material_topics_count: number | null
          metadata: Json | null
          methodology: string
          next_review_date: string | null
          organization_id: string
          priority_topics: Json | null
          report_url: string | null
          stakeholder_groups: Json | null
          stakeholders_engaged: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date: string
          assessment_year: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_topics_count?: number | null
          metadata?: Json | null
          methodology: string
          next_review_date?: string | null
          organization_id: string
          priority_topics?: Json | null
          report_url?: string | null
          stakeholder_groups?: Json | null
          stakeholders_engaged?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date?: string
          assessment_year?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_topics_count?: number | null
          metadata?: Json | null
          methodology?: string
          next_review_date?: string | null
          organization_id?: string
          priority_topics?: Json | null
          report_url?: string | null
          stakeholder_groups?: Json | null
          stakeholders_engaged?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiality_assessments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiality_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiality_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          completion_tokens: number | null
          content: string
          conversation_id: string
          created_at: string | null
          function_args: Json | null
          function_name: string | null
          function_response: Json | null
          id: string
          metadata: Json | null
          model: string | null
          prompt_tokens: number | null
          role: Database["public"]["Enums"]["message_role"]
          total_tokens: number | null
          ui_components: Json | null
        }
        Insert: {
          completion_tokens?: number | null
          content: string
          conversation_id: string
          created_at?: string | null
          function_args?: Json | null
          function_name?: string | null
          function_response?: Json | null
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          role: Database["public"]["Enums"]["message_role"]
          total_tokens?: number | null
          ui_components?: Json | null
        }
        Update: {
          completion_tokens?: number | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          function_args?: Json | null
          function_name?: string | null
          function_response?: Json | null
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          role?: Database["public"]["Enums"]["message_role"]
          total_tokens?: number | null
          ui_components?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          methods: string[]
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          methods: string[]
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          methods?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_ab_tests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration: string
          id: string
          model_id: string
          results: Json | null
          status: string
          success_metrics: string[] | null
          traffic_split: number
          version_a: string
          version_b: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration: string
          id?: string
          model_id: string
          results?: Json | null
          status: string
          success_metrics?: string[] | null
          traffic_split: number
          version_a: string
          version_b: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration?: string
          id?: string
          model_id?: string
          results?: Json | null
          status?: string
          success_metrics?: string[] | null
          traffic_split?: number
          version_a?: string
          version_b?: string
        }
        Relationships: []
      }
      ml_datasets: {
        Row: {
          created_at: string
          dataset_name: string
          dataset_type: string
          id: string
          organization_id: string
          preprocessing_applied: Json | null
          quality_score: number | null
          size_records: number
          source: string
          splits: Json | null
          time_range: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dataset_name: string
          dataset_type: string
          id?: string
          organization_id: string
          preprocessing_applied?: Json | null
          quality_score?: number | null
          size_records: number
          source: string
          splits?: Json | null
          time_range?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dataset_name?: string
          dataset_type?: string
          id?: string
          organization_id?: string
          preprocessing_applied?: Json | null
          quality_score?: number | null
          size_records?: number
          source?: string
          splits?: Json | null
          time_range?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_datasets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_deployment_events: {
        Row: {
          deployment_id: string
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          deployment_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          deployment_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_deployment_events_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "ml_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_deployment_metrics: {
        Row: {
          deployment_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          timestamp: string
          value: number | null
        }
        Insert: {
          deployment_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          timestamp: string
          value?: number | null
        }
        Update: {
          deployment_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          timestamp?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_deployment_metrics_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "ml_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_deployments: {
        Row: {
          configuration: Json | null
          created_at: string | null
          endpoint: string | null
          environment: string
          id: string
          metrics: Json | null
          model_version_id: string
          replicas: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          endpoint?: string | null
          environment: string
          id?: string
          metrics?: Json | null
          model_version_id: string
          replicas?: number | null
          status: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          endpoint?: string | null
          environment?: string
          id?: string
          metrics?: Json | null
          model_version_id?: string
          replicas?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_deployments_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "ml_model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_experiments: {
        Row: {
          completed_at: string | null
          conclusion: string | null
          created_at: string
          created_by: string | null
          experiment_name: string
          hypothesis: string
          id: string
          model_type: string
          organization_id: string
          parameters: Json
          results: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          experiment_name: string
          hypothesis: string
          id?: string
          model_type: string
          organization_id: string
          parameters: Json
          results?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          experiment_name?: string
          hypothesis?: string
          id?: string
          model_type?: string
          organization_id?: string
          parameters?: Json
          results?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_experiments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_features: {
        Row: {
          computation_time_ms: number | null
          computed_at: string
          created_at: string
          feature_set: string
          feature_type: string
          features: Json
          id: string
          metadata: Json | null
          organization_id: string
          validity_period: unknown
        }
        Insert: {
          computation_time_ms?: number | null
          computed_at: string
          created_at?: string
          feature_set: string
          feature_type: string
          features: Json
          id?: string
          metadata?: Json | null
          organization_id: string
          validity_period?: unknown
        }
        Update: {
          computation_time_ms?: number | null
          computed_at?: string
          created_at?: string
          feature_set?: string
          feature_type?: string
          features?: Json
          id?: string
          metadata?: Json | null
          organization_id?: string
          validity_period?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "ml_features_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_metadata: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          input_schema: Json
          model_id: string
          model_name: string
          model_type: string
          output_schema: Json
          performance: Json | null
          requirements: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema: Json
          model_id: string
          model_name: string
          model_type: string
          output_schema: Json
          performance?: Json | null
          requirements?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema?: Json
          model_id?: string
          model_name?: string
          model_type?: string
          output_schema?: Json
          performance?: Json | null
          requirements?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_model_performance: {
        Row: {
          drift_detected: boolean | null
          drift_score: number | null
          evaluated_at: string
          evaluation_data: Json | null
          evaluation_dataset: string
          evaluation_size: number
          id: string
          metric_type: string
          metric_value: number
          model_id: string
          organization_id: string
        }
        Insert: {
          drift_detected?: boolean | null
          drift_score?: number | null
          evaluated_at?: string
          evaluation_data?: Json | null
          evaluation_dataset: string
          evaluation_size: number
          id?: string
          metric_type: string
          metric_value: number
          model_id: string
          organization_id: string
        }
        Update: {
          drift_detected?: boolean | null
          drift_score?: number | null
          evaluated_at?: string
          evaluation_data?: Json | null
          evaluation_dataset?: string
          evaluation_size?: number
          id?: string
          metric_type?: string
          metric_value?: number
          model_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_model_performance_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_model_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_versions: {
        Row: {
          artifacts: Json
          created_at: string | null
          framework: string
          id: string
          metadata: Json | null
          model_id: string
          status: string
          updated_at: string | null
          version: string
        }
        Insert: {
          artifacts: Json
          created_at?: string | null
          framework: string
          id?: string
          metadata?: Json | null
          model_id: string
          status: string
          updated_at?: string | null
          version: string
        }
        Update: {
          artifacts?: Json
          created_at?: string | null
          framework?: string
          id?: string
          metadata?: Json | null
          model_id?: string
          status?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          architecture: Json
          created_at: string
          created_by: string | null
          framework: string
          hyperparameters: Json
          id: string
          model_name: string
          model_size_bytes: number | null
          model_type: string
          organization_id: string
          performance_metrics: Json | null
          status: string
          training_data_info: Json | null
          training_duration_ms: number | null
          updated_at: string
          version: string
        }
        Insert: {
          architecture: Json
          created_at?: string
          created_by?: string | null
          framework?: string
          hyperparameters?: Json
          id?: string
          model_name: string
          model_size_bytes?: number | null
          model_type: string
          organization_id: string
          performance_metrics?: Json | null
          status?: string
          training_data_info?: Json | null
          training_duration_ms?: number | null
          updated_at?: string
          version: string
        }
        Update: {
          architecture?: Json
          created_at?: string
          created_by?: string | null
          framework?: string
          hyperparameters?: Json
          id?: string
          model_name?: string
          model_size_bytes?: number | null
          model_type?: string
          organization_id?: string
          performance_metrics?: Json | null
          status?: string
          training_data_info?: Json | null
          training_duration_ms?: number | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_models_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_predictions: {
        Row: {
          actual_value: Json | null
          confidence: number | null
          created_at: string
          features_used: Json | null
          feedback: string | null
          feedback_score: number | null
          id: string
          inference_time_ms: number | null
          input_data: Json
          model_id: string
          organization_id: string
          prediction: Json
          prediction_type: string
          uncertainty: Json | null
        }
        Insert: {
          actual_value?: Json | null
          confidence?: number | null
          created_at?: string
          features_used?: Json | null
          feedback?: string | null
          feedback_score?: number | null
          id?: string
          inference_time_ms?: number | null
          input_data: Json
          model_id: string
          organization_id: string
          prediction: Json
          prediction_type: string
          uncertainty?: Json | null
        }
        Update: {
          actual_value?: Json | null
          confidence?: number | null
          created_at?: string
          features_used?: Json | null
          feedback?: string | null
          feedback_score?: number | null
          id?: string
          inference_time_ms?: number | null
          input_data?: Json
          model_id?: string
          organization_id?: string
          prediction?: Json
          prediction_type?: string
          uncertainty?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_training_jobs: {
        Row: {
          best_metrics: Json | null
          completed_at: string | null
          config: Json
          created_at: string
          created_by: string | null
          current_epoch: number | null
          dataset_info: Json
          error_message: string | null
          id: string
          logs: string[] | null
          metrics: Json | null
          model_type: string
          model_version: string | null
          organization_id: string
          progress: number | null
          resource_usage: Json | null
          started_at: string | null
          status: string
          total_epochs: number | null
        }
        Insert: {
          best_metrics?: Json | null
          completed_at?: string | null
          config: Json
          created_at?: string
          created_by?: string | null
          current_epoch?: number | null
          dataset_info: Json
          error_message?: string | null
          id?: string
          logs?: string[] | null
          metrics?: Json | null
          model_type: string
          model_version?: string | null
          organization_id: string
          progress?: number | null
          resource_usage?: Json | null
          started_at?: string | null
          status?: string
          total_epochs?: number | null
        }
        Update: {
          best_metrics?: Json | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          current_epoch?: number | null
          dataset_info?: Json
          error_message?: string | null
          id?: string
          logs?: string[] | null
          metrics?: Json | null
          model_type?: string
          model_version?: string | null
          organization_id?: string
          progress?: number | null
          resource_usage?: Json | null
          started_at?: string | null
          status?: string
          total_epochs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      network_benchmarks: {
        Row: {
          benchmark_type: string
          confidence_level: number | null
          created_at: string
          expires_at: string
          id: string
          industry: string | null
          methodology: string
          metric_category: string
          metric_name: string
          participant_count: number
          period: string
          quality_score: number | null
          statistics: Json
        }
        Insert: {
          benchmark_type: string
          confidence_level?: number | null
          created_at?: string
          expires_at: string
          id?: string
          industry?: string | null
          methodology: string
          metric_category: string
          metric_name: string
          participant_count: number
          period: string
          quality_score?: number | null
          statistics: Json
        }
        Update: {
          benchmark_type?: string
          confidence_level?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          industry?: string | null
          methodology?: string
          metric_category?: string
          metric_name?: string
          participant_count?: number
          period?: string
          quality_score?: number | null
          statistics?: Json
        }
        Relationships: []
      }
      network_data_marketplace: {
        Row: {
          access_type: string
          created_at: string
          data_period_end: string
          data_period_start: string
          dataset_name: string
          dataset_type: string
          description: string
          id: string
          listing_title: string
          price_credits: number | null
          provider_org_id: string
          quality_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          access_type: string
          created_at?: string
          data_period_end: string
          data_period_start: string
          dataset_name: string
          dataset_type: string
          description: string
          id?: string
          listing_title: string
          price_credits?: number | null
          provider_org_id: string
          quality_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_type?: string
          created_at?: string
          data_period_end?: string
          data_period_start?: string
          dataset_name?: string
          dataset_type?: string
          description?: string
          id?: string
          listing_title?: string
          price_credits?: number | null
          provider_org_id?: string
          quality_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_provider_org"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      network_edges: {
        Row: {
          created_at: string
          edge_type: string
          id: string
          metadata: Json | null
          relationship_status: string
          relationship_strength: number | null
          source_node_id: string
          target_node_id: string
          tier_level: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          edge_type: string
          id?: string
          metadata?: Json | null
          relationship_status?: string
          relationship_strength?: number | null
          source_node_id: string
          target_node_id: string
          tier_level?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          edge_type?: string
          id?: string
          metadata?: Json | null
          relationship_status?: string
          relationship_strength?: number | null
          source_node_id?: string
          target_node_id?: string
          tier_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      network_nodes: {
        Row: {
          certifications: string[] | null
          created_at: string
          data_sharing_level: string
          esg_score: number | null
          external_id: string | null
          id: string
          industry: string | null
          joined_network_at: string
          location: Json | null
          metadata: Json | null
          node_name: string
          node_type: string
          organization_id: string | null
          size_category: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string
          data_sharing_level?: string
          esg_score?: number | null
          external_id?: string | null
          id?: string
          industry?: string | null
          joined_network_at?: string
          location?: Json | null
          metadata?: Json | null
          node_name: string
          node_type: string
          organization_id?: string | null
          size_category?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          certifications?: string[] | null
          created_at?: string
          data_sharing_level?: string
          esg_score?: number | null
          external_id?: string | null
          id?: string
          industry?: string | null
          joined_network_at?: string
          location?: Json | null
          metadata?: Json | null
          node_name?: string
          node_type?: string
          organization_id?: string | null
          size_category?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_network_nodes_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      network_privacy_settings: {
        Row: {
          anonymization_method: string | null
          consent_date: string | null
          consent_given: boolean
          created_at: string
          data_category: string
          id: string
          organization_id: string
          sharing_level: string
          updated_at: string
        }
        Insert: {
          anonymization_method?: string | null
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          data_category: string
          id?: string
          organization_id: string
          sharing_level: string
          updated_at?: string
        }
        Update: {
          anonymization_method?: string | null
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          data_category?: string
          id?: string
          organization_id?: string
          sharing_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_privacy_settings_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      network_supplier_assessments: {
        Row: {
          assessment_date: string
          assessment_type: string
          confidence_level: number | null
          id: string
          recommendations: Json | null
          requester_org_id: string
          scores: Json
          supplier_node_id: string
          valid_until: string
        }
        Insert: {
          assessment_date?: string
          assessment_type: string
          confidence_level?: number | null
          id?: string
          recommendations?: Json | null
          requester_org_id: string
          scores: Json
          supplier_node_id: string
          valid_until: string
        }
        Update: {
          assessment_date?: string
          assessment_type?: string
          confidence_level?: number | null
          id?: string
          recommendations?: Json | null
          requester_org_id?: string
          scores?: Json
          supplier_node_id?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_assessments_requester_org"
            columns: ["requester_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_supplier_assessments_supplier_node_id_fkey"
            columns: ["supplier_node_id"]
            isOneToOne: false
            referencedRelation: "network_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_configs: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          access_all_facilities: boolean | null
          created_at: string | null
          custom_permissions: Json | null
          deleted_at: string | null
          facility_ids: string[] | null
          id: string
          invitation_status:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          last_access_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_all_facilities?: boolean | null
          created_at?: string | null
          custom_permissions?: Json | null
          deleted_at?: string | null
          facility_ids?: string[] | null
          id?: string
          invitation_status?:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_access_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_all_facilities?: boolean | null
          created_at?: string | null
          custom_permissions?: Json | null
          deleted_at?: string | null
          facility_ids?: string[] | null
          id?: string
          invitation_status?:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_access_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_address: Json | null
          brand_colors: Json | null
          company_size: string | null
          compliance_frameworks: string[] | null
          created_at: string | null
          data_residency_region: string | null
          deleted_at: string | null
          enabled_features: string[] | null
          gri_sector_id: string | null
          headquarters_address: Json | null
          id: string
          industry_classification_id: string | null
          industry_confidence: number | null
          industry_primary: string | null
          industry_secondary: string | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          primary_contact_email: string | null
          primary_contact_phone: string | null
          public_company: boolean | null
          settings: Json | null
          slug: string
          stock_ticker: string | null
          subscription_expires_at: string | null
          subscription_seats: number | null
          subscription_started_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          billing_address?: Json | null
          brand_colors?: Json | null
          company_size?: string | null
          compliance_frameworks?: string[] | null
          created_at?: string | null
          data_residency_region?: string | null
          deleted_at?: string | null
          enabled_features?: string[] | null
          gri_sector_id?: string | null
          headquarters_address?: Json | null
          id?: string
          industry_classification_id?: string | null
          industry_confidence?: number | null
          industry_primary?: string | null
          industry_secondary?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          public_company?: boolean | null
          settings?: Json | null
          slug: string
          stock_ticker?: string | null
          subscription_expires_at?: string | null
          subscription_seats?: number | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          billing_address?: Json | null
          brand_colors?: Json | null
          company_size?: string | null
          compliance_frameworks?: string[] | null
          created_at?: string | null
          data_residency_region?: string | null
          deleted_at?: string | null
          enabled_features?: string[] | null
          gri_sector_id?: string | null
          headquarters_address?: Json | null
          id?: string
          industry_classification_id?: string | null
          industry_confidence?: number | null
          industry_primary?: string | null
          industry_secondary?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          public_company?: boolean | null
          settings?: Json | null
          slug?: string
          stock_ticker?: string | null
          subscription_expires_at?: string | null
          subscription_seats?: number | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_gri_sector_id_fkey"
            columns: ["gri_sector_id"]
            isOneToOne: false
            referencedRelation: "gri_sector_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_industry_classification_id_fkey"
            columns: ["industry_classification_id"]
            isOneToOne: false
            referencedRelation: "industry_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_mfa_setups: {
        Row: {
          created_at: string | null
          expires_at: string
          method: string
          secret: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          method: string
          secret: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          method?: string
          secret?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_mfa_setups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_impact_assessments: {
        Row: {
          approvals: Json | null
          created_at: string | null
          data_processing_activities: string[] | null
          description: string | null
          id: string
          mitigations: Json | null
          project_name: string
          risk_level: string
          risks: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approvals?: Json | null
          created_at?: string | null
          data_processing_activities?: string[] | null
          description?: string | null
          id?: string
          mitigations?: Json | null
          project_name: string
          risk_level: string
          risks?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approvals?: Json | null
          created_at?: string | null
          data_processing_activities?: string[] | null
          description?: string | null
          id?: string
          mitigations?: Json | null
          project_name?: string
          risk_level?: string
          risks?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          communication: Json | null
          created_at: string | null
          data_processing: Json | null
          updated_at: string | null
          user_id: string
          visibility: Json | null
        }
        Insert: {
          communication?: Json | null
          created_at?: string | null
          data_processing?: Json | null
          updated_at?: string | null
          user_id: string
          visibility?: Json | null
        }
        Update: {
          communication?: Json | null
          created_at?: string | null
          data_processing?: Json | null
          updated_at?: string | null
          user_id?: string
          visibility?: Json | null
        }
        Relationships: []
      }
      query_performance: {
        Row: {
          execution_time_ms: number | null
          id: string
          query_fingerprint: string
          query_text: string | null
          rows_returned: number | null
          timestamp: string | null
        }
        Insert: {
          execution_time_ms?: number | null
          id?: string
          query_fingerprint: string
          query_text?: string | null
          rows_returned?: number | null
          timestamp?: string | null
        }
        Update: {
          execution_time_ms?: number | null
          id?: string
          query_fingerprint?: string
          query_text?: string | null
          rows_returned?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      query_performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          operation: string | null
          table_name: string | null
          timestamp: string | null
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          operation?: string | null
          table_name?: string | null
          timestamp?: string | null
          value: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          operation?: string | null
          table_name?: string | null
          timestamp?: string | null
          value?: number
        }
        Relationships: []
      }
      rate_limit_rules: {
        Row: {
          burst_limit: number
          created_at: string | null
          description: string
          enabled: boolean | null
          id: string
          limit_value: number
          name: string
          updated_at: string | null
          window_seconds: number
        }
        Insert: {
          burst_limit: number
          created_at?: string | null
          description: string
          enabled?: boolean | null
          id?: string
          limit_value: number
          name: string
          updated_at?: string | null
          window_seconds: number
        }
        Update: {
          burst_limit?: number
          created_at?: string | null
          description?: string
          enabled?: boolean | null
          id?: string
          limit_value?: number
          name?: string
          updated_at?: string | null
          window_seconds?: number
        }
        Relationships: []
      }
      recovery_tokens: {
        Row: {
          created_at: string
          current_attempts: number
          expires_at: string
          hashed_token: string
          id: string
          max_attempts: number
          metadata: Json | null
          method: string
          status: string
          type: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_attempts?: number
          expires_at: string
          hashed_token: string
          id?: string
          max_attempts?: number
          metadata?: Json | null
          method: string
          status?: string
          type: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_attempts?: number
          expires_at?: string
          hashed_token?: string
          id?: string
          max_attempts?: number
          metadata?: Json | null
          method?: string
          status?: string
          type?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_requirements: {
        Row: {
          applicable_industries: string[] | null
          compliance_deadline: string | null
          created_at: string | null
          effective_date: string | null
          gri_alignment: string[] | null
          id: string
          jurisdiction: string
          penalties: string | null
          regulation_code: string
          regulation_name: string
          requirements: Json
          updated_at: string | null
        }
        Insert: {
          applicable_industries?: string[] | null
          compliance_deadline?: string | null
          created_at?: string | null
          effective_date?: string | null
          gri_alignment?: string[] | null
          id?: string
          jurisdiction: string
          penalties?: string | null
          regulation_code: string
          regulation_name: string
          requirements: Json
          updated_at?: string | null
        }
        Update: {
          applicable_industries?: string[] | null
          compliance_deadline?: string | null
          created_at?: string | null
          effective_date?: string | null
          gri_alignment?: string[] | null
          id?: string
          jurisdiction?: string
          penalties?: string | null
          regulation_code?: string
          regulation_name?: string
          requirements?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          checksum: string
          created_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          name: string
          rollback_sql: string | null
          status: string | null
          version: number
        }
        Insert: {
          applied_at?: string | null
          checksum: string
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id: string
          metadata?: Json | null
          name: string
          rollback_sql?: string | null
          status?: string | null
          version: number
        }
        Update: {
          applied_at?: string | null
          checksum?: string
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          rollback_sql?: string | null
          status?: string | null
          version?: number
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json
          handled: boolean | null
          id: string
          ip: unknown | null
          severity: string
          source: string
          timestamp: string
          type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json
          handled?: boolean | null
          id?: string
          ip?: unknown | null
          severity: string
          source: string
          timestamp: string
          type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json
          handled?: boolean | null
          id?: string
          ip?: unknown | null
          severity?: string
          source?: string
          timestamp?: string
          type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          created_at: string | null
          effective_date: string
          framework: string
          id: string
          name: string
          requirements: Json
          review_date: string
          updated_at: string | null
          version: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          effective_date: string
          framework: string
          id?: string
          name: string
          requirements?: Json
          review_date: string
          updated_at?: string | null
          version: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          effective_date?: string
          framework?: string
          id?: string
          name?: string
          requirements?: Json
          review_date?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      slow_query_logs: {
        Row: {
          created_at: string | null
          database_name: string | null
          execution_time_ms: number
          first_seen: string | null
          id: string
          last_seen: string | null
          max_time_ms: number | null
          mean_time_ms: number | null
          query_fingerprint: string | null
          query_text: string
          rows_affected: number | null
          total_calls: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          database_name?: string | null
          execution_time_ms: number
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          max_time_ms?: number | null
          mean_time_ms?: number | null
          query_fingerprint?: string | null
          query_text: string
          rows_affected?: number | null
          total_calls?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          database_name?: string | null
          execution_time_ms?: number
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          max_time_ms?: number | null
          mean_time_ms?: number | null
          query_fingerprint?: string | null
          query_text?: string
          rows_affected?: number | null
          total_calls?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sso_auth_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          provider: Database["public"]["Enums"]["sso_provider"]
          redirect_uri: string
          relay_state: string | null
          sso_configuration_id: string
          state: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          provider: Database["public"]["Enums"]["sso_provider"]
          redirect_uri: string
          relay_state?: string | null
          sso_configuration_id: string
          state: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          provider?: Database["public"]["Enums"]["sso_provider"]
          redirect_uri?: string
          relay_state?: string | null
          sso_configuration_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_auth_requests_sso_configuration_id_fkey"
            columns: ["sso_configuration_id"]
            isOneToOne: false
            referencedRelation: "sso_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          auto_provision_users: boolean
          created_at: string
          created_by: string
          default_permissions: Json | null
          default_role: string | null
          domain: string
          enabled: boolean
          id: string
          last_test_error: string | null
          last_test_status: string | null
          last_tested_at: string | null
          name: string
          oidc_attribute_mapping: Json | null
          oidc_authorization_endpoint: string | null
          oidc_client_id: string | null
          oidc_client_secret: string | null
          oidc_discovery_url: string | null
          oidc_issuer_url: string | null
          oidc_jwks_uri: string | null
          oidc_scopes: string[] | null
          oidc_token_endpoint: string | null
          oidc_userinfo_endpoint: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["sso_provider"]
          saml_attribute_mapping: Json | null
          saml_certificate: string | null
          saml_issuer: string | null
          saml_metadata_url: string | null
          saml_metadata_xml: string | null
          saml_sso_url: string | null
          status: Database["public"]["Enums"]["sso_status"]
          updated_at: string
        }
        Insert: {
          auto_provision_users?: boolean
          created_at?: string
          created_by: string
          default_permissions?: Json | null
          default_role?: string | null
          domain: string
          enabled?: boolean
          id?: string
          last_test_error?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name: string
          oidc_attribute_mapping?: Json | null
          oidc_authorization_endpoint?: string | null
          oidc_client_id?: string | null
          oidc_client_secret?: string | null
          oidc_discovery_url?: string | null
          oidc_issuer_url?: string | null
          oidc_jwks_uri?: string | null
          oidc_scopes?: string[] | null
          oidc_token_endpoint?: string | null
          oidc_userinfo_endpoint?: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["sso_provider"]
          saml_attribute_mapping?: Json | null
          saml_certificate?: string | null
          saml_issuer?: string | null
          saml_metadata_url?: string | null
          saml_metadata_xml?: string | null
          saml_sso_url?: string | null
          status?: Database["public"]["Enums"]["sso_status"]
          updated_at?: string
        }
        Update: {
          auto_provision_users?: boolean
          created_at?: string
          created_by?: string
          default_permissions?: Json | null
          default_role?: string | null
          domain?: string
          enabled?: boolean
          id?: string
          last_test_error?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name?: string
          oidc_attribute_mapping?: Json | null
          oidc_authorization_endpoint?: string | null
          oidc_client_id?: string | null
          oidc_client_secret?: string | null
          oidc_discovery_url?: string | null
          oidc_issuer_url?: string | null
          oidc_jwks_uri?: string | null
          oidc_scopes?: string[] | null
          oidc_token_endpoint?: string | null
          oidc_userinfo_endpoint?: string | null
          organization_id?: string
          provider?: Database["public"]["Enums"]["sso_provider"]
          saml_attribute_mapping?: Json | null
          saml_certificate?: string | null
          saml_issuer?: string | null
          saml_metadata_url?: string | null
          saml_metadata_xml?: string | null
          saml_sso_url?: string | null
          status?: Database["public"]["Enums"]["sso_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_sessions: {
        Row: {
          created_at: string
          expires_at: string
          external_id: string
          id: string
          id_token: string | null
          ip_address: unknown | null
          last_activity_at: string
          name_id: string | null
          oidc_access_token: string | null
          oidc_id_token: string | null
          oidc_refresh_token: string | null
          provider: Database["public"]["Enums"]["sso_provider"]
          session_index: string | null
          sso_configuration_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          external_id: string
          id?: string
          id_token?: string | null
          ip_address?: unknown | null
          last_activity_at?: string
          name_id?: string | null
          oidc_access_token?: string | null
          oidc_id_token?: string | null
          oidc_refresh_token?: string | null
          provider: Database["public"]["Enums"]["sso_provider"]
          session_index?: string | null
          sso_configuration_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          external_id?: string
          id?: string
          id_token?: string | null
          ip_address?: unknown | null
          last_activity_at?: string
          name_id?: string | null
          oidc_access_token?: string | null
          oidc_id_token?: string | null
          oidc_refresh_token?: string | null
          provider?: Database["public"]["Enums"]["sso_provider"]
          session_index?: string | null
          sso_configuration_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_sessions_sso_configuration_id_fkey"
            columns: ["sso_configuration_id"]
            isOneToOne: false
            referencedRelation: "sso_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_users: {
        Row: {
          auto_provisioned: boolean
          created_at: string
          custom_attributes: Json | null
          department: string | null
          email: string
          employee_id: string | null
          external_id: string
          first_name: string | null
          full_name: string | null
          groups: string[] | null
          id: string
          last_name: string | null
          last_synced_at: string
          sso_configuration_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_provisioned?: boolean
          created_at?: string
          custom_attributes?: Json | null
          department?: string | null
          email: string
          employee_id?: string | null
          external_id: string
          first_name?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string
          last_name?: string | null
          last_synced_at?: string
          sso_configuration_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_provisioned?: boolean
          created_at?: string
          custom_attributes?: Json | null
          department?: string | null
          email?: string
          employee_id?: string | null
          external_id?: string
          first_name?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string
          last_name?: string | null
          last_synced_at?: string
          sso_configuration_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_users_sso_configuration_id_fkey"
            columns: ["sso_configuration_id"]
            isOneToOne: false
            referencedRelation: "sso_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_assessments: {
        Row: {
          assessment_date: string | null
          id: string
          organization_id: string
          peer_comparison: Json | null
          recommendations: string[] | null
          scores: Json
          strengths: string[] | null
          supplier_id: string
          weaknesses: string[] | null
        }
        Insert: {
          assessment_date?: string | null
          id?: string
          organization_id: string
          peer_comparison?: Json | null
          recommendations?: string[] | null
          scores: Json
          strengths?: string[] | null
          supplier_id: string
          weaknesses?: string[] | null
        }
        Update: {
          assessment_date?: string | null
          id?: string
          organization_id?: string
          peer_comparison?: Json | null
          recommendations?: string[] | null
          scores?: Json
          strengths?: string[] | null
          supplier_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          annual_spend_usd: number | null
          categories: string[] | null
          certifications: Json | null
          created_at: string | null
          has_sustainability_data: boolean | null
          headquarters_country: string | null
          id: string
          is_critical_supplier: boolean | null
          last_assessment_date: string | null
          legal_name: string | null
          metadata: Json | null
          name: string
          operating_countries: string[] | null
          organization_id: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          relationship_end_date: string | null
          relationship_start_date: string | null
          supplier_code: string | null
          supplier_type: string | null
          sustainability_rating: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          annual_spend_usd?: number | null
          categories?: string[] | null
          certifications?: Json | null
          created_at?: string | null
          has_sustainability_data?: boolean | null
          headquarters_country?: string | null
          id?: string
          is_critical_supplier?: boolean | null
          last_assessment_date?: string | null
          legal_name?: string | null
          metadata?: Json | null
          name: string
          operating_countries?: string[] | null
          organization_id: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          supplier_code?: string | null
          supplier_type?: string | null
          sustainability_rating?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_spend_usd?: number | null
          categories?: string[] | null
          certifications?: Json | null
          created_at?: string | null
          has_sustainability_data?: boolean | null
          headquarters_country?: string | null
          id?: string
          is_critical_supplier?: boolean | null
          last_assessment_date?: string | null
          legal_name?: string | null
          metadata?: Json | null
          name?: string
          operating_countries?: string[] | null
          organization_id?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          supplier_code?: string | null
          supplier_type?: string | null
          sustainability_rating?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_chain_emissions: {
        Row: {
          created_at: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          downstream_emissions_tco2e: number | null
          emission_id: string | null
          id: string
          metadata: Json | null
          organization_id: string
          period_end: string | null
          period_start: string | null
          product_category: string | null
          product_description: string | null
          quantity: number | null
          spend_amount: number | null
          spend_currency: string | null
          supplier_id: string
          unit: string | null
          updated_at: string | null
          upstream_emissions_tco2e: number | null
        }
        Insert: {
          created_at?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          downstream_emissions_tco2e?: number | null
          emission_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          product_category?: string | null
          product_description?: string | null
          quantity?: number | null
          spend_amount?: number | null
          spend_currency?: string | null
          supplier_id: string
          unit?: string | null
          updated_at?: string | null
          upstream_emissions_tco2e?: number | null
        }
        Update: {
          created_at?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          downstream_emissions_tco2e?: number | null
          emission_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          product_category?: string | null
          product_description?: string | null
          quantity?: number | null
          spend_amount?: number | null
          spend_currency?: string | null
          supplier_id?: string
          unit?: string | null
          updated_at?: string | null
          upstream_emissions_tco2e?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_chain_emissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_emissions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_reports: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string | null
          emissions_intensity: number | null
          energy_consumption: number | null
          framework: string
          id: string
          metadata: Json | null
          organization_id: string
          published_at: string | null
          renewable_energy_percentage: number | null
          report_type: string
          report_year: number
          status: string | null
          total_emissions_scope1: number | null
          total_emissions_scope2: number | null
          total_emissions_scope3: number | null
          updated_at: string | null
          waste_generated: number | null
          waste_recycled_percentage: number | null
          water_consumption: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          emissions_intensity?: number | null
          energy_consumption?: number | null
          framework: string
          id?: string
          metadata?: Json | null
          organization_id: string
          published_at?: string | null
          renewable_energy_percentage?: number | null
          report_type: string
          report_year: number
          status?: string | null
          total_emissions_scope1?: number | null
          total_emissions_scope2?: number | null
          total_emissions_scope3?: number | null
          updated_at?: string | null
          waste_generated?: number | null
          waste_recycled_percentage?: number | null
          water_consumption?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          emissions_intensity?: number | null
          energy_consumption?: number | null
          framework?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          published_at?: string | null
          renewable_energy_percentage?: number | null
          report_type?: string
          report_year?: number
          status?: string | null
          total_emissions_scope1?: number | null
          total_emissions_scope2?: number | null
          total_emissions_scope3?: number | null
          updated_at?: string | null
          waste_generated?: number | null
          waste_recycled_percentage?: number | null
          water_consumption?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_targets: {
        Row: {
          assumptions: string | null
          baseline_unit: string
          baseline_value: number
          baseline_year: number
          categories:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url: string | null
          created_at: string | null
          current_as_of: string | null
          current_value: number | null
          description: string | null
          facilities: string[] | null
          id: string
          is_science_based: boolean | null
          metadata: Json | null
          methodology: string | null
          name: string
          organization_id: string
          parent_target_id: string | null
          progress_percent: number | null
          public_commitment: boolean | null
          sbti_approved: boolean | null
          scopes: Database["public"]["Enums"]["emission_scope"][] | null
          status: string | null
          target_type: string
          target_unit: string
          target_value: number
          target_year: number
          updated_at: string | null
        }
        Insert: {
          assumptions?: string | null
          baseline_unit: string
          baseline_value: number
          baseline_year: number
          categories?:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url?: string | null
          created_at?: string | null
          current_as_of?: string | null
          current_value?: number | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_science_based?: boolean | null
          metadata?: Json | null
          methodology?: string | null
          name: string
          organization_id: string
          parent_target_id?: string | null
          progress_percent?: number | null
          public_commitment?: boolean | null
          sbti_approved?: boolean | null
          scopes?: Database["public"]["Enums"]["emission_scope"][] | null
          status?: string | null
          target_type: string
          target_unit: string
          target_value: number
          target_year: number
          updated_at?: string | null
        }
        Update: {
          assumptions?: string | null
          baseline_unit?: string
          baseline_value?: number
          baseline_year?: number
          categories?:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url?: string | null
          created_at?: string | null
          current_as_of?: string | null
          current_value?: number | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_science_based?: boolean | null
          metadata?: Json | null
          methodology?: string | null
          name?: string
          organization_id?: string
          parent_target_id?: string | null
          progress_percent?: number | null
          public_commitment?: boolean | null
          sbti_approved?: boolean | null
          scopes?: Database["public"]["Enums"]["emission_scope"][] | null
          status?: string | null
          target_type?: string
          target_unit?: string
          target_value?: number
          target_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustainability_targets_parent_target_id_fkey"
            columns: ["parent_target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_preferences: {
        Row: {
          communication_style: string
          confidence_score: number
          created_at: string
          domain_interests: string[] | null
          id: string
          interaction_patterns: Json | null
          learned_from_conversations: number
          organization_id: string
          preferred_metrics: string[] | null
          response_length: string
          updated_at: string
          user_id: string
        }
        Insert: {
          communication_style?: string
          confidence_score?: number
          created_at?: string
          domain_interests?: string[] | null
          id?: string
          interaction_patterns?: Json | null
          learned_from_conversations?: number
          organization_id: string
          preferred_metrics?: string[] | null
          response_length?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          communication_style?: string
          confidence_score?: number
          created_at?: string
          domain_interests?: string[] | null
          id?: string
          interaction_patterns?: Json | null
          learned_from_conversations?: number
          organization_id?: string
          preferred_metrics?: string[] | null
          response_length?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_backup_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_backup_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          metadata: Json | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          status: string
          type: string
          updated_at?: string | null
          user_id: string
          version?: string
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          ip_address: unknown | null
          is_trusted: boolean | null
          last_used_at: string | null
          name: string
          type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean | null
          last_used_at?: string | null
          name: string
          type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean | null
          last_used_at?: string | null
          name?: string
          type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_config: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          is_primary: boolean | null
          last_used_at: string | null
          method: string
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          is_primary?: boolean | null
          last_used_at?: string | null
          method: string
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          is_primary?: boolean | null
          last_used_at?: string | null
          method?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          ai_personality: Json | null
          ai_preferences: Json | null
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          department: string | null
          display_name: string | null
          email: string
          email_verified: boolean | null
          employee_id: string | null
          full_name: string
          id: string
          job_title: string | null
          last_active_at: string | null
          last_password_change: string | null
          locale: string | null
          locked_until: string | null
          login_attempts: number | null
          metadata: Json | null
          mobile_phone: string | null
          password_expires_at: string | null
          phone: string | null
          phone_verified: boolean | null
          preferences: Json | null
          preferred_language: string | null
          recovery_methods: Json | null
          reports_to: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_personality?: Json | null
          ai_preferences?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          employee_id?: string | null
          full_name: string
          id: string
          job_title?: string | null
          last_active_at?: string | null
          last_password_change?: string | null
          locale?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          mobile_phone?: string | null
          password_expires_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          preferred_language?: string | null
          recovery_methods?: Json | null
          reports_to?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_personality?: Json | null
          ai_preferences?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          employee_id?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_active_at?: string | null
          last_password_change?: string | null
          locale?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          mobile_phone?: string | null
          password_expires_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          preferred_language?: string | null
          recovery_methods?: Json | null
          reports_to?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_data: {
        Row: {
          building_id: string | null
          created_at: string | null
          created_by: string | null
          disposal_method: string
          diverted_from_landfill: boolean | null
          id: string
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          recycling_rate: number | null
          unit: string
          updated_at: string | null
          waste_type: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          disposal_method: string
          diverted_from_landfill?: boolean | null
          id?: string
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          recycling_rate?: number | null
          unit: string
          updated_at?: string | null
          waste_type: string
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          disposal_method?: string
          diverted_from_landfill?: boolean | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          quantity?: number
          recycling_rate?: number | null
          unit?: string
          updated_at?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_data_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_generation: {
        Row: {
          certificates: Json | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          disposal_facility_location: string | null
          disposal_method: string
          facility_id: string | null
          id: string
          is_diverted_from_disposal: boolean | null
          manifest_number: string | null
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          quantity_unit: string
          tags: string[] | null
          updated_at: string | null
          waste_category: string
          waste_code: string | null
          waste_handler_name: string | null
          waste_handler_permit: string | null
          waste_type: string
        }
        Insert: {
          certificates?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          disposal_facility_location?: string | null
          disposal_method: string
          facility_id?: string | null
          id?: string
          is_diverted_from_disposal?: boolean | null
          manifest_number?: string | null
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          quantity_unit: string
          tags?: string[] | null
          updated_at?: string | null
          waste_category: string
          waste_code?: string | null
          waste_handler_name?: string | null
          waste_handler_permit?: string | null
          waste_type: string
        }
        Update: {
          certificates?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          disposal_facility_location?: string | null
          disposal_method?: string
          facility_id?: string | null
          id?: string
          is_diverted_from_disposal?: boolean | null
          manifest_number?: string | null
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          quantity?: number
          quantity_unit?: string
          tags?: string[] | null
          updated_at?: string | null
          waste_category?: string
          waste_code?: string | null
          waste_handler_name?: string | null
          waste_handler_permit?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_generation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_generation_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_generation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      water_consumption: {
        Row: {
          consumption_volume: number | null
          created_at: string | null
          created_by: string | null
          data_quality: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source: string | null
          discharge_destination: string | null
          discharge_volume: number | null
          facility_id: string | null
          id: string
          is_water_stressed_area: boolean | null
          metadata: Json | null
          meter_readings: Json | null
          organization_id: string
          period_end: string
          period_start: string
          recycled_volume: number | null
          tags: string[] | null
          treatment_method: string | null
          updated_at: string | null
          volume_unit: string
          water_quality: string | null
          water_source: string
          water_stress_level: string | null
          withdrawal_volume: number | null
        }
        Insert: {
          consumption_volume?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          discharge_destination?: string | null
          discharge_volume?: number | null
          facility_id?: string | null
          id?: string
          is_water_stressed_area?: boolean | null
          metadata?: Json | null
          meter_readings?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          recycled_volume?: number | null
          tags?: string[] | null
          treatment_method?: string | null
          updated_at?: string | null
          volume_unit: string
          water_quality?: string | null
          water_source: string
          water_stress_level?: string | null
          withdrawal_volume?: number | null
        }
        Update: {
          consumption_volume?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: Database["public"]["Enums"]["data_quality_tier"] | null
          data_source?: string | null
          discharge_destination?: string | null
          discharge_volume?: number | null
          facility_id?: string | null
          id?: string
          is_water_stressed_area?: boolean | null
          metadata?: Json | null
          meter_readings?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          recycled_volume?: number | null
          tags?: string[] | null
          treatment_method?: string | null
          updated_at?: string | null
          volume_unit?: string
          water_quality?: string | null
          water_source?: string
          water_stress_level?: string | null
          withdrawal_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_consumption_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_consumption_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_consumption_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      water_usage: {
        Row: {
          building_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_recycled: boolean | null
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          treatment_type: string | null
          updated_at: string | null
          usage_type: string
          volume_liters: number
          water_source: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_recycled?: boolean | null
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          treatment_type?: string | null
          updated_at?: string | null
          usage_type: string
          volume_liters: number
          water_source: string
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_recycled?: boolean | null
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          treatment_type?: string | null
          updated_at?: string | null
          usage_type?: string
          volume_liters?: number
          water_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_usage_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at: string
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          aaguid: string
          backup_eligible: boolean
          backup_state: boolean
          counter: number
          created_at: string
          credential_id: string
          device_type: string
          id: string
          is_active: boolean
          last_used: string
          name: string
          public_key: string
          transports: string[]
          user_id: string
        }
        Insert: {
          aaguid: string
          backup_eligible?: boolean
          backup_state?: boolean
          counter?: number
          created_at?: string
          credential_id: string
          device_type: string
          id?: string
          is_active?: boolean
          last_used?: string
          name: string
          public_key: string
          transports?: string[]
          user_id: string
        }
        Update: {
          aaguid?: string
          backup_eligible?: boolean
          backup_state?: boolean
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string
          id?: string
          is_active?: boolean
          last_used?: string
          name?: string
          public_key?: string
          transports?: string[]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_number: number
          created_at: string
          delivered_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          next_retry_at: string | null
          organization_id: string
          payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status_code: number | null
          response_time_ms: number | null
          scheduled_at: string
          status: string
          webhook_endpoint_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          next_retry_at?: string | null
          organization_id: string
          payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_time_ms?: number | null
          scheduled_at?: string
          status: string
          webhook_endpoint_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          next_retry_at?: string | null
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_time_ms?: number | null
          scheduled_at?: string
          status?: string
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          api_version: string
          created_at: string
          created_by: string
          description: string | null
          enabled: boolean
          events: string[]
          failure_count: number
          headers: Json | null
          id: string
          last_delivery_at: string | null
          last_failure_at: string | null
          last_success_at: string | null
          organization_id: string
          secret_key: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          api_version?: string
          created_at?: string
          created_by: string
          description?: string | null
          enabled?: boolean
          events: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          last_delivery_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          organization_id: string
          secret_key: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          api_version?: string
          created_at?: string
          created_by?: string
          description?: string | null
          enabled?: boolean
          events?: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          last_delivery_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          organization_id?: string
          secret_key?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_memories: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          title: string
          summary: string | null
          key_topics: string[] | null
          entities: Json | null
          sentiment: Json | null
          preferences: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          title: string
          summary?: string | null
          key_topics?: string[] | null
          entities?: Json | null
          sentiment?: Json | null
          preferences?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          title?: string
          summary?: string | null
          key_topics?: string[] | null
          entities?: Json | null
          sentiment?: Json | null
          preferences?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_memories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_test_results: {
        Row: {
          id: string
          organization_id: string
          suite_id: string
          scenario_id: string | null
          results: Json
          report: string
          passed: boolean
          score: number
          run_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          suite_id: string
          scenario_id?: string | null
          results: Json
          report: string
          passed?: boolean
          score: number
          run_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          suite_id?: string
          scenario_id?: string | null
          results?: Json
          report?: string
          passed?: boolean
          score?: number
          run_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_test_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_test_results_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_test_suites: {
        Row: {
          id: string
          organization_id: string
          suite_data: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          suite_data: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          suite_data?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_test_suites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_test_suites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      mv_org_dashboard_metrics: {
        Row: {
          avg_emissions_tonnes: number | null
          emission_categories: number | null
          month: string | null
          organization_id: string | null
          reporting_buildings: number | null
          reporting_days: number | null
          scope1_emissions: number | null
          scope2_emissions: number | null
          scope3_emissions: number | null
          total_emissions_tonnes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emissions_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_api_usage_hourly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      analyze_query: {
        Args: { query_params?: string[]; query_text: string }
        Returns: Json
      }
      analyze_query_patterns: {
        Args: { p_days?: number }
        Returns: {
          avg_execution_time: number
          example_query: string
          occurrence_count: number
          pattern_name: string
          total_time: number
        }[]
      }
      award_marketplace_credits: {
        Args: { p_amount: number; p_provider_id: string }
        Returns: undefined
      }
      calculate_model_drift: {
        Args: { p_model_id: string; p_window_days?: number }
        Returns: {
          drift_score: number
          performance_change: number
          prediction_distribution: Json
        }[]
      }
      calculate_percentile_rank: {
        Args: {
          p_industry_id?: string
          p_metric_id: string
          p_value: number
          p_year: number
        }
        Returns: number
      }
      check_database_health: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_conversation_contexts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_mfa_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sso_auth_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sso_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_webauthn_challenges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_webauthn_credentials: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string; owner_id: string }
        Returns: string
      }
      deduct_marketplace_credits: {
        Args: { p_amount: number; p_consumer_id: string }
        Returns: undefined
      }
      estimate_backup_size: {
        Args: { tables?: string[] }
        Returns: {
          row_count: number
          table_count: number
          total_size_bytes: number
          total_size_pretty: string
        }[]
      }
      execute_agent_task: {
        Args: {
          p_agent_instance_id: string
          p_input_data?: Json
          p_priority?: string
          p_task_name: string
          p_task_type: string
        }
        Returns: string
      }
      execute_backup_sql: {
        Args: { sql_query: string }
        Returns: undefined
      }
      execute_sql: {
        Args: { sql_query: string }
        Returns: undefined
      }
      expire_old_recovery_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_api_key: {
        Args: { prefix?: string }
        Returns: string
      }
      generate_sample_benchmark_data: {
        Args: { p_num_companies?: number; p_year?: number }
        Returns: undefined
      }
      get_all_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
          table_name: string
        }[]
      }
      get_index_stats: {
        Args: { target_index_name?: string }
        Returns: {
          created_at: string
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          index_name: string
          index_size: string
          table_name: string
        }[]
      }
      get_industry_material_topics: {
        Args: { p_industry_id: string }
        Returns: {
          gri_standard: string
          relevance: string
          topic_id: string
          topic_name: string
        }[]
      }
      get_query_insights: {
        Args: { p_hours?: number }
        Returns: {
          description: string
          impact: string
          insight_type: string
          query_example: string
          recommendation: string
        }[]
      }
      get_slow_queries: {
        Args: { duration_threshold_ms?: number; limit_count?: number }
        Returns: {
          calls: number
          max_time: number
          mean_time: number
          query: string
          rows: number
          total_time: number
        }[]
      }
      get_sso_config_by_email: {
        Args: { email_address: string }
        Returns: {
          config: Json
          enabled: boolean
          id: string
          organization_id: string
          provider: Database["public"]["Enums"]["sso_provider"]
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          character_maximum_length: number
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          numeric_precision: number
          numeric_scale: number
        }[]
      }
      get_table_constraints: {
        Args: { table_name: string }
        Returns: {
          constraint_definition: string
          constraint_name: string
          constraint_type: string
        }[]
      }
      get_table_indexes: {
        Args: { table_name: string }
        Returns: {
          index_definition: string
          index_name: string
          is_primary: boolean
          is_unique: boolean
        }[]
      }
      get_table_stats: {
        Args: { target_table_name: string }
        Returns: {
          bloat_ratio: number
          index_size: string
          last_analyze: string
          last_vacuum: string
          row_count: number
          table_size: string
          total_size: string
        }[]
      }
      get_unused_indexes: {
        Args: { days_threshold?: number; target_table_name?: string }
        Returns: {
          index_name: string
          index_scans: number
          index_size: string
          table_name: string
        }[]
      }
      get_user_recoveryoptions: {
        Args: { p_user_id: string }
        Returns: {
          backup_codes_enabled: boolean
          email_enabled: boolean
          phone_number: string
          security_questions_count: number
          security_questions_enabled: boolean
          sms_enabled: boolean
        }[]
      }
      get_webauthn_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_credentials: number
          cross_platform_credentials: number
          platform_credentials: number
          recent_authentications: number
          top_device_types: Json
          total_credentials: number
        }[]
      }
      has_organization_role: {
        Args: { org_id: string; roles: string[] }
        Returns: boolean
      }
      hash_api_key: {
        Args: { key: string }
        Returns: string
      }
      increment_recovery_attempts: {
        Args: { token_id: string }
        Returns: undefined
      }
      initialize_agents_for_organization: {
        Args: { org_id: string }
        Returns: undefined
      }
      is_organization_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      log_slow_query: {
        Args: {
          p_execution_time_ms: number
          p_query_text: string
          p_rows_affected?: number
          p_user_id?: string
        }
        Returns: string
      }
      map_organization_to_gri_sector: {
        Args: { org_id: string }
        Returns: string
      }
      monitor_query_performance: {
        Args: { threshold_ms?: number }
        Returns: {
          calls: number
          max_time: number
          mean_time: number
          query_text: string
          query_type: string
          rows: number
          total_time: number
        }[]
      }
      record_agent_decision: {
        Args: {
          p_agent_instance_id: string
          p_autonomy_level_used: number
          p_confidence_score: number
          p_decision_context: Json
          p_decision_outcome: Json
          p_decision_type: string
          p_task_execution_id: string
        }
        Returns: string
      }
      record_deployment_event: {
        Args: {
          p_deployment_id: string
          p_event_data: Json
          p_event_type: string
          p_user_id?: string
        }
        Returns: undefined
      }
      refresh_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_org_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_agent_task: {
        Args: {
          p_agent_instance_id: string
          p_priority?: string
          p_schedule_pattern: string
          p_task_config?: Json
          p_task_name: string
          p_task_type: string
        }
        Returns: string
      }
      search_conversation_memories: {
        Args: {
          p_limit?: number
          p_organization_id?: string
          p_query: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          key_topics: string[]
          relevance_score: number
          summary: string
          title: string
        }[]
      }
      suggest_indexes: {
        Args: { target_table_name: string }
        Returns: {
          create_statement: string
          estimated_improvement: string
          reason: string
          suggestion: string
        }[]
      }
      track_api_usage: {
        Args: {
          p_api_key_id: string
          p_endpoint: string
          p_ip_address?: unknown
          p_method: string
          p_origin?: string
          p_request_size?: number
          p_response_size?: number
          p_response_time_ms: number
          p_status_code: number
          p_user_agent?: string
          p_version: string
        }
        Returns: string
      }
      update_agent_health: {
        Args: { p_agent_instance_id: string; p_health_score: number }
        Returns: undefined
      }
      update_conversation_analytics: {
        Args: { p_date?: string; p_organization_id: string; p_user_id: string }
        Returns: undefined
      }
      update_deployment_metrics: {
        Args: {
          p_avg_latency: number
          p_deployment_id: string
          p_error_count: number
          p_request_count: number
        }
        Returns: undefined
      }
      update_user_ai_preferences: {
        Args: {
          p_communication_style?: string
          p_domain_interests?: string[]
          p_organization_id: string
          p_preferred_metrics?: string[]
          p_response_length?: string
          p_user_id: string
        }
        Returns: undefined
      }
      user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      validate_recovery_token: {
        Args: { p_method: string; p_token_type: string; p_user_id: string }
        Returns: {
          attempts_remaining: number
          expires_at: string
          token_id: string
          token_status: string
        }[]
      }
    }
    Enums: {
      api_key_status: "active" | "revoked" | "expired"
      assurance_level: "none" | "limited" | "reasonable" | "high"
      conversation_status: "active" | "archived" | "deleted"
      data_quality_tier:
        | "measured"
        | "calculated"
        | "estimated"
        | "default"
        | "unknown"
      document_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
        | "deleted"
      document_type:
        | "sustainability_report"
        | "emissions_evidence"
        | "utility_bill"
        | "travel_receipt"
        | "waste_manifest"
        | "certificate"
        | "contract"
        | "invoice"
        | "policy"
        | "other"
      emission_scope: "scope_1" | "scope_2" | "scope_3" | "biogenic" | "removed"
      emission_source_category:
        | "stationary_combustion"
        | "mobile_combustion"
        | "fugitive_emissions"
        | "process_emissions"
        | "purchased_electricity"
        | "purchased_heat"
        | "purchased_steam"
        | "purchased_cooling"
        | "purchased_goods"
        | "capital_goods"
        | "fuel_energy_activities"
        | "upstream_transportation"
        | "waste_generated"
        | "business_travel"
        | "employee_commuting"
        | "upstream_leased_assets"
        | "downstream_transportation"
        | "processing_sold_products"
        | "use_of_sold_products"
        | "end_of_life_treatment"
        | "downstream_leased_assets"
        | "franchises"
        | "investments"
      facility_status:
        | "planning"
        | "construction"
        | "operational"
        | "renovation"
        | "decommissioned"
      facility_type:
        | "office"
        | "retail"
        | "industrial"
        | "warehouse"
        | "data_center"
        | "residential"
        | "mixed_use"
        | "healthcare"
        | "education"
        | "hospitality"
        | "other"
      feedback_type: "positive" | "negative" | "suggestion" | "bug_report"
      invitation_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "revoked"
      message_role: "system" | "user" | "assistant" | "function" | "tool"
      reporting_framework:
        | "gri"
        | "esrs"
        | "tcfd"
        | "cdp"
        | "sasb"
        | "tnfd"
        | "ungc"
        | "sdg"
        | "iso14001"
        | "iso45001"
        | "iso50001"
        | "sbti"
        | "other"
      risk_appetite: "averse" | "minimal" | "cautious" | "open" | "hungry"
      sso_provider: "saml" | "oidc"
      sso_status: "active" | "inactive" | "configuring" | "error"
      stakeholder_type:
        | "employees"
        | "customers"
        | "investors"
        | "suppliers"
        | "communities"
        | "regulators"
        | "ngo"
        | "academia"
        | "media"
        | "other"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "suspended"
        | "trialing"
      subscription_tier:
        | "trial"
        | "starter"
        | "professional"
        | "enterprise"
        | "custom"
      user_role:
        | "platform_admin"
        | "account_owner"
        | "admin"
        | "sustainability_lead"
        | "facility_manager"
        | "analyst"
        | "reporter"
        | "viewer"
        | "sustainability_manager"
      verification_status:
        | "unverified"
        | "self_verified"
        | "third_party_verified"
        | "audited"
        | "certified"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      api_key_status: ["active", "revoked", "expired"],
      assurance_level: ["none", "limited", "reasonable", "high"],
      conversation_status: ["active", "archived", "deleted"],
      data_quality_tier: [
        "measured",
        "calculated",
        "estimated",
        "default",
        "unknown",
      ],
      document_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
        "deleted",
      ],
      document_type: [
        "sustainability_report",
        "emissions_evidence",
        "utility_bill",
        "travel_receipt",
        "waste_manifest",
        "certificate",
        "contract",
        "invoice",
        "policy",
        "other",
      ],
      emission_scope: ["scope_1", "scope_2", "scope_3", "biogenic", "removed"],
      emission_source_category: [
        "stationary_combustion",
        "mobile_combustion",
        "fugitive_emissions",
        "process_emissions",
        "purchased_electricity",
        "purchased_heat",
        "purchased_steam",
        "purchased_cooling",
        "purchased_goods",
        "capital_goods",
        "fuel_energy_activities",
        "upstream_transportation",
        "waste_generated",
        "business_travel",
        "employee_commuting",
        "upstream_leased_assets",
        "downstream_transportation",
        "processing_sold_products",
        "use_of_sold_products",
        "end_of_life_treatment",
        "downstream_leased_assets",
        "franchises",
        "investments",
      ],
      facility_status: [
        "planning",
        "construction",
        "operational",
        "renovation",
        "decommissioned",
      ],
      facility_type: [
        "office",
        "retail",
        "industrial",
        "warehouse",
        "data_center",
        "residential",
        "mixed_use",
        "healthcare",
        "education",
        "hospitality",
        "other",
      ],
      feedback_type: ["positive", "negative", "suggestion", "bug_report"],
      invitation_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "revoked",
      ],
      message_role: ["system", "user", "assistant", "function", "tool"],
      reporting_framework: [
        "gri",
        "esrs",
        "tcfd",
        "cdp",
        "sasb",
        "tnfd",
        "ungc",
        "sdg",
        "iso14001",
        "iso45001",
        "iso50001",
        "sbti",
        "other",
      ],
      risk_appetite: ["averse", "minimal", "cautious", "open", "hungry"],
      sso_provider: ["saml", "oidc"],
      sso_status: ["active", "inactive", "configuring", "error"],
      stakeholder_type: [
        "employees",
        "customers",
        "investors",
        "suppliers",
        "communities",
        "regulators",
        "ngo",
        "academia",
        "media",
        "other",
      ],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "suspended",
        "trialing",
      ],
      subscription_tier: [
        "trial",
        "starter",
        "professional",
        "enterprise",
        "custom",
      ],
      user_role: [
        "platform_admin",
        "account_owner",
        "admin",
        "sustainability_lead",
        "facility_manager",
        "analyst",
        "reporter",
        "viewer",
        "sustainability_manager",
      ],
      verification_status: [
        "unverified",
        "self_verified",
        "third_party_verified",
        "audited",
        "certified",
      ],
    },
  },
} as const
