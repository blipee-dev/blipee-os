import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if organization_members table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['organization_members', 'user_organizations']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return NextResponse.json({
        error: 'Failed to check tables',
        details: tablesError.message
      }, { status: 500 });
    }

    const tableNames = tables?.map(t => t.table_name) || [];
    const hasOrganizationMembers = tableNames.includes('organization_members');
    const hasUserOrganizations = tableNames.includes('user_organizations');

    // Provide information about the current state
    return NextResponse.json({
      status: 'info',
      tables: {
        organization_members: hasOrganizationMembers,
        user_organizations: hasUserOrganizations
      },
      recommendation: !hasOrganizationMembers && hasUserOrganizations 
        ? 'The database is using the old user_organizations table. Consider migrating to organization_members.'
        : hasOrganizationMembers && !hasUserOrganizations
        ? 'The database is correctly using organization_members table.'
        : hasOrganizationMembers && hasUserOrganizations
        ? 'Both tables exist. Consider removing the deprecated user_organizations table.'
        : 'Neither table exists. Database schema may be incomplete.'
    });
  } catch (error: any) {
    console.error('Error in fix-table-references:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}