import type { CustomField, CustomFieldType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireCompanyAccess } from "@/modules/authz/access";

export type CustomFieldDto = {
  id: string;
  companyId: string;
  section: string;
  label: string;
  value: string;
  type: CustomFieldType;
  sortOrder: number;
  isVisible: boolean;
};

export function toCustomFieldDto(row: CustomField): CustomFieldDto {
  return {
    id: row.id,
    companyId: row.companyId,
    section: row.section,
    label: row.label,
    value: row.value,
    type: row.type,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

export async function listCustomFields(
  userId: string,
  companyId: string,
): Promise<CustomFieldDto[]> {
  await requireCompanyAccess(userId, companyId, "VIEWER");
  const rows = await db.customField.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toCustomFieldDto);
}

export async function createCustomField(
  userId: string,
  companyId: string,
  input: {
    section?: string;
    label: string;
    value: string;
    type?: CustomFieldType;
    isVisible?: boolean;
  },
): Promise<CustomFieldDto> {
  await requireCompanyAccess(userId, companyId, "EDITOR");
  const label = input.label.trim();
  const value = input.value.trim();
  if (!label || label.length > 120) {
    throw new AppError("VALIDATION", "Etiket gerekli (max 120).", 400);
  }
  if (!value || value.length > 2000) {
    throw new AppError("VALIDATION", "Değer gerekli (max 2000).", 400);
  }

  const maxSort = await db.customField.aggregate({
    where: { companyId },
    _max: { sortOrder: true },
  });

  const row = await db.customField.create({
    data: {
      companyId,
      section: input.section?.trim() || "general",
      label,
      value,
      type: input.type ?? "TEXT",
      isVisible: input.isVisible ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return toCustomFieldDto(row);
}

export async function updateCustomField(
  userId: string,
  fieldId: string,
  patch: Partial<{
    section: string;
    label: string;
    value: string;
    type: CustomFieldType;
    isVisible: boolean;
    sortOrder: number;
  }>,
): Promise<CustomFieldDto> {
  const existing = await db.customField.findUnique({ where: { id: fieldId } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");

  const data: Prisma.CustomFieldUpdateInput = {};
  if (patch.section !== undefined) data.section = patch.section.trim() || "general";
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) throw new AppError("VALIDATION", "Etiket gerekli.", 400);
    data.label = label;
  }
  if (patch.value !== undefined) {
    const value = patch.value.trim();
    if (!value) throw new AppError("VALIDATION", "Değer gerekli.", 400);
    data.value = value;
  }
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.isVisible !== undefined) data.isVisible = patch.isVisible;
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder;

  const row = await db.customField.update({ where: { id: fieldId }, data });
  return toCustomFieldDto(row);
}

export async function deleteCustomField(
  userId: string,
  fieldId: string,
): Promise<void> {
  const existing = await db.customField.findUnique({ where: { id: fieldId } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }
  await requireCompanyAccess(userId, existing.companyId, "EDITOR");
  await db.customField.delete({ where: { id: fieldId } });
}
