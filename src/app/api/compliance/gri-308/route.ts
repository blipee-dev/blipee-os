import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Fetch all suppliers for the organization
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('supplier_name');

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalSuppliers = suppliers?.length || 0;
    const activeSuppliers = suppliers?.filter(s => s.supplier_status === 'active').length || 0;

    // GRI 308-1: New suppliers screened
    const suppliersScreened = suppliers?.filter(s => s.environmental_screening_completed).length || 0;
    const screeningRate = totalSuppliers > 0 ? (suppliersScreened / totalSuppliers) * 100 : 0;

    // Filter suppliers by screening year
    const suppliersScreenedThisYear = suppliers?.filter(s => {
      if (!s.screening_date) return false;
      const screeningYear = new Date(s.screening_date).getFullYear();
      return screeningYear === year && s.environmental_screening_completed;
    }).length || 0;

    // GRI 308-2: Suppliers with negative impacts
    const suppliersWithImpacts = suppliers?.filter(s => s.negative_impacts_identified).length || 0;
    const suppliersWithAssessments = suppliers?.filter(s => s.environmental_assessment_completed).length || 0;

    // Improvement plans
    const suppliersWithImprovementPlans = suppliers?.filter(s => s.improvement_plan_agreed).length || 0;
    const improvementsImplemented = suppliers?.filter(s => s.improvements_implemented).length || 0;

    // Risk levels
    const suppliersByRisk: { [key: string]: number } = {};
    suppliers?.forEach(s => {
      if (s.risk_level) {
        suppliersByRisk[s.risk_level] = (suppliersByRisk[s.risk_level] || 0) + 1;
      }
    });

    // Certifications
    const iso14001Certified = suppliers?.filter(s => s.iso14001_certified).length || 0;

    // Relationships terminated due to impacts
    const relationshipsTerminated = suppliers?.filter(s =>
      s.supplier_status === 'terminated' && s.negative_impacts_identified
    ).length || 0;

    return NextResponse.json({
      year,
      organizationId,

      // Overview
      totalSuppliers,
      activeSuppliers,

      // GRI 308-1: New suppliers screened
      suppliersScreened,
      suppliersScreenedThisYear,
      screeningRate,

      // GRI 308-2: Negative impacts in supply chain
      suppliersWithAssessments,
      suppliersWithImpacts,
      suppliersWithImprovementPlans,
      improvementsImplemented,
      relationshipsTerminated,

      // Breakdowns
      suppliersByRisk,
      iso14001Certified,
      certificationRate: totalSuppliers > 0 ? (iso14001Certified / totalSuppliers) * 100 : 0,

      // Detailed supplier data
      suppliers: suppliers?.map(s => ({
        id: s.id,
        name: s.supplier_name,
        code: s.supplier_code,
        country: s.country,
        sector: s.industry_sector,
        status: s.supplier_status,
        screeningCompleted: s.environmental_screening_completed,
        screeningDate: s.screening_date,
        assessmentCompleted: s.environmental_assessment_completed,
        assessmentDate: s.assessment_date,
        assessmentScore: s.assessment_score,
        negativeImpacts: s.negative_impacts_identified,
        impactsDescription: s.impacts_description,
        riskLevel: s.risk_level,
        improvementPlan: s.improvement_plan_agreed,
        improvementsImplemented: s.improvements_implemented,
        iso14001: s.iso14001_certified,
        annualSpend: s.annual_spend,
      })) || [],

      // Methodology
      methodology: {
        reportingPeriod: `${year}-01-01 to ${year}-12-31`,
        standards: 'GRI 308: Supplier Environmental Assessment 2016',
        screeningCriteria: 'Environmental management systems, compliance history, certifications, impact assessments',
        assessmentApproach: 'Risk-based assessment prioritizing high-spend and high-risk suppliers',
      },
    });
  } catch (error) {
    console.error('Error in GRI 308 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
