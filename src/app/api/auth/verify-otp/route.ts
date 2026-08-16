import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { getClientIp, getUserAgent } from "@/lib/request";
import { handleVerifyOtp } from "@/modules/auth/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().min(3).max(254),
  code: z.string().min(6).max(6),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    const { user } = await handleVerifyOtp({
      email: body.email,
      code: body.code,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Doğrulama kodu geçersiz.",
          code: "OTP_INVALID",
        },
        { status: 400 },
      );
    }
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
