import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getPlatformAdminEmails } from "@/lib/env";
import { writeAuditLog } from "@/modules/audit/audit.service";
import type { SessionUser } from "@/modules/auth/session.service";
import type { CompanyStatus } from "@prisma/client";

export function isPlatformAdminUser(user: {
  email: string;
  isPlatformAdmin: boolean;
}): boolean {
  if (user.isPlatformAdmin) return true;
  const allow = getPlatformAdminEmails();
  return allow.includes(user.email.toLowerCase());
}

export async function requirePlatformAdmin(user: SessionUser): Promise<void> {
  if (!isPlatformAdminUser(user)) {
    throw new AppError("FORBIDDEN", "Platform admin yetkisi gerekli.", 403);
  }
}

export async function getAdminOverview() {
  const [
    organizations,
    users,
    companies,
    qrCodes,
    subscriptions,
    recentAudits,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.company.count(),
    db.qRCode.count(),
    db.subscription.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { email: true } },
        organization: { select: { name: true } },
      },
    }),
  ]);

  const companiesByStatus = await db.company.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    counts: {
      organizations,
      users,
      companies,
      qrCodes,
      subscriptions,
    },
    companiesByStatus: Object.fromEntries(
      companiesByStatus.map((r) => [r.status, r._count]),
    ),
    recentAudits,
  };
}

export async function listAdminOrganizations() {
  return db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { companies: true, memberships: true } },
      subscription: true,
    },
    take: 100,
  });
}

export async function listAdminCompanies() {
  return db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      _count: { select: { qrCodes: true } },
    },
    take: 100,
  });
}

export async function listAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      isPlatformAdmin: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { memberships: true, sessions: true } },
    },
    take: 100,
  });
}

export async function listAdminQrCodes() {
  return db.qRCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          organizationId: true,
        },
      },
    },
    take: 100,
  });
}

export async function setCompanyStatus(input: {
  actorUserId: string;
  companyId: string;
  status: CompanyStatus;
}) {
  const company = await db.company.findUnique({
    where: { id: input.companyId },
  });
  if (!company) {
    throw new AppError("NOT_FOUND", "Şirket bulunamadı.", 404);
  }

  const updated = await db.company.update({
    where: { id: input.companyId },
    data: {
      status: input.status,
      publishedAt:
        input.status === "ACTIVE"
          ? (company.publishedAt ?? new Date())
          : company.publishedAt,
    },
  });

  await writeAuditLog({
    action:
      input.status === "SUSPENDED"
        ? "COMPANY_SUSPENDED"
        : input.status === "ACTIVE"
          ? "COMPANY_PUBLISHED"
          : `COMPANY_STATUS_${input.status}`,
    actorUserId: input.actorUserId,
    organizationId: company.organizationId,
    companyId: company.id,
    metadata: { from: company.status, to: input.status },
  });

  return updated;
}
