import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  requirePlatformAdmin,
  setCompanyStatus,
} from "@/modules/admin/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"]),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    await requirePlatformAdmin(user);
    const { companyId } = await ctx.params;
    const body = schema.parse(await req.json());
    const company = await setCompanyStatus({
      actorUserId: user.id,
      companyId,
      status: body.status,
    });
    return NextResponse.json({ company });
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
