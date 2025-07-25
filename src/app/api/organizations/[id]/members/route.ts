import { NextRequest, NextResponse } from "next/server";
import { organizationService } from "@/lib/organizations/service";
import { authService } from "@/lib/auth/service";
import { z } from "zod";
import type { UserRole } from "@/types/auth";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.string(),
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

    const members = await organizationService.getOrganizationMembers(params.id);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get members" },
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
    if (!authService.hasPermission(session, "users", "invite")) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = inviteUserSchema.parse(body);

    const member = await organizationService.inviteUser(
      params.id,
      validated.email,
      validated.role as UserRole,
      session.user.id,
    );

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Invite user error:", error);

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
      { success: false, error: error.message || "Failed to invite user" },
      { status: 500 },
    );
  }
}
