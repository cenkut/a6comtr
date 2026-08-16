import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  getCompanyForUser,
  updateCompany,
} from "@/modules/company/company.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { companyId } = await context.params;
    const company = await getCompanyForUser(user.id, companyId);
    return NextResponse.json({ company });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  legalName: z.string().max(200).optional().nullable(),
  shortDescription: z.string().max(280).optional().nullable(),
  about: z.string().max(5000).optional().nullable(),
  sector: z.string().max(120).optional().nullable(),
  foundedYear: z.number().int().optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  primaryEmail: z.string().max(254).optional().nullable(),
  primaryPhone: z.string().max(40).optional().nullable(),
  whatsappPhone: z.string().max(40).optional().nullable(),
  taxOffice: z.string().max(120).optional().nullable(),
  taxNumber: z.string().max(40).optional().nullable(),
  mersisNumber: z.string().max(40).optional().nullable(),
  tradeRegistryNumber: z.string().max(40).optional().nullable(),
  taxNumberVisible: z.boolean().optional(),
  mersisVisible: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { companyId } = await context.params;
    const json = await request.json();
    const body = updateSchema.parse(json);
    const company = await updateCompany(user.id, companyId, body);
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
