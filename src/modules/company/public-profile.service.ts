import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  Company,
  CompanyLocation,
  CustomField,
  SocialLink,
} from "@prisma/client";

/** Public DTO — never include hidden/private fields. */
export type PublicCompanyProfile = {
  slug: string;
  name: string;
  legalName: string | null;
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
  status: "ACTIVE";
  publishedAt: Date | null;
  locations: PublicLocation[];
  socialLinks: PublicSocial[];
  customFields: PublicCustomField[];
};

export type PublicLocation = {
  id: string;
  type: string;
  name: string;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  workingHours: string | null;
  description: string | null;
};

export type PublicSocial = {
  id: string;
  platform: string;
  label: string | null;
  url: string;
};

export type PublicCustomField = {
  id: string;
  section: string;
  label: string;
  value: string;
  type: string;
};

export type PublicProfileResult =
  | { kind: "ok"; profile: PublicCompanyProfile }
  | { kind: "not_found" }
  | { kind: "draft" }
  | { kind: "suspended" }
  | { kind: "archived" };

export async function getPublicProfileBySlug(
  slug: string,
): Promise<PublicProfileResult> {
  const company = await db.company.findUnique({
    where: { slug },
    include: {
      locations: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      socialLinks: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      customFields: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!company) return { kind: "not_found" };
  if (company.status === "DRAFT") return { kind: "draft" };
  if (company.status === "SUSPENDED") return { kind: "suspended" };
  if (company.status === "ARCHIVED") return { kind: "archived" };
  if (company.status !== "ACTIVE") return { kind: "not_found" };

  return {
    kind: "ok",
    profile: toPublicProfile(company),
  };
}

function toPublicProfile(
  company: Company & {
    locations: CompanyLocation[];
    socialLinks: SocialLink[];
    customFields: CustomField[];
  },
): PublicCompanyProfile {
  return {
    slug: company.slug,
    name: company.name,
    legalName: company.legalName,
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
    // Sensitive fields only when visibility flags allow.
    taxOffice: company.taxNumberVisible ? company.taxOffice : null,
    taxNumber: company.taxNumberVisible ? company.taxNumber : null,
    mersisNumber: company.mersisVisible ? company.mersisNumber : null,
    tradeRegistryNumber: company.taxNumberVisible
      ? company.tradeRegistryNumber
      : null,
    status: "ACTIVE",
    publishedAt: company.publishedAt,
    locations: company.locations.map((l) => ({
      id: l.id,
      type: l.type,
      name: l.name,
      addressLine: l.addressLine,
      district: l.district,
      city: l.city,
      postalCode: l.postalCode,
      country: l.country,
      phone: l.phone,
      email: l.email,
      contactPersonName: l.contactPersonName,
      contactPersonPhone: l.contactPersonPhone,
      workingHours: l.workingHours,
      description: l.description,
    })),
    socialLinks: company.socialLinks.map((s) => ({
      id: s.id,
      platform: s.platform,
      label: s.label,
      url: s.url,
    })),
    customFields: company.customFields.map((f) => ({
      id: f.id,
      section: f.section,
      label: f.label,
      value: f.value,
      type: f.type,
    })),
  };
}

export async function requireActivePublicProfile(
  slug: string,
): Promise<PublicCompanyProfile> {
  const result = await getPublicProfileBySlug(slug);
  if (result.kind === "ok") return result.profile;
  if (result.kind === "draft") {
    throw new AppError(
      "COMPANY_DRAFT",
      "Şirket kartı henüz yayınlanmamış.",
      404,
    );
  }
  if (result.kind === "suspended") {
    throw new AppError(
      "COMPANY_SUSPENDED",
      "Şirket kartı geçici olarak pasif.",
      403,
    );
  }
  throw new AppError("NOT_FOUND", "Şirket kartı bulunamadı.", 404);
}

/** Build vCard 3.0 with public fields only. */
export function buildVCard(profile: PublicCompanyProfile): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(profile.name)}`,
    `ORG:${escapeVCard(profile.legalName || profile.name)}`,
  ];

  if (profile.primaryPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(profile.primaryPhone)}`);
  }
  if (profile.whatsappPhone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCard(profile.whatsappPhone)}`);
  }
  if (profile.primaryEmail) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(profile.primaryEmail)}`);
  }
  if (profile.website) {
    lines.push(`URL:${escapeVCard(profile.website)}`);
  }

  const hq = profile.locations[0];
  if (hq) {
    const street = [hq.addressLine, hq.district].filter(Boolean).join(", ");
    lines.push(
      `ADR;TYPE=WORK:;;${escapeVCard(street)};${escapeVCard(hq.city ?? "")};;${escapeVCard(hq.postalCode ?? "")};${escapeVCard(hq.country)}`,
    );
  }

  if (profile.shortDescription) {
    lines.push(`NOTE:${escapeVCard(profile.shortDescription)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function formatDirectionsUrl(location: PublicLocation): string | null {
  const parts = [
    location.addressLine,
    location.district,
    location.city,
    location.country,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

export function formatWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function formatTelUrl(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function formatMailtoUrl(email: string): string {
  return `mailto:${email}`;
}
