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
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "devices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "metrics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_definitions: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          capabilities: Json
          default_autonomy_level: number
          configuration: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          capabilities?: Json
          default_autonomy_level?: number
          configuration?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          capabilities?: Json
          default_autonomy_level?: number
          configuration?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_instances: {
        Row: {
          id: string
          organization_id: string
          agent_definition_id: string
          name: string
          status: 'stopped' | 'starting' | 'running' | 'paused' | 'error'
          autonomy_level: number
          configuration: Json
          last_heartbeat: string | null
          health_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          agent_definition_id: string
          name: string
          status?: 'stopped' | 'starting' | 'running' | 'paused' | 'error'
          autonomy_level?: number
          configuration?: Json
          last_heartbeat?: string | null
          health_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          agent_definition_id?: string
          name?: string
          status?: 'stopped' | 'starting' | 'running' | 'paused' | 'error'
          autonomy_level?: number
          configuration?: Json
          last_heartbeat?: string | null
          health_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instances_agent_definition_id_fkey"
            columns: ["agent_definition_id"]
            isOneToOne: false
            referencedRelation: "agent_definitions"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_scheduled_tasks: {
        Row: {
          id: string
          agent_instance_id: string
          task_type: string
          task_name: string
          schedule_pattern: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          task_config: Json
          next_run: string
          last_run: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          task_type: string
          task_name: string
          schedule_pattern: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          task_config?: Json
          next_run: string
          last_run?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          task_type?: string
          task_name?: string
          schedule_pattern?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          task_config?: Json
          next_run?: string
          last_run?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_scheduled_tasks_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_task_executions: {
        Row: {
          id: string
          agent_instance_id: string
          scheduled_task_id: string | null
          task_type: string
          task_name: string
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          input_data: Json
          output_data: Json
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          scheduled_task_id?: string | null
          task_type: string
          task_name: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          input_data?: Json
          output_data?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          scheduled_task_id?: string | null
          task_type?: string
          task_name?: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          input_data?: Json
          output_data?: Json
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          retry_count?: number
          created_at?: string
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
          }
        ]
      }
      agent_approvals: {
        Row: {
          id: string
          agent_instance_id: string
          task_execution_id: string | null
          action_type: string
          action_description: string
          action_data: Json
          required_autonomy_level: number
          status: 'pending' | 'approved' | 'rejected' | 'expired'
          approved_by: string | null
          approval_reason: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          task_execution_id?: string | null
          action_type: string
          action_description: string
          action_data?: Json
          required_autonomy_level: number
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          approved_by?: string | null
          approval_reason?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          task_execution_id?: string | null
          action_type?: string
          action_description?: string
          action_data?: Json
          required_autonomy_level?: number
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          approved_by?: string | null
          approval_reason?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_approvals_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_approvals_task_execution_id_fkey"
            columns: ["task_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_task_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_learning_patterns: {
        Row: {
          id: string
          agent_instance_id: string
          pattern_type: string
          pattern_name: string
          pattern_data: Json
          success_rate: number
          confidence_score: number
          usage_count: number
          last_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          pattern_type: string
          pattern_name: string
          pattern_data: Json
          success_rate?: number
          confidence_score?: number
          usage_count?: number
          last_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          pattern_type?: string
          pattern_name?: string
          pattern_data?: Json
          success_rate?: number
          confidence_score?: number
          usage_count?: number
          last_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_learning_patterns_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_metrics: {
        Row: {
          id: string
          agent_instance_id: string
          metric_type: string
          metric_name: string
          metric_value: number
          metric_unit: string | null
          metadata: Json
          recorded_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          metric_type: string
          metric_name: string
          metric_value: number
          metric_unit?: string | null
          metadata?: Json
          recorded_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          metric_type?: string
          metric_name?: string
          metric_value?: number
          metric_unit?: string | null
          metadata?: Json
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_decisions: {
        Row: {
          id: string
          agent_instance_id: string
          task_execution_id: string | null
          decision_type: string
          decision_context: Json
          decision_outcome: Json
          confidence_score: number | null
          autonomy_level_used: number | null
          approval_required: boolean
          approval_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_instance_id: string
          task_execution_id?: string | null
          decision_type: string
          decision_context: Json
          decision_outcome: Json
          confidence_score?: number | null
          autonomy_level_used?: number | null
          approval_required?: boolean
          approval_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_instance_id?: string
          task_execution_id?: string | null
          decision_type?: string
          decision_context?: Json
          decision_outcome?: Json
          confidence_score?: number | null
          autonomy_level_used?: number | null
          approval_required?: boolean
          approval_id?: string | null
          created_at?: string
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
            foreignKeyName: "agent_decisions_task_execution_id_fkey"
            columns: ["task_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_task_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_decisions_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "agent_approvals"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_collaborations: {
        Row: {
          id: string
          initiator_agent_id: string
          collaborator_agent_id: string
          collaboration_type: string
          collaboration_data: Json
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          initiator_agent_id: string
          collaborator_agent_id: string
          collaboration_type: string
          collaboration_data: Json
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          initiator_agent_id?: string
          collaborator_agent_id?: string
          collaboration_type?: string
          collaboration_data?: Json
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_collaborations_initiator_agent_id_fkey"
            columns: ["initiator_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_collaborations_collaborator_agent_id_fkey"
            columns: ["collaborator_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_agents_for_organization: {
        Args: {
          org_id: string
        }
        Returns: undefined
      }
      schedule_agent_task: {
        Args: {
          p_agent_instance_id: string
          p_task_type: string
          p_task_name: string
          p_schedule_pattern: string
          p_priority?: 'low' | 'medium' | 'high' | 'critical'
          p_task_config?: Json
        }
        Returns: string
      }
      execute_agent_task: {
        Args: {
          p_agent_instance_id: string
          p_task_type: string
          p_task_name: string
          p_input_data?: Json
          p_priority?: 'low' | 'medium' | 'high' | 'critical'
        }
        Returns: string
      }
      update_agent_health: {
        Args: {
          p_agent_instance_id: string
          p_health_score: number
        }
        Returns: undefined
      }
      record_agent_decision: {
        Args: {
          p_agent_instance_id: string
          p_task_execution_id: string
          p_decision_type: string
          p_decision_context: Json
          p_decision_outcome: Json
          p_confidence_score: number
          p_autonomy_level_used: number
        }
        Returns: string
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

// Helper types for agent system
export type AgentDefinition = Database['public']['Tables']['agent_definitions']['Row']
export type AgentInstance = Database['public']['Tables']['agent_instances']['Row']
export type AgentScheduledTask = Database['public']['Tables']['agent_scheduled_tasks']['Row']
export type AgentTaskExecution = Database['public']['Tables']['agent_task_executions']['Row']
export type AgentApproval = Database['public']['Tables']['agent_approvals']['Row']
export type AgentLearningPattern = Database['public']['Tables']['agent_learning_patterns']['Row']
export type AgentMetric = Database['public']['Tables']['agent_metrics']['Row']
export type AgentDecision = Database['public']['Tables']['agent_decisions']['Row']
export type AgentCollaboration = Database['public']['Tables']['agent_collaborations']['Row']

// Insert types
export type AgentDefinitionInsert = Database['public']['Tables']['agent_definitions']['Insert']
export type AgentInstanceInsert = Database['public']['Tables']['agent_instances']['Insert']
export type AgentScheduledTaskInsert = Database['public']['Tables']['agent_scheduled_tasks']['Insert']
export type AgentTaskExecutionInsert = Database['public']['Tables']['agent_task_executions']['Insert']
export type AgentApprovalInsert = Database['public']['Tables']['agent_approvals']['Insert']
export type AgentLearningPatternInsert = Database['public']['Tables']['agent_learning_patterns']['Insert']
export type AgentMetricInsert = Database['public']['Tables']['agent_metrics']['Insert']
export type AgentDecisionInsert = Database['public']['Tables']['agent_decisions']['Insert']
export type AgentCollaborationInsert = Database['public']['Tables']['agent_collaborations']['Insert']

// Update types
export type AgentDefinitionUpdate = Database['public']['Tables']['agent_definitions']['Update']
export type AgentInstanceUpdate = Database['public']['Tables']['agent_instances']['Update']
export type AgentScheduledTaskUpdate = Database['public']['Tables']['agent_scheduled_tasks']['Update']
export type AgentTaskExecutionUpdate = Database['public']['Tables']['agent_task_executions']['Update']
export type AgentApprovalUpdate = Database['public']['Tables']['agent_approvals']['Update']
export type AgentLearningPatternUpdate = Database['public']['Tables']['agent_learning_patterns']['Update']
export type AgentMetricUpdate = Database['public']['Tables']['agent_metrics']['Update']
export type AgentDecisionUpdate = Database['public']['Tables']['agent_decisions']['Update']
export type AgentCollaborationUpdate = Database['public']['Tables']['agent_collaborations']['Update']

// Enums
export type AgentStatus = 'stopped' | 'starting' | 'running' | 'paused' | 'error'
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type CollaborationStatus = 'active' | 'completed' | 'cancelled'

// Complex types with relationships
export type AgentInstanceWithDefinition = AgentInstance & {
  agent_definition: AgentDefinition
}

export type AgentTaskExecutionWithAgent = AgentTaskExecution & {
  agent_instance: AgentInstance
}

export type AgentApprovalWithDetails = AgentApproval & {
  agent_instance: AgentInstance
  task_execution?: AgentTaskExecution
}