import type { PackageCode, Subscription, SubscriptionStatus } from "@prisma/client";

export type Entitlements = {
  packageCode: PackageCode;
  status: SubscriptionStatus;
  maxCompanies: number;
  maxUsers: number;
  canCreateCompany: boolean;
  canInviteUser: boolean;
  canExportQr: boolean;
  canUseAnalytics: boolean;
  canUseCustomFields: boolean;
  canUseDocuments: boolean;
  isActive: boolean;
};

const PACKAGE_DEFAULTS: Record<
  PackageCode,
  {
    maxCompanies: number;
    maxUsers: number;
    canExportQr: boolean;
    canUseAnalytics: boolean;
    canUseCustomFields: boolean;
    canUseDocuments: boolean;
  }
> = {
  TRIAL: {
    maxCompanies: 1,
    maxUsers: 3,
    canExportQr: true,
    canUseAnalytics: true,
    canUseCustomFields: true,
    canUseDocuments: false,
  },
  BASIC: {
    maxCompanies: 1,
    maxUsers: 5,
    canExportQr: true,
    canUseAnalytics: true,
    canUseCustomFields: true,
    canUseDocuments: true,
  },
  BUSINESS: {
    maxCompanies: 5,
    maxUsers: 20,
    canExportQr: true,
    canUseAnalytics: true,
    canUseCustomFields: true,
    canUseDocuments: true,
  },
  AGENCY: {
    maxCompanies: 50,
    maxUsers: 100,
    canExportQr: true,
    canUseAnalytics: true,
    canUseCustomFields: true,
    canUseDocuments: true,
  },
};

/**
 * Central feature gate — do not scatter package conditionals across the codebase.
 */
export function getEntitlements(
  subscription: Pick<
    Subscription,
    | "packageCode"
    | "status"
    | "maxCompanies"
    | "maxUsers"
    | "expiresAt"
  > | null,
  usage?: { companyCount?: number; userCount?: number },
): Entitlements {
  const packageCode = subscription?.packageCode ?? "TRIAL";
  const defaults = PACKAGE_DEFAULTS[packageCode];
  const status = subscription?.status ?? "TRIALING";

  const expired =
    !!subscription?.expiresAt &&
    subscription.expiresAt.getTime() < Date.now();

  const isActive =
    !expired &&
    (status === "ACTIVE" || status === "TRIALING");

  const maxCompanies = subscription?.maxCompanies ?? defaults.maxCompanies;
  const maxUsers = subscription?.maxUsers ?? defaults.maxUsers;
  const companyCount = usage?.companyCount ?? 0;
  const userCount = usage?.userCount ?? 0;

  return {
    packageCode,
    status: expired ? "EXPIRED" : status,
    maxCompanies,
    maxUsers,
    isActive,
    canCreateCompany: isActive && companyCount < maxCompanies,
    canInviteUser: isActive && userCount < maxUsers,
    canExportQr: isActive && defaults.canExportQr,
    canUseAnalytics: isActive && defaults.canUseAnalytics,
    canUseCustomFields: isActive && defaults.canUseCustomFields,
    canUseDocuments: isActive && defaults.canUseDocuments,
  };
}
