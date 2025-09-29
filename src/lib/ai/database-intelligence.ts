/**
 * Database Intelligence Service
 * Comprehensive mapping of ALL tables, relationships, settings, and data flows in BLIPEE OS
 * Provides AI with complete understanding of the database structure and permissions
 */

import { createClient } from '@supabase/supabase-js';

// Core entity tables and their relationships
export interface DatabaseSchema {
  // Authentication & Users
  auth_users: {
    id: string;
    email: string;
    raw_user_meta_data: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  app_users: {
    id: string;
    auth_user_id: string; // FK to auth.users
    email: string;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    role: 'super_admin' | 'user';
    permissions: string[];
    phone?: string;
    avatar_url?: string;
    last_login?: string;
    created_at: string;
    updated_at: string;
    // Settings columns
    language_settings?: Record<string, any>;
    notification_settings?: Record<string, any>;
    appearance_settings?: Record<string, any>;
    security_settings?: Record<string, any>;
  };

  // Organizations & Membership
  organizations: {
    id: string;
    name: string;
    slug: string;
    industry?: string;
    country?: string;
    company_size?: string;
    compliance_frameworks?: string[];
    created_by?: string; // FK to auth.users
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
    // Additional organization fields
    website?: string;
    description?: string;
    logo_url?: string;
    billing_settings?: Record<string, any>;
    targets?: Record<string, any>;
  };

  user_organizations: {
    user_id: string; // FK to auth.users
    organization_id: string; // FK to organizations
    role: 'account_owner' | 'sustainability_manager' | 'facility_manager' | 'analyst' | 'viewer' | 'member';
    created_at: string;
  };

  // Sites & Buildings
  sites: {
    id: string;
    organization_id: string; // FK to organizations
    name: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    square_footage?: number;
    year_built?: number;
    building_type?: string;
    occupancy_type?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  buildings: {
    id: string;
    organization_id: string; // FK to organizations
    name: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    square_footage?: number;
    year_built?: number;
    building_type?: string;
    occupancy_type?: string;
    metadata: Record<string, any>;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  // Devices & IoT
  devices: {
    id: string;
    building_id: string; // FK to buildings
    organization_id?: string; // FK to organizations
    type: string;
    name: string;
    manufacturer?: string;
    model?: string;
    device_id?: string;
    connection_status?: string;
    capabilities: string[];
    state: Record<string, any>;
    last_seen: string;
    created_at: string;
    updated_at: string;
  };

  // Metrics & Sustainability Data
  metrics_catalog: {
    id: string;
    code: string;
    name: string;
    scope: 'scope_1' | 'scope_2' | 'scope_3';
    category: string;
    subcategory?: string;
    unit: string;
    description?: string;
    calculation_method?: string;
    emission_factor?: number;
    emission_factor_unit?: string;
    emission_factor_source?: string;
    ghg_protocol_category?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

  organization_metrics: {
    id: string;
    organization_id: string; // FK to organizations
    metric_id: string; // FK to metrics_catalog
    is_required: boolean;
    target_value?: number;
    target_year?: number;
    baseline_value?: number;
    baseline_year?: number;
    reporting_frequency: 'monthly' | 'quarterly' | 'annually';
    data_source?: string;
    responsible_user_id?: string; // FK to auth.users
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

  metrics_data: {
    id: string;
    organization_id: string; // FK to organizations
    metric_id: string; // FK to metrics_catalog
    site_id?: string; // FK to sites
    period_start: string;
    period_end: string;
    value: number;
    unit: string;
    co2e_emissions?: number;
    data_quality: 'measured' | 'calculated' | 'estimated';
    verification_status: 'unverified' | 'verified' | 'audited';
    verified_by?: string; // FK to auth.users
    verified_at?: string;
    evidence_url?: string;
    notes?: string;
    metadata: Record<string, any>;
    created_by?: string; // FK to auth.users
    created_at: string;
    updated_at: string;
  };

  // Legacy emissions tables (for backward compatibility)
  emissions_data: {
    id: string;
    organization_id: string; // FK to organizations
    building_id?: string; // FK to buildings
    scope: '1' | '2' | '3';
    category: string;
    subcategory?: string;
    activity_data: number;
    activity_unit: string;
    emission_factor: number;
    emission_factor_unit: string;
    co2e_kg: number;
    data_source?: string;
    calculation_method?: string;
    evidence_url?: string;
    period_start: string;
    period_end: string;
    created_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  energy_consumption: {
    id: string;
    organization_id: string; // FK to organizations
    building_id?: string; // FK to buildings
    energy_type: string;
    consumption_kwh: number;
    period_start: string;
    period_end: string;
    cost?: number;
    currency?: string;
    renewable_percentage?: number;
    created_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  water_consumption: {
    id: string;
    organization_id: string; // FK to organizations
    building_id?: string; // FK to buildings
    water_source: string;
    usage_type: string;
    volume_liters: number;
    period_start: string;
    period_end: string;
    is_recycled: boolean;
    treatment_type?: string;
    created_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  waste_data: {
    id: string;
    organization_id: string; // FK to organizations
    building_id?: string; // FK to buildings
    waste_type: string;
    disposal_method: string;
    quantity: number;
    unit: string;
    recycling_rate?: number;
    diverted_from_landfill: boolean;
    period_start: string;
    period_end: string;
    created_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  // AI & Autonomous Agents
  agent_learnings: {
    id: string;
    agent_id: string;
    organization_id: string; // FK to organizations
    context: string;
    insight: string;
    impact: number; // 0-1
    confidence: number; // 0-1
    metadata?: Record<string, any>;
    created_at: string;
  };

  agent_tasks: {
    id: string;
    agent_id: string;
    organization_id: string; // FK to organizations
    task_type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: Record<string, any>;
    execution_time_ms?: number;
    error?: string;
    executed_at: string;
  };

  agent_rules: {
    id: string;
    agent_id: string;
    organization_id: string; // FK to organizations
    rule_type: string;
    rule_content: string;
    confidence: number;
    active: boolean;
    created_at: string;
    updated_at: string;
  };

  // ML Pipeline
  ml_models: {
    id: string;
    organization_id: string; // FK to organizations
    model_type: string;
    architecture: string;
    parameters?: Record<string, any>;
    performance?: Record<string, any>;
    trained_at: string;
    created_at: string;
  };

  ml_predictions: {
    id: string;
    organization_id: string; // FK to organizations
    model_type: string;
    predictions: Record<string, any>;
    confidence?: number;
    metadata?: Record<string, any>;
    created_at: string;
  };

  // Conversations & AI Interactions
  conversations: {
    id: string;
    user_id?: string; // FK to auth.users
    building_id?: string; // FK to buildings
    organization_id?: string; // FK to organizations
    messages: Record<string, any>[];
    context: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  // Reports & Documents
  sustainability_reports: {
    id: string;
    organization_id: string; // FK to organizations
    report_type: string;
    report_year: number;
    status: 'draft' | 'review' | 'approved' | 'published';
    framework: string;
    content: Record<string, any>;
    total_emissions_scope1?: number;
    total_emissions_scope2?: number;
    total_emissions_scope3?: number;
    emissions_intensity?: number;
    energy_consumption?: number;
    renewable_energy_percentage?: number;
    water_consumption?: number;
    waste_generated?: number;
    waste_recycled_percentage?: number;
    published_at?: string;
    created_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  document_uploads: {
    id: string;
    organization_id: string; // FK to organizations
    building_id?: string; // FK to buildings
    document_type: string;
    file_name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    extracted_data: Record<string, any>;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    uploaded_by?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  };

  // Time-series metrics
  metrics: {
    time: string;
    device_id?: string; // FK to devices
    metric_type: string;
    value: number;
    metadata: Record<string, any>;
  };
}

// Database relationship mappings
export const DATABASE_RELATIONSHIPS = {
  // Core entity hierarchy
  organization_hierarchy: {
    organizations: {
      children: ['sites', 'buildings', 'user_organizations', 'organization_metrics', 'metrics_data'],
      settings_tables: ['organization_metrics'],
      data_tables: ['metrics_data', 'emissions_data', 'energy_consumption', 'water_consumption', 'waste_data']
    },
    sites: {
      parent: 'organizations',
      children: ['devices', 'metrics_data'],
      foreign_keys: { organization_id: 'organizations.id' }
    },
    buildings: {
      parent: 'organizations',
      children: ['devices', 'conversations'],
      foreign_keys: { organization_id: 'organizations.id' }
    },
    devices: {
      parent: ['sites', 'buildings'],
      children: ['metrics'],
      foreign_keys: {
        building_id: 'buildings.id',
        site_id: 'sites.id'
      }
    }
  },

  // User & permission relationships
  user_permissions: {
    auth_users: {
      children: ['app_users', 'user_organizations', 'conversations'],
      sync_table: 'app_users'
    },
    app_users: {
      parent: 'auth_users',
      foreign_keys: { auth_user_id: 'auth.users.id' },
      settings_columns: ['language_settings', 'notification_settings', 'appearance_settings', 'security_settings']
    },
    user_organizations: {
      parents: ['auth_users', 'organizations'],
      foreign_keys: {
        user_id: 'auth.users.id',
        organization_id: 'organizations.id'
      },
      roles: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer', 'member']
    }
  },

  // Data flow relationships
  sustainability_data: {
    metrics_catalog: {
      children: ['organization_metrics', 'metrics_data'],
      is_reference_table: true
    },
    organization_metrics: {
      parents: ['organizations', 'metrics_catalog'],
      children: ['metrics_data'],
      foreign_keys: {
        organization_id: 'organizations.id',
        metric_id: 'metrics_catalog.id'
      }
    },
    metrics_data: {
      parents: ['organizations', 'metrics_catalog', 'sites'],
      foreign_keys: {
        organization_id: 'organizations.id',
        metric_id: 'metrics_catalog.id',
        site_id: 'sites.id'
      }
    }
  },

  // Agent & ML relationships
  ai_system: {
    agent_learnings: {
      parent: 'organizations',
      foreign_keys: { organization_id: 'organizations.id' }
    },
    agent_tasks: {
      parent: 'organizations',
      foreign_keys: { organization_id: 'organizations.id' }
    },
    ml_models: {
      parent: 'organizations',
      children: ['ml_predictions'],
      foreign_keys: { organization_id: 'organizations.id' }
    },
    ml_predictions: {
      parents: ['organizations', 'ml_models'],
      foreign_keys: { organization_id: 'organizations.id' }
    }
  }
};

// Role-based access control mapping
export const RBAC_PERMISSIONS = {
  roles: {
    super_admin: {
      scope: 'global',
      permissions: ['read', 'write', 'delete', 'admin'],
      tables: 'all'
    },
    account_owner: {
      scope: 'organization',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      tables: 'organization_data'
    },
    sustainability_manager: {
      scope: 'organization',
      permissions: ['read', 'write', 'manage_metrics'],
      tables: ['metrics_data', 'emissions_data', 'reports', 'organization_metrics']
    },
    facility_manager: {
      scope: 'organization',
      permissions: ['read', 'write'],
      tables: ['buildings', 'devices', 'metrics_data', 'energy_consumption']
    },
    analyst: {
      scope: 'organization',
      permissions: ['read', 'write'],
      tables: ['metrics_data', 'emissions_data', 'reports']
    },
    viewer: {
      scope: 'organization',
      permissions: ['read'],
      tables: ['metrics_data', 'reports', 'dashboard_views']
    }
  },

  table_permissions: {
    organizations: ['account_owner'],
    sites: ['account_owner', 'sustainability_manager', 'facility_manager'],
    buildings: ['account_owner', 'sustainability_manager', 'facility_manager'],
    devices: ['account_owner', 'facility_manager'],
    metrics_data: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer'],
    emissions_data: ['account_owner', 'sustainability_manager', 'analyst', 'viewer'],
    energy_consumption: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer'],
    water_consumption: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer'],
    waste_data: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer'],
    sustainability_reports: ['account_owner', 'sustainability_manager', 'analyst', 'viewer'],
    user_organizations: ['account_owner'],
    app_users: ['account_owner']
  }
};

// Settings configuration mapping
export const SETTINGS_HIERARCHY = {
  organization_settings: {
    table: 'organizations',
    column: 'settings',
    schema: {
      industry: 'string',
      compliance_frameworks: 'string[]',
      targets: 'object',
      billing_settings: 'object',
      timezone: 'string',
      currency: 'string',
      units: 'object'
    }
  },

  site_settings: {
    table: 'sites',
    column: 'metadata',
    schema: {
      operating_hours: 'object',
      timezone: 'string',
      climate_zone: 'string',
      occupancy: 'number',
      energy_sources: 'string[]'
    }
  },

  building_settings: {
    table: 'buildings',
    column: 'settings',
    schema: {
      hvac_settings: 'object',
      lighting_settings: 'object',
      security_settings: 'object',
      access_control: 'object'
    }
  },

  device_settings: {
    table: 'devices',
    column: 'state',
    schema: {
      thresholds: 'object',
      calibration: 'object',
      alerts: 'object',
      maintenance_schedule: 'object'
    }
  },

  user_settings: {
    table: 'app_users',
    columns: {
      language_settings: {
        language: 'string',
        timezone: 'string',
        date_format: 'string'
      },
      notification_settings: {
        email_notifications: 'boolean',
        push_notifications: 'boolean',
        alert_types: 'string[]'
      },
      appearance_settings: {
        theme: 'string',
        dashboard_layout: 'object'
      },
      security_settings: {
        two_factor_enabled: 'boolean',
        session_timeout: 'number'
      }
    }
  }
};

/**
 * Database Intelligence Service Class
 */
export class DatabaseIntelligenceService {
  private supabase: any;

  constructor(supabase?: any) {
    this.supabase = supabase;
  }

  /**
   * Get all tables accessible to an organization
   */
  async getAllTablesForOrganization(organizationId: string): Promise<string[]> {
    const orgTables = [
      // Core organization data
      'organizations',
      'sites',
      'buildings',
      'devices',

      // Sustainability data
      'metrics_data',
      'organization_metrics',
      'emissions_data',
      'energy_consumption',
      'water_consumption',
      'waste_data',

      // Reports & documents
      'sustainability_reports',
      'document_uploads',

      // AI & agents
      'agent_learnings',
      'agent_tasks',
      'agent_rules',
      'ml_models',
      'ml_predictions',

      // Conversations
      'conversations',

      // Time-series
      'metrics'
    ];

    return orgTables;
  }

  /**
   * Get user accessible data based on their role and organization membership
   */
  async getUserAccessibleData(userId: string): Promise<{
    organizations: string[];
    tables: string[];
    permissions: string[];
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get user's organization memberships
    const { data: memberships } = await this.supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', userId);

    const organizations = memberships?.map(m => m.organization_id) || [];

    // Get highest role across all organizations
    const roles = memberships?.map(m => m.role) || [];
    const highestRole = this.getHighestRole(roles);

    // Get accessible tables based on role
    const accessibleTables = this.getTablesForRole(highestRole);
    const permissions = RBAC_PERMISSIONS.roles[highestRole]?.permissions || ['read'];

    return {
      organizations,
      tables: accessibleTables,
      permissions
    };
  }

  /**
   * Get settings hierarchy for an entity
   */
  getSettingsHierarchy(entityType: keyof typeof SETTINGS_HIERARCHY, entityId: string): {
    table: string;
    column?: string;
    columns?: Record<string, any>;
    schema: any;
  } {
    const settingsConfig = SETTINGS_HIERARCHY[entityType];
    if (!settingsConfig) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return settingsConfig;
  }

  /**
   * Trace data lineage for a specific data point
   */
  getDataLineage(table: string, column?: string): {
    source_tables: string[];
    dependent_tables: string[];
    relationships: any[];
    settings_affected: string[];
  } {
    const lineage = {
      source_tables: [],
      dependent_tables: [],
      relationships: [],
      settings_affected: []
    };

    // Find relationships involving this table
    for (const [category, relations] of Object.entries(DATABASE_RELATIONSHIPS)) {
      for (const [tableName, config] of Object.entries(relations)) {
        if (tableName === table) {
          // Add parent tables
          if (config.parent) {
            lineage.source_tables.push(config.parent);
          }
          if (config.parents) {
            lineage.source_tables.push(...config.parents);
          }

          // Add child tables
          if (config.children) {
            lineage.dependent_tables.push(...config.children);
          }

          // Add foreign key relationships
          if (config.foreign_keys) {
            for (const [fk, ref] of Object.entries(config.foreign_keys)) {
              lineage.relationships.push({
                type: 'foreign_key',
                from: `${table}.${fk}`,
                to: ref
              });
            }
          }
        }
      }
    }

    // Find settings tables affected
    for (const [settingType, config] of Object.entries(SETTINGS_HIERARCHY)) {
      if (config.table === table) {
        lineage.settings_affected.push(settingType);
      }
    }

    return lineage;
  }

  /**
   * Get complete table schema with relationships
   */
  getTableSchema(tableName: string): {
    columns: Record<string, any>;
    relationships: any;
    rls_policies: string[];
    indexes: string[];
  } {
    // This would be expanded with actual schema introspection
    const schema = {
      columns: {},
      relationships: this.getTableRelationships(tableName),
      rls_policies: this.getRLSPolicies(tableName),
      indexes: this.getTableIndexes(tableName)
    };

    return schema;
  }

  /**
   * Get organization configuration summary
   */
  async getOrganizationConfiguration(organizationId: string): Promise<{
    settings: any;
    metrics_configured: number;
    sites_count: number;
    devices_count: number;
    active_agents: string[];
    compliance_frameworks: string[];
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get organization settings
    const { data: org } = await this.supabase
      .from('organizations')
      .select('settings, compliance_frameworks')
      .eq('id', organizationId)
      .single();

    // Get metrics count
    const { count: metricsCount } = await this.supabase
      .from('organization_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get sites count
    const { count: sitesCount } = await this.supabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get devices count
    const { count: devicesCount } = await this.supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .in('building_id',
        this.supabase
          .from('buildings')
          .select('id')
          .eq('organization_id', organizationId)
      );

    // Get active agents
    const { data: agents } = await this.supabase
      .from('agent_tasks')
      .select('agent_id')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const activeAgents = [...new Set(agents?.map(a => a.agent_id) || [])];

    return {
      settings: org?.settings || {},
      metrics_configured: metricsCount || 0,
      sites_count: sitesCount || 0,
      devices_count: devicesCount || 0,
      active_agents: activeAgents,
      compliance_frameworks: org?.compliance_frameworks || []
    };
  }

  /**
   * Get real-time system status
   */
  async getSystemStatus(organizationId: string): Promise<{
    data_quality: any;
    agent_health: any;
    ml_model_status: any;
    recent_alerts: any[];
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get data quality metrics
    const { data: dataQuality } = await this.supabase
      .from('metrics_data')
      .select('data_quality, verification_status')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get agent performance
    const { data: agentHealth } = await this.supabase
      .from('agent_performance')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Get ML model status
    const { data: mlStatus } = await this.supabase
      .from('ml_models')
      .select('model_type, performance, trained_at')
      .eq('organization_id', organizationId);

    // Get recent alerts
    const { data: alerts } = await this.supabase
      .from('agent_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      data_quality: this.analyzeDataQuality(dataQuality || []),
      agent_health: agentHealth?.[0] || {},
      ml_model_status: mlStatus || [],
      recent_alerts: alerts || []
    };
  }

  // Helper methods
  private getHighestRole(roles: string[]): string {
    const roleHierarchy = ['viewer', 'analyst', 'facility_manager', 'sustainability_manager', 'account_owner', 'super_admin'];
    return roles.reduce((highest, role) => {
      return roleHierarchy.indexOf(role) > roleHierarchy.indexOf(highest) ? role : highest;
    }, 'viewer');
  }

  private getTablesForRole(role: string): string[] {
    const rolePermissions = RBAC_PERMISSIONS.roles[role];
    if (!rolePermissions || rolePermissions.tables === 'all') {
      return Object.keys(SETTINGS_HIERARCHY);
    }

    if (rolePermissions.tables === 'organization_data') {
      return Object.keys(DATABASE_RELATIONSHIPS.organization_hierarchy.organizations.children);
    }

    return rolePermissions.tables as string[];
  }

  private getTableRelationships(tableName: string): any {
    for (const [category, relations] of Object.entries(DATABASE_RELATIONSHIPS)) {
      if (relations[tableName]) {
        return relations[tableName];
      }
    }
    return {};
  }

  private getRLSPolicies(tableName: string): string[] {
    // This would return actual RLS policies for the table
    return [`Users can view ${tableName} in their organization`];
  }

  private getTableIndexes(tableName: string): string[] {
    // This would return actual indexes for the table
    return [`idx_${tableName}_org`, `idx_${tableName}_created`];
  }

  private analyzeDataQuality(data: any[]): any {
    const total = data.length;
    const measured = data.filter(d => d.data_quality === 'measured').length;
    const verified = data.filter(d => d.verification_status === 'verified').length;

    return {
      total_records: total,
      measured_percentage: total > 0 ? (measured / total) * 100 : 0,
      verified_percentage: total > 0 ? (verified / total) * 100 : 0,
      quality_score: total > 0 ? ((measured * 0.6 + verified * 0.4) / total) * 100 : 0
    };
  }
}

// Export singleton instance
export const databaseIntelligence = new DatabaseIntelligenceService();

// Export utility functions for AI to use
export function createDatabaseIntelligence(supabase: any) {
  return new DatabaseIntelligenceService(supabase);
}

export function getTablePermissions(tableName: string, userRole: string): string[] {
  const tablePerms = RBAC_PERMISSIONS.table_permissions[tableName];
  if (!tablePerms) return [];

  const rolePerms = RBAC_PERMISSIONS.roles[userRole];
  if (!rolePerms) return [];

  return tablePerms.includes(userRole) ? rolePerms.permissions : [];
}

export function getDataFlowMap(startTable: string): any {
  const flowMap = {
    upstream: [],
    downstream: [],
    settings_impact: []
  };

  // Trace data flows using relationship mappings
  const lineage = databaseIntelligence.getDataLineage(startTable);
  flowMap.upstream = lineage.source_tables;
  flowMap.downstream = lineage.dependent_tables;
  flowMap.settings_impact = lineage.settings_affected;

  return flowMap;
}

/**
 * Key exports for AI to understand the entire system:
 *
 * 1. DatabaseSchema - Complete type definitions for all tables
 * 2. DATABASE_RELATIONSHIPS - How tables connect and depend on each other
 * 3. RBAC_PERMISSIONS - Who can access what based on roles
 * 4. SETTINGS_HIERARCHY - Where settings live and how they're structured
 * 5. DatabaseIntelligenceService - Methods to query and analyze the database
 *
 * The AI can now:
 * - Understand what data exists across the entire system
 * - Know which settings control what functionality
 * - Navigate permission boundaries correctly
 * - Access any configuration or data point needed
 * - Trace data lineage and dependencies
 * - Get real-time system status and health
 */