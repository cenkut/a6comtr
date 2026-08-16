import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  createLocation,
  listLocations,
} from "@/modules/company/location.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

const locationTypes = [
  "HEADQUARTERS",
  "BRANCH",
  "STORE",
  "WAREHOUSE",
  "FACTORY",
  "SERVICE",
  "OTHER",
] as const;

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const locations = await listLocations(user.id, companyId);
    return NextResponse.json({ locations });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const createSchema = z.object({
  type: z.enum(locationTypes).optional(),
  name: z.string().min(1).max(120),
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
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const body = createSchema.parse(await req.json());
    const location = await createLocation(user.id, companyId, body);
    return NextResponse.json({ location }, { status: 201 });
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
