import { NextRequest, NextResponse } from "next/server";
import {
  buildVCard,
  getPublicProfileBySlug,
} from "@/modules/company/public-profile.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const result = await getPublicProfileBySlug(slug);

  if (result.kind !== "ok") {
    const message =
      result.kind === "draft"
        ? "Şirket kartı henüz yayınlanmamış."
        : result.kind === "suspended"
          ? "Şirket kartı geçici olarak pasif."
          : "Şirket kartı bulunamadı.";
    return NextResponse.json(
      { error: message, code: result.kind.toUpperCase() },
      { status: result.kind === "suspended" ? 403 : 404 },
    );
  }

  const vcard = buildVCard(result.profile);
  const filename = `${result.profile.slug}.vcf`;

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
