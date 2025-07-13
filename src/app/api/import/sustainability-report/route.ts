import { NextRequest, NextResponse } from "next/server";
import {
  importSustainabilityReport,
  generateMonthlyBreakdown,
} from "@/lib/sustainability/import-report-data";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;
    const _userId = formData.get("userId") as string;
    const generateMonthly = formData.get("generateMonthly") === "true";

    if (!file || !organizationId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Import the report data
    const result = await importSustainabilityReport(
      file,
      organizationId,
      userId,
    );

    // Optionally generate monthly breakdown
    if (generateMonthly && result.data.report_year) {
      const monthlyData = await generateMonthlyBreakdown(
        organizationId,
        result.data,
        result.data.report_year,
      );
      (result.inserted as any).monthly = monthlyData;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported sustainability report for ${result.data.company_name || "your organization"}`,
      summary: {
        year: result.data.report_year,
        emissions: {
          scope1: result.data.scope1_emissions,
          scope2: result.data.scope2_emissions,
          scope3: result.data.scope3_emissions,
          total:
            (result.data.scope1_emissions || 0) +
            (result.data.scope2_emissions || 0) +
            (result.data.scope3_emissions || 0),
        },
        metrics: {
          energy: result.data.energy_consumption,
          renewable: result.data.renewable_energy_percentage,
          water: result.data.water_consumption,
          waste_diversion: result.data.waste_diverted_percentage,
        },
        inserted: result.inserted,
      },
    });
  } catch (error: any) {
    console.error("Error importing report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import report" },
      { status: 500 },
    );
  }
}
