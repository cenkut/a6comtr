import type { Company, CompanyStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify, withUniqueSuffix } from "@/lib/slug";
import { requireCompanyAccess, requireOrganizationAccess } from "@/modules/authz/access";
import { randomBytes } from "node:crypto";

/** Admin/dashboard DTO — may include private fields. */
export type CompanyAdminDto = {
  id: string;
  organizationId: string;
  name: string;
  legalName: string | null;
  slug: string;
  shortDescription: string | null;
  about: string | null;
  sector: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  whatsappPhone: string | null;
  taxOffice: string | null;
  taxNumber: string | null;
  mersisNumber: string | null;
  tradeRegistryNumber: string | null;
  status: CompanyStatus;
  publishedAt: Date | null;
  taxNumberVisible: boolean;
  mersisVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toCompanyAdminDto(company: Company): CompanyAdminDto {
  return {
    id: company.id,
    organizationId: company.organizationId,
    name: company.name,
    legalName: company.legalName,
    slug: company.slug,
    shortDescription: company.shortDescription,
    about: company.about,
    sector: company.sector,
    foundedYear: company.foundedYear,
    logoUrl: company.logoUrl,
    coverUrl: company.coverUrl,
    website: company.website,
    primaryEmail: company.primaryEmail,
    primaryPhone: company.primaryPhone,
    whatsappPhone: company.whatsappPhone,
    taxOffice: company.taxOffice,
    taxNumber: company.taxNumber,
    mersisNumber: company.mersisNumber,
    tradeRegistryNumber: company.tradeRegistryNumber,
    status: company.status,
    publishedAt: company.publishedAt,
    taxNumberVisible: company.taxNumberVisible,
    mersisVisible: company.mersisVisible,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export async function listCompaniesForOrganization(
  userId: string,
  organizationId: string,
): Promise<CompanyAdminDto[]> {
  await requireOrganizationAccess(userId, organizationId, "VIEWER");
  const companies = await db.company.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
  return companies.map(toCompanyAdminDto);
}

export async function getCompanyForUser(
  userId: string,
  companyId: string,
): Promise<CompanyAdminDto> {
  const { company } = await requireCompanyAccess(userId, companyId, "VIEWER");
  return toCompanyAdminDto(company);
}

export async function createCompany(input: {
  userId: string;
  organizationId: string;
  name: string;
  legalName?: string | null;
  sector?: string | null;
  primaryPhone?: string | null;
  website?: string | null;
}): Promise<CompanyAdminDto> {
  await requireOrganizationAccess(input.userId, input.organizationId, "EDITOR");

  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) {
    throw new AppError(
      "VALIDATION",
      "Şirket adı 2–120 karakter olmalıdır.",
      400,
    );
  }

  const slug = await uniqueCompanySlug(name);

  const company = await db.company.create({
    data: {
      organizationId: input.organizationId,
      name,
      legalName: input.legalName?.trim() || null,
      sector: input.sector?.trim() || null,
      primaryPhone: input.primaryPhone?.trim() || null,
      website: normalizeWebsite(input.website),
      slug,
      status: "DRAFT",
    },
  });

  return toCompanyAdminDto(company);
}

export async function updateCompany(
  userId: string,
  companyId: string,
  patch: {
    name?: string;
    legalName?: string | null;
    shortDescription?: string | null;
    about?: string | null;
    sector?: string | null;
    foundedYear?: number | null;
    website?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    whatsappPhone?: string | null;
    taxOffice?: string | null;
    taxNumber?: string | null;
    mersisNumber?: string | null;
    tradeRegistryNumber?: string | null;
    taxNumberVisible?: boolean;
    mersisVisible?: boolean;
  },
): Promise<CompanyAdminDto> {
  await requireCompanyAccess(userId, companyId, "EDITOR");

  const data: Prisma.CompanyUpdateInput = {};

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length < 2 || name.length > 120) {
      throw new AppError(
        "VALIDATION",
        "Şirket adı 2–120 karakter olmalıdır.",
        400,
      );
    }
    data.name = name;
  }

  const nullableString = (
    key: keyof typeof patch,
    max: number,
  ) => {
    if (patch[key] === undefined) return;
    const value = patch[key];
    if (value === null || value === "") {
      (data as Record<string, unknown>)[key] = null;
      return;
    }
    if (typeof value === "string" && value.length > max) {
      throw new AppError("VALIDATION", "Alan çok uzun.", 400);
    }
    (data as Record<string, unknown>)[key] = value;
  };

  nullableString("legalName", 200);
  nullableString("shortDescription", 280);
  nullableString("about", 5000);
  nullableString("sector", 120);
  nullableString("primaryEmail", 254);
  nullableString("primaryPhone", 40);
  nullableString("whatsappPhone", 40);
  nullableString("taxOffice", 120);
  nullableString("taxNumber", 40);
  nullableString("mersisNumber", 40);
  nullableString("tradeRegistryNumber", 40);

  if (patch.website !== undefined) {
    data.website = normalizeWebsite(patch.website);
  }
  if (patch.foundedYear !== undefined) {
    if (
      patch.foundedYear !== null &&
      (patch.foundedYear < 1800 || patch.foundedYear > new Date().getFullYear())
    ) {
      throw new AppError("VALIDATION", "Geçersiz kuruluş yılı.", 400);
    }
    data.foundedYear = patch.foundedYear;
  }
  if (patch.taxNumberVisible !== undefined) {
    data.taxNumberVisible = patch.taxNumberVisible;
  }
  if (patch.mersisVisible !== undefined) {
    data.mersisVisible = patch.mersisVisible;
  }

  const company = await db.company.update({
    where: { id: companyId },
    data,
  });

  return toCompanyAdminDto(company);
}

export async function publishCompany(
  userId: string,
  companyId: string,
): Promise<CompanyAdminDto> {
  const { company } = await requireCompanyAccess(userId, companyId, "ADMIN");

  if (company.status === "SUSPENDED" || company.status === "ARCHIVED") {
    throw new AppError(
      "COMPANY_NOT_PUBLISHABLE",
      "Bu şirket yayınlanamaz.",
      400,
    );
  }

  const updated = await db.company.update({
    where: { id: companyId },
    data: {
      status: "ACTIVE",
      publishedAt: company.publishedAt ?? new Date(),
    },
  });

  return toCompanyAdminDto(updated);
}

async function uniqueCompanySlug(name: string): Promise<string> {
  const base = slugify(name) || "sirket";
  let candidate = base;
  for (let i = 0; i < 8; i += 1) {
    const exists = await db.company.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = withUniqueSuffix(base, randomBytes(3).toString("hex"));
  }
  return withUniqueSuffix(base, randomBytes(4).toString("hex"));
}

function normalizeWebsite(value?: string | null): string | null {
  if (value === undefined) return null;
  if (value === null || value.trim() === "") return null;
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    return parsed.toString();
  } catch {
    throw new AppError("VALIDATION", "Geçerli bir web sitesi girin.", 400);
  }
}
