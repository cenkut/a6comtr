import type {
  ButtonStyle,
  CompanyProfileSection,
  CompanyProfileTheme,
  LogoShape,
  ProfileSectionKey,
} from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireCompanyAccess } from "@/modules/authz/access";
import { DEFAULT_SECTIONS } from "@/modules/design/design.constants";

export { DEFAULT_SECTIONS, PRESET_THEMES } from "@/modules/design/design.constants";

export type ThemeDto = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonStyle: ButtonStyle;
  logoShape: LogoShape;
  showCover: boolean;
};

export type SectionDto = {
  key: ProfileSectionKey;
  enabled: boolean;
  sortOrder: number;
};

export async function getDesign(
  userId: string,
  companyId: string,
): Promise<{ theme: ThemeDto; sections: SectionDto[] }> {
  await requireCompanyAccess(userId, companyId, "VIEWER");
  return ensureDesign(companyId);
}

export async function getPublicDesign(companyId: string): Promise<{
  theme: ThemeDto;
  sections: SectionDto[];
}> {
  return ensureDesign(companyId);
}

async function ensureDesign(companyId: string): Promise<{
  theme: ThemeDto;
  sections: SectionDto[];
}> {
  let theme = await db.companyProfileTheme.findUnique({
    where: { companyId },
  });
  if (!theme) {
    theme = await db.companyProfileTheme.create({
      data: { companyId },
    });
  }

  const existing = await db.companyProfileSection.findMany({
    where: { companyId },
  });
  if (existing.length === 0) {
    await db.companyProfileSection.createMany({
      data: DEFAULT_SECTIONS.map((s) => ({
        companyId,
        key: s.key,
        enabled: s.enabled,
        sortOrder: s.sortOrder,
      })),
    });
  } else {
    // Backfill any new section keys.
    const have = new Set(existing.map((s) => s.key));
    const missing = DEFAULT_SECTIONS.filter((s) => !have.has(s.key));
    if (missing.length) {
      await db.companyProfileSection.createMany({
        data: missing.map((s) => ({
          companyId,
          key: s.key,
          enabled: s.enabled,
          sortOrder: s.sortOrder,
        })),
      });
    }
  }

  const sections = await db.companyProfileSection.findMany({
    where: { companyId },
    orderBy: { sortOrder: "asc" },
  });

  return {
    theme: toThemeDto(theme),
    sections: sections.map(toSectionDto),
  };
}

export async function updateTheme(
  userId: string,
  companyId: string,
  patch: Partial<ThemeDto>,
): Promise<ThemeDto> {
  await requireCompanyAccess(userId, companyId, "EDITOR");
  await ensureDesign(companyId);

  if (patch.primaryColor && !isHexColor(patch.primaryColor)) {
    throw new AppError("VALIDATION", "Geçersiz renk kodu.", 400);
  }
  if (patch.backgroundColor && !isHexColor(patch.backgroundColor)) {
    throw new AppError("VALIDATION", "Geçersiz renk kodu.", 400);
  }
  if (patch.textColor && !isHexColor(patch.textColor)) {
    throw new AppError("VALIDATION", "Geçersiz renk kodu.", 400);
  }

  const theme = await db.companyProfileTheme.update({
    where: { companyId },
    data: {
      ...(patch.primaryColor !== undefined
        ? { primaryColor: patch.primaryColor }
        : {}),
      ...(patch.backgroundColor !== undefined
        ? { backgroundColor: patch.backgroundColor }
        : {}),
      ...(patch.textColor !== undefined ? { textColor: patch.textColor } : {}),
      ...(patch.buttonStyle !== undefined
        ? { buttonStyle: patch.buttonStyle }
        : {}),
      ...(patch.logoShape !== undefined ? { logoShape: patch.logoShape } : {}),
      ...(patch.showCover !== undefined ? { showCover: patch.showCover } : {}),
    },
  });
  return toThemeDto(theme);
}

export async function updateSections(
  userId: string,
  companyId: string,
  sections: SectionDto[],
): Promise<SectionDto[]> {
  await requireCompanyAccess(userId, companyId, "EDITOR");
  await ensureDesign(companyId);

  await db.$transaction(
    sections.map((s) =>
      db.companyProfileSection.update({
        where: {
          companyId_key: { companyId, key: s.key },
        },
        data: {
          enabled: s.enabled,
          sortOrder: s.sortOrder,
        },
      }),
    ),
  );

  const rows = await db.companyProfileSection.findMany({
    where: { companyId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toSectionDto);
}

function toThemeDto(theme: CompanyProfileTheme): ThemeDto {
  return {
    primaryColor: theme.primaryColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    buttonStyle: theme.buttonStyle,
    logoShape: theme.logoShape,
    showCover: theme.showCover,
  };
}

function toSectionDto(row: CompanyProfileSection): SectionDto {
  return {
    key: row.key,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
  };
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
