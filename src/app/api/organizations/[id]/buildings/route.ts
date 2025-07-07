import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "@/lib/organizations/service";
import { authService } from "@/lib/auth/service";
import { z } from "zod";

const createBuildingSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  size_sqft: z.number().optional(),
  floors: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const buildings = await organizationService.getOrganizationBuildings(
      params.id,
    );

    return NextResponse.json({
      success: true,
      data: buildings,
    });
  } catch (error: any) {
    console.error("Get buildings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get buildings" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Check permissions
    if (!authService.hasPermission(session, "buildings", "create")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = createBuildingSchema.parse(body);

    const building = await organizationService.createBuilding(
      params.id,
      validated,
    );

    return NextResponse.json({
      success: true,
      data: building,
    });
  } catch (error: any) {
    console.error("Create building error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create building" },
      { status: 500 },
    );
  }
}
