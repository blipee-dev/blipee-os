Using workdir /Users/pedro/Documents/blipee/blipee-os/blipee-os
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
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      access_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          site_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          site_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          site_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "access_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          agent_id: string
          alert_type: string | null
          created_at: string | null
          data: Json | null
          description: string
          id: string
          message: string | null
          metrics: Json | null
          organization_id: string
          recommendations: string[] | null
          resolved: boolean | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id: string
          alert_type?: string | null
          created_at?: string | null
          data?: Json | null
          description: string
          id?: string
          message?: string | null
          metrics?: Json | null
          organization_id: string
          recommendations?: string[] | null
          resolved?: boolean | null
          severity: string
          title: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id?: string
          alert_type?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string
          id?: string
          message?: string | null
          metrics?: Json | null
          organization_id?: string
          recommendations?: string[] | null
          resolved?: boolean | null
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
      agent_coordinations: {
        Row: {
          coordination_rules: Json | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          participating_agents: string[] | null
          priority: string | null
          status: string | null
          trigger_conditions: Json | null
          type: string | null
        }
        Insert: {
          coordination_rules?: Json | null
          created_at?: string | null
          description?: string | null
          id: string
          organization_id: string
          participating_agents?: string[] | null
          priority?: string | null
          status?: string | null
          trigger_conditions?: Json | null
          type?: string | null
        }
        Update: {
          coordination_rules?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          participating_agents?: string[] | null
          priority?: string | null
          status?: string | null
          trigger_conditions?: Json | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_coordinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_cost_initiatives: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          implementation_cost: number | null
          implementation_date: string | null
          lifespan_years: number | null
          name: string
          npv: number | null
          organization_id: string
          payback_months: number | null
          projected_savings: number | null
          roi: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          implementation_cost?: number | null
          implementation_date?: string | null
          lifespan_years?: number | null
          name: string
          npv?: number | null
          organization_id: string
          payback_months?: number | null
          projected_savings?: number | null
          roi?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          implementation_cost?: number | null
          implementation_date?: string | null
          lifespan_years?: number | null
          name?: string
          npv?: number | null
          organization_id?: string
          payback_months?: number | null
          projected_savings?: number | null
          roi?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_cost_initiatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_cost_opportunities: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string | null
          current_cost: number | null
          description: string | null
          id: string
          implementation_cost: number | null
          organization_id: string
          payback_period: number | null
          potential_savings: number | null
          priority: string | null
          roi: number | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          current_cost?: number | null
          description?: string | null
          id?: string
          implementation_cost?: number | null
          organization_id: string
          payback_period?: number | null
          potential_savings?: number | null
          priority?: string | null
          roi?: number | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          current_cost?: number | null
          description?: string | null
          id?: string
          implementation_cost?: number | null
          organization_id?: string
          payback_period?: number | null
          potential_savings?: number | null
          priority?: string | null
          roi?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_cost_opportunities_organization_id_fkey"
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
      agent_energy_analyses: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          id: string
          insights: string | null
          organization_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          insights?: string | null
          organization_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          insights?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_energy_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_energy_consumption: {
        Row: {
          consumption: number
          cost: number | null
          created_at: string | null
          device_id: string | null
          id: string
          measured_at: string
          organization_id: string
          peak_demand: number | null
          site_id: string | null
        }
        Insert: {
          consumption: number
          cost?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          measured_at: string
          organization_id: string
          peak_demand?: number | null
          site_id?: string | null
        }
        Update: {
          consumption?: number
          cost?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          measured_at?: string
          organization_id?: string
          peak_demand?: number | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_energy_consumption_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_energy_consumption_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_energy_consumption_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "agent_energy_consumption_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      agent_learning_insights: {
        Row: {
          agent_name: string
          confidence: number | null
          created_at: string | null
          id: string
          insight: string
          learning_type: string
          metadata: Json | null
        }
        Insert: {
          agent_name: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight: string
          learning_type: string
          metadata?: Json | null
        }
        Update: {
          agent_name?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight?: string
          learning_type?: string
          metadata?: Json | null
        }
        Relationships: []
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
      agent_learnings: {
        Row: {
          agent_id: string
          confidence: number | null
          context: Json | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          feedback: string | null
          feedback_reason: string | null
          id: string
          learning_type: string
          organization_id: string
          recommendation_type: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          feedback?: string | null
          feedback_reason?: string | null
          id?: string
          learning_type: string
          organization_id: string
          recommendation_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          confidence?: number | null
          context?: Json | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          feedback?: string | null
          feedback_reason?: string | null
          id?: string
          learning_type?: string
          organization_id?: string
          recommendation_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_learnings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      agent_operational_costs: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          subcategory: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          subcategory?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_operational_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      agent_performance: {
        Row: {
          agent_id: string
          avg_response_time: number | null
          created_at: string | null
          error_rate: number | null
          failed_tasks: number | null
          id: string
          organization_id: string
          success_rate: number | null
          successful_tasks: number | null
          tasks_processed: number | null
          total_executions: number | null
        }
        Insert: {
          agent_id: string
          avg_response_time?: number | null
          created_at?: string | null
          error_rate?: number | null
          failed_tasks?: number | null
          id?: string
          organization_id: string
          success_rate?: number | null
          successful_tasks?: number | null
          tasks_processed?: number | null
          total_executions?: number | null
        }
        Update: {
          agent_id?: string
          avg_response_time?: number | null
          created_at?: string | null
          error_rate?: number | null
          failed_tasks?: number | null
          id?: string
          organization_id?: string
          success_rate?: number | null
          successful_tasks?: number | null
          tasks_processed?: number | null
          total_executions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_organization_id_fkey"
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
      agent_rules: {
        Row: {
          active: boolean | null
          agent_id: string
          confidence: number
          created_at: string | null
          id: string
          organization_id: string
          rule_content: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          confidence: number
          created_at?: string | null
          id?: string
          organization_id: string
          rule_content: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          confidence?: number
          created_at?: string | null
          id?: string
          organization_id?: string
          rule_content?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_rules_organization_id_fkey"
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
      agent_task_queue: {
        Row: {
          agent_id: string
          created_at: string | null
          data: Json | null
          id: string
          organization_id: string
          priority: string
          scheduled_for: string | null
          status: string | null
          type: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id: string
          priority: string
          scheduled_for?: string | null
          status?: string | null
          type: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          organization_id?: string
          priority?: string
          scheduled_for?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_results: {
        Row: {
          agent_id: string
          created_at: string | null
          error: string | null
          execution_time_ms: number | null
          id: string
          notification_importance: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          organization_id: string
          priority: string | null
          result: Json | null
          success: boolean | null
          task_id: string | null
          task_type: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          notification_importance?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          organization_id: string
          priority?: string | null
          result?: Json | null
          success?: boolean | null
          task_id?: string | null
          task_type?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          notification_importance?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          organization_id?: string
          priority?: string | null
          result?: Json | null
          success?: boolean | null
          task_id?: string | null
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string
          error: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          organization_id: string
          priority: string | null
          result: Json | null
          status: string
          task_type: string
        }
        Insert: {
          agent_id: string
          error?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          organization_id: string
          priority?: string | null
          result?: Json | null
          status: string
          task_type: string
        }
        Update: {
          agent_id?: string
          error?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          organization_id?: string
          priority?: string | null
          result?: Json | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          organization_id: string
          participating_agents: string[] | null
          results: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          name?: string | null
          organization_id: string
          participating_agents?: string[] | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          participating_agents?: string[] | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_ab_experiments: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          variants: Json
          winner_variant_id: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          variants: Json
          winner_variant_id?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          variants?: Json
          winner_variant_id?: string | null
        }
        Relationships: []
      }
      ai_conversation_analytics: {
        Row: {
          analyzed_at: string | null
          avg_response_time_ms: number | null
          common_intents: string[] | null
          conversation_id: string | null
          conversation_metadata: Json | null
          created_at: string | null
          id: string
          message_count: number | null
          organization_id: string | null
          topics_discussed: string[] | null
          user_satisfaction_score: number | null
        }
        Insert: {
          analyzed_at?: string | null
          avg_response_time_ms?: number | null
          common_intents?: string[] | null
          conversation_id?: string | null
          conversation_metadata?: Json | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          organization_id?: string | null
          topics_discussed?: string[] | null
          user_satisfaction_score?: number | null
        }
        Update: {
          analyzed_at?: string | null
          avg_response_time_ms?: number | null
          common_intents?: string[] | null
          conversation_id?: string | null
          conversation_metadata?: Json | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          organization_id?: string | null
          topics_discussed?: string[] | null
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      ai_pattern_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          first_detected: string | null
          frequency: number | null
          id: string
          last_detected: string | null
          organization_id: string | null
          pattern_data: Json | null
          pattern_description: string
          pattern_type: string | null
          recommended_action: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          first_detected?: string | null
          frequency?: number | null
          id?: string
          last_detected?: string | null
          organization_id?: string | null
          pattern_data?: Json | null
          pattern_description: string
          pattern_type?: string | null
          recommended_action?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          first_detected?: string | null
          frequency?: number | null
          id?: string
          last_detected?: string | null
          organization_id?: string | null
          pattern_data?: Json | null
          pattern_description?: string
          pattern_type?: string | null
          recommended_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_pattern_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          model_config: Json | null
          name: string
          prompt_content: string
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          model_config?: Json | null
          name: string
          prompt_content: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          model_config?: Json | null
          name?: string
          prompt_content?: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_security_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          event_type: string
          id: string
          organization_id: string | null
          severity: string
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          organization_id?: string | null
          severity: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          organization_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      allocation_strategies: {
        Row: {
          avg_success_rate: number | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          strategy_type: string
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          avg_success_rate?: number | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          strategy_type: string
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_success_rate?: number | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          strategy_type?: string
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allocation_strategies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      app_users: {
        Row: {
          appearance_settings: Json | null
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          join_date: string | null
          language_settings: Json | null
          last_active: string | null
          last_login: string | null
          location: string | null
          name: string
          notification_settings: Json | null
          organization_id: string | null
          permissions: Json
          phone: string | null
          role: string | null
          security_events: Json | null
          security_settings: Json | null
          status: string | null
          title: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          appearance_settings?: Json | null
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          join_date?: string | null
          language_settings?: Json | null
          last_active?: string | null
          last_login?: string | null
          location?: string | null
          name: string
          notification_settings?: Json | null
          organization_id?: string | null
          permissions?: Json
          phone?: string | null
          role?: string | null
          security_events?: Json | null
          security_settings?: Json | null
          status?: string | null
          title?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          appearance_settings?: Json | null
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          join_date?: string | null
          language_settings?: Json | null
          last_active?: string | null
          last_login?: string | null
          location?: string | null
          name?: string
          notification_settings?: Json | null
          organization_id?: string | null
          permissions?: Json
          phone?: string | null
          role?: string | null
          security_events?: Json | null
          security_settings?: Json | null
          status?: string | null
          title?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applied_optimizations: {
        Row: {
          actual_improvement: number | null
          applied_at: string | null
          expected_improvement: number | null
          id: string
          new_value: Json | null
          opportunity_id: string | null
          organization_id: string
          original_value: Json | null
          status: string | null
          target: string | null
          type: string | null
          validated_at: string | null
        }
        Insert: {
          actual_improvement?: number | null
          applied_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_value?: Json | null
          opportunity_id?: string | null
          organization_id: string
          original_value?: Json | null
          status?: string | null
          target?: string | null
          type?: string | null
          validated_at?: string | null
        }
        Update: {
          actual_improvement?: number | null
          applied_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_value?: Json | null
          opportunity_id?: string | null
          organization_id?: string
          original_value?: Json | null
          status?: string | null
          target?: string | null
          type?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_optimizations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "optimization_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applied_optimizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      audit_events: {
        Row: {
          action_category: string | null
          action_type: string | null
          actor_email: string | null
          actor_id: string | null
          actor_type: string | null
          correlation_id: string | null
          created_at: string
          event: Json
          id: string
          ip_address: unknown
          organization_id: string | null
          outcome_status: string | null
          resource_id: string | null
          resource_type: string | null
          search_vector: unknown
          session_id: string | null
          severity: string | null
          user_agent: string | null
        }
        Insert: {
          action_category?: string | null
          action_type?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_type?: string | null
          correlation_id?: string | null
          created_at?: string
          event: Json
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          outcome_status?: string | null
          resource_id?: string | null
          resource_type?: string | null
          search_vector?: unknown
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
        }
        Update: {
          action_category?: string | null
          action_type?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_type?: string | null
          correlation_id?: string | null
          created_at?: string
          event?: Json
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          outcome_status?: string | null
          resource_id?: string | null
          resource_type?: string | null
          search_vector?: unknown
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
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
          actor_ip?: unknown
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
          actor_ip?: unknown
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
      auth_audit_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error: string | null
          execution_time_ms: number | null
          id: string
          job_type: string
          organization_id: string
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          job_type: string
          organization_id: string
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          job_type?: string
          organization_id?: string
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          organization_id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          organization_id: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          organization_id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_schedules: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string
          id: string
          job_type: string
          next_run: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency: string
          id?: string
          job_type: string
          next_run: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          job_type?: string
          next_run?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          configuration: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          organization_id: string
          target: string | null
          type: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id: string
          target?: string | null
          type?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id?: string
          target?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_organization_id_fkey"
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
      baseline_recalculations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          new_baseline_year: number
          old_baseline_year: number
          organization_id: string
          reason: string | null
          recalculation_date: string | null
          total_categories_updated: number | null
          total_targets_updated: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_baseline_year: number
          old_baseline_year: number
          organization_id: string
          reason?: string | null
          recalculation_date?: string | null
          total_categories_updated?: number | null
          total_targets_updated?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_baseline_year?: number
          old_baseline_year?: number
          organization_id?: string
          reason?: string | null
          recalculation_date?: string | null
          total_categories_updated?: number | null
          total_targets_updated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baseline_recalculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      baseline_restatements: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          historical_estimates: Json | null
          id: string
          methodology_notes: string | null
          new_metrics_added: Json | null
          organization_id: string
          original_baseline_emissions: number
          original_baseline_year: number
          restated_baseline_emissions: number
          restatement_date: string
          restatement_delta: number | null
          restatement_percent: number | null
          restatement_reason: string
          restatement_type: string
          status: string
          supporting_documents: Json | null
          target_id: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          historical_estimates?: Json | null
          id?: string
          methodology_notes?: string | null
          new_metrics_added?: Json | null
          organization_id: string
          original_baseline_emissions: number
          original_baseline_year: number
          restated_baseline_emissions: number
          restatement_date?: string
          restatement_delta?: number | null
          restatement_percent?: number | null
          restatement_reason: string
          restatement_type?: string
          status?: string
          supporting_documents?: Json | null
          target_id: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          historical_estimates?: Json | null
          id?: string
          methodology_notes?: string | null
          new_metrics_added?: Json | null
          organization_id?: string
          original_baseline_emissions?: number
          original_baseline_year?: number
          restated_baseline_emissions?: number
          restatement_date?: string
          restatement_delta?: number | null
          restatement_percent?: number | null
          restatement_reason?: string
          restatement_type?: string
          status?: string
          supporting_documents?: Json | null
          target_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baseline_restatements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_restatements_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_restatements_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
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
      benchmark_usage_analytics: {
        Row: {
          benchmark_type: string
          company_name: string | null
          id: string
          organization_id: string | null
          sector: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          benchmark_type: string
          company_name?: string | null
          id?: string
          organization_id?: string | null
          sector: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          benchmark_type?: string
          company_name?: string | null
          id?: string
          organization_id?: string | null
          sector?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_usage_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      biodiversity_sites: {
        Row: {
          adjacent_to_protected_area: boolean | null
          assessment_date: string | null
          biodiversity_value: string | null
          conservation_measures: string | null
          created_at: string | null
          habitat_protected_hectares: number | null
          habitat_restored_hectares: number | null
          habitats_present: string[] | null
          id: string
          impacts_description: string | null
          in_protected_area: boolean | null
          iucn_species_count: number | null
          iucn_species_list: Json | null
          iucn_species_present: boolean | null
          latitude: number | null
          location_description: string | null
          longitude: number | null
          monitoring_program_in_place: boolean | null
          operational_impact_level: string | null
          organization_id: string
          protected_area_name: string | null
          protected_area_type: string | null
          reporting_year: number | null
          site_id: string | null
          site_name: string
          species_richness_level: string | null
          total_area_hectares: number | null
          updated_at: string | null
        }
        Insert: {
          adjacent_to_protected_area?: boolean | null
          assessment_date?: string | null
          biodiversity_value?: string | null
          conservation_measures?: string | null
          created_at?: string | null
          habitat_protected_hectares?: number | null
          habitat_restored_hectares?: number | null
          habitats_present?: string[] | null
          id?: string
          impacts_description?: string | null
          in_protected_area?: boolean | null
          iucn_species_count?: number | null
          iucn_species_list?: Json | null
          iucn_species_present?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          monitoring_program_in_place?: boolean | null
          operational_impact_level?: string | null
          organization_id: string
          protected_area_name?: string | null
          protected_area_type?: string | null
          reporting_year?: number | null
          site_id?: string | null
          site_name: string
          species_richness_level?: string | null
          total_area_hectares?: number | null
          updated_at?: string | null
        }
        Update: {
          adjacent_to_protected_area?: boolean | null
          assessment_date?: string | null
          biodiversity_value?: string | null
          conservation_measures?: string | null
          created_at?: string | null
          habitat_protected_hectares?: number | null
          habitat_restored_hectares?: number | null
          habitats_present?: string[] | null
          id?: string
          impacts_description?: string | null
          in_protected_area?: boolean | null
          iucn_species_count?: number | null
          iucn_species_list?: Json | null
          iucn_species_present?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          monitoring_program_in_place?: boolean | null
          operational_impact_level?: string | null
          organization_id?: string
          protected_area_name?: string | null
          protected_area_type?: string | null
          reporting_year?: number | null
          site_id?: string | null
          site_name?: string
          species_richness_level?: string | null
          total_area_hectares?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biodiversity_sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biodiversity_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "biodiversity_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
      carbon_market_prices: {
        Row: {
          created_at: string | null
          exchange: string
          id: string
          market_type: string
          price_change_24h: number | null
          price_usd: number
          scraped_at: string | null
          scraper_job_id: string | null
          timestamp: string
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          exchange: string
          id?: string
          market_type: string
          price_change_24h?: number | null
          price_usd: number
          scraped_at?: string | null
          scraper_job_id?: string | null
          timestamp: string
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          exchange?: string
          id?: string
          market_type?: string
          price_change_24h?: number | null
          price_usd?: number
          scraped_at?: string | null
          scraper_job_id?: string | null
          timestamp?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carbon_market_prices_scraper_job_id_fkey"
            columns: ["scraper_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      card_data_cache: {
        Row: {
          cached_at: string | null
          cached_data: Json
          card_id: string | null
          data_key: string
          expires_at: string | null
          hit_count: number | null
          id: string
          ttl_seconds: number | null
        }
        Insert: {
          cached_at?: string | null
          cached_data: Json
          card_id?: string | null
          data_key: string
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          ttl_seconds?: number | null
        }
        Update: {
          cached_at?: string | null
          cached_data?: Json
          card_id?: string | null
          data_key?: string
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          ttl_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_data_cache_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_definitions: {
        Row: {
          agent_id: string | null
          card_type: string
          created_at: string | null
          data_bindings: Json
          description: string | null
          id: string
          is_active: boolean | null
          layout_config: Json
          quick_actions: Json | null
          title: string
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          card_type: string
          created_at?: string | null
          data_bindings?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json
          quick_actions?: Json | null
          title: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          card_type?: string
          created_at?: string | null
          data_bindings?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json
          quick_actions?: Json | null
          title?: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      card_interactions: {
        Row: {
          action_target: string | null
          action_type: string
          card_id: string | null
          context_snapshot: Json | null
          error_message: string | null
          id: string
          response_time_ms: number | null
          success: boolean | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_target?: string | null
          action_type: string
          card_id?: string | null
          context_snapshot?: Json | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_target?: string | null
          action_type?: string
          card_id?: string | null
          context_snapshot?: Json | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_interactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_learning_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          last_occurred: string | null
          occurrence_count: number | null
          pattern_data: Json
          pattern_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_occurred?: string | null
          occurrence_count?: number | null
          pattern_data: Json
          pattern_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_occurred?: string | null
          occurrence_count?: number | null
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      card_realtime_subscriptions: {
        Row: {
          active: boolean | null
          card_id: string | null
          created_at: string | null
          id: string
          last_ping: string | null
          subscription_params: Json | null
          user_id: string | null
          websocket_channel: string
        }
        Insert: {
          active?: boolean | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          last_ping?: string | null
          subscription_params?: Json | null
          user_id?: string | null
          websocket_channel: string
        }
        Update: {
          active?: boolean | null
          card_id?: string | null
          created_at?: string | null
          id?: string
          last_ping?: string | null
          subscription_params?: Json | null
          user_id?: string | null
          websocket_channel?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_realtime_subscriptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_templates: {
        Row: {
          card_ids: string[]
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          role_type: string | null
          updated_at: string | null
        }
        Insert: {
          card_ids: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          role_type?: string | null
          updated_at?: string | null
        }
        Update: {
          card_ids?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          role_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_progress: {
        Row: {
          actual_emissions: number
          category_target_id: string
          created_at: string | null
          gap_to_target: number | null
          id: string
          month: number | null
          organization_id: string
          performance_status: string | null
          reporting_date: string
          required_emissions: number
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_emissions: number
          category_target_id: string
          created_at?: string | null
          gap_to_target?: number | null
          id?: string
          month?: number | null
          organization_id: string
          performance_status?: string | null
          reporting_date: string
          required_emissions: number
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_emissions?: number
          category_target_id?: string
          created_at?: string | null
          gap_to_target?: number | null
          id?: string
          month?: number | null
          organization_id?: string
          performance_status?: string | null
          reporting_date?: string
          required_emissions?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_progress_category_target_id_fkey"
            columns: ["category_target_id"]
            isOneToOne: false
            referencedRelation: "category_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      category_scores: {
        Row: {
          category: string
          created_at: string
          data_points: number
          id: string
          insights: string[] | null
          last_updated: string
          percentile: number | null
          performance_score_id: string
          raw_score: number
          site_id: string | null
          sub_scores: Json | null
          trend: Database["public"]["Enums"]["trend_direction"]
          trend_value: number
          weight: number
          weighted_score: number
        }
        Insert: {
          category: string
          created_at?: string
          data_points?: number
          id?: string
          insights?: string[] | null
          last_updated?: string
          percentile?: number | null
          performance_score_id: string
          raw_score: number
          site_id?: string | null
          sub_scores?: Json | null
          trend?: Database["public"]["Enums"]["trend_direction"]
          trend_value?: number
          weight: number
          weighted_score: number
        }
        Update: {
          category?: string
          created_at?: string
          data_points?: number
          id?: string
          insights?: string[] | null
          last_updated?: string
          percentile?: number | null
          performance_score_id?: string
          raw_score?: number
          site_id?: string | null
          sub_scores?: Json | null
          trend?: Database["public"]["Enums"]["trend_direction"]
          trend_value?: number
          weight?: number
          weighted_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_scores_performance_score_id_fkey"
            columns: ["performance_score_id"]
            isOneToOne: false
            referencedRelation: "performance_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_scores_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "category_scores_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      category_targets: {
        Row: {
          adjusted_target_percent: number
          allocation_reason: string | null
          baseline_emissions: number
          baseline_target_percent: number
          baseline_year: number
          category: string
          created_at: string | null
          created_by: string | null
          effort_factor: number
          emission_percent: number
          feasibility: string
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          organization_id: string
          parent_target_id: string | null
          scope: string
          target_emissions: number
          updated_at: string | null
        }
        Insert: {
          adjusted_target_percent: number
          allocation_reason?: string | null
          baseline_emissions: number
          baseline_target_percent: number
          baseline_year: number
          category: string
          created_at?: string | null
          created_by?: string | null
          effort_factor: number
          emission_percent: number
          feasibility: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          organization_id: string
          parent_target_id?: string | null
          scope: string
          target_emissions: number
          updated_at?: string | null
        }
        Update: {
          adjusted_target_percent?: number
          allocation_reason?: string | null
          baseline_emissions?: number
          baseline_target_percent?: number
          baseline_year?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          effort_factor?: number
          emission_percent?: number
          feasibility?: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          organization_id?: string
          parent_target_id?: string | null
          scope?: string
          target_emissions?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_targets_parent_target_id_fkey"
            columns: ["parent_target_id"]
            isOneToOne: false
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_targets_parent_target_id_fkey"
            columns: ["parent_target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: {
          conversation_id: string
          created_at: string
          extracted_text: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id: string
          message_id: string | null
          metadata: Json | null
          processing_status: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          processing_status?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          processing_status?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_shares: {
        Row: {
          allowed_organization_ids: string[] | null
          allowed_user_ids: string[] | null
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_public: boolean
          last_accessed_at: string | null
          share_description: string | null
          share_title: string | null
          share_token: string
          shared_by_user_id: string
          view_count: number | null
        }
        Insert: {
          allowed_organization_ids?: string[] | null
          allowed_user_ids?: string[] | null
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          last_accessed_at?: string | null
          share_description?: string | null
          share_title?: string | null
          share_token?: string
          shared_by_user_id: string
          view_count?: number | null
        }
        Update: {
          allowed_organization_ids?: string[] | null
          allowed_user_ids?: string[] | null
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          last_accessed_at?: string | null
          share_description?: string | null
          share_title?: string | null
          share_token?: string
          shared_by_user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_shares_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_scenarios: {
        Row: {
          adaptation_costs: number | null
          analysis_date: string | null
          created_at: string | null
          financial_impact_high: number | null
          financial_impact_low: number | null
          id: string
          impact_currency: string | null
          next_review_date: string | null
          organization_id: string
          physical_impacts: Json | null
          resilience_measures: Json | null
          scenario_name: string
          scenario_type: string | null
          temperature_pathway: number | null
          time_horizon: number | null
          transition_impacts: Json | null
          updated_at: string | null
        }
        Insert: {
          adaptation_costs?: number | null
          analysis_date?: string | null
          created_at?: string | null
          financial_impact_high?: number | null
          financial_impact_low?: number | null
          id?: string
          impact_currency?: string | null
          next_review_date?: string | null
          organization_id: string
          physical_impacts?: Json | null
          resilience_measures?: Json | null
          scenario_name: string
          scenario_type?: string | null
          temperature_pathway?: number | null
          time_horizon?: number | null
          transition_impacts?: Json | null
          updated_at?: string | null
        }
        Update: {
          adaptation_costs?: number | null
          analysis_date?: string | null
          created_at?: string | null
          financial_impact_high?: number | null
          financial_impact_low?: number | null
          id?: string
          impact_currency?: string | null
          next_review_date?: string | null
          organization_id?: string
          physical_impacts?: Json | null
          resilience_measures?: Json | null
          scenario_name?: string
          scenario_type?: string | null
          temperature_pathway?: number | null
          time_horizon?: number | null
          transition_impacts?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_scenarios_organization_id_fkey"
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
      company_benchmark_positions: {
        Row: {
          calculated_at: string | null
          company_id: string | null
          company_name: string
          created_at: string | null
          id: string
          is_laggard: boolean | null
          is_leader: boolean | null
          overall_score: number
          percentile_rank: number
          position_data: Json
          report_year: number
          sector: string
        }
        Insert: {
          calculated_at?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string | null
          id?: string
          is_laggard?: boolean | null
          is_leader?: boolean | null
          overall_score: number
          percentile_rank: number
          position_data: Json
          report_year: number
          sector: string
        }
        Update: {
          calculated_at?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          is_laggard?: boolean | null
          is_leader?: boolean | null
          overall_score?: number
          percentile_rank?: number
          position_data?: Json
          report_year?: number
          sector?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_benchmark_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sector_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_esg_data: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          industry: string
          last_updated: string | null
          metrics: Json | null
          organization_id: string
          public_claims: string[] | null
          reports_published: Json | null
          scraper_job_id: string | null
          updated_at: string | null
          website: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          industry: string
          last_updated?: string | null
          metrics?: Json | null
          organization_id: string
          public_claims?: string[] | null
          reports_published?: Json | null
          scraper_job_id?: string | null
          updated_at?: string | null
          website: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          industry?: string
          last_updated?: string | null
          metrics?: Json | null
          organization_id?: string
          public_claims?: string[] | null
          reports_published?: Json | null
          scraper_job_id?: string | null
          updated_at?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_esg_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_esg_data_scraper_job_id_fkey"
            columns: ["scraper_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_action_plans: {
        Row: {
          created_at: string | null
          estimated_effort: string | null
          framework: string
          id: string
          organization_id: string
          plan: string | null
          priority: number | null
          requirement: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_effort?: string | null
          framework: string
          id?: string
          organization_id: string
          plan?: string | null
          priority?: number | null
          requirement?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_effort?: string | null
          framework?: string
          id?: string
          organization_id?: string
          plan?: string | null
          priority?: number | null
          requirement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_action_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          organization_id: string
          severity: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          organization_id: string
          severity?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          organization_id?: string
          severity?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_automations: {
        Row: {
          configuration: Json | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
          status: string | null
          type: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string | null
          type?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_automations_organization_id_fkey"
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
      compliance_tasks: {
        Row: {
          created_at: string | null
          current_status: string | null
          estimated_effort: string | null
          framework: string
          gap_description: string | null
          id: string
          organization_id: string
          priority: number | null
          requirement: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_status?: string | null
          estimated_effort?: string | null
          framework: string
          gap_description?: string | null
          id?: string
          organization_id: string
          priority?: number | null
          requirement?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_status?: string | null
          estimated_effort?: string | null
          framework?: string
          gap_description?: string | null
          id?: string
          organization_id?: string
          priority?: number | null
          requirement?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      conversation_feedback: {
        Row: {
          applied_to_model: boolean | null
          conversation_id: string
          created_at: string | null
          feedback_type: string
          feedback_value: Json
          id: string
          message_index: number
          organization_id: string
          user_id: string
        }
        Insert: {
          applied_to_model?: boolean | null
          conversation_id: string
          created_at?: string | null
          feedback_type: string
          feedback_value: Json
          id?: string
          message_index: number
          organization_id: string
          user_id: string
        }
        Update: {
          applied_to_model?: boolean | null
          conversation_id?: string
          created_at?: string | null
          feedback_type?: string
          feedback_value?: Json
          id?: string
          message_index?: number
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_feedback_organization_id_fkey"
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
      conversation_memory: {
        Row: {
          conversation_id: string
          created_at: string | null
          embedding: string | null
          id: string
          message: string
          message_index: number
          metadata: Json | null
          organization_id: string
          response: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          message: string
          message_index: number
          metadata?: Json | null
          organization_id: string
          response?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          message?: string
          message_index?: number
          metadata?: Json | null
          organization_id?: string
          response?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_preferences: {
        Row: {
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          last_used: string | null
          organization_id: string
          preference_type: string
          preference_value: Json
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          organization_id: string
          preference_type: string
          preference_value: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          organization_id?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_state: {
        Row: {
          confidence: number | null
          conversation_id: string
          created_at: string | null
          id: string
          organization_id: string
          state_type: string
          state_value: Json
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          confidence?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          organization_id: string
          state_type: string
          state_value: Json
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          confidence?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          state_type?: string
          state_value?: Json
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          building_id: string | null
          context_entities: string[] | null
          context_type: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          last_message_at: string | null
          max_tokens: number | null
          message_count: number | null
          metadata: Json | null
          model: string | null
          organization_id: string
          parent_conversation_id: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          summary: string | null
          system_prompt: string | null
          tags: string[] | null
          temperature: number | null
          title: string | null
          total_cost_usd: number | null
          total_tokens_used: number | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          building_id?: string | null
          context_entities?: string[] | null
          context_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          max_tokens?: number | null
          message_count?: number | null
          metadata?: Json | null
          model?: string | null
          organization_id: string
          parent_conversation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          summary?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          title?: string | null
          total_cost_usd?: number | null
          total_tokens_used?: number | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          building_id?: string | null
          context_entities?: string[] | null
          context_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          last_message_at?: string | null
          max_tokens?: number | null
          message_count?: number | null
          metadata?: Json | null
          model?: string | null
          organization_id?: string
          parent_conversation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          summary?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          title?: string | null
          total_cost_usd?: number | null
          total_tokens_used?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
      database_optimization_reports: {
        Row: {
          created_at: string | null
          findings: Json
          generated_at: string | null
          id: string
          impact_score: number | null
          organization_id: string | null
          recommendations: Json | null
          report_type: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          findings: Json
          generated_at?: string | null
          id?: string
          impact_score?: number | null
          organization_id?: string | null
          recommendations?: Json | null
          report_type?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          findings?: Json
          generated_at?: string | null
          id?: string
          impact_score?: number | null
          organization_id?: string | null
          recommendations?: Json | null
          report_type?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "database_optimization_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_anomalies: {
        Row: {
          detected_at: string | null
          deviation: number | null
          device_id: string | null
          id: string
          organization_id: string
          severity: string | null
          threshold: number | null
          type: string | null
          value: number | null
        }
        Insert: {
          detected_at?: string | null
          deviation?: number | null
          device_id?: string | null
          id?: string
          organization_id: string
          severity?: string | null
          threshold?: number | null
          type?: string | null
          value?: number | null
        }
        Update: {
          detected_at?: string | null
          deviation?: number | null
          device_id?: string | null
          id?: string
          organization_id?: string
          severity?: string | null
          threshold?: number | null
          type?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detected_anomalies_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_anomalies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_data: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          metadata: Json | null
          timestamp: string
          unit: string | null
          value: number
          variable: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          unit?: string | null
          value: number
          variable: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          unit?: string | null
          value?: number
          variable?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_data_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_health_metrics: {
        Row: {
          anomaly_count: number | null
          critical_issues: number | null
          device_id: string | null
          failure_probability: number | null
          health_score: number | null
          id: string
          measured_at: string | null
          organization_id: string
        }
        Insert: {
          anomaly_count?: number | null
          critical_issues?: number | null
          device_id?: string | null
          failure_probability?: number | null
          health_score?: number | null
          id?: string
          measured_at?: string | null
          organization_id: string
        }
        Update: {
          anomaly_count?: number | null
          critical_issues?: number | null
          device_id?: string | null
          failure_probability?: number | null
          health_score?: number | null
          id?: string
          measured_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_health_metrics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_health_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_telemetry: {
        Row: {
          consumption: number | null
          created_at: string | null
          device_id: string
          efficiency: number | null
          emissions: number | null
          id: string
          metadata: Json | null
          organization_id: string | null
          status: string | null
          timestamp: string | null
        }
        Insert: {
          consumption?: number | null
          created_at?: string | null
          device_id: string
          efficiency?: number | null
          emissions?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Update: {
          consumption?: number | null
          created_at?: string | null
          device_id?: string
          efficiency?: number | null
          emissions?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_telemetry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_templates: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          type: string
          variables: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          type: string
          variables: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          type?: string
          variables?: Json
        }
        Relationships: []
      }
      devices: {
        Row: {
          api_endpoint: string | null
          authentication: Json | null
          created_at: string | null
          external_id: string | null
          id: string
          installed_at: string | null
          last_seen_at: string | null
          last_sync: string | null
          location: string | null
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          name: string
          organization_id: string | null
          protocol: string | null
          serial_number: string | null
          site_id: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          authentication?: Json | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          installed_at?: string | null
          last_seen_at?: string | null
          last_sync?: string | null
          location?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          organization_id?: string | null
          protocol?: string | null
          serial_number?: string | null
          site_id: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          authentication?: Json | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          installed_at?: string | null
          last_seen_at?: string | null
          last_sync?: string | null
          location?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          organization_id?: string | null
          protocol?: string | null
          serial_number?: string | null
          site_id?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "devices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      documents_embeddings: {
        Row: {
          content: string
          created_at: string
          document_type: string
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          geographic_scope: string | null
          id: string
          metadata: Json | null
          methodology: string | null
          name: string
          published_date: string | null
          quality_rating: number | null
          regions: string[] | null
          scope: Database["public"]["Enums"]["emission_scope"]
          source_document: string | null
          source_organization: string
          source_year: number | null
          subcategory: string | null
          uncertainty_percent: number | null
          uncertainty_range: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
          version: string | null
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
          geographic_scope?: string | null
          id?: string
          metadata?: Json | null
          methodology?: string | null
          name: string
          published_date?: string | null
          quality_rating?: number | null
          regions?: string[] | null
          scope: Database["public"]["Enums"]["emission_scope"]
          source_document?: string | null
          source_organization: string
          source_year?: number | null
          subcategory?: string | null
          uncertainty_percent?: number | null
          uncertainty_range?: number | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
          version?: string | null
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
          geographic_scope?: string | null
          id?: string
          metadata?: Json | null
          methodology?: string | null
          name?: string
          published_date?: string | null
          quality_rating?: number | null
          regions?: string[] | null
          scope?: Database["public"]["Enums"]["emission_scope"]
          source_document?: string | null
          source_organization?: string
          source_year?: number | null
          subcategory?: string | null
          uncertainty_percent?: number | null
          uncertainty_range?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
          version?: string | null
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
      emissions_adjustments: {
        Row: {
          adjustment_type: string
          certification_standard: string | null
          co2e_amount: number
          created_at: string | null
          evidence_url: string | null
          id: string
          nature_based: boolean | null
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          permanent: boolean | null
          project_id: string | null
          project_name: string | null
          retirement_date: string | null
          scope: string | null
          technological: boolean | null
          updated_at: string | null
          vintage_year: number | null
        }
        Insert: {
          adjustment_type: string
          certification_standard?: string | null
          co2e_amount: number
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          nature_based?: boolean | null
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          permanent?: boolean | null
          project_id?: string | null
          project_name?: string | null
          retirement_date?: string | null
          scope?: string | null
          technological?: boolean | null
          updated_at?: string | null
          vintage_year?: number | null
        }
        Update: {
          adjustment_type?: string
          certification_standard?: string | null
          co2e_amount?: number
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          nature_based?: boolean | null
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          permanent?: boolean | null
          project_id?: string | null
          project_name?: string | null
          retirement_date?: string | null
          scope?: string | null
          technological?: boolean | null
          updated_at?: string | null
          vintage_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emissions_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      environmental_incidents: {
        Row: {
          corrective_actions: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          environmental_impact: string | null
          fine_amount: number | null
          id: string
          incident_date: string
          incident_description: string
          incident_type: string
          notes: string | null
          organization_id: string
          regulation_violated: string | null
          regulatory_body: string | null
          resolution_date: string | null
          resolution_description: string | null
          severity: string | null
          site_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          corrective_actions?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          environmental_impact?: string | null
          fine_amount?: number | null
          id?: string
          incident_date: string
          incident_description: string
          incident_type: string
          notes?: string | null
          organization_id: string
          regulation_violated?: string | null
          regulatory_body?: string | null
          resolution_date?: string | null
          resolution_description?: string | null
          severity?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          corrective_actions?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          environmental_impact?: string | null
          fine_amount?: number | null
          id?: string
          incident_date?: string
          incident_description?: string
          incident_type?: string
          notes?: string | null
          organization_id?: string
          regulation_violated?: string | null
          regulatory_body?: string | null
          resolution_date?: string | null
          resolution_description?: string | null
          severity?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "environmental_incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      esrs_e1_disclosures: {
        Row: {
          adaptation_actions: Json | null
          capex_green: number | null
          carbon_price_currency: string | null
          carbon_price_used: number | null
          climate_policies: Json | null
          created_at: string | null
          credits_total: number | null
          energy_consumption: Json | null
          financial_effects_adaptation: Json | null
          financial_effects_mitigation: Json | null
          id: string
          mitigation_actions: Json | null
          opex_green: number | null
          opportunities: Json | null
          organization_id: string
          removals_total: number | null
          reporting_year: number
          scope_1_gross: number | null
          scope_2_gross_lb: number | null
          scope_2_gross_mb: number | null
          scope_3_gross: number | null
          targets: Json | null
          total_gross: number | null
          transition_plan: Json | null
          transition_plan_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          adaptation_actions?: Json | null
          capex_green?: number | null
          carbon_price_currency?: string | null
          carbon_price_used?: number | null
          climate_policies?: Json | null
          created_at?: string | null
          credits_total?: number | null
          energy_consumption?: Json | null
          financial_effects_adaptation?: Json | null
          financial_effects_mitigation?: Json | null
          id?: string
          mitigation_actions?: Json | null
          opex_green?: number | null
          opportunities?: Json | null
          organization_id: string
          removals_total?: number | null
          reporting_year: number
          scope_1_gross?: number | null
          scope_2_gross_lb?: number | null
          scope_2_gross_mb?: number | null
          scope_3_gross?: number | null
          targets?: Json | null
          total_gross?: number | null
          transition_plan?: Json | null
          transition_plan_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          adaptation_actions?: Json | null
          capex_green?: number | null
          carbon_price_currency?: string | null
          carbon_price_used?: number | null
          climate_policies?: Json | null
          created_at?: string | null
          credits_total?: number | null
          energy_consumption?: Json | null
          financial_effects_adaptation?: Json | null
          financial_effects_mitigation?: Json | null
          id?: string
          mitigation_actions?: Json | null
          opex_green?: number | null
          opportunities?: Json | null
          organization_id?: string
          removals_total?: number | null
          reporting_year?: number
          scope_1_gross?: number | null
          scope_2_gross_lb?: number | null
          scope_2_gross_mb?: number | null
          scope_3_gross?: number | null
          targets?: Json | null
          total_gross?: number | null
          transition_plan?: Json | null
          transition_plan_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esrs_e1_disclosures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      failure_predictions: {
        Row: {
          confidence: number | null
          created_at: string | null
          device_id: string | null
          id: string
          organization_id: string
          predicted_date: string | null
          probability: number | null
          risk_factors: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          organization_id: string
          predicted_date?: string | null
          probability?: number | null
          risk_factors?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          organization_id?: string
          predicted_date?: string | null
          probability?: number | null
          risk_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "failure_predictions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failure_predictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_mappings: {
        Row: {
          calculation_method: string | null
          created_at: string | null
          data_quality_requirements: string | null
          datapoint_code: string | null
          description: string | null
          esrs_codes: string[] | null
          gri_codes: string[] | null
          id: string
          ifrs_s2_codes: string[] | null
          metric_id: string | null
          tcfd_references: string[] | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          calculation_method?: string | null
          created_at?: string | null
          data_quality_requirements?: string | null
          datapoint_code?: string | null
          description?: string | null
          esrs_codes?: string[] | null
          gri_codes?: string[] | null
          id?: string
          ifrs_s2_codes?: string[] | null
          metric_id?: string | null
          tcfd_references?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          calculation_method?: string | null
          created_at?: string | null
          data_quality_requirements?: string | null
          datapoint_code?: string | null
          description?: string | null
          esrs_codes?: string[] | null
          gri_codes?: string[] | null
          id?: string
          ifrs_s2_codes?: string[] | null
          metric_id?: string | null
          tcfd_references?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_mappings_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "framework_mappings_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
        ]
      }
      ghg_inventory_settings: {
        Row: {
          assurance_level: string | null
          assurance_provider: string | null
          assurance_statement_url: string | null
          base_year: number | null
          base_year_rationale: string | null
          compliance_statement: string | null
          consolidation_approach: string | null
          created_at: string | null
          gases_covered: string[] | null
          gwp_standard: string | null
          id: string
          methodology_description: string | null
          organization_id: string
          period_end: string | null
          period_start: string | null
          recalculation_threshold: number | null
          reporting_entity: string | null
          reporting_year: number
          scope3_categories_included: number[] | null
          scope3_screening_rationale: string | null
          updated_at: string | null
        }
        Insert: {
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_statement_url?: string | null
          base_year?: number | null
          base_year_rationale?: string | null
          compliance_statement?: string | null
          consolidation_approach?: string | null
          created_at?: string | null
          gases_covered?: string[] | null
          gwp_standard?: string | null
          id?: string
          methodology_description?: string | null
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          recalculation_threshold?: number | null
          reporting_entity?: string | null
          reporting_year: number
          scope3_categories_included?: number[] | null
          scope3_screening_rationale?: string | null
          updated_at?: string | null
        }
        Update: {
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_statement_url?: string | null
          base_year?: number | null
          base_year_rationale?: string | null
          compliance_statement?: string | null
          consolidation_approach?: string | null
          created_at?: string | null
          gases_covered?: string[] | null
          gwp_standard?: string | null
          id?: string
          methodology_description?: string | null
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          recalculation_threshold?: number | null
          reporting_entity?: string | null
          reporting_year?: number
          scope3_categories_included?: number[] | null
          scope3_screening_rationale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghg_inventory_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      gri_sector_material_topics: {
        Row: {
          created_at: string | null
          dashboard_type: string | null
          description: string | null
          disclosure_requirements: Json | null
          gri_sector_id: number | null
          id: number
          is_critical: boolean | null
          topic_category: string
          topic_code: string
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dashboard_type?: string | null
          description?: string | null
          disclosure_requirements?: Json | null
          gri_sector_id?: number | null
          id?: number
          is_critical?: boolean | null
          topic_category: string
          topic_code: string
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dashboard_type?: string | null
          description?: string | null
          disclosure_requirements?: Json | null
          gri_sector_id?: number | null
          id?: number
          is_critical?: boolean | null
          topic_category?: string
          topic_code?: string
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gri_sector_material_topics_gri_sector_id_fkey"
            columns: ["gri_sector_id"]
            isOneToOne: false
            referencedRelation: "gri_sectors"
            referencedColumns: ["id"]
          },
        ]
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
      gri_sectors: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          name: string
          published_year: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          published_year: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          published_year?: number
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
      industry_materiality: {
        Row: {
          created_at: string | null
          financial_materiality: boolean | null
          gri_disclosure: string | null
          gri_sector_code: string | null
          id: string
          impact_materiality: boolean | null
          industry: string
          last_reviewed: string | null
          mandatory: boolean | null
          materiality_level: string
          materiality_reason: string | null
          metric_catalog_id: string | null
          required_for_frameworks: Json | null
          source: string | null
          sub_sector: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          financial_materiality?: boolean | null
          gri_disclosure?: string | null
          gri_sector_code?: string | null
          id?: string
          impact_materiality?: boolean | null
          industry: string
          last_reviewed?: string | null
          mandatory?: boolean | null
          materiality_level?: string
          materiality_reason?: string | null
          metric_catalog_id?: string | null
          required_for_frameworks?: Json | null
          source?: string | null
          sub_sector?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          financial_materiality?: boolean | null
          gri_disclosure?: string | null
          gri_sector_code?: string | null
          id?: string
          impact_materiality?: boolean | null
          industry?: string
          last_reviewed?: string | null
          mandatory?: boolean | null
          materiality_level?: string
          materiality_reason?: string | null
          metric_catalog_id?: string | null
          required_for_frameworks?: Json | null
          source?: string | null
          sub_sector?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_materiality_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_materiality_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
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
      industry_sectors: {
        Row: {
          benchmark_intensity_avg: number | null
          benchmark_intensity_high: number | null
          benchmark_intensity_low: number | null
          created_at: string | null
          default_production_unit: string | null
          gri_standard: string | null
          id: string
          intensity_denominator_options: string[] | null
          sbti_pathway: string | null
          sector_category: string
          sector_name: string
        }
        Insert: {
          benchmark_intensity_avg?: number | null
          benchmark_intensity_high?: number | null
          benchmark_intensity_low?: number | null
          created_at?: string | null
          default_production_unit?: string | null
          gri_standard?: string | null
          id?: string
          intensity_denominator_options?: string[] | null
          sbti_pathway?: string | null
          sector_category: string
          sector_name: string
        }
        Update: {
          benchmark_intensity_avg?: number | null
          benchmark_intensity_high?: number | null
          benchmark_intensity_low?: number | null
          created_at?: string | null
          default_production_unit?: string | null
          gri_standard?: string | null
          id?: string
          intensity_denominator_options?: string[] | null
          sbti_pathway?: string | null
          sector_category?: string
          sector_name?: string
        }
        Relationships: []
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
      maintenance_schedules: {
        Row: {
          created_at: string | null
          device_id: string | null
          estimated_duration: number | null
          id: string
          organization_id: string
          priority: string | null
          scheduled_date: string | null
          status: string | null
          tasks: string[] | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          estimated_duration?: number | null
          id?: string
          organization_id: string
          priority?: string | null
          scheduled_date?: string | null
          status?: string | null
          tasks?: string[] | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          estimated_duration?: number | null
          id?: string
          organization_id?: string
          priority?: string | null
          scheduled_date?: string | null
          status?: string | null
          tasks?: string[] | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      message_votes: {
        Row: {
          created_at: string
          feedback_category: string | null
          feedback_text: string | null
          id: string
          message_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          feedback_category?: string | null
          feedback_text?: string | null
          id?: string
          message_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          feedback_category?: string | null
          feedback_text?: string | null
          id?: string
          message_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string | null
          completion_tokens: number | null
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          finish_reason: string | null
          function_args: Json | null
          function_name: string | null
          function_response: Json | null
          id: string
          is_edited: boolean | null
          is_regenerated: boolean | null
          latency_ms: number | null
          metadata: Json | null
          model: string | null
          parent_message_id: string | null
          parts: Json | null
          priority: string | null
          prompt_tokens: number | null
          read: boolean | null
          role: Database["public"]["Enums"]["message_role"]
          streaming_enabled: boolean | null
          tool_calls: Json | null
          tool_results: Json | null
          total_tokens: number | null
          ui_components: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          completion_tokens?: number | null
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          finish_reason?: string | null
          function_args?: Json | null
          function_name?: string | null
          function_response?: Json | null
          id?: string
          is_edited?: boolean | null
          is_regenerated?: boolean | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          parent_message_id?: string | null
          parts?: Json | null
          priority?: string | null
          prompt_tokens?: number | null
          read?: boolean | null
          role: Database["public"]["Enums"]["message_role"]
          streaming_enabled?: boolean | null
          tool_calls?: Json | null
          tool_results?: Json | null
          total_tokens?: number | null
          ui_components?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          completion_tokens?: number | null
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          finish_reason?: string | null
          function_args?: Json | null
          function_name?: string | null
          function_response?: Json | null
          id?: string
          is_edited?: boolean | null
          is_regenerated?: boolean | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          parent_message_id?: string | null
          parts?: Json | null
          priority?: string | null
          prompt_tokens?: number | null
          read?: boolean | null
          role?: Database["public"]["Enums"]["message_role"]
          streaming_enabled?: boolean | null
          tool_calls?: Json | null
          tool_results?: Json | null
          total_tokens?: number | null
          ui_components?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_recommendations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          created_by: string | null
          dismissed_at: string | null
          dismissed_reason: string | null
          estimated_annual_savings: number | null
          estimated_baseline_unit: string | null
          estimated_baseline_value: number | null
          estimated_cost_to_implement: number | null
          estimated_roi_multiplier: number | null
          estimation_confidence: string | null
          estimation_method: string | null
          gri_disclosure: string | null
          id: string
          metric_catalog_id: string
          organization_id: string
          peer_adoption_percent: number | null
          priority: string
          recommendation_reason: string
          required_for_frameworks: Json | null
          status: string | null
          time_to_implement_hours: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          estimated_annual_savings?: number | null
          estimated_baseline_unit?: string | null
          estimated_baseline_value?: number | null
          estimated_cost_to_implement?: number | null
          estimated_roi_multiplier?: number | null
          estimation_confidence?: string | null
          estimation_method?: string | null
          gri_disclosure?: string | null
          id?: string
          metric_catalog_id: string
          organization_id: string
          peer_adoption_percent?: number | null
          priority?: string
          recommendation_reason: string
          required_for_frameworks?: Json | null
          status?: string | null
          time_to_implement_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          estimated_annual_savings?: number | null
          estimated_baseline_unit?: string | null
          estimated_baseline_value?: number | null
          estimated_cost_to_implement?: number | null
          estimated_roi_multiplier?: number | null
          estimation_confidence?: string | null
          estimation_method?: string | null
          gri_disclosure?: string | null
          id?: string
          metric_catalog_id?: string
          organization_id?: string
          peer_adoption_percent?: number | null
          priority?: string
          recommendation_reason?: string
          required_for_frameworks?: Json | null
          status?: string | null
          time_to_implement_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_recommendations_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_recommendations_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_targets: {
        Row: {
          assumptions: string | null
          baseline_emissions: number
          baseline_value: number
          baseline_year: number
          confidence_level: string | null
          created_at: string | null
          created_by: string | null
          current_emission_factor: number | null
          id: string
          metric_catalog_id: string
          notes: string | null
          organization_id: string
          reduction_percentage: number | null
          status: string | null
          strategy_type: string
          target_emission_factor: number | null
          target_emissions: number
          target_id: string | null
          target_value: number
          target_year: number
          updated_at: string | null
        }
        Insert: {
          assumptions?: string | null
          baseline_emissions: number
          baseline_value: number
          baseline_year: number
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          current_emission_factor?: number | null
          id?: string
          metric_catalog_id: string
          notes?: string | null
          organization_id: string
          reduction_percentage?: number | null
          status?: string | null
          strategy_type?: string
          target_emission_factor?: number | null
          target_emissions: number
          target_id?: string | null
          target_value: number
          target_year: number
          updated_at?: string | null
        }
        Update: {
          assumptions?: string | null
          baseline_emissions?: number
          baseline_value?: number
          baseline_year?: number
          confidence_level?: string | null
          created_at?: string | null
          created_by?: string | null
          current_emission_factor?: number | null
          id?: string
          metric_catalog_id?: string
          notes?: string | null
          organization_id?: string
          reduction_percentage?: number | null
          status?: string | null
          strategy_type?: string
          target_emission_factor?: number | null
          target_emissions?: number
          target_id?: string | null
          target_value?: number
          target_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_targets_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_targets_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_targets_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_targets_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_targets_monthly: {
        Row: {
          actual_emission_factor: number | null
          actual_emissions: number | null
          actual_value: number | null
          id: string
          metric_target_id: string
          month: number
          planned_emission_factor: number | null
          planned_emissions: number
          planned_value: number
          status: string | null
          updated_at: string | null
          variance_emissions: number | null
          variance_percentage: number | null
          variance_value: number | null
          year: number
        }
        Insert: {
          actual_emission_factor?: number | null
          actual_emissions?: number | null
          actual_value?: number | null
          id?: string
          metric_target_id: string
          month: number
          planned_emission_factor?: number | null
          planned_emissions: number
          planned_value: number
          status?: string | null
          updated_at?: string | null
          variance_emissions?: number | null
          variance_percentage?: number | null
          variance_value?: number | null
          year: number
        }
        Update: {
          actual_emission_factor?: number | null
          actual_emissions?: number | null
          actual_value?: number | null
          id?: string
          metric_target_id?: string
          month?: number
          planned_emission_factor?: number | null
          planned_emissions?: number
          planned_value?: number
          status?: string | null
          updated_at?: string | null
          variance_emissions?: number | null
          variance_percentage?: number | null
          variance_value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_targets_monthly_metric_target_id_fkey"
            columns: ["metric_target_id"]
            isOneToOne: false
            referencedRelation: "metric_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_tracking_history: {
        Row: {
          baseline_year: number | null
          created_at: string | null
          estimated_baseline_emissions: number | null
          estimation_confidence: string | null
          estimation_method: string | null
          estimation_notes: string | null
          first_data_entry_date: string | null
          id: string
          in_original_baseline: boolean
          metric_id: string
          organization_id: string
          started_tracking_date: string
          updated_at: string | null
        }
        Insert: {
          baseline_year?: number | null
          created_at?: string | null
          estimated_baseline_emissions?: number | null
          estimation_confidence?: string | null
          estimation_method?: string | null
          estimation_notes?: string | null
          first_data_entry_date?: string | null
          id?: string
          in_original_baseline?: boolean
          metric_id: string
          organization_id: string
          started_tracking_date: string
          updated_at?: string | null
        }
        Update: {
          baseline_year?: number | null
          created_at?: string | null
          estimated_baseline_emissions?: number | null
          estimation_confidence?: string | null
          estimation_method?: string | null
          estimation_notes?: string | null
          first_data_entry_date?: string | null
          id?: string
          in_original_baseline?: boolean
          metric_id?: string
          organization_id?: string
          started_tracking_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_tracking_history_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_tracking_history_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_tracking_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_cache: {
        Row: {
          cache_type: string
          computation_time_ms: number | null
          computed_at: string
          created_at: string | null
          data: Json
          data_version: number | null
          domain: string
          expires_at: string | null
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          period_year: number | null
          updated_at: string | null
        }
        Insert: {
          cache_type: string
          computation_time_ms?: number | null
          computed_at?: string
          created_at?: string | null
          data: Json
          data_version?: number | null
          domain: string
          expires_at?: string | null
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          period_year?: number | null
          updated_at?: string | null
        }
        Update: {
          cache_type?: string
          computation_time_ms?: number | null
          computed_at?: string
          created_at?: string | null
          data?: Json
          data_version?: number | null
          domain?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          period_year?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_catalog: {
        Row: {
          calculation_method: string | null
          category: string
          code: string
          consumption_rate: number | null
          cost_per_ton: number | null
          created_at: string | null
          description: string | null
          disposal_method: string | null
          emission_factor: number | null
          emission_factor_source: string | null
          emission_factor_unit: string | null
          energy_source_type: string | null
          energy_type: string | null
          fuel_source: string | null
          generation_type: string | null
          ghg_protocol_category: string | null
          has_energy_recovery: boolean | null
          id: string
          is_active: boolean | null
          is_diverted: boolean | null
          is_recycling: boolean | null
          is_renewable: boolean | null
          name: string
          scope: string
          subcategory: string | null
          unit: string
          updated_at: string | null
          waste_material_type: string | null
        }
        Insert: {
          calculation_method?: string | null
          category: string
          code: string
          consumption_rate?: number | null
          cost_per_ton?: number | null
          created_at?: string | null
          description?: string | null
          disposal_method?: string | null
          emission_factor?: number | null
          emission_factor_source?: string | null
          emission_factor_unit?: string | null
          energy_source_type?: string | null
          energy_type?: string | null
          fuel_source?: string | null
          generation_type?: string | null
          ghg_protocol_category?: string | null
          has_energy_recovery?: boolean | null
          id?: string
          is_active?: boolean | null
          is_diverted?: boolean | null
          is_recycling?: boolean | null
          is_renewable?: boolean | null
          name: string
          scope: string
          subcategory?: string | null
          unit: string
          updated_at?: string | null
          waste_material_type?: string | null
        }
        Update: {
          calculation_method?: string | null
          category?: string
          code?: string
          consumption_rate?: number | null
          cost_per_ton?: number | null
          created_at?: string | null
          description?: string | null
          disposal_method?: string | null
          emission_factor?: number | null
          emission_factor_source?: string | null
          emission_factor_unit?: string | null
          energy_source_type?: string | null
          energy_type?: string | null
          fuel_source?: string | null
          generation_type?: string | null
          ghg_protocol_category?: string | null
          has_energy_recovery?: boolean | null
          id?: string
          is_active?: boolean | null
          is_diverted?: boolean | null
          is_recycling?: boolean | null
          is_renewable?: boolean | null
          name?: string
          scope?: string
          subcategory?: string | null
          unit?: string
          updated_at?: string | null
          waste_material_type?: string | null
        }
        Relationships: []
      }
      metrics_data: {
        Row: {
          calculation_method: string | null
          co2e_emissions: number | null
          created_at: string | null
          created_by: string | null
          data_quality: string | null
          data_source_type: string | null
          emission_factor_source: string | null
          emissions_location_based: number | null
          emissions_market_based: number | null
          evidence_url: string | null
          grid_region: string | null
          id: string
          metadata: Json | null
          metric_id: string
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          scope2_method: string | null
          site_id: string | null
          unit: string
          updated_at: string | null
          value: number
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          calculation_method?: string | null
          co2e_emissions?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: string | null
          data_source_type?: string | null
          emission_factor_source?: string | null
          emissions_location_based?: number | null
          emissions_market_based?: number | null
          evidence_url?: string | null
          grid_region?: string | null
          id?: string
          metadata?: Json | null
          metric_id: string
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          scope2_method?: string | null
          site_id?: string | null
          unit: string
          updated_at?: string | null
          value: number
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          calculation_method?: string | null
          co2e_emissions?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: string | null
          data_source_type?: string | null
          emission_factor_source?: string | null
          emissions_location_based?: number | null
          emissions_market_based?: number | null
          evidence_url?: string | null
          grid_region?: string | null
          id?: string
          metadata?: Json | null
          metric_id?: string
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          scope2_method?: string | null
          site_id?: string | null
          unit?: string
          updated_at?: string | null
          value?: number
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_data_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_data_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "metrics_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          gri_standard: string | null
          id: string
          industry: string | null
          is_public: boolean | null
          metric_ids: string[]
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gri_standard?: string | null
          id?: string
          industry?: string | null
          is_public?: boolean | null
          metric_ids: string[]
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          gri_standard?: string | null
          id?: string
          industry?: string | null
          is_public?: boolean | null
          metric_ids?: string[]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      ml_evaluations: {
        Row: {
          evaluated_at: string | null
          id: string
          metrics: Json | null
          model_type: string
          organization_id: string
        }
        Insert: {
          evaluated_at?: string | null
          id?: string
          metrics?: Json | null
          model_type: string
          organization_id: string
        }
        Update: {
          evaluated_at?: string | null
          id?: string
          metrics?: Json | null
          model_type?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      ml_hyperparameters: {
        Row: {
          all_results: Json | null
          best_params: Json | null
          id: string
          model_type: string
          organization_id: string
          tuned_at: string | null
        }
        Insert: {
          all_results?: Json | null
          best_params?: Json | null
          id?: string
          model_type: string
          organization_id: string
          tuned_at?: string | null
        }
        Update: {
          all_results?: Json | null
          best_params?: Json | null
          id?: string
          model_type?: string
          organization_id?: string
          tuned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_hyperparameters_organization_id_fkey"
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
      ml_model_storage: {
        Row: {
          id: string
          model_data: Json
          model_type: string
          organization_id: string
          path: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          model_data: Json
          model_type: string
          organization_id: string
          path?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          model_data?: Json
          model_type?: string
          organization_id?: string
          path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_model_storage_organization_id_fkey"
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
      ml_training_cycles: {
        Row: {
          completed_at: string | null
          id: string
          organization_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_cycles_organization_id_fkey"
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
      ml_training_logs: {
        Row: {
          epoch: number | null
          id: string
          loss: number | null
          mae: number | null
          model_type: string
          organization_id: string
          timestamp: string | null
          val_loss: number | null
          val_mae: number | null
        }
        Insert: {
          epoch?: number | null
          id?: string
          loss?: number | null
          mae?: number | null
          model_type: string
          organization_id: string
          timestamp?: string | null
          val_loss?: number | null
          val_mae?: number | null
        }
        Update: {
          epoch?: number | null
          id?: string
          loss?: number | null
          mae?: number | null
          model_type?: string
          organization_id?: string
          timestamp?: string | null
          val_loss?: number | null
          val_mae?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_logs_organization_id_fkey"
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
      optimization_jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number | null
          organization_id: string | null
          params: Json | null
          priority: number | null
          result: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number | null
          organization_id?: string | null
          params?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number | null
          organization_id?: string | null
          params?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_opportunities: {
        Row: {
          actions: Json | null
          area: string | null
          complexity: string | null
          confidence: number | null
          created_at: string | null
          description: string | null
          estimated_savings: number | null
          id: string
          improvement_potential: number | null
          organization_id: string
          status: string | null
        }
        Insert: {
          actions?: Json | null
          area?: string | null
          complexity?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          id?: string
          improvement_potential?: number | null
          organization_id: string
          status?: string | null
        }
        Update: {
          actions?: Json | null
          area?: string | null
          complexity?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          id?: string
          improvement_potential?: number | null
          organization_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestration_metrics: {
        Row: {
          active_agents: number | null
          avg_execution_time: number | null
          created_at: string | null
          execution_time_ms: number | null
          failed_tasks: number | null
          id: string
          organization_id: string
          successful_tasks: number | null
          tasks_processed: number | null
        }
        Insert: {
          active_agents?: number | null
          avg_execution_time?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          failed_tasks?: number | null
          id?: string
          organization_id: string
          successful_tasks?: number | null
          tasks_processed?: number | null
        }
        Update: {
          active_agents?: number | null
          avg_execution_time?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          failed_tasks?: number | null
          id?: string
          organization_id?: string
          successful_tasks?: number | null
          tasks_processed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orchestration_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_benchmark_access: {
        Row: {
          access_level: string | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          organization_id: string
          sector: string
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          organization_id: string
          sector: string
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          organization_id?: string
          sector?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_benchmark_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_creation_invitations: {
        Row: {
          created_at: string | null
          current_uses: number | null
          custom_message: string | null
          email: string
          expires_at: string
          id: string
          invitation_type: string | null
          invited_by: string
          max_uses: number | null
          organization_name: string | null
          sender_email: string | null
          sender_name: string | null
          suggested_org_data: Json | null
          terms_version: string | null
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          current_uses?: number | null
          custom_message?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_type?: string | null
          invited_by: string
          max_uses?: number | null
          organization_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          suggested_org_data?: Json | null
          terms_version?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          current_uses?: number | null
          custom_message?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_type?: string | null
          invited_by?: string
          max_uses?: number | null
          organization_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          suggested_org_data?: Json | null
          terms_version?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      organization_inventory_settings: {
        Row: {
          assurance_date: string | null
          assurance_level: string | null
          assurance_provider: string | null
          assurance_scope: string[] | null
          base_year: number
          base_year_rationale: string | null
          base_year_recalculation_policy: string | null
          base_year_significance_threshold: number | null
          calculation_tools: string[] | null
          consolidation_approach: string
          consolidation_percentage: number | null
          created_at: string | null
          gases_covered: string[] | null
          gwp_version: string | null
          id: string
          material_topics: Json | null
          materiality_assessment_date: string | null
          organization_id: string
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement: Json | null
          updated_at: string | null
        }
        Insert: {
          assurance_date?: string | null
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_scope?: string[] | null
          base_year: number
          base_year_rationale?: string | null
          base_year_recalculation_policy?: string | null
          base_year_significance_threshold?: number | null
          calculation_tools?: string[] | null
          consolidation_approach: string
          consolidation_percentage?: number | null
          created_at?: string | null
          gases_covered?: string[] | null
          gwp_version?: string | null
          id?: string
          material_topics?: Json | null
          materiality_assessment_date?: string | null
          organization_id: string
          reporting_period_end: string
          reporting_period_start: string
          stakeholder_engagement?: Json | null
          updated_at?: string | null
        }
        Update: {
          assurance_date?: string | null
          assurance_level?: string | null
          assurance_provider?: string | null
          assurance_scope?: string[] | null
          base_year?: number
          base_year_rationale?: string | null
          base_year_recalculation_policy?: string | null
          base_year_significance_threshold?: number | null
          calculation_tools?: string[] | null
          consolidation_approach?: string
          consolidation_percentage?: number | null
          created_at?: string | null
          gases_covered?: string[] | null
          gwp_version?: string | null
          id?: string
          material_topics?: Json | null
          materiality_assessment_date?: string | null
          organization_id?: string
          reporting_period_end?: string
          reporting_period_start?: string
          stakeholder_engagement?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_inventory_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          is_owner: boolean | null
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
          is_owner?: boolean | null
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
          is_owner?: boolean | null
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
      organization_metrics: {
        Row: {
          baseline_value: number | null
          baseline_year: number | null
          created_at: string | null
          data_source: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          metric_id: string
          notes: string | null
          organization_id: string
          reporting_frequency: string | null
          responsible_user_id: string | null
          target_value: number | null
          target_year: number | null
          updated_at: string | null
        }
        Insert: {
          baseline_value?: number | null
          baseline_year?: number | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          metric_id: string
          notes?: string | null
          organization_id: string
          reporting_frequency?: string | null
          responsible_user_id?: string | null
          target_value?: number | null
          target_year?: number | null
          updated_at?: string | null
        }
        Update: {
          baseline_value?: number | null
          baseline_year?: number | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          metric_id?: string
          notes?: string | null
          organization_id?: string
          reporting_frequency?: string | null
          responsible_user_id?: string | null
          target_value?: number | null
          target_year?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_regulatory_tracking: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          regulatory_update_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          regulatory_update_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          regulatory_update_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_regulatory_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_regulatory_tracking_regulatory_update_id_fkey"
            columns: ["regulatory_update_id"]
            isOneToOne: false
            referencedRelation: "regulatory_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_owner_id: string | null
          annual_customers: number | null
          annual_operating_hours: number | null
          annual_production_volume: number | null
          annual_revenue: number | null
          api_settings: Json | null
          base_year: number | null
          billing_address: Json | null
          brand_colors: Json | null
          company_size: string | null
          company_size_category: string | null
          compliance_frameworks: string[] | null
          consolidation_approach: string | null
          created_at: string | null
          created_by: string | null
          custom_settings: Json | null
          data_residency_region: string | null
          deleted_at: string | null
          employees: number | null
          enabled_features: string[] | null
          feature_flags: Json | null
          gri_sector_code: string | null
          gri_sector_id: string | null
          headquarters_address: Json | null
          id: string
          industry: string | null
          industry_classification_id: string | null
          industry_confidence: number | null
          industry_primary: string | null
          industry_secondary: string | null
          industry_sector: string | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          primary_contact_email: string | null
          primary_contact_phone: string | null
          production_unit: string | null
          public_company: boolean | null
          region: string | null
          sector_category: string | null
          settings: Json | null
          slug: string
          stock_ticker: string | null
          subscription_expires_at: string | null
          subscription_seats: number | null
          subscription_started_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          value_added: number | null
          website: string | null
        }
        Insert: {
          account_owner_id?: string | null
          annual_customers?: number | null
          annual_operating_hours?: number | null
          annual_production_volume?: number | null
          annual_revenue?: number | null
          api_settings?: Json | null
          base_year?: number | null
          billing_address?: Json | null
          brand_colors?: Json | null
          company_size?: string | null
          company_size_category?: string | null
          compliance_frameworks?: string[] | null
          consolidation_approach?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_settings?: Json | null
          data_residency_region?: string | null
          deleted_at?: string | null
          employees?: number | null
          enabled_features?: string[] | null
          feature_flags?: Json | null
          gri_sector_code?: string | null
          gri_sector_id?: string | null
          headquarters_address?: Json | null
          id?: string
          industry?: string | null
          industry_classification_id?: string | null
          industry_confidence?: number | null
          industry_primary?: string | null
          industry_secondary?: string | null
          industry_sector?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          production_unit?: string | null
          public_company?: boolean | null
          region?: string | null
          sector_category?: string | null
          settings?: Json | null
          slug: string
          stock_ticker?: string | null
          subscription_expires_at?: string | null
          subscription_seats?: number | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          value_added?: number | null
          website?: string | null
        }
        Update: {
          account_owner_id?: string | null
          annual_customers?: number | null
          annual_operating_hours?: number | null
          annual_production_volume?: number | null
          annual_revenue?: number | null
          api_settings?: Json | null
          base_year?: number | null
          billing_address?: Json | null
          brand_colors?: Json | null
          company_size?: string | null
          company_size_category?: string | null
          compliance_frameworks?: string[] | null
          consolidation_approach?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_settings?: Json | null
          data_residency_region?: string | null
          deleted_at?: string | null
          employees?: number | null
          enabled_features?: string[] | null
          feature_flags?: Json | null
          gri_sector_code?: string | null
          gri_sector_id?: string | null
          headquarters_address?: Json | null
          id?: string
          industry?: string | null
          industry_classification_id?: string | null
          industry_confidence?: number | null
          industry_primary?: string | null
          industry_secondary?: string | null
          industry_sector?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          production_unit?: string | null
          public_company?: boolean | null
          region?: string | null
          sector_category?: string | null
          settings?: Json | null
          slug?: string
          stock_ticker?: string | null
          subscription_expires_at?: string | null
          subscription_seats?: number | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          value_added?: number | null
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
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      peer_benchmark_data: {
        Row: {
          adoption_percent: number
          avg_absolute_value: number | null
          business_type: string | null
          calculation_method: string | null
          created_at: string | null
          data_as_of: string
          id: string
          industry: string
          intensity_metric: string | null
          metric_catalog_id: string | null
          metric_type: string
          p25_intensity: number | null
          p50_intensity: number | null
          p75_intensity: number | null
          p90_intensity: number | null
          peer_count: number
          region: string
          size_category: string
          updated_at: string | null
        }
        Insert: {
          adoption_percent: number
          avg_absolute_value?: number | null
          business_type?: string | null
          calculation_method?: string | null
          created_at?: string | null
          data_as_of: string
          id?: string
          industry: string
          intensity_metric?: string | null
          metric_catalog_id?: string | null
          metric_type: string
          p25_intensity?: number | null
          p50_intensity?: number | null
          p75_intensity?: number | null
          p90_intensity?: number | null
          peer_count: number
          region: string
          size_category: string
          updated_at?: string | null
        }
        Update: {
          adoption_percent?: number
          avg_absolute_value?: number | null
          business_type?: string | null
          calculation_method?: string | null
          created_at?: string | null
          data_as_of?: string
          id?: string
          industry?: string
          intensity_metric?: string | null
          metric_catalog_id?: string | null
          metric_type?: string
          p25_intensity?: number | null
          p50_intensity?: number | null
          p75_intensity?: number | null
          p90_intensity?: number | null
          peer_count?: number
          region?: string
          size_category?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_benchmark_data_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_benchmark_data_metric_catalog_id_fkey"
            columns: ["metric_catalog_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_benchmarks: {
        Row: {
          bottom_25_percentile_score: number
          calculated_at: string
          category: string
          created_at: string
          id: string
          industry: string
          median_score: number
          period_end: string
          period_start: string
          region: string | null
          sample_count: number
          size_range: string
          top_10_percentile_score: number
          top_25_percentile_score: number
          updated_at: string
        }
        Insert: {
          bottom_25_percentile_score: number
          calculated_at?: string
          category: string
          created_at?: string
          id?: string
          industry: string
          median_score: number
          period_end: string
          period_start: string
          region?: string | null
          sample_count: number
          size_range: string
          top_10_percentile_score: number
          top_25_percentile_score: number
          updated_at?: string
        }
        Update: {
          bottom_25_percentile_score?: number
          calculated_at?: string
          category?: string
          created_at?: string
          id?: string
          industry?: string
          median_score?: number
          period_end?: string
          period_start?: string
          region?: string | null
          sample_count?: number
          size_range?: string
          top_10_percentile_score?: number
          top_25_percentile_score?: number
          updated_at?: string
        }
        Relationships: []
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
      performance_analyses: {
        Row: {
          analyzed_at: string | null
          id: string
          metrics: Json | null
          organization_id: string
          score: number | null
        }
        Insert: {
          analyzed_at?: string | null
          id?: string
          metrics?: Json | null
          organization_id: string
          score?: number | null
        }
        Update: {
          analyzed_at?: string | null
          id?: string
          metrics?: Json | null
          organization_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_score_history: {
        Row: {
          calculated_at: string
          category_scores: Json
          created_at: string
          id: string
          organization_id: string
          overall_score: number
          site_id: string | null
        }
        Insert: {
          calculated_at: string
          category_scores: Json
          created_at?: string
          id?: string
          organization_id: string
          overall_score: number
          site_id?: string | null
        }
        Update: {
          calculated_at?: string
          category_scores?: Json
          created_at?: string
          id?: string
          organization_id?: string
          overall_score?: number
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_score_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_score_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "performance_score_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_scores: {
        Row: {
          calculated_at: string
          confidence_level: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          data_completeness: number
          grade: Database["public"]["Enums"]["score_grade"]
          id: string
          improvement_velocity: number
          industry: string | null
          is_portfolio_score: boolean | null
          organization_id: string
          overall_score: number
          peer_percentile: number | null
          predicted_score_30_days: number | null
          predicted_score_365_days: number | null
          predicted_score_90_days: number | null
          rolling_30_day_score: number | null
          rolling_365_day_score: number | null
          rolling_7_day_score: number | null
          rolling_90_day_score: number | null
          site_id: string | null
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          confidence_level: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          data_completeness: number
          grade: Database["public"]["Enums"]["score_grade"]
          id?: string
          improvement_velocity: number
          industry?: string | null
          is_portfolio_score?: boolean | null
          organization_id: string
          overall_score: number
          peer_percentile?: number | null
          predicted_score_30_days?: number | null
          predicted_score_365_days?: number | null
          predicted_score_90_days?: number | null
          rolling_30_day_score?: number | null
          rolling_365_day_score?: number | null
          rolling_7_day_score?: number | null
          rolling_90_day_score?: number | null
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          confidence_level?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          data_completeness?: number
          grade?: Database["public"]["Enums"]["score_grade"]
          id?: string
          improvement_velocity?: number
          industry?: string | null
          is_portfolio_score?: boolean | null
          organization_id?: string
          overall_score?: number
          peer_percentile?: number | null
          predicted_score_30_days?: number | null
          predicted_score_365_days?: number | null
          predicted_score_90_days?: number | null
          rolling_30_day_score?: number | null
          rolling_365_day_score?: number | null
          rolling_7_day_score?: number | null
          rolling_90_day_score?: number | null
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_scores_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "performance_scores_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_best_practices: {
        Row: {
          applicable_to_site_ids: string[] | null
          category: string
          created_at: string
          description: string | null
          evidence_cost_savings_usd: number | null
          evidence_score_improvement: number | null
          evidence_timeframe: string | null
          from_site_id: string
          from_site_name: string
          id: string
          impact: string
          implemented_count: number | null
          industry_specific: string[] | null
          organization_id: string
          practice: string
          shared_count: number | null
          updated_at: string
        }
        Insert: {
          applicable_to_site_ids?: string[] | null
          category: string
          created_at?: string
          description?: string | null
          evidence_cost_savings_usd?: number | null
          evidence_score_improvement?: number | null
          evidence_timeframe?: string | null
          from_site_id: string
          from_site_name: string
          id?: string
          impact: string
          implemented_count?: number | null
          industry_specific?: string[] | null
          organization_id: string
          practice: string
          shared_count?: number | null
          updated_at?: string
        }
        Update: {
          applicable_to_site_ids?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          evidence_cost_savings_usd?: number | null
          evidence_score_improvement?: number | null
          evidence_timeframe?: string | null
          from_site_id?: string
          from_site_name?: string
          id?: string
          impact?: string
          implemented_count?: number | null
          industry_specific?: string[] | null
          organization_id?: string
          practice?: string
          shared_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_best_practices_from_site_id_fkey"
            columns: ["from_site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "portfolio_best_practices_from_site_id_fkey"
            columns: ["from_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_best_practices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      predicted_cards: {
        Row: {
          card_id: string | null
          context_factors: Json | null
          expires_at: string | null
          feedback: string | null
          id: string
          predicted_at: string | null
          prediction_reason: string | null
          prediction_score: number | null
          user_id: string | null
          was_used: boolean | null
        }
        Insert: {
          card_id?: string | null
          context_factors?: Json | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          predicted_at?: string | null
          prediction_reason?: string | null
          prediction_score?: number | null
          user_id?: string | null
          was_used?: boolean | null
        }
        Update: {
          card_id?: string | null
          context_factors?: Json | null
          expires_at?: string | null
          feedback?: string | null
          id?: string
          predicted_at?: string | null
          prediction_reason?: string | null
          prediction_score?: number | null
          user_id?: string | null
          was_used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "predicted_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_definitions"
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
      push_subscriptions: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          is_active: boolean
          last_used_at: string | null
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          created_at: string | null
          created_by: string | null
          hit_count: number | null
          id: string
          last_used_at: string | null
          organization_id: string
          question_embedding: string | null
          question_text: string
          response: Json
          sql_query: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          organization_id: string
          question_embedding?: string | null
          question_text: string
          response: Json
          sql_query: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          organization_id?: string
          question_embedding?: string | null
          question_text?: string
          response?: Json
          sql_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      recommendation_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          id: string
          organization_id: string
          performed_at: string | null
          performed_by: string | null
          recommendation_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          id?: string
          organization_id: string
          performed_at?: string | null
          performed_by?: string | null
          recommendation_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          id?: string
          organization_id?: string
          performed_at?: string | null
          performed_by?: string | null
          recommendation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_actions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "metric_recommendations"
            referencedColumns: ["id"]
          },
        ]
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
      reduction_initiatives: {
        Row: {
          actual_reduction_tco2e: number | null
          annual_opex: number | null
          annual_savings: number | null
          capex: number | null
          completion_date: string | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          dependencies: string | null
          description: string | null
          estimated_reduction_percentage: number | null
          estimated_reduction_tco2e: number
          id: string
          implementation_status: string | null
          implementation_year: number
          initiative_type: string | null
          metric_target_id: string | null
          name: string
          organization_id: string
          owner_team: string | null
          owner_user_id: string | null
          risk_level: string | null
          risks: string | null
          roi_years: number | null
          scopes: string[] | null
          start_date: string
          sustainability_target_id: string | null
          updated_at: string | null
          verification_method: string | null
          verified: boolean | null
        }
        Insert: {
          actual_reduction_tco2e?: number | null
          annual_opex?: number | null
          annual_savings?: number | null
          capex?: number | null
          completion_date?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string | null
          description?: string | null
          estimated_reduction_percentage?: number | null
          estimated_reduction_tco2e: number
          id?: string
          implementation_status?: string | null
          implementation_year?: number
          initiative_type?: string | null
          metric_target_id?: string | null
          name: string
          organization_id: string
          owner_team?: string | null
          owner_user_id?: string | null
          risk_level?: string | null
          risks?: string | null
          roi_years?: number | null
          scopes?: string[] | null
          start_date: string
          sustainability_target_id?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified?: boolean | null
        }
        Update: {
          actual_reduction_tco2e?: number | null
          annual_opex?: number | null
          annual_savings?: number | null
          capex?: number | null
          completion_date?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string | null
          description?: string | null
          estimated_reduction_percentage?: number | null
          estimated_reduction_tco2e?: number
          id?: string
          implementation_status?: string | null
          implementation_year?: number
          initiative_type?: string | null
          metric_target_id?: string | null
          name?: string
          organization_id?: string
          owner_team?: string | null
          owner_user_id?: string | null
          risk_level?: string | null
          risks?: string | null
          roi_years?: number | null
          scopes?: string[] | null
          start_date?: string
          sustainability_target_id?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reduction_initiatives_metric_target_id_fkey"
            columns: ["metric_target_id"]
            isOneToOne: false
            referencedRelation: "metric_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reduction_initiatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reduction_initiatives_sustainability_target_id_fkey"
            columns: ["sustainability_target_id"]
            isOneToOne: false
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reduction_initiatives_sustainability_target_id_fkey"
            columns: ["sustainability_target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      regulatory_updates: {
        Row: {
          created_at: string | null
          deadline: string | null
          effective_date: string | null
          framework: string
          id: string
          impact: string | null
          organization_id: string
          region: string | null
          required_actions: string[] | null
          summary: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          effective_date?: string | null
          framework: string
          id?: string
          impact?: string | null
          organization_id: string
          region?: string | null
          required_actions?: string[] | null
          summary?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          effective_date?: string | null
          framework?: string
          id?: string
          impact?: string | null
          organization_id?: string
          region?: string | null
          required_actions?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_allocations: {
        Row: {
          allocated: number | null
          id: string
          organization_id: string
          resource_type: string | null
          updated_at: string | null
          used: number | null
        }
        Insert: {
          allocated?: number | null
          id?: string
          organization_id: string
          resource_type?: string | null
          updated_at?: string | null
          used?: number | null
        }
        Update: {
          allocated?: number | null
          id?: string
          organization_id?: string
          resource_type?: string | null
          updated_at?: string | null
          used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          performed_by: string | null
          reason: string | null
          role_type: string
          role_value: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by?: string | null
          reason?: string | null
          role_type: string
          role_value: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by?: string | null
          reason?: string | null
          role_type?: string
          role_value?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          base_permissions: Json
          created_at: string | null
          description: string | null
          id: string
          level: string
          name: string
        }
        Insert: {
          base_permissions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          level: string
          name: string
        }
        Update: {
          base_permissions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string
          name?: string
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
      scope2_instruments: {
        Row: {
          certificate_id: string | null
          created_at: string | null
          emission_factor: number | null
          evidence_url: string | null
          id: string
          instrument_name: string | null
          instrument_type: string
          metrics_data_id: string | null
          mwh_covered: number
          notes: string | null
          organization_id: string
          quality_criteria: Json | null
          quality_grade: string | null
          quality_score: number | null
          updated_at: string | null
          valid_from: string
          valid_to: string
          vintage_year: number | null
        }
        Insert: {
          certificate_id?: string | null
          created_at?: string | null
          emission_factor?: number | null
          evidence_url?: string | null
          id?: string
          instrument_name?: string | null
          instrument_type: string
          metrics_data_id?: string | null
          mwh_covered: number
          notes?: string | null
          organization_id: string
          quality_criteria?: Json | null
          quality_grade?: string | null
          quality_score?: number | null
          updated_at?: string | null
          valid_from: string
          valid_to: string
          vintage_year?: number | null
        }
        Update: {
          certificate_id?: string | null
          created_at?: string | null
          emission_factor?: number | null
          evidence_url?: string | null
          id?: string
          instrument_name?: string | null
          instrument_type?: string
          metrics_data_id?: string | null
          mwh_covered?: number
          notes?: string | null
          organization_id?: string
          quality_criteria?: Json | null
          quality_grade?: string | null
          quality_score?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
          vintage_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scope2_instruments_metrics_data_id_fkey"
            columns: ["metrics_data_id"]
            isOneToOne: false
            referencedRelation: "metrics_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scope2_instruments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      score_opportunities: {
        Row: {
          action: string
          agent_id: string | null
          agent_working: boolean | null
          annual_savings_usd: number | null
          assigned_at: string | null
          category: string
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["opportunity_difficulty"]
          estimated_cost: string | null
          id: string
          payback_months: number | null
          performance_score_id: string
          potential_points: number
          priority: Database["public"]["Enums"]["opportunity_priority"]
          status: string | null
          updated_at: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          agent_working?: boolean | null
          annual_savings_usd?: number | null
          assigned_at?: string | null
          category: string
          created_at?: string
          description?: string | null
          difficulty: Database["public"]["Enums"]["opportunity_difficulty"]
          estimated_cost?: string | null
          id?: string
          payback_months?: number | null
          performance_score_id: string
          potential_points: number
          priority: Database["public"]["Enums"]["opportunity_priority"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          agent_working?: boolean | null
          annual_savings_usd?: number | null
          assigned_at?: string | null
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["opportunity_difficulty"]
          estimated_cost?: string | null
          id?: string
          payback_months?: number | null
          performance_score_id?: string
          potential_points?: number
          priority?: Database["public"]["Enums"]["opportunity_priority"]
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_opportunities_performance_score_id_fkey"
            columns: ["performance_score_id"]
            isOneToOne: false
            referencedRelation: "performance_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_benchmarks: {
        Row: {
          benchmark_data: Json
          company_count: number
          created_at: string | null
          id: string
          last_updated: string | null
          median_carbon_neutral_target: number | null
          median_renewable_percent: number | null
          median_scope1: number | null
          median_scope2: number | null
          median_scope3: number | null
          median_total_emissions: number | null
          report_year: number
          sector: string
        }
        Insert: {
          benchmark_data: Json
          company_count: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          median_carbon_neutral_target?: number | null
          median_renewable_percent?: number | null
          median_scope1?: number | null
          median_scope2?: number | null
          median_scope3?: number | null
          median_total_emissions?: number | null
          report_year: number
          sector: string
        }
        Update: {
          benchmark_data?: Json
          company_count?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          median_carbon_neutral_target?: number | null
          median_renewable_percent?: number | null
          median_scope1?: number | null
          median_scope2?: number | null
          median_scope3?: number | null
          median_total_emissions?: number | null
          report_year?: number
          sector?: string
        }
        Relationships: []
      }
      sector_companies: {
        Row: {
          company_name: string
          company_size: string | null
          country: string | null
          created_at: string | null
          discovered_at: string | null
          has_sustainability_report: boolean | null
          id: string
          industry: string | null
          last_verified: string | null
          report_last_parsed: string | null
          sector: string
          stock_ticker: string | null
          updated_at: string | null
          website: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          has_sustainability_report?: boolean | null
          id?: string
          industry?: string | null
          last_verified?: string | null
          report_last_parsed?: string | null
          sector: string
          stock_ticker?: string | null
          updated_at?: string | null
          website: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          has_sustainability_report?: boolean | null
          id?: string
          industry?: string | null
          last_verified?: string | null
          report_last_parsed?: string | null
          sector?: string
          stock_ticker?: string | null
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      sector_company_reports: {
        Row: {
          adequate_wages: boolean | null
          air_pollutants_emissions: Json | null
          annual_revenue: number | null
          anti_corruption_policy: boolean | null
          anti_corruption_training_percent: number | null
          assurance_provider: string | null
          biodiversity_impacts: Json | null
          biodiversity_programs: boolean | null
          biodiversity_sensitive_areas: boolean | null
          biogenic_emissions: number | null
          board_independence: number | null
          bribery_incidents: number | null
          carbon_neutral_target: number | null
          child_labor_risks: boolean | null
          circular_economy_strategy: Json | null
          circular_revenue_percent: number | null
          climate_physical_risks: Json | null
          climate_related_capex: number | null
          climate_related_opex: number | null
          climate_scenario_analysis: boolean | null
          climate_transition_plan: Json | null
          climate_transition_risks: Json | null
          collective_bargaining_coverage: number | null
          community_engagement: boolean | null
          community_impacts: Json | null
          company_id: string | null
          company_name: string
          consumer_complaints: number | null
          consumer_data_breaches: number | null
          created_at: string | null
          csrd_compliant: boolean | null
          csrd_reporting_year: number | null
          discrimination_incidents: number | null
          diversity_metrics: Json | null
          double_materiality_assessment: boolean | null
          downstream_scope3_detailed: Json | null
          ecosystem_restoration: Json | null
          emission_reduction_target: Json | null
          employee_count: number | null
          employee_turnover_rate: number | null
          energy_intensity: number | null
          esg_linked_compensation: boolean | null
          esrs_standards_reported: string[] | null
          ethical_supply_chain_policy: boolean | null
          externally_assured: boolean | null
          fatalities: number | null
          forced_labor_risks: boolean | null
          ghg_intensity: number | null
          id: string
          indigenous_rights_respected: boolean | null
          land_owned_managed: number | null
          land_rights_conflicts: boolean | null
          living_wage_percent: number | null
          lost_time_injury_rate: number | null
          marine_resources_impact: boolean | null
          material_inflows: number | null
          material_outflows: number | null
          microplastics_emissions: number | null
          near_miss_incidents: number | null
          net_zero_target: number | null
          packaging_recycled_content: number | null
          parsed_at: string | null
          parsed_by: string | null
          parser_job_id: string | null
          political_contributions: number | null
          product_information_transparency: boolean | null
          product_recycling_rate: number | null
          product_safety_incidents: number | null
          product_takeback_programs: boolean | null
          protected_habitat_area: number | null
          raw_text: string | null
          renewable_energy_mwh: number | null
          renewable_energy_percent: number | null
          renewable_energy_target: Json | null
          report_type: string | null
          report_url: string
          report_year: number
          reporting_standards: string[] | null
          revenue_currency: string | null
          scope1_emissions: number | null
          scope2_emissions: number | null
          scope2_location_based: number | null
          scope2_market_based: number | null
          scope3_emissions: number | null
          sector: string
          soil_contamination: boolean | null
          substances_of_concern: Json | null
          supplier_audits_conducted: number | null
          supplier_corrective_actions: number | null
          supplier_esg_assessments: number | null
          sustainable_sourcing_percent: number | null
          taxonomy_aligned_activities_percent: number | null
          taxonomy_capex_alignment: number | null
          taxonomy_eligible_activities_percent: number | null
          taxonomy_opex_alignment: number | null
          total_emissions: number | null
          total_energy_consumption: number | null
          total_recordable_incident_rate: number | null
          training_hours_per_employee: number | null
          unionized_workforce_percent: number | null
          upstream_scope3_detailed: Json | null
          value_chain_engagement_strategy: Json | null
          value_chain_human_rights_risks: Json | null
          value_chain_workers_count: number | null
          waste_generated: number | null
          waste_recycled: number | null
          waste_recycling_rate: number | null
          waste_to_landfill: number | null
          water_consumption: number | null
          water_discharge: number | null
          water_efficiency_targets: Json | null
          water_intensity: number | null
          water_pollutants: Json | null
          water_recycled: number | null
          water_stress_locations: boolean | null
          water_withdrawal: number | null
          whistleblower_mechanism: boolean | null
          women_in_leadership: number | null
          work_life_balance_metrics: Json | null
        }
        Insert: {
          adequate_wages?: boolean | null
          air_pollutants_emissions?: Json | null
          annual_revenue?: number | null
          anti_corruption_policy?: boolean | null
          anti_corruption_training_percent?: number | null
          assurance_provider?: string | null
          biodiversity_impacts?: Json | null
          biodiversity_programs?: boolean | null
          biodiversity_sensitive_areas?: boolean | null
          biogenic_emissions?: number | null
          board_independence?: number | null
          bribery_incidents?: number | null
          carbon_neutral_target?: number | null
          child_labor_risks?: boolean | null
          circular_economy_strategy?: Json | null
          circular_revenue_percent?: number | null
          climate_physical_risks?: Json | null
          climate_related_capex?: number | null
          climate_related_opex?: number | null
          climate_scenario_analysis?: boolean | null
          climate_transition_plan?: Json | null
          climate_transition_risks?: Json | null
          collective_bargaining_coverage?: number | null
          community_engagement?: boolean | null
          community_impacts?: Json | null
          company_id?: string | null
          company_name: string
          consumer_complaints?: number | null
          consumer_data_breaches?: number | null
          created_at?: string | null
          csrd_compliant?: boolean | null
          csrd_reporting_year?: number | null
          discrimination_incidents?: number | null
          diversity_metrics?: Json | null
          double_materiality_assessment?: boolean | null
          downstream_scope3_detailed?: Json | null
          ecosystem_restoration?: Json | null
          emission_reduction_target?: Json | null
          employee_count?: number | null
          employee_turnover_rate?: number | null
          energy_intensity?: number | null
          esg_linked_compensation?: boolean | null
          esrs_standards_reported?: string[] | null
          ethical_supply_chain_policy?: boolean | null
          externally_assured?: boolean | null
          fatalities?: number | null
          forced_labor_risks?: boolean | null
          ghg_intensity?: number | null
          id?: string
          indigenous_rights_respected?: boolean | null
          land_owned_managed?: number | null
          land_rights_conflicts?: boolean | null
          living_wage_percent?: number | null
          lost_time_injury_rate?: number | null
          marine_resources_impact?: boolean | null
          material_inflows?: number | null
          material_outflows?: number | null
          microplastics_emissions?: number | null
          near_miss_incidents?: number | null
          net_zero_target?: number | null
          packaging_recycled_content?: number | null
          parsed_at?: string | null
          parsed_by?: string | null
          parser_job_id?: string | null
          political_contributions?: number | null
          product_information_transparency?: boolean | null
          product_recycling_rate?: number | null
          product_safety_incidents?: number | null
          product_takeback_programs?: boolean | null
          protected_habitat_area?: number | null
          raw_text?: string | null
          renewable_energy_mwh?: number | null
          renewable_energy_percent?: number | null
          renewable_energy_target?: Json | null
          report_type?: string | null
          report_url: string
          report_year: number
          reporting_standards?: string[] | null
          revenue_currency?: string | null
          scope1_emissions?: number | null
          scope2_emissions?: number | null
          scope2_location_based?: number | null
          scope2_market_based?: number | null
          scope3_emissions?: number | null
          sector: string
          soil_contamination?: boolean | null
          substances_of_concern?: Json | null
          supplier_audits_conducted?: number | null
          supplier_corrective_actions?: number | null
          supplier_esg_assessments?: number | null
          sustainable_sourcing_percent?: number | null
          taxonomy_aligned_activities_percent?: number | null
          taxonomy_capex_alignment?: number | null
          taxonomy_eligible_activities_percent?: number | null
          taxonomy_opex_alignment?: number | null
          total_emissions?: number | null
          total_energy_consumption?: number | null
          total_recordable_incident_rate?: number | null
          training_hours_per_employee?: number | null
          unionized_workforce_percent?: number | null
          upstream_scope3_detailed?: Json | null
          value_chain_engagement_strategy?: Json | null
          value_chain_human_rights_risks?: Json | null
          value_chain_workers_count?: number | null
          waste_generated?: number | null
          waste_recycled?: number | null
          waste_recycling_rate?: number | null
          waste_to_landfill?: number | null
          water_consumption?: number | null
          water_discharge?: number | null
          water_efficiency_targets?: Json | null
          water_intensity?: number | null
          water_pollutants?: Json | null
          water_recycled?: number | null
          water_stress_locations?: boolean | null
          water_withdrawal?: number | null
          whistleblower_mechanism?: boolean | null
          women_in_leadership?: number | null
          work_life_balance_metrics?: Json | null
        }
        Update: {
          adequate_wages?: boolean | null
          air_pollutants_emissions?: Json | null
          annual_revenue?: number | null
          anti_corruption_policy?: boolean | null
          anti_corruption_training_percent?: number | null
          assurance_provider?: string | null
          biodiversity_impacts?: Json | null
          biodiversity_programs?: boolean | null
          biodiversity_sensitive_areas?: boolean | null
          biogenic_emissions?: number | null
          board_independence?: number | null
          bribery_incidents?: number | null
          carbon_neutral_target?: number | null
          child_labor_risks?: boolean | null
          circular_economy_strategy?: Json | null
          circular_revenue_percent?: number | null
          climate_physical_risks?: Json | null
          climate_related_capex?: number | null
          climate_related_opex?: number | null
          climate_scenario_analysis?: boolean | null
          climate_transition_plan?: Json | null
          climate_transition_risks?: Json | null
          collective_bargaining_coverage?: number | null
          community_engagement?: boolean | null
          community_impacts?: Json | null
          company_id?: string | null
          company_name?: string
          consumer_complaints?: number | null
          consumer_data_breaches?: number | null
          created_at?: string | null
          csrd_compliant?: boolean | null
          csrd_reporting_year?: number | null
          discrimination_incidents?: number | null
          diversity_metrics?: Json | null
          double_materiality_assessment?: boolean | null
          downstream_scope3_detailed?: Json | null
          ecosystem_restoration?: Json | null
          emission_reduction_target?: Json | null
          employee_count?: number | null
          employee_turnover_rate?: number | null
          energy_intensity?: number | null
          esg_linked_compensation?: boolean | null
          esrs_standards_reported?: string[] | null
          ethical_supply_chain_policy?: boolean | null
          externally_assured?: boolean | null
          fatalities?: number | null
          forced_labor_risks?: boolean | null
          ghg_intensity?: number | null
          id?: string
          indigenous_rights_respected?: boolean | null
          land_owned_managed?: number | null
          land_rights_conflicts?: boolean | null
          living_wage_percent?: number | null
          lost_time_injury_rate?: number | null
          marine_resources_impact?: boolean | null
          material_inflows?: number | null
          material_outflows?: number | null
          microplastics_emissions?: number | null
          near_miss_incidents?: number | null
          net_zero_target?: number | null
          packaging_recycled_content?: number | null
          parsed_at?: string | null
          parsed_by?: string | null
          parser_job_id?: string | null
          political_contributions?: number | null
          product_information_transparency?: boolean | null
          product_recycling_rate?: number | null
          product_safety_incidents?: number | null
          product_takeback_programs?: boolean | null
          protected_habitat_area?: number | null
          raw_text?: string | null
          renewable_energy_mwh?: number | null
          renewable_energy_percent?: number | null
          renewable_energy_target?: Json | null
          report_type?: string | null
          report_url?: string
          report_year?: number
          reporting_standards?: string[] | null
          revenue_currency?: string | null
          scope1_emissions?: number | null
          scope2_emissions?: number | null
          scope2_location_based?: number | null
          scope2_market_based?: number | null
          scope3_emissions?: number | null
          sector?: string
          soil_contamination?: boolean | null
          substances_of_concern?: Json | null
          supplier_audits_conducted?: number | null
          supplier_corrective_actions?: number | null
          supplier_esg_assessments?: number | null
          sustainable_sourcing_percent?: number | null
          taxonomy_aligned_activities_percent?: number | null
          taxonomy_capex_alignment?: number | null
          taxonomy_eligible_activities_percent?: number | null
          taxonomy_opex_alignment?: number | null
          total_emissions?: number | null
          total_energy_consumption?: number | null
          total_recordable_incident_rate?: number | null
          training_hours_per_employee?: number | null
          unionized_workforce_percent?: number | null
          upstream_scope3_detailed?: Json | null
          value_chain_engagement_strategy?: Json | null
          value_chain_human_rights_risks?: Json | null
          value_chain_workers_count?: number | null
          waste_generated?: number | null
          waste_recycled?: number | null
          waste_recycling_rate?: number | null
          waste_to_landfill?: number | null
          water_consumption?: number | null
          water_discharge?: number | null
          water_efficiency_targets?: Json | null
          water_intensity?: number | null
          water_pollutants?: Json | null
          water_recycled?: number | null
          water_stress_locations?: boolean | null
          water_withdrawal?: number | null
          whistleblower_mechanism?: boolean | null
          women_in_leadership?: number | null
          work_life_balance_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sector_company_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sector_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_company_reports_parser_job_id_fkey"
            columns: ["parser_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json
          handled: boolean | null
          id: string
          ip: unknown
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
          ip?: unknown
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
          ip?: unknown
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
      semantic_cache: {
        Row: {
          created_at: string
          hit_count: number
          id: string
          last_hit_at: string | null
          model: string
          organization_id: string
          query_embedding: string | null
          query_text: string
          response_text: string
          usage: Json
        }
        Insert: {
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string | null
          model: string
          organization_id: string
          query_embedding?: string | null
          query_text: string
          response_text: string
          usage: Json
        }
        Update: {
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string | null
          model?: string
          organization_id?: string
          query_embedding?: string | null
          query_text?: string
          response_text?: string
          usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "semantic_cache_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_active_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_metrics: {
        Row: {
          baseline_value: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metric_id: string
          notes: string | null
          organization_id: string
          responsible_user_id: string | null
          site_id: string
          target_date: string | null
          target_value: number | null
          updated_at: string | null
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_id: string
          notes?: string | null
          organization_id: string
          responsible_user_id?: string | null
          site_id: string
          target_date?: string | null
          target_value?: number | null
          updated_at?: string | null
        }
        Update: {
          baseline_value?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_id?: string
          notes?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          site_id?: string
          target_date?: string | null
          target_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "waste_metrics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          devices_count: number | null
          floor_details: Json | null
          floors: number | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          organization_id: string
          region_id: string | null
          status: string | null
          timezone: string | null
          total_area_sqm: number | null
          total_employees: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          devices_count?: number | null
          floor_details?: Json | null
          floors?: number | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          organization_id: string
          region_id?: string | null
          status?: string | null
          timezone?: string | null
          total_area_sqm?: number | null
          total_employees?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          devices_count?: number | null
          floor_details?: Json | null
          floors?: number | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          region_id?: string | null
          status?: string | null
          timezone?: string | null
          total_area_sqm?: number | null
          total_employees?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      super_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
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
      supplier_sustainability: {
        Row: {
          certifications: Json | null
          created_at: string | null
          esg_score: number | null
          id: string
          last_verified: string | null
          organization_id: string
          scraper_job_id: string | null
          supplier_name: string
          sustainability_report: Json | null
          updated_at: string | null
          website: string
        }
        Insert: {
          certifications?: Json | null
          created_at?: string | null
          esg_score?: number | null
          id?: string
          last_verified?: string | null
          organization_id: string
          scraper_job_id?: string | null
          supplier_name: string
          sustainability_report?: Json | null
          updated_at?: string | null
          website: string
        }
        Update: {
          certifications?: Json | null
          created_at?: string | null
          esg_score?: number | null
          id?: string
          last_verified?: string | null
          organization_id?: string
          scraper_job_id?: string | null
          supplier_name?: string
          sustainability_report?: Json | null
          updated_at?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sustainability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_sustainability_scraper_job_id_fkey"
            columns: ["scraper_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          annual_spend: number | null
          assessment_date: string | null
          assessment_score: number | null
          country: string | null
          created_at: string | null
          environmental_assessment_completed: boolean | null
          environmental_screening_completed: boolean | null
          first_contract_date: string | null
          id: string
          impacts_description: string | null
          implementation_date: string | null
          improvement_deadline: string | null
          improvement_plan_agreed: boolean | null
          improvement_plan_description: string | null
          improvements_implemented: boolean | null
          industry_sector: string | null
          iso14001_certified: boolean | null
          last_contract_date: string | null
          negative_impacts_identified: boolean | null
          organization_id: string
          other_certifications: string[] | null
          risk_level: string | null
          screening_criteria: string[] | null
          screening_date: string | null
          supplier_code: string | null
          supplier_name: string
          supplier_status: string | null
          updated_at: string | null
        }
        Insert: {
          annual_spend?: number | null
          assessment_date?: string | null
          assessment_score?: number | null
          country?: string | null
          created_at?: string | null
          environmental_assessment_completed?: boolean | null
          environmental_screening_completed?: boolean | null
          first_contract_date?: string | null
          id?: string
          impacts_description?: string | null
          implementation_date?: string | null
          improvement_deadline?: string | null
          improvement_plan_agreed?: boolean | null
          improvement_plan_description?: string | null
          improvements_implemented?: boolean | null
          industry_sector?: string | null
          iso14001_certified?: boolean | null
          last_contract_date?: string | null
          negative_impacts_identified?: boolean | null
          organization_id: string
          other_certifications?: string[] | null
          risk_level?: string | null
          screening_criteria?: string[] | null
          screening_date?: string | null
          supplier_code?: string | null
          supplier_name: string
          supplier_status?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_spend?: number | null
          assessment_date?: string | null
          assessment_score?: number | null
          country?: string | null
          created_at?: string | null
          environmental_assessment_completed?: boolean | null
          environmental_screening_completed?: boolean | null
          first_contract_date?: string | null
          id?: string
          impacts_description?: string | null
          implementation_date?: string | null
          improvement_deadline?: string | null
          improvement_plan_agreed?: boolean | null
          improvement_plan_description?: string | null
          improvements_implemented?: boolean | null
          industry_sector?: string | null
          iso14001_certified?: boolean | null
          last_contract_date?: string | null
          negative_impacts_identified?: boolean | null
          organization_id?: string
          other_certifications?: string[] | null
          risk_level?: string | null
          screening_criteria?: string[] | null
          screening_date?: string | null
          supplier_code?: string | null
          supplier_name?: string
          supplier_status?: string | null
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
          annual_reduction_rate: number | null
          assumptions: string | null
          baseline_emissions: number | null
          baseline_scope_1: number | null
          baseline_scope_2: number | null
          baseline_scope_3: number | null
          baseline_unit: string
          baseline_value: number
          baseline_year: number
          board_approval: boolean | null
          bvcm_commitment: string | null
          categories:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url: string | null
          created_at: string | null
          current_as_of: string | null
          current_emissions: number | null
          current_emissions_date: string | null
          current_value: number | null
          description: string | null
          emissions_reduction_percent: number | null
          energy_reduction_percent: number | null
          facilities: string[] | null
          ghg_inventory_complete: boolean | null
          id: string
          is_active: boolean | null
          is_science_based: boolean | null
          metadata: Json | null
          methodology: string | null
          name: string
          net_zero_date: number | null
          neutralization_plan: string | null
          organization_id: string
          parent_target_id: string | null
          priority: number | null
          progress_percent: number | null
          progress_status: Database["public"]["Enums"]["progress_status"] | null
          public_commitment: boolean | null
          sbti_ambition: string | null
          sbti_approved: boolean | null
          sbti_submission_date: string | null
          sbti_submission_ready: boolean | null
          sbti_validated: boolean | null
          sbti_validation_date: string | null
          scope_1_2_coverage_percent: number | null
          scope_3_coverage_percent: number | null
          scopes: Database["public"]["Enums"]["emission_scope"][] | null
          site_id: string | null
          status: string | null
          target_description: string | null
          target_emissions: number | null
          target_name: string | null
          target_reduction_percent: number | null
          target_scope: Database["public"]["Enums"]["target_scope"] | null
          target_status: Database["public"]["Enums"]["target_status"] | null
          target_type: string
          target_unit: string
          target_value: number
          target_year: number
          updated_at: string | null
          waste_reduction_percent: number | null
          water_reduction_percent: number | null
        }
        Insert: {
          annual_reduction_rate?: number | null
          assumptions?: string | null
          baseline_emissions?: number | null
          baseline_scope_1?: number | null
          baseline_scope_2?: number | null
          baseline_scope_3?: number | null
          baseline_unit: string
          baseline_value: number
          baseline_year: number
          board_approval?: boolean | null
          bvcm_commitment?: string | null
          categories?:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url?: string | null
          created_at?: string | null
          current_as_of?: string | null
          current_emissions?: number | null
          current_emissions_date?: string | null
          current_value?: number | null
          description?: string | null
          emissions_reduction_percent?: number | null
          energy_reduction_percent?: number | null
          facilities?: string[] | null
          ghg_inventory_complete?: boolean | null
          id?: string
          is_active?: boolean | null
          is_science_based?: boolean | null
          metadata?: Json | null
          methodology?: string | null
          name: string
          net_zero_date?: number | null
          neutralization_plan?: string | null
          organization_id: string
          parent_target_id?: string | null
          priority?: number | null
          progress_percent?: number | null
          progress_status?:
            | Database["public"]["Enums"]["progress_status"]
            | null
          public_commitment?: boolean | null
          sbti_ambition?: string | null
          sbti_approved?: boolean | null
          sbti_submission_date?: string | null
          sbti_submission_ready?: boolean | null
          sbti_validated?: boolean | null
          sbti_validation_date?: string | null
          scope_1_2_coverage_percent?: number | null
          scope_3_coverage_percent?: number | null
          scopes?: Database["public"]["Enums"]["emission_scope"][] | null
          site_id?: string | null
          status?: string | null
          target_description?: string | null
          target_emissions?: number | null
          target_name?: string | null
          target_reduction_percent?: number | null
          target_scope?: Database["public"]["Enums"]["target_scope"] | null
          target_status?: Database["public"]["Enums"]["target_status"] | null
          target_type: string
          target_unit: string
          target_value: number
          target_year: number
          updated_at?: string | null
          waste_reduction_percent?: number | null
          water_reduction_percent?: number | null
        }
        Update: {
          annual_reduction_rate?: number | null
          assumptions?: string | null
          baseline_emissions?: number | null
          baseline_scope_1?: number | null
          baseline_scope_2?: number | null
          baseline_scope_3?: number | null
          baseline_unit?: string
          baseline_value?: number
          baseline_year?: number
          board_approval?: boolean | null
          bvcm_commitment?: string | null
          categories?:
            | Database["public"]["Enums"]["emission_source_category"][]
            | null
          commitment_url?: string | null
          created_at?: string | null
          current_as_of?: string | null
          current_emissions?: number | null
          current_emissions_date?: string | null
          current_value?: number | null
          description?: string | null
          emissions_reduction_percent?: number | null
          energy_reduction_percent?: number | null
          facilities?: string[] | null
          ghg_inventory_complete?: boolean | null
          id?: string
          is_active?: boolean | null
          is_science_based?: boolean | null
          metadata?: Json | null
          methodology?: string | null
          name?: string
          net_zero_date?: number | null
          neutralization_plan?: string | null
          organization_id?: string
          parent_target_id?: string | null
          priority?: number | null
          progress_percent?: number | null
          progress_status?:
            | Database["public"]["Enums"]["progress_status"]
            | null
          public_commitment?: boolean | null
          sbti_ambition?: string | null
          sbti_approved?: boolean | null
          sbti_submission_date?: string | null
          sbti_submission_ready?: boolean | null
          sbti_validated?: boolean | null
          sbti_validation_date?: string | null
          scope_1_2_coverage_percent?: number | null
          scope_3_coverage_percent?: number | null
          scopes?: Database["public"]["Enums"]["emission_scope"][] | null
          site_id?: string | null
          status?: string | null
          target_description?: string | null
          target_emissions?: number | null
          target_name?: string | null
          target_reduction_percent?: number | null
          target_scope?: Database["public"]["Enums"]["target_scope"] | null
          target_status?: Database["public"]["Enums"]["target_status"] | null
          target_type?: string
          target_unit?: string
          target_value?: number
          target_year?: number
          updated_at?: string | null
          waste_reduction_percent?: number | null
          water_reduction_percent?: number | null
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
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustainability_targets_parent_target_id_fkey"
            columns: ["parent_target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sustainability_targets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "sustainability_targets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      system_schedules: {
        Row: {
          action: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          organization_id: string
          schedule: string | null
          system: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id: string
          schedule?: string | null
          system?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id?: string
          schedule?: string | null
          system?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string | null
          organization_id: string
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          id?: string
          key?: string | null
          organization_id: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string | null
          organization_id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      target_replanning_history: {
        Row: {
          allocation_strategy: string | null
          average_confidence_score: number | null
          created_at: string | null
          id: string
          initiatives_snapshot: Json | null
          metric_targets_snapshot: Json | null
          new_target_emissions: number | null
          new_target_year: number | null
          notes: string | null
          organization_id: string
          previous_target_emissions: number | null
          previous_target_year: number | null
          replanned_at: string | null
          replanned_by: string | null
          replanning_trigger: string | null
          sustainability_target_id: string
          total_estimated_investment: number | null
          total_initiatives_added: number | null
        }
        Insert: {
          allocation_strategy?: string | null
          average_confidence_score?: number | null
          created_at?: string | null
          id?: string
          initiatives_snapshot?: Json | null
          metric_targets_snapshot?: Json | null
          new_target_emissions?: number | null
          new_target_year?: number | null
          notes?: string | null
          organization_id: string
          previous_target_emissions?: number | null
          previous_target_year?: number | null
          replanned_at?: string | null
          replanned_by?: string | null
          replanning_trigger?: string | null
          sustainability_target_id: string
          total_estimated_investment?: number | null
          total_initiatives_added?: number | null
        }
        Update: {
          allocation_strategy?: string | null
          average_confidence_score?: number | null
          created_at?: string | null
          id?: string
          initiatives_snapshot?: Json | null
          metric_targets_snapshot?: Json | null
          new_target_emissions?: number | null
          new_target_year?: number | null
          notes?: string | null
          organization_id?: string
          previous_target_emissions?: number | null
          previous_target_year?: number | null
          replanned_at?: string | null
          replanned_by?: string | null
          replanning_trigger?: string | null
          sustainability_target_id?: string
          total_estimated_investment?: number | null
          total_initiatives_added?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "target_replanning_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_replanning_history_sustainability_target_id_fkey"
            columns: ["sustainability_target_id"]
            isOneToOne: false
            referencedRelation: "sbti_validation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_replanning_history_sustainability_target_id_fkey"
            columns: ["sustainability_target_id"]
            isOneToOne: false
            referencedRelation: "sustainability_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      tcfd_disclosures: {
        Row: {
          board_oversight: Json | null
          business_strategy_impact: Json | null
          climate_opportunities: Json | null
          climate_risks: Json | null
          created_at: string | null
          executive_remuneration_link: Json | null
          id: string
          integration_with_erm: Json | null
          management_role: Json | null
          metrics: Json | null
          organization_id: string
          reporting_year: number
          risk_identification_process: Json | null
          risk_management_process: Json | null
          scenario_analysis: Json | null
          targets: Json | null
          updated_at: string | null
        }
        Insert: {
          board_oversight?: Json | null
          business_strategy_impact?: Json | null
          climate_opportunities?: Json | null
          climate_risks?: Json | null
          created_at?: string | null
          executive_remuneration_link?: Json | null
          id?: string
          integration_with_erm?: Json | null
          management_role?: Json | null
          metrics?: Json | null
          organization_id: string
          reporting_year: number
          risk_identification_process?: Json | null
          risk_management_process?: Json | null
          scenario_analysis?: Json | null
          targets?: Json | null
          updated_at?: string | null
        }
        Update: {
          board_oversight?: Json | null
          business_strategy_impact?: Json | null
          climate_opportunities?: Json | null
          climate_risks?: Json | null
          created_at?: string | null
          executive_remuneration_link?: Json | null
          id?: string
          integration_with_erm?: Json | null
          management_role?: Json | null
          metrics?: Json | null
          organization_id?: string
          reporting_year?: number
          risk_identification_process?: Json | null
          risk_management_process?: Json | null
          scenario_analysis?: Json | null
          targets?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcfd_disclosures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          permissions: Json | null
          resource_id: string
          resource_type: string
          role: string
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permissions?: Json | null
          resource_id: string
          resource_type: string
          role: string
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permissions?: Json | null
          resource_id?: string
          resource_type?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_access_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
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
      user_card_preferences: {
        Row: {
          card_id: string | null
          created_at: string | null
          custom_config: Json | null
          id: string
          interaction_count: number | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          last_interacted: string | null
          position: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          interaction_count?: number | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          last_interacted?: string | null
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          interaction_count?: number | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          last_interacted?: string | null
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_card_preferences_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_definitions"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      user_group_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          group_id: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          group_id?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          group_id?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_group_access_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_access_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
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
      user_organization_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          region_ids: string[] | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          region_ids?: string[] | null
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          region_ids?: string[] | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_roles_organization_id_fkey"
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
          notification_settings: Json | null
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
          notification_settings?: Json | null
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
          notification_settings?: Json | null
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
      user_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          ip_address: unknown
          organization_id: string | null
          session_end: string | null
          session_start: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          session_end?: string | null
          session_start?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          session_end?: string | null
          session_start?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_site_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          role: string
          site_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          site_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_site_roles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "user_site_roles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_bills: {
        Row: {
          account_number: string | null
          billing_end: string
          billing_start: string
          carbon_emissions_kg: number | null
          created_at: string | null
          electricity_kwh: number | null
          gas_therms: number | null
          id: string
          organization_id: string
          provider: string
          raw_bill_storage_path: string | null
          raw_bill_url: string | null
          scraped_at: string | null
          scraper_job_id: string | null
          total_cost: number | null
        }
        Insert: {
          account_number?: string | null
          billing_end: string
          billing_start: string
          carbon_emissions_kg?: number | null
          created_at?: string | null
          electricity_kwh?: number | null
          gas_therms?: number | null
          id?: string
          organization_id: string
          provider: string
          raw_bill_storage_path?: string | null
          raw_bill_url?: string | null
          scraped_at?: string | null
          scraper_job_id?: string | null
          total_cost?: number | null
        }
        Update: {
          account_number?: string | null
          billing_end?: string
          billing_start?: string
          carbon_emissions_kg?: number | null
          created_at?: string | null
          electricity_kwh?: number | null
          gas_therms?: number | null
          id?: string
          organization_id?: string
          provider?: string
          raw_bill_storage_path?: string | null
          raw_bill_url?: string | null
          scraped_at?: string | null
          scraper_job_id?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_bills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_scraper_job_id_fkey"
            columns: ["scraper_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_credentials: {
        Row: {
          account_number: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_successful_login: string | null
          organization_id: string
          password_encrypted: string
          provider: string
          updated_at: string | null
          username: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_successful_login?: string | null
          organization_id: string
          password_encrypted: string
          provider: string
          updated_at?: string | null
          username: string
        }
        Update: {
          account_number?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_successful_login?: string | null
          organization_id?: string
          password_encrypted?: string
          provider?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      weather_alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          resolved_at: string | null
          severity: string | null
          site_id: string | null
          start_time: string
          title: string
        }
        Insert: {
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          site_id?: string | null
          start_time: string
          title: string
        }
        Update: {
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          site_id?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "weather_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_history: {
        Row: {
          created_at: string | null
          humidity_percent: number | null
          id: string
          organization_id: string | null
          precipitation_mm: number | null
          raw_data: Json | null
          recorded_at: string
          site_id: string | null
          temperature_celsius: number | null
          weather_condition: string | null
          wind_speed_kmh: number | null
        }
        Insert: {
          created_at?: string | null
          humidity_percent?: number | null
          id?: string
          organization_id?: string | null
          precipitation_mm?: number | null
          raw_data?: Json | null
          recorded_at: string
          site_id?: string | null
          temperature_celsius?: number | null
          weather_condition?: string | null
          wind_speed_kmh?: number | null
        }
        Update: {
          created_at?: string | null
          humidity_percent?: number | null
          id?: string
          organization_id?: string | null
          precipitation_mm?: number | null
          raw_data?: Json | null
          recorded_at?: string
          site_id?: string | null
          temperature_celsius?: number | null
          weather_condition?: string | null
          wind_speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "weather_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
    }
    Views: {
      effective_site_targets: {
        Row: {
          baseline_value: number | null
          baseline_year: number | null
          organization_id: string | null
          sbti_ambition: string | null
          site_id: string | null
          site_name: string | null
          status: string | null
          target_id: string | null
          target_reduction_percent: number | null
          target_source: string | null
          target_type: string | null
          target_value: number | null
          target_year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      sbti_validation_status: {
        Row: {
          board_approval: boolean | null
          ghg_inventory_complete: boolean | null
          id: string | null
          name: string | null
          organization_id: string | null
          ready_for_submission: boolean | null
          sbti_validated: boolean | null
          scope_1_2_adequate: boolean | null
          scope_3_adequate: boolean | null
          target_type: string | null
        }
        Insert: {
          board_approval?: boolean | null
          ghg_inventory_complete?: boolean | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          ready_for_submission?: never
          sbti_validated?: boolean | null
          scope_1_2_adequate?: never
          scope_3_adequate?: never
          target_type?: string | null
        }
        Update: {
          board_approval?: boolean | null
          ghg_inventory_complete?: boolean | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          ready_for_submission?: never
          sbti_validated?: boolean | null
          scope_1_2_adequate?: never
          scope_3_adequate?: never
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_benchmark_overview: {
        Row: {
          company_count: number | null
          last_updated: string | null
          median_carbon_neutral_target: number | null
          median_renewable_percent: number | null
          median_scope1: number | null
          median_scope2: number | null
          median_scope3: number | null
          median_total_emissions: number | null
          report_year: number | null
          sector: string | null
          total_companies_in_sector: number | null
        }
        Relationships: []
      }
      sector_leaders: {
        Row: {
          calculated_at: string | null
          company_name: string | null
          overall_score: number | null
          percentile_rank: number | null
          sector: string | null
          stock_ticker: string | null
          website: string | null
        }
        Relationships: []
      }
      semantic_cache_stats: {
        Row: {
          avg_hits_per_entry: number | null
          latest_entry: string | null
          latest_hit: string | null
          model: string | null
          organization_id: string | null
          total_entries: number | null
          total_hits: number | null
          total_tokens_saved: number | null
        }
        Relationships: [
          {
            foreignKeyName: "semantic_cache_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_metrics_view: {
        Row: {
          code: string | null
          cost_per_ton: number | null
          disposal_method: string | null
          emission_factor: number | null
          gri_classification: string | null
          has_energy_recovery: boolean | null
          id: string | null
          is_diverted: boolean | null
          is_recycling: boolean | null
          name: string | null
          subcategory: string | null
          unit: string | null
          waste_category: string | null
          waste_material_type: string | null
        }
        Insert: {
          code?: string | null
          cost_per_ton?: number | null
          disposal_method?: string | null
          emission_factor?: number | null
          gri_classification?: never
          has_energy_recovery?: boolean | null
          id?: string | null
          is_diverted?: boolean | null
          is_recycling?: boolean | null
          name?: string | null
          subcategory?: string | null
          unit?: string | null
          waste_category?: never
          waste_material_type?: string | null
        }
        Update: {
          code?: string | null
          cost_per_ton?: number | null
          disposal_method?: string | null
          emission_factor?: number | null
          gri_classification?: never
          has_energy_recovery?: boolean | null
          id?: string | null
          is_diverted?: boolean | null
          is_recycling?: boolean | null
          name?: string | null
          subcategory?: string | null
          unit?: string | null
          waste_category?: never
          waste_material_type?: string | null
        }
        Relationships: []
      }
      water_consumption_summary: {
        Row: {
          co2e_emissions: number | null
          consumption_m3: number | null
          consumption_rate_percent: number | null
          discharge_m3: number | null
          metric_code: string | null
          metric_name: string | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          site_id: string | null
          withdrawal_m3: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "effective_site_targets"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "metrics_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_recommendation: {
        Args: {
          p_recommendation_id: string
          p_restate_baseline?: boolean
          p_use_estimate?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      aggregate_api_usage_hourly: { Args: never; Returns: undefined }
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
      apply_target_replanning: {
        Args: {
          p_metric_targets: Json
          p_notes?: string
          p_organization_id: string
          p_strategy: string
          p_target_id: string
          p_trigger?: string
          p_user_id?: string
        }
        Returns: Json
      }
      award_marketplace_credits: {
        Args: { p_amount: number; p_provider_id: string }
        Returns: undefined
      }
      backfill_app_users: { Args: never; Returns: undefined }
      calculate_materials_metrics: {
        Args: { p_organization_id: string; p_year: number }
        Returns: {
          non_renewable_materials: number
          products_reclaimed: number
          recycled_input: number
          recycled_percentage: number
          renewable_materials: number
          total_materials: number
          total_packaging: number
        }[]
      }
      calculate_model_drift: {
        Args: { p_model_id: string; p_window_days?: number }
        Returns: {
          drift_score: number
          performance_change: number
          prediction_distribution: Json
        }[]
      }
      calculate_peer_percentile: {
        Args: {
          p_category: string
          p_industry: string
          p_region?: string
          p_score: number
          p_size_range?: string
        }
        Returns: number
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
      calculate_restated_baseline: {
        Args: {
          p_new_metrics: Json
          p_organization_id: string
          p_target_id: string
        }
        Returns: number
      }
      calculate_site_baseline: {
        Args: { p_site_id: string; p_year: number }
        Returns: number
      }
      can_user_access_resource: {
        Args: {
          check_resource_id: string
          check_resource_type: string
          check_user_id: string
          required_role?: string
        }
        Returns: boolean
      }
      check_and_recalculate_baseline: { Args: never; Returns: undefined }
      check_database_health: { Args: never; Returns: undefined }
      check_user_permission: {
        Args: {
          p_action: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      clean_expired_cache: { Args: never; Returns: undefined }
      clean_expired_conversation_states: { Args: never; Returns: undefined }
      cleanup_expired_cache: { Args: { ttl_seconds?: number }; Returns: number }
      cleanup_expired_conversation_contexts: { Args: never; Returns: undefined }
      cleanup_expired_learnings: { Args: never; Returns: number }
      cleanup_expired_metrics_cache: { Args: never; Returns: number }
      cleanup_expired_mfa_challenges: { Args: never; Returns: undefined }
      cleanup_expired_permissions: { Args: never; Returns: undefined }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_expired_sso_auth_requests: { Args: never; Returns: undefined }
      cleanup_expired_sso_sessions: { Args: never; Returns: undefined }
      cleanup_expired_webauthn_challenges: { Args: never; Returns: number }
      cleanup_old_audit_events: {
        Args: { p_keep_security_days?: number; p_retention_days?: number }
        Returns: {
          deleted_count: number
          security_preserved: number
        }[]
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_optimization_jobs: { Args: never; Returns: number }
      cleanup_old_webauthn_credentials: { Args: never; Returns: number }
      create_audit_event: {
        Args: {
          p_action_category: string
          p_action_type: string
          p_changes?: Json
          p_metadata?: Json
          p_outcome_error?: string
          p_outcome_status?: string
          p_resource_id: string
          p_resource_name?: string
          p_resource_type: string
        }
        Returns: string
      }
      create_optimization_job: {
        Args: { p_job_type: string; p_params?: Json; p_priority?: number }
        Returns: string
      }
      create_org_from_invitation: {
        Args: {
          p_org_data: Json
          p_token: string
          p_user_id: string
          p_user_profile: Json
        }
        Returns: {
          error_message: string
          organization_id: string
          success: boolean
        }[]
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string; owner_id: string }
        Returns: string
      }
      create_user_safely: {
        Args: {
          p_auth_user_id?: string
          p_email: string
          p_name: string
          p_org_id: string
          p_role: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      deduct_marketplace_credits: {
        Args: { p_amount: number; p_consumer_id: string }
        Returns: undefined
      }
      detect_new_metrics: {
        Args: { p_baseline_year: number; p_organization_id: string }
        Returns: {
          category: string
          data_points_count: number
          first_data_date: string
          metric_code: string
          metric_id: string
          metric_name: string
          scope: string
          total_emissions: number
        }[]
      }
      detect_organization_industry: {
        Args: { p_organization_id: string }
        Returns: {
          confidence: string
          detected_gri_code: string
          detected_industry: string
          reason: string
        }[]
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
      execute_backup_sql: { Args: { sql_query: string }; Returns: undefined }
      execute_sql: { Args: { sql_query: string }; Returns: undefined }
      expire_old_recovery_tokens: { Args: never; Returns: undefined }
      explore_sustainability_data: {
        Args: { org_id: string; query_text: string }
        Returns: Json
      }
      find_similar_cached_queries: {
        Args: {
          max_results?: number
          model_name: string
          org_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          created_at: string
          hit_count: number
          id: string
          query_text: string
          response_text: string
          similarity: number
          usage: Json
        }[]
      }
      generate_api_key: { Args: { prefix?: string }; Returns: string }
      generate_recommendations_for_org: {
        Args: {
          p_industry?: string
          p_organization_id: string
          p_region?: string
          p_size_category?: string
        }
        Returns: {
          category: string
          estimated_baseline_unit: string
          estimated_baseline_value: number
          estimation_confidence: string
          gri_disclosure: string
          metric_catalog_id: string
          metric_code: string
          metric_name: string
          peer_adoption_percent: number
          priority: string
          recommendation_reason: string
          required_for_frameworks: Json
          scope: string
        }[]
      }
      generate_sample_benchmark_data: {
        Args: { p_num_companies?: number; p_year?: number }
        Returns: undefined
      }
      get_all_tables: {
        Args: never
        Returns: {
          schema_name: string
          table_name: string
        }[]
      }
      get_conversation_statistics: {
        Args: { organization_id_param?: string; user_id_param: string }
        Returns: Json
      }
      get_edp_renewable_percentage: {
        Args: { period_date: string }
        Returns: number
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
      get_metric_target_progress: {
        Args: { p_metric_target_id: string; p_month: number; p_year: number }
        Returns: {
          actual_ytd: number
          on_track: boolean
          planned_ytd: number
          variance_ytd: number
        }[]
      }
      get_optimization_job_status: {
        Args: { p_job_id: string }
        Returns: {
          completed_at: string
          created_at: string
          id: string
          job_type: string
          result: Json
          status: string
        }[]
      }
      get_organization_aggregated_metrics: {
        Args: { org_id: string }
        Returns: {
          metric_code: string
          metric_id: string
          metric_name: string
          organization_level: boolean
          total_sites_using: number
        }[]
      }
      get_prioritized_cards: {
        Args: { p_user_id: string }
        Returns: {
          card_id: string
          card_type: string
          is_pinned: boolean
          is_predicted: boolean
          priority_score: number
          title: string
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
      get_recent_security_events: {
        Args: { event_limit?: number; min_severity?: string; org_id: string }
        Returns: {
          actor_id: string
          actor_type: string
          created_at: string
          details: Json
          event_type: string
          id: string
          severity: string
        }[]
      }
      get_resource_audit_trail: {
        Args: {
          p_limit?: number
          p_resource_id: string
          p_resource_type: string
        }
        Returns: {
          action_type: string
          actor_email: string
          changes: Json
          created_at: string
          id: string
          metadata: Json
        }[]
      }
      get_site_target: {
        Args: { p_site_id: string; p_target_type?: string }
        Returns: {
          baseline_year: number
          is_site_specific: boolean
          sbti_ambition: string
          target_id: string
          target_reduction_percent: number
          target_year: number
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
      get_sustainability_schema: { Args: never; Returns: Json }
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
      get_table_stats:
        | {
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
        | {
            Args: never
            Returns: {
              index_bytes: number
              row_count: number
              table_bytes: number
              table_name: string
              toast_bytes: number
              total_bytes: number
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
      get_user_avg_daily_time: { Args: { p_user_id: string }; Returns: number }
      get_user_org_id: { Args: { user_auth_id: string }; Returns: string }
      get_user_org_role: {
        Args: { check_user_id?: string; org_id: string }
        Returns: string
      }
      get_user_recovery_options: {
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
      get_user_role: {
        Args: {
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_variance_analysis: {
        Args: {
          p_as_of_date?: string
          p_organization_id: string
          p_target_id: string
        }
        Returns: {
          actual_ytd: number
          metric_code: string
          metric_name: string
          months_planned: number
          months_tracked: number
          planned_ytd: number
          scope: string
          status: string
          variance_percent: number
          variance_ytd: number
        }[]
      }
      get_webauthn_stats: {
        Args: never
        Returns: {
          active_credentials: number
          cross_platform_credentials: number
          platform_credentials: number
          recent_authentications: number
          top_device_types: Json
          total_credentials: number
        }[]
      }
      grant_super_admin: {
        Args: { grant_reason?: string; target_user_id: string }
        Returns: boolean
      }
      has_organization_role: {
        Args: { org_id: string; roles: string[] }
        Returns: boolean
      }
      has_permission: {
        Args: {
          action: string
          check_user_id?: string
          org_id: string
          resource: string
        }
        Returns: boolean
      }
      hash_api_key: { Args: { key: string }; Returns: string }
      increment_cache_hit: { Args: { cache_id: string }; Returns: undefined }
      increment_recovery_attempts: {
        Args: { token_id: string }
        Returns: undefined
      }
      initialize_agents_for_organization: {
        Args: { org_id: string }
        Returns: undefined
      }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      is_organization_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: { check_user_id?: string }; Returns: boolean }
      jsonb_diff: { Args: { new_val: Json; old_val: Json }; Returns: Json }
      list_super_admins: {
        Args: never
        Returns: {
          admin_id: string
          created_at: string
          email: string
          full_name: string
          granted_at: string
          reason: string
          user_id: string
        }[]
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
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          org_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          document_type: string
          id: string
          similarity: number
          title: string
        }[]
      }
      match_similar_questions: {
        Args: {
          match_count?: number
          org_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          created_at: string
          hit_count: number
          id: string
          question_text: string
          response: Json
          similarity: number
          sql_query: string
        }[]
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
      recalculate_targets_for_new_baseline: {
        Args: { p_new_baseline_year: number; p_organization_id: string }
        Returns: undefined
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
      refresh_dashboard_metrics: { Args: never; Returns: undefined }
      refresh_org_dashboard_metrics: { Args: never; Returns: undefined }
      revoke_super_admin: { Args: { target_user_id: string }; Returns: boolean }
      rollback_target_replanning: {
        Args: { p_history_id: string; p_user_id?: string }
        Returns: Json
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
      search_conversations: {
        Args: {
          limit_param?: number
          search_query: string
          user_id_param: string
        }
        Returns: {
          conversation_id: string
          conversation_title: string
          matched_messages: number
          relevance: number
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
      update_metric_actual: {
        Args: {
          p_actual_emission_factor?: number
          p_actual_emissions: number
          p_actual_value: number
          p_metric_target_id: string
          p_month: number
          p_year: number
        }
        Returns: Json
      }
      update_organization_industry: {
        Args: {
          p_company_size_category?: string
          p_gri_sector_code?: string
          p_industry: string
          p_organization_id: string
          p_region?: string
        }
        Returns: Json
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
      user_can_access_org: { Args: { org_id: string }; Returns: boolean }
      user_has_org_access: {
        Args: { min_role?: string; org_id: string }
        Returns: boolean
      }
      user_has_site_access: {
        Args: { min_role?: string; site_id: string }
        Returns: boolean
      }
      user_organizations: { Args: never; Returns: string[] }
      validate_organization_invitation_token: {
        Args: { invitation_token: string }
        Returns: {
          custom_message: string
          email: string
          error_code: string
          error_message: string
          expires_at: string
          invitation_id: string
          organization_name: string
          sender_name: string
          suggested_org_data: Json
          valid: boolean
        }[]
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
      audit_action_category:
        | "auth"
        | "data"
        | "permission"
        | "system"
        | "security"
        | "api"
        | "agent"
      confidence_level: "high" | "medium" | "low"
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
      message_role:
        | "system"
        | "user"
        | "assistant"
        | "function"
        | "tool"
        | "agent"
      opportunity_difficulty: "easy" | "moderate" | "complex"
      opportunity_priority: "high" | "medium" | "low"
      progress_status:
        | "on_track"
        | "at_risk"
        | "off_track"
        | "achieved"
        | "not_started"
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
      sbti_ambition: "1.5C" | "well-below-2C" | "net-zero"
      score_grade: "A+" | "A" | "B" | "C" | "D" | "F"
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
      target_scope:
        | "scope_1"
        | "scope_2"
        | "scope_3"
        | "scope_1_2"
        | "all_scopes"
      target_status:
        | "draft"
        | "submitted"
        | "validated"
        | "committed"
        | "expired"
      target_type:
        | "near-term"
        | "net-zero"
        | "renewable-energy"
        | "supplier-engagement"
        | "long-term"
      trend_direction: "improving" | "stable" | "declining"
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
  public: {
    Enums: {
      api_key_status: ["active", "revoked", "expired"],
      assurance_level: ["none", "limited", "reasonable", "high"],
      audit_action_category: [
        "auth",
        "data",
        "permission",
        "system",
        "security",
        "api",
        "agent",
      ],
      confidence_level: ["high", "medium", "low"],
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
      message_role: [
        "system",
        "user",
        "assistant",
        "function",
        "tool",
        "agent",
      ],
      opportunity_difficulty: ["easy", "moderate", "complex"],
      opportunity_priority: ["high", "medium", "low"],
      progress_status: [
        "on_track",
        "at_risk",
        "off_track",
        "achieved",
        "not_started",
      ],
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
      sbti_ambition: ["1.5C", "well-below-2C", "net-zero"],
      score_grade: ["A+", "A", "B", "C", "D", "F"],
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
      target_scope: [
        "scope_1",
        "scope_2",
        "scope_3",
        "scope_1_2",
        "all_scopes",
      ],
      target_status: [
        "draft",
        "submitted",
        "validated",
        "committed",
        "expired",
      ],
      target_type: [
        "near-term",
        "net-zero",
        "renewable-energy",
        "supplier-engagement",
        "long-term",
      ],
      trend_direction: ["improving", "stable", "declining"],
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
A new version of Supabase CLI is available: v2.54.11 (currently installed v2.26.9)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
