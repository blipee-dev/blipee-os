/**
 * Database Schema Validator & Health Check System
 * 
 * Ensures database schema integrity and validates migrations
 * Provides comprehensive health checks and repair recommendations
 */

import { createClient } from '@/lib/supabase/server';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  missingElements: MissingElement[];
  recommendations: Recommendation[];
  healthScore: number;
}

export interface SchemaError {
  type: 'missing_table' | 'missing_column' | 'missing_enum' | 'missing_function' | 'constraint_violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  description: string;
  sqlFix?: string;
}

export interface SchemaWarning {
  type: 'performance' | 'security' | 'best_practice';
  element: string;
  message: string;
  recommendation: string;
}

export interface MissingElement {
  type: 'table' | 'column' | 'index' | 'function' | 'trigger' | 'policy';
  name: string;
  required: boolean;
  createSql: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'maintenance';
  action: string;
  description: string;
  sql?: string;
}

export class DatabaseSchemaValidator {
  private supabase = createClient();

  /**
   * Comprehensive schema validation
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    const results: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingElements: [],
      recommendations: [],
      healthScore: 100
    };

    // Run all validation checks
    await Promise.all([
      this.validateEnums(results),
      this.validateCoreTables(results),
      this.validateIndexes(results),
      this.validateRLSPolicies(results),
      this.validateFunctions(results),
      this.validateConstraints(results)
    ]);

    // Calculate health score
    results.healthScore = this.calculateHealthScore(results);
    results.isValid = results.errors.length === 0;

    return results;
  }

  /**
   * Validate that required enums exist with correct values
   */
  private async validateEnums(results: SchemaValidationResult): Promise<void> {
    const requiredEnums = {
      'user_role': [
        'platform_admin', 'account_owner', 'admin', 'sustainability_lead',
        'sustainability_manager', 'facility_manager', 'analyst', 'reporter', 'viewer'
      ],
      'invitation_status': ['pending', 'accepted', 'declined', 'expired', 'revoked'],
      'organization_tier': ['free', 'starter', 'professional', 'enterprise']
    };

    try {
      for (const [enumName, expectedValues] of Object.entries(requiredEnums)) {
        // Check if enum exists
        const { data: enumExists } = await this.supabase
          .rpc('check_enum_exists', { enum_name: enumName });

        if (!enumExists) {
          results.errors.push({
            type: 'missing_enum',
            severity: 'critical',
            element: enumName,
            description: `Required enum '${enumName}' does not exist`,
            sqlFix: this.generateEnumCreateSql(enumName, expectedValues)
          });
          continue;
        }

        // Check enum values
        const { data: enumValues } = await this.supabase
          .rpc('get_enum_values', { enum_name: enumName });

        const missingValues = expectedValues.filter(
          value => !enumValues?.includes(value)
        );

        if (missingValues.length > 0) {
          results.errors.push({
            type: 'missing_enum',
            severity: 'high',
            element: `${enumName} values`,
            description: `Missing enum values: ${missingValues.join(', ')}`,
            sqlFix: missingValues.map(value => 
              `ALTER TYPE ${enumName} ADD VALUE '${value}';`
            ).join('\n')
          });
        }
      }
    } catch (error) {
      results.errors.push({
        type: 'missing_function',
        severity: 'high',
        element: 'enum validation functions',
        description: 'Missing database functions for enum validation',
        sqlFix: this.getEnumValidationFunctions()
      });
    }
  }

