import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  deleteCustomField,
  updateCustomField,
} from "@/modules/company/custom-field.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ fieldId: string }> };

const types = ["TEXT", "PHONE", "EMAIL", "URL", "NUMBER", "DATE"] as const;

const updateSchema = z.object({
  section: z.string().max(80).optional(),
  label: z.string().min(1).max(120).optional(),
  value: z.string().min(1).max(2000).optional(),
  type: z.enum(types).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { fieldId } = await ctx.params;
    const body = updateSchema.parse(await req.json());
    const customField = await updateCustomField(user.id, fieldId, body);
    return NextResponse.json({ customField });
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

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { fieldId } = await ctx.params;
    await deleteCustomField(user.id, fieldId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
