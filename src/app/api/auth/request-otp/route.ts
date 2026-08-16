import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { getClientIp, getUserAgent } from "@/lib/request";
import { handleRequestOtp } from "@/modules/auth/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().min(3).max(254),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    const result = await handleRequestOtp({
      email: body.email,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      ok: true,
      message: "Doğrulama kodu e-posta adresinize gönderildi.",
      expiresInSeconds: result.expiresInSeconds,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Geçerli bir e-posta adresi girin.",
          code: "EMAIL_INVALID",
        },
        { status: 400 },
      );
    }
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
