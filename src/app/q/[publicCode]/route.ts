import { NextRequest, NextResponse } from "next/server";
import { resolveQrScan } from "@/modules/qr/qr.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ publicCode: string }> };

/**
 * Permanent QR entrypoint.
 * Never exposes company database id in the public URL.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { publicCode } = await ctx.params;
  const result = await resolveQrScan(publicCode);

  if (result.kind === "redirect") {
    const url = new URL(`/c/${result.slug}`, request.url);
    // Preserve optional UTM-like query for future analytics.
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url, 302);
  }

  const statusPath =
    result.kind === "company_suspended"
      ? "/q/status/suspended"
      : result.kind === "company_draft"
        ? "/q/status/draft"
        : result.kind === "disabled"
          ? "/q/status/disabled"
          : "/q/status/not-found";

  return NextResponse.redirect(new URL(statusPath, request.url), 302);
}
