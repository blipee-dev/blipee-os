/**
 * Utility functions for audit logging with error handling
 */

import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  organization_id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Safely insert audit log entry with error handling for RLS policies
 */
export async function safeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      // Log the error but don't throw - audit logging failure shouldn't block operations
      console.error('Failed to store audit event:', error);
    }
  } catch (error) {
    console.error('Failed to store audit events:', error);
    // Continue execution - audit logging failure shouldn't block the operation
  }
}

/**
 * Batch insert multiple audit log entries
 */
export async function batchAuditLog(entries: AuditLogEntry[]): Promise<void> {
  try {
    const supabase = await createClient();
    const timestamp = new Date().toISOString();
    
    const entriesWithTimestamp = entries.map(entry => ({
      ...entry,
      created_at: timestamp,
    }));
    
    const { error } = await supabase
      .from('audit_logs')
      .insert(entriesWithTimestamp);
    
    if (error) {
      console.error('Failed to store batch audit events:', error);
    }
  } catch (error) {
    console.error('Failed to store batch audit events:', error);
  }
}