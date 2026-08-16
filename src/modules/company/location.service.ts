import type { CompanyLocation, LocationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireCompanyAccess } from "@/modules/authz/access";

export type LocationDto = {
  id: string;
  companyId: string;
  type: LocationType;
  name: string;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  workingHours: string | null;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export function toLocationDto(row: CompanyLocation): LocationDto {
  return {
    id: row.id,
    companyId: row.companyId,
    type: row.type,
    name: row.name,
    addressLine: row.addressLine,
    district: row.district,
    city: row.city,
    postalCode: row.postalCode,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    contactPersonName: row.contactPersonName,
    contactPersonPhone: row.contactPersonPhone,
    workingHours: row.workingHours,
    description: row.description,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

export async function listLocations(
  userId: string,
  companyId: string,
): Promise<LocationDto[]> {
  await requireCompanyAccess(userId, companyId, "VIEWER");
  const rows = await db.companyLocation.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toLocationDto);
}

export async function createLocation(
  userId: string,
  companyId: string,
  input: {
    type?: LocationType;
    name: string;
    addressLine?: string | null;
    district?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string;
    phone?: string | null;
    email?: string | null;
    contactPersonName?: string | null;
    contactPersonPhone?: string | null;
    workingHours?: string | null;
    description?: string | null;
    isVisible?: boolean;
  },
): Promise<LocationDto> {
  await requireCompanyAccess(userId, companyId, "EDITOR");
  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) {
    throw new AppError("VALIDATION", "Adres adı gerekli.", 400);
  }

  const maxSort = await db.companyLocation.aggregate({
    where: { companyId },
    _max: { sortOrder: true },
  });

  const row = await db.companyLocation.create({
    data: {
      companyId,
      type: input.type ?? "OTHER",
      name,
      addressLine: emptyToNull(input.addressLine),
      district: emptyToNull(input.district),
      city: emptyToNull(input.city),
      postalCode: emptyToNull(input.postalCode),
      country: input.country?.trim() || "TR",
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      contactPersonName: emptyToNull(input.contactPersonName),
      contactPersonPhone: emptyToNull(input.contactPersonPhone),
      workingHours: emptyToNull(input.workingHours),
      description: emptyToNull(input.description),
      isVisible: input.isVisible ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return toLocationDto(row);
}

export async function updateLocation(
  userId: string,
  locationId: string,
  patch: Partial<{
    type: LocationType;
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
    isVisible: boolean;
    sortOrder: number;
  }>,
): Promise<LocationDto> {
  const existing = await db.companyLocation.findUnique({
    where: { id: locationId },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");

  const data: Prisma.CompanyLocationUpdateInput = {};
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new AppError("VALIDATION", "Adres adı gerekli.", 400);
    data.name = name;
  }
  if (patch.addressLine !== undefined) data.addressLine = emptyToNull(patch.addressLine);
  if (patch.district !== undefined) data.district = emptyToNull(patch.district);
  if (patch.city !== undefined) data.city = emptyToNull(patch.city);
  if (patch.postalCode !== undefined) data.postalCode = emptyToNull(patch.postalCode);
  if (patch.country !== undefined) data.country = patch.country.trim() || "TR";
  if (patch.phone !== undefined) data.phone = emptyToNull(patch.phone);
  if (patch.email !== undefined) data.email = emptyToNull(patch.email);
  if (patch.contactPersonName !== undefined) {
    data.contactPersonName = emptyToNull(patch.contactPersonName);
  }
  if (patch.contactPersonPhone !== undefined) {
    data.contactPersonPhone = emptyToNull(patch.contactPersonPhone);
  }
  if (patch.workingHours !== undefined) data.workingHours = emptyToNull(patch.workingHours);
  if (patch.description !== undefined) data.description = emptyToNull(patch.description);
  if (patch.isVisible !== undefined) data.isVisible = patch.isVisible;
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder;

  const row = await db.companyLocation.update({
    where: { id: locationId },
    data,
  });
  return toLocationDto(row);
}

export async function deleteLocation(
  userId: string,
  locationId: string,
): Promise<void> {
  const existing = await db.companyLocation.findUnique({
    where: { id: locationId },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");
  await db.companyLocation.delete({ where: { id: locationId } });
}

function emptyToNull(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}
