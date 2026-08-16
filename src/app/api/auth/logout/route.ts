import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { handleLogout } from "@/modules/auth/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await handleLogout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
