import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import { completeOnboarding } from "@/modules/onboarding/onboarding.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  companyName: z.string().min(2).max(120),
  legalName: z.string().max(200).optional().nullable(),
  sector: z.string().max(120).optional().nullable(),
  primaryPhone: z.string().max(40).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const json = await request.json();
    const body = schema.parse(json);

    const result = await completeOnboarding({
      userId: user.id,
      companyName: body.companyName,
      legalName: body.legalName,
      sector: body.sector,
      primaryPhone: body.primaryPhone,
      website: body.website,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Geçersiz istek.", code: "VALIDATION" },
        { status: 400 },
      );
    }
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
