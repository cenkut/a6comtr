import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  createCompany,
  listCompaniesForOrganization,
} from "@/modules/company/company.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { organizationId } = await context.params;
    const companies = await listCompaniesForOrganization(
      user.id,
      organizationId,
    );
    return NextResponse.json({ companies });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  legalName: z.string().max(200).optional().nullable(),
  sector: z.string().max(120).optional().nullable(),
  primaryPhone: z.string().max(40).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { organizationId } = await context.params;
    const json = await request.json();
    const body = createSchema.parse(json);

    const company = await createCompany({
      userId: user.id,
      organizationId,
      name: body.name,
      legalName: body.legalName,
      sector: body.sector,
      primaryPhone: body.primaryPhone,
      website: body.website,
    });

    return NextResponse.json({ company }, { status: 201 });
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
