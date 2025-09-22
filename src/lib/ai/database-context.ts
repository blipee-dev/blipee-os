/**
 * Database Context Service
 * Fetches real data from the database for AI context
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface OrganizationContext {
  organization: any;
  sites: any[];
  devices: any[];
  users: any[];
  emissions: any[];
  targets: any[];
  reports: any[];
}

export class DatabaseContextService {
  /**
   * Get complete organization context for a user
   */
  static async getUserOrganizationContext(userId: string): Promise<OrganizationContext | null> {
    try {
      // First get user's organization
      const { data: userOrg } = await supabaseAdmin
        .from('app_users')
        .select('organization_id, role')
        .eq('auth_user_id', userId)
        .single();

      if (!userOrg?.organization_id) {
        // Check organization_members table
        const { data: member } = await supabaseAdmin
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', userId)
          .single();

        if (!member?.organization_id) {
          return null;
        }
        userOrg.organization_id = member.organization_id;
      }

      const orgId = userOrg.organization_id;

      // Fetch all related data in parallel
      const [
        orgData,
        sitesData,
        devicesData,
        usersData,
        emissionsData,
        targetsData,
        reportsData
      ] = await Promise.all([
        // Organization details
        supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single(),

        // Sites
        supabaseAdmin
          .from('sites')
          .select('*')
          .eq('organization_id', orgId)
          .order('name'),

        // Devices
        supabaseAdmin
          .from('devices')
          .select(`
            *,
            sites!inner(organization_id)
          `)
          .eq('sites.organization_id', orgId)
          .order('name'),

        // Users in organization
        supabaseAdmin
          .from('organization_members')
          .select(`
            *,
            users:user_id(
              id,
              email,
              name
            )
          `)
          .eq('organization_id', orgId),

        // Recent emissions data
        supabaseAdmin
          .from('emissions')
          .select('*')
          .eq('organization_id', orgId)
          .order('date', { ascending: false })
          .limit(100),

        // Targets
        supabaseAdmin
          .from('targets')
          .select('*')
          .eq('organization_id', orgId)
          .order('target_year'),

        // Recent reports
        supabaseAdmin
          .from('reports')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      return {
        organization: orgData.data,
        sites: sitesData.data || [],
        devices: devicesData.data || [],
        users: usersData.data || [],
        emissions: emissionsData.data || [],
        targets: targetsData.data || [],
        reports: reportsData.data || []
      };
    } catch (error) {
      console.error('Error fetching organization context:', error);
      return null;
    }
  }

  /**
   * Get all organizations (for super admin)
   */
  static async getAllOrganizations(): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(`
          *,
          sites:sites(count),
          members:organization_members(count)
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all organizations:', error);
      return [];
    }
  }

  /**
   * Get specific site details with devices
   */
  static async getSiteContext(siteId: string): Promise<any> {
    try {
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select(`
          *,
          devices:devices(*),
          emissions:emissions(*)
        `)
        .eq('id', siteId)
        .single();

      return site;
    } catch (error) {
      console.error('Error fetching site context:', error);
      return null;
    }
  }

  /**
   * Get device details with telemetry
   */
  static async getDeviceContext(deviceId: string): Promise<any> {
    try {
      const { data: device } = await supabaseAdmin
        .from('devices')
        .select(`
          *,
          telemetry:device_telemetry(*)
        `)
        .eq('id', deviceId)
        .single();

      return device;
    } catch (error) {
      console.error('Error fetching device context:', error);
      return null;
    }
  }

  /**
   * Get emissions summary for organization
   */
  static async getEmissionsSummary(orgId: string): Promise<any> {
    try {
      // Get current month emissions
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

      const [currentEmissions, lastMonthEmissions, yearlyEmissions] = await Promise.all([
        // Current month
        supabaseAdmin
          .from('emissions')
          .select('scope, amount')
          .eq('organization_id', orgId)
          .gte('date', `${currentMonth}-01`)
          .lte('date', `${currentMonth}-31`),

        // Last month
        supabaseAdmin
          .from('emissions')
          .select('scope, amount')
          .eq('organization_id', orgId)
          .gte('date', `${lastMonth}-01`)
          .lte('date', `${lastMonth}-31`),

        // Year to date
        supabaseAdmin
          .from('emissions')
          .select('scope, amount')
          .eq('organization_id', orgId)
          .gte('date', `${new Date().getFullYear()}-01-01`)
      ]);

      // Calculate totals
      const calculateTotal = (data: any[]) => {
        return data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      };

      const calculateByScope = (data: any[]) => {
        const scopes = { scope1: 0, scope2: 0, scope3: 0 };
        data?.forEach(item => {
          if (item.scope === 1) scopes.scope1 += item.amount || 0;
          if (item.scope === 2) scopes.scope2 += item.amount || 0;
          if (item.scope === 3) scopes.scope3 += item.amount || 0;
        });
        return scopes;
      };

      return {
        currentMonth: {
          total: calculateTotal(currentEmissions.data || []),
          byScope: calculateByScope(currentEmissions.data || [])
        },
        lastMonth: {
          total: calculateTotal(lastMonthEmissions.data || []),
          byScope: calculateByScope(lastMonthEmissions.data || [])
        },
        yearToDate: {
          total: calculateTotal(yearlyEmissions.data || []),
          byScope: calculateByScope(yearlyEmissions.data || [])
        },
        trend: currentEmissions.data && lastMonthEmissions.data
          ? ((calculateTotal(currentEmissions.data) - calculateTotal(lastMonthEmissions.data)) / calculateTotal(lastMonthEmissions.data) * 100).toFixed(1)
          : 0
      };
    } catch (error) {
      console.error('Error fetching emissions summary:', error);
      return null;
    }
  }

  /**
   * Get compliance status
   */
  static async getComplianceStatus(orgId: string): Promise<any> {
    try {
      const { data } = await supabaseAdmin
        .from('compliance_frameworks')
        .select('*')
        .eq('organization_id', orgId);

      return {
        frameworks: data || [],
        compliant: data?.filter(f => f.status === 'compliant').length || 0,
        inProgress: data?.filter(f => f.status === 'in_progress').length || 0,
        nonCompliant: data?.filter(f => f.status === 'non_compliant').length || 0
      };
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      return null;
    }
  }
}