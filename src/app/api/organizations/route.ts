import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  createOrganization,
  listOrganizationsForUser,
} from "@/modules/organization/organization.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const organizations = await listOrganizationsForUser(user.id);
    return NextResponse.json({ organizations });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const json = await request.json();
    const body = createSchema.parse(json);
    const organization = await createOrganization({
      userId: user.id,
      name: body.name,
    });
    return NextResponse.json({ organization }, { status: 201 });
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
