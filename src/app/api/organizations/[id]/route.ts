import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "@/lib/organizations/service";
import { authService } from "@/lib/auth/service";

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

    const organization = await organizationService.getOrganization(params.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get organization" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    if (!authService.hasPermission(session, "organization", "edit")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const organization = await organizationService.updateOrganization(
      params.id,
      body,
    );

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("Update organization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update organization",
      },
      { status: 500 },
    );
  }
}
