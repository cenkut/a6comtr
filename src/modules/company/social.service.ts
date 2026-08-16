import type { Prisma, SocialLink, SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireCompanyAccess } from "@/modules/authz/access";

export type SocialLinkDto = {
  id: string;
  companyId: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  sortOrder: number;
  isVisible: boolean;
};

export function toSocialDto(row: SocialLink): SocialLinkDto {
  return {
    id: row.id,
    companyId: row.companyId,
    platform: row.platform,
    label: row.label,
    url: row.url,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

export async function listSocialLinks(
  userId: string,
  companyId: string,
): Promise<SocialLinkDto[]> {
  await requireCompanyAccess(userId, companyId, "VIEWER");
  const rows = await db.socialLink.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toSocialDto);
}

export async function createSocialLink(
  userId: string,
  companyId: string,
  input: {
    platform?: SocialPlatform;
    label?: string | null;
    url: string;
    isVisible?: boolean;
  },
): Promise<SocialLinkDto> {
  await requireCompanyAccess(userId, companyId, "EDITOR");
  const url = normalizeHttpUrl(input.url);

  const maxSort = await db.socialLink.aggregate({
    where: { companyId },
    _max: { sortOrder: true },
  });

  const row = await db.socialLink.create({
    data: {
      companyId,
      platform: input.platform ?? "OTHER",
      label: emptyToNull(input.label),
      url,
      isVisible: input.isVisible ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return toSocialDto(row);
}

export async function updateSocialLink(
  userId: string,
  socialId: string,
  patch: Partial<{
    platform: SocialPlatform;
    label: string | null;
    url: string;
    isVisible: boolean;
    sortOrder: number;
  }>,
): Promise<SocialLinkDto> {
  const existing = await db.socialLink.findUnique({ where: { id: socialId } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");

  const data: Prisma.SocialLinkUpdateInput = {};
  if (patch.platform !== undefined) data.platform = patch.platform;
  if (patch.label !== undefined) data.label = emptyToNull(patch.label);
  if (patch.url !== undefined) data.url = normalizeHttpUrl(patch.url);
  if (patch.isVisible !== undefined) data.isVisible = patch.isVisible;
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder;

  const row = await db.socialLink.update({ where: { id: socialId }, data });
  return toSocialDto(row);
}

export async function deleteSocialLink(
  userId: string,
  socialId: string,
): Promise<void> {
  const existing = await db.socialLink.findUnique({ where: { id: socialId } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");
  await db.socialLink.delete({ where: { id: socialId } });
}

function emptyToNull(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

function normalizeHttpUrl(value: string): string {
  let url = value.trim();
  if (!url) throw new AppError("VALIDATION", "URL gerekli.", 400);
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad");
    }
    return parsed.toString();
  } catch {
    throw new AppError("VALIDATION", "Geçerli bir URL girin.", 400);
  }
}