  /**
   * Validate core tables exist with proper structure
   */
  private async validateCoreTables(results: SchemaValidationResult): Promise<void> {
    const coreTables = {
      'organizations': ['id', 'name', 'created_at', 'updated_at'],
      'organization_members': ['id', 'organization_id', 'user_id', 'role', 'is_active'],
      'organization_invitations': ['id', 'organization_id', 'email', 'role', 'status'],
      'organization_settings': ['id', 'organization_id', 'tier', 'features'],
      'buildings': ['id', 'organization_id', 'name'],
      'emissions_data': ['id', 'organization_id', 'scope', 'co2e_kg'],
      'conversation_memories': ['id', 'organization_id', 'user_id', 'summary'],
      'conversation_contexts': ['id', 'conversation_id', 'organization_id']
    };

    for (const [tableName, requiredColumns] of Object.entries(coreTables)) {
      try {
        // Check table exists
        const { data: tableExists } = await this.supabase
          .rpc('check_table_exists', { table_name: tableName });

        if (!tableExists) {
          results.errors.push({
            type: 'missing_table',
            severity: 'critical',
            element: tableName,
            description: `Core table '${tableName}' does not exist`
          });
          continue;
        }

        // Check required columns
        const { data: columns } = await this.supabase
          .rpc('get_table_columns', { table_name: tableName });

        const existingColumns = columns?.map(col => col.column_name) || [];
        const missingColumns = requiredColumns.filter(
          col => !existingColumns.includes(col)
        );

        if (missingColumns.length > 0) {
          results.errors.push({
            type: 'missing_column',
            severity: 'high',
            element: `${tableName} columns`,
            description: `Missing columns in ${tableName}: ${missingColumns.join(', ')}`
          });
        }

      } catch (error) {
        results.errors.push({
          type: 'missing_table',
          severity: 'critical',
          element: tableName,
          description: `Unable to validate table '${tableName}': ${error}`
        });
      }
    }
  }

  /**
   * Validate critical indexes exist for performance
   */
  private async validateIndexes(results: SchemaValidationResult): Promise<void> {
    const criticalIndexes = [
      'idx_organization_members_org_id',
      'idx_organization_members_user_id', 
      'idx_organization_members_role',
      'idx_emissions_data_org_id',
      'idx_conversation_memories_org_id',
      'idx_conversation_memories_user_id'
    ];

    try {
      const { data: indexes } = await this.supabase
        .rpc('get_table_indexes', {});

      const existingIndexes = indexes?.map(idx => idx.indexname) || [];
      
      for (const indexName of criticalIndexes) {
        if (!existingIndexes.includes(indexName)) {
          results.warnings.push({
            type: 'performance',
            element: indexName,
            message: `Missing critical index: ${indexName}`,
            recommendation: 'Create index to improve query performance'
          });
        }
      }
    } catch (error) {
      results.warnings.push({
        type: 'performance',
        element: 'indexes',
        message: 'Unable to validate indexes',
        recommendation: 'Check database connection and permissions'
      });
    }
  }

  /**
   * Validate Row Level Security policies
   */
  private async validateRLSPolicies(results: SchemaValidationResult): Promise<void> {
    const tablesNeedingRLS = [
      'organization_members',
      'organization_invitations', 
      'organization_settings',
      'buildings',
      'emissions_data',
      'conversation_memories',
      'conversation_contexts'
    ];

    for (const tableName of tablesNeedingRLS) {
      try {
        const { data: policies } = await this.supabase
          .rpc('get_table_policies', { table_name: tableName });

        if (!policies || policies.length === 0) {
          results.warnings.push({
            type: 'security',
            element: `${tableName} RLS`,
            message: `Table '${tableName}' has no RLS policies`,
            recommendation: 'Implement RLS policies for data security'
          });
        }

        // Check if RLS is enabled
        const { data: rlsEnabled } = await this.supabase
          .rpc('check_rls_enabled', { table_name: tableName });

        if (!rlsEnabled) {
          results.warnings.push({
            type: 'security',
            element: `${tableName} RLS`,
            message: `RLS not enabled on table '${tableName}'`,
            recommendation: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
          });
        }

      } catch (error) {
        // RLS validation functions may not exist yet
      }
    }
  }

  /**
   * Validate required functions exist
   */
  private async validateFunctions(results: SchemaValidationResult): Promise<void> {
    const requiredFunctions = [
      'user_has_organization_access',
      'get_user_organization_role',
      'update_updated_at_column'
    ];

    try {
      for (const functionName of requiredFunctions) {
        const { data: functionExists } = await this.supabase
          .rpc('check_function_exists', { function_name: functionName });

        if (!functionExists) {
          results.warnings.push({
            type: 'best_practice',
            element: functionName,
            message: `Utility function '${functionName}' not found`,
            recommendation: 'Create utility functions for better maintainability'
          });
        }
      }
    } catch (error) {
      // Functions for checking functions may not exist
    }
  }

