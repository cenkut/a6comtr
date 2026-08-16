import { NextResponse } from "next/server";
import { getCurrentSession } from "@/modules/auth/session.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isPlatformAdmin: session.user.isPlatformAdmin,
    },
  });
}
