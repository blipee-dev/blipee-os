import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const siteId = searchParams.get('siteId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Date range for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch environmental incidents
    let query = supabase
      .from('environmental_incidents')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('incident_date', startDate)
      .lte('incident_date', endDate);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: incidents, error: incidentsError } = await query.order('incident_date', { ascending: false });

    if (incidentsError) {
      console.error('Error fetching environmental incidents:', incidentsError);
      return NextResponse.json(
        { error: 'Failed to fetch incidents data' },
        { status: 500 }
      );
    }

    // Calculate totals
    let totalFines = 0;
    let totalIncidents = incidents?.length || 0;
    let significantFines = 0;
    let nonMonetarySanctions = 0;

    const incidentsByType: { [key: string]: number } = {};
    const incidentsBySeverity: { [key: string]: number } = {};
    const incidentsByStatus: { [key: string]: number } = {};

    incidents?.forEach((incident) => {
      // Count by type
      incidentsByType[incident.incident_type] = (incidentsByType[incident.incident_type] || 0) + 1;

      // Count by severity
      if (incident.severity) {
        incidentsBySeverity[incident.severity] = (incidentsBySeverity[incident.severity] || 0) + 1;
      }

      // Count by status
      incidentsByStatus[incident.status] = (incidentsByStatus[incident.status] || 0) + 1;

      // Calculate fines
      if (incident.fine_amount) {
        const fineAmount = parseFloat(incident.fine_amount);
        totalFines += fineAmount;

        // GRI considers fines above 10,000 as significant
        if (fineAmount >= 10000) {
          significantFines++;
        }
      }

      // Count non-monetary sanctions
      if (['sanction', 'warning', 'notice'].includes(incident.incident_type) && !incident.fine_amount) {
        nonMonetarySanctions++;
      }
    });

    return NextResponse.json({
      year,
      organizationId,
      siteId,

      // GRI 307-1: Non-compliance with environmental laws and regulations
      totalIncidents,
      totalFines,
      significantFines,
      nonMonetarySanctions,

      // Breakdowns
      incidentsByType,
      incidentsBySeverity,
      incidentsByStatus,

      // Detailed incidents list
      incidents: incidents?.map((incident) => ({
        id: incident.id,
        date: incident.incident_date,
        type: incident.incident_type,
        severity: incident.severity,
        status: incident.status,
        description: incident.incident_description,
        fineAmount: incident.fine_amount,
        currency: incident.currency,
        regulatoryBody: incident.regulatory_body,
        regulationViolated: incident.regulation_violated,
        correctiveActions: incident.corrective_actions,
        resolutionDate: incident.resolution_date,
      })) || [],

      // Methodology
      methodology: {
        boundaries: siteId ? 'Site-specific data' : 'Organization-wide data',
        reportingPeriod: `${year}-01-01 to ${year}-12-31`,
        standards: 'GRI 307: Environmental Compliance 2016',
        significantFineThreshold: '€10,000 or equivalent',
      },
    });
  } catch (error) {
    console.error('Error in GRI 307 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
