import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "@/lib/organizations/service";
import { authService } from "@/lib/auth/service";

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, _error: "Not authenticated" },
        { status: 401 },
      );
    }

    const organization = await organizationService.getOrganization(params.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, _error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, _error: errorerror.message || "Failed to get organization" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, _error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Check permissions
    if (!authService.hasPermission(session, "organization", "edit")) {
      return NextResponse.json(
        { success: false, _error: "Insufficient permissions" },
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
    console.error('Error:', error);
    return NextResponse.json(
      {
        success: false,
        _error: errorerror.message || "Failed to update organization",
      },
      { status: 500 },
    );
  }
}
