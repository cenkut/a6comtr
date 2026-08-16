import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import { publishCompany } from "@/modules/company/company.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const company = await publishCompany(user.id, companyId);
    return NextResponse.json({ company });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
