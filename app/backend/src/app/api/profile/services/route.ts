import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { saveProfileServices } from "@/features/profiles/server/profile.service";

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const services = Array.isArray(body.services) ? body.services : [];

    const result = await saveProfileServices({
      clerkUserId: userId,
      services,
    });

    return NextResponse.json({
      success: true,
      services: result.services,
    });
  } catch (error) {
    console.error("[PATCH /api/profile/services]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update services",
      },
      { status: 500 },
    );
  }
}
