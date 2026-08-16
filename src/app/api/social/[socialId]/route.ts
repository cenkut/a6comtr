import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  deleteSocialLink,
  updateSocialLink,
} from "@/modules/company/social.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ socialId: string }> };

const platforms = [
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "X",
  "YOUTUBE",
  "TIKTOK",
  "OTHER",
] as const;

const updateSchema = z.object({
  platform: z.enum(platforms).optional(),
  label: z.string().max(120).optional().nullable(),
  url: z.string().min(1).max(500).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { socialId } = await ctx.params;
    const body = updateSchema.parse(await req.json());
    const socialLink = await updateSocialLink(user.id, socialId, body);
    return NextResponse.json({ socialLink });
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
    const { socialId } = await ctx.params;
    await deleteSocialLink(user.id, socialId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
