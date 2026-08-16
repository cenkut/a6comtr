import { db } from "@/lib/db";
import type { PackageCode } from "@prisma/client";
import { getEntitlements, type Entitlements } from "@/modules/subscription/entitlements";
import { AppError } from "@/lib/errors";

const TRIAL_DAYS = 14;

export async function ensureSubscription(
  organizationId: string,
): Promise<Entitlements> {
  let sub = await db.subscription.findUnique({
    where: { organizationId },
  });

  if (!sub) {
    const expiresAt = new Date(
      Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );
    sub = await db.subscription.create({
      data: {
        organizationId,
        packageCode: "TRIAL",
        status: "TRIALING",
        expiresAt,
        maxCompanies: 1,
        maxUsers: 3,
      },
    });
  }

  const [companyCount, userCount] = await Promise.all([
    db.company.count({ where: { organizationId } }),
    db.membership.count({ where: { organizationId } }),
  ]);

  return getEntitlements(sub, { companyCount, userCount });
}

export async function requireCanCreateCompany(
  organizationId: string,
): Promise<void> {
  const entitlements = await ensureSubscription(organizationId);
  if (!entitlements.canCreateCompany) {
    throw new AppError(
      "PLAN_LIMIT",
      "Paket limitine ulaşıldı. Daha fazla şirket için paketinizi yükseltin.",
      403,
    );
  }
}

export async function setOrganizationPackage(input: {
  organizationId: string;
  packageCode: PackageCode;
  expiresAt?: Date | null;
}) {
  const defaults: Record<
    PackageCode,
    { maxCompanies: number; maxUsers: number }
  > = {
    TRIAL: { maxCompanies: 1, maxUsers: 3 },
    BASIC: { maxCompanies: 1, maxUsers: 5 },
    BUSINESS: { maxCompanies: 5, maxUsers: 20 },
    AGENCY: { maxCompanies: 50, maxUsers: 100 },
  };

  const limits = defaults[input.packageCode];
  return db.subscription.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      packageCode: input.packageCode,
      status: input.packageCode === "TRIAL" ? "TRIALING" : "ACTIVE",
      maxCompanies: limits.maxCompanies,
      maxUsers: limits.maxUsers,
      expiresAt: input.expiresAt ?? null,
    },
    update: {
      packageCode: input.packageCode,
      status: input.packageCode === "TRIAL" ? "TRIALING" : "ACTIVE",
      maxCompanies: limits.maxCompanies,
      maxUsers: limits.maxUsers,
      expiresAt: input.expiresAt ?? null,
    },
  });
}

export async function listSubscriptions() {
  return db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { companies: true, memberships: true } },
        },
      },
    },
    take: 100,
  });
}
