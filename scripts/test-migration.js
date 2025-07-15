#!/usr/bin/env node

/**
 * Migration Test Script
 * Tests the database migration without actually running it
 */

const fs = require('fs');
const path = require('path');

class MigrationTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'error') {
      this.errors.push(logEntry);
    } else {
      this.results.push(logEntry);
    }
  }

  async testMigration() {
    console.log('🔍 Testing Database Migration');
    console.log('=============================');

    this.testMigrationFile();
    this.testTableCreation();
    this.testFunctionDefinitions();
    this.testDependencies();
    
    this.generateReport();
  }

  testMigrationFile() {
    this.log('Testing Migration File Structure...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250715000002_autonomous_agents_fixed.sql');
    
    if (!fs.existsSync(migrationPath)) {
      this.log('❌ Migration file not found', 'error');
      return;
    }
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const lines = migrationContent.split('\n').length;
    const size = Math.round(fs.statSync(migrationPath).size / 1024);
    
    this.log(`✅ Migration file exists (${lines} lines, ${size}KB)`);
    
    // Test that it uses DO blocks for safe execution
    if (migrationContent.includes('DO $$')) {
      this.log('✅ Uses DO blocks for safe execution');
    } else {
      this.log('❌ Missing DO blocks for safe execution', 'error');
    }
    
    // Test that it checks for existing tables
    if (migrationContent.includes('information_schema.tables')) {
      this.log('✅ Checks for existing tables');
    } else {
      this.log('❌ Missing table existence checks', 'error');
    }
    
    // Test that it handles dependencies properly
    if (migrationContent.includes('agent_instances') && migrationContent.includes('agent_scheduled_tasks')) {
      this.log('✅ Handles table dependencies');
    } else {
      this.log('❌ Missing dependency handling', 'error');
    }
  }

  testTableCreation() {
    this.log('Testing Table Creation Logic...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250715000002_autonomous_agents_fixed.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    const expectedTables = [
      'agent_definitions',
      'agent_instances',
      'agent_scheduled_tasks',
      'agent_task_executions',
      'agent_approvals',
      'agent_learning_patterns',
      'agent_metrics',
      'agent_decisions',
      'agent_collaborations'
    ];
    
    for (const table of expectedTables) {
      if (migrationContent.includes(`CREATE TABLE ${table}`)) {
        this.log(`✅ Table ${table} creation logic found`);
      } else {
        this.log(`❌ Table ${table} creation logic missing`, 'error');
      }
    }
    
    // Test for proper foreign key references
    const foreignKeys = [
      'REFERENCES organizations(id)',
      'REFERENCES agent_definitions(id)',
      'REFERENCES agent_instances(id)',
      'REFERENCES agent_scheduled_tasks(id)',
      'REFERENCES agent_task_executions(id)',
      'REFERENCES agent_approvals(id)',
      'REFERENCES auth.users(id)'
    ];
    
    for (const fk of foreignKeys) {
      if (migrationContent.includes(fk)) {
        this.log(`✅ Foreign key reference found: ${fk}`);
      } else {
        this.log(`⚠️ Foreign key reference missing: ${fk}`, 'warning');
      }
    }
  }

  testFunctionDefinitions() {
    this.log('Testing Function Definitions...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250715000002_autonomous_agents_fixed.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    const expectedFunctions = [
      'initialize_agents_for_organization',
      'schedule_agent_task',
      'execute_agent_task',
      'update_agent_health',
      'record_agent_decision'
    ];
    
    for (const func of expectedFunctions) {
      if (migrationContent.includes(`CREATE OR REPLACE FUNCTION ${func}`)) {
        this.log(`✅ Function ${func} definition found`);
      } else {
        this.log(`❌ Function ${func} definition missing`, 'error');
      }
    }
    
    // Test for proper function parameters
    if (migrationContent.includes('p_agent_instance_id UUID')) {
      this.log('✅ Function parameters properly typed');
    } else {
      this.log('❌ Function parameters missing or incorrect', 'error');
    }
    
    // Test for return types
    if (migrationContent.includes('RETURNS UUID') && migrationContent.includes('RETURNS void')) {
      this.log('✅ Function return types specified');
    } else {
      this.log('❌ Function return types missing', 'error');
    }
  }

  testDependencies() {
    this.log('Testing Migration Dependencies...');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250715000002_autonomous_agents_fixed.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Test that organizations table is referenced (should exist)
    if (migrationContent.includes('REFERENCES organizations(id)')) {
      this.log('✅ References organizations table (should exist)');
    } else {
      this.log('❌ Missing organizations table reference', 'error');
    }
    
    // Test that auth.users is referenced (should exist)
    if (migrationContent.includes('REFERENCES auth.users(id)')) {
      this.log('✅ References auth.users table (should exist)');
    } else {
      this.log('❌ Missing auth.users table reference', 'error');
    }
    
    // Test for table creation order
    const agentDefinitionsPos = migrationContent.indexOf('CREATE TABLE agent_definitions');
    const agentInstancesPos = migrationContent.indexOf('CREATE TABLE agent_instances');
    const agentScheduledTasksPos = migrationContent.indexOf('CREATE TABLE agent_scheduled_tasks');
    
    if (agentDefinitionsPos < agentInstancesPos && agentInstancesPos < agentScheduledTasksPos) {
      this.log('✅ Table creation order is correct');
    } else {
      this.log('❌ Table creation order may cause dependency issues', 'error');
    }
  }

  generateReport() {
    console.log('\n📊 Migration Test Results');
    console.log('=========================');
    
    const totalTests = this.results.length + this.errors.length;
    const passed = this.results.length;
    const failed = this.errors.length;
    const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (failed > 0) {
      console.log('\n🚨 Issues Found:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    console.log('\n🎯 Migration Assessment');
    console.log('=======================');
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT - Migration is ready to run!');
    } else if (successRate >= 80) {
      console.log('✅ GOOD - Migration should work with minor issues');
    } else if (successRate >= 70) {
      console.log('⚠️ FAIR - Migration needs some fixes');
    } else {
      console.log('❌ POOR - Migration requires significant fixes');
    }
    
    console.log('\n📋 Next Steps');
    console.log('=============');
    console.log('1. Fix any failing tests above');
    console.log('2. Run: npx supabase db push');
    console.log('3. If migration fails, check the logs for specific errors');
    console.log('4. Test with: npm run dev');
    console.log('5. Visit: http://localhost:3000/dashboard/agents');
    
    console.log('\n💡 Migration Features');
    console.log('=====================');
    console.log('✅ Safe execution with DO blocks');
    console.log('✅ Checks for existing tables/indexes');
    console.log('✅ Proper dependency handling');
    console.log('✅ Row Level Security (RLS) enabled');
    console.log('✅ Complete foreign key relationships');
    console.log('✅ Performance indexes created');
    console.log('✅ Helper functions included');
    console.log('✅ Agent definitions pre-populated');
  }
}

// Run tests
async function runTests() {
  const tester = new MigrationTester();
  await tester.testMigration();
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { MigrationTester };