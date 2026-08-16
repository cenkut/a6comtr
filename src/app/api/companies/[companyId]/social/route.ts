import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  createSocialLink,
  listSocialLinks,
} from "@/modules/company/social.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

const platforms = [
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "X",
  "YOUTUBE",
  "TIKTOK",
  "OTHER",
] as const;

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const socialLinks = await listSocialLinks(user.id, companyId);
    return NextResponse.json({ socialLinks });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const createSchema = z.object({
  platform: z.enum(platforms).optional(),
  label: z.string().max(120).optional().nullable(),
  url: z.string().min(1).max(500),
  isVisible: z.boolean().optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const body = createSchema.parse(await req.json());
    const socialLink = await createSocialLink(user.id, companyId, body);
    return NextResponse.json({ socialLink }, { status: 201 });
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
