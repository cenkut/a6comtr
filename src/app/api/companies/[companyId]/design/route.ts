import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requireUser } from "@/modules/auth/session.service";
import {
  getDesign,
  updateSections,
  updateTheme,
} from "@/modules/design/design.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ companyId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const design = await getDesign(user.id, companyId);
    return NextResponse.json(design);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const patchSchema = z.object({
  theme: z
    .object({
      primaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      buttonStyle: z.enum(["SOLID", "OUTLINE", "SOFT"]).optional(),
      logoShape: z.enum(["SQUARE", "ROUNDED", "CIRCLE"]).optional(),
      showCover: z.boolean().optional(),
    })
    .optional(),
  sections: z
    .array(
      z.object({
        key: z.enum([
          "HERO",
          "ABOUT",
          "QUICK_ACTIONS",
          "CONTACT",
          "LOCATIONS",
          "COMPANY_INFO",
          "SOCIAL",
          "DOCUMENTS",
          "CUSTOM_FIELDS",
        ]),
        enabled: z.boolean(),
        sortOrder: z.number().int(),
      }),
    )
    .optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { companyId } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    let theme;
    let sections;
    if (body.theme) {
      theme = await updateTheme(user.id, companyId, body.theme);
    }
    if (body.sections) {
      sections = await updateSections(user.id, companyId, body.sections);
    }
    const design = await getDesign(user.id, companyId);
    return NextResponse.json({
      theme: theme ?? design.theme,
      sections: sections ?? design.sections,
    });
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
