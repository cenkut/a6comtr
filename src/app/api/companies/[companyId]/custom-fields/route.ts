import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  createCustomField,
  listCustomFields,
} from "@/modules/company/custom-field.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

const types = ["TEXT", "PHONE", "EMAIL", "URL", "NUMBER", "DATE"] as const;

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const customFields = await listCustomFields(user.id, companyId);
    return NextResponse.json({ customFields });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const createSchema = z.object({
  section: z.string().max(80).optional(),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(2000),
  type: z.enum(types).optional(),
  isVisible: z.boolean().optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const body = createSchema.parse(await req.json());
    const customField = await createCustomField(user.id, companyId, body);
    return NextResponse.json({ customField }, { status: 201 });
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
