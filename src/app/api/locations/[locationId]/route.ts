import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  deleteLocation,
  updateLocation,
} from "@/modules/company/location.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ locationId: string }> };

const locationTypes = [
  "HEADQUARTERS",
  "BRANCH",
  "STORE",
  "WAREHOUSE",
  "FACTORY",
  "SERVICE",
  "OTHER",
] as const;

const updateSchema = z.object({
  type: z.enum(locationTypes).optional(),
  name: z.string().min(1).max(120).optional(),
  addressLine: z.string().max(500).optional().nullable(),
  district: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(2).optional(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(254).optional().nullable(),
  contactPersonName: z.string().max(120).optional().nullable(),
  contactPersonPhone: z.string().max(40).optional().nullable(),
  workingHours: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { locationId } = await ctx.params;
    const body = updateSchema.parse(await req.json());
    const location = await updateLocation(user.id, locationId, body);
    return NextResponse.json({ location });
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
    const { locationId } = await ctx.params;
    await deleteLocation(user.id, locationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
