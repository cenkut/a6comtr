import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { trackEvent } from "@/modules/analytics/analytics.service";
import { getClientIp, getUserAgent } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

const schema = z.object({
  type: z.enum([
    "PROFILE_VIEW",
    "PHONE_CLICK",
    "WHATSAPP_CLICK",
    "EMAIL_CLICK",
    "WEBSITE_CLICK",
    "DIRECTIONS_CLICK",
    "VCARD_DOWNLOAD",
    "DOCUMENT_CLICK",
    "SOCIAL_CLICK",
  ]),
});

/**
 * Public fire-and-forget analytics endpoint.
 * Does not leak private company data; only accepts events for ACTIVE companies.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const body = schema.parse(await request.json());

    const company = await db.company.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!company || company.status !== "ACTIVE") {
      return NextResponse.json({ ok: true });
    }

    await trackEvent({
      companyId: company.id,
      type: body.type,
      referrer: request.headers.get("referer"),
      userAgent: getUserAgent(request),
      // IP not stored; privacy-first (plan.md §15).
      country: null,
    });

    // Silence unused helper import if tree-shaken differently
    void getClientIp;

    return NextResponse.json({ ok: true });
  } catch {
    // Never break client UX for analytics.
    return NextResponse.json({ ok: true });
  }
}