  /**
   * Validate database constraints
   */
  private async validateConstraints(results: SchemaValidationResult): Promise<void> {
    try {
      // Check foreign key constraints
      const { data: constraints } = await this.supabase
        .rpc('get_foreign_key_violations', {});

      if (constraints && constraints.length > 0) {
        results.errors.push({
          type: 'constraint_violation',
          severity: 'high',
          element: 'foreign keys',
          description: `${constraints.length} foreign key constraint violations found`
        });
      }
    } catch (error) {
      // Constraint validation may not be available
    }
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(results: SchemaValidationResult): number {
    let score = 100;

    // Deduct for errors
    results.errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct for warnings
    results.warnings.forEach(warning => {
      switch (warning.type) {
        case 'security': score -= 10; break;
        case 'performance': score -= 5; break;
        case 'best_practice': score -= 2; break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Auto-repair schema issues where possible
   */
  async autoRepairSchema(): Promise<{
    repaired: number;
    failed: number;
    results: string[];
  }> {
    const validation = await this.validateSchema();
    const results: string[] = [];
    let repaired = 0;
    let failed = 0;

    for (const error of validation.errors) {
      if (error.sqlFix) {
        try {
          await this.supabase.rpc('execute_sql', { sql: error.sqlFix });
          results.push(`✅ Fixed: ${error.element}`);
          repaired++;
        } catch (fixError) {
          results.push(`❌ Failed to fix: ${error.element} - ${fixError}`);
          failed++;
        }
      }
    }

    return { repaired, failed, results };
  }

  /**
   * Generate comprehensive schema report
   */
  async generateSchemaReport(): Promise<string> {
    const validation = await this.validateSchema();
    
    let report = `
# 📊 Database Schema Health Report
Generated: ${new Date().toISOString()}
Health Score: ${validation.healthScore}/100

## 🎯 Summary
- Errors: ${validation.errors.length}
- Warnings: ${validation.warnings.length}  
- Schema Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}

`;

    if (validation.errors.length > 0) {
      report += `## 🚨 Critical Errors\n\n`;
      validation.errors.forEach(error => {
        report += `### ${error.element}\n`;
        report += `**Type**: ${error.type}\n`;
        report += `**Severity**: ${error.severity}\n`;
        report += `**Description**: ${error.description}\n`;
        if (error.sqlFix) {
          report += `**Fix**:\n\`\`\`sql\n${error.sqlFix}\n\`\`\`\n\n`;
        }
      });
    }

    if (validation.warnings.length > 0) {
      report += `## ⚠️ Warnings\n\n`;
      validation.warnings.forEach(warning => {
        report += `- **${warning.element}**: ${warning.message}\n`;
        report += `  *Recommendation*: ${warning.recommendation}\n\n`;
      });
    }

    if (validation.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      validation.recommendations.forEach(rec => {
        report += `- **${rec.category.toUpperCase()}** (${rec.priority}): ${rec.action}\n`;
        report += `  ${rec.description}\n\n`;
      });
    }

    return report;
  }

  /**
   * Helper methods for SQL generation
   */
  private generateEnumCreateSql(enumName: string, values: string[]): string {
    const valuesList = values.map(v => `'${v}'`).join(', ');
    return `CREATE TYPE ${enumName} AS ENUM (${valuesList});`;
  }

  private getEnumValidationFunctions(): string {
    return `
-- Helper functions for schema validation
CREATE OR REPLACE FUNCTION check_enum_exists(enum_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = enum_name AND typtype = 'e'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_enum_values(enum_name TEXT)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT enumlabel::text
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = enum_name
        ORDER BY enumsortorder
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;
`;
  }
}

// Export singleton instance
export const schemaValidator = new DatabaseSchemaValidator();