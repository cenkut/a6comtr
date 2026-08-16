import { env } from "@/lib/env";

/**
 * Application-level constants that are not secret.
 * Secret values live in `env` only.
 */
export const appConfig = {
  name: env.APP_NAME,
  url: env.APP_URL,
  domain: env.APP_DOMAIN,
  locale: "tr-TR",
  defaultLanguage: "tr",
} as const;

export const routes = {
  home: "/",
  login: "/login",
  verify: "/verify",
  dashboard: "/dashboard",
  dashboardCompany: "/dashboard/company",
  dashboardLocations: "/dashboard/locations",
  dashboardSocial: "/dashboard/social",
  dashboardDocuments: "/dashboard/documents",
  dashboardDesign: "/dashboard/design",
  dashboardQr: "/dashboard/qr",
  dashboardAnalytics: "/dashboard/analytics",
  dashboardTeam: "/dashboard/team",
  companyPublic: (slug: string) => `/c/${slug}`,
  qrRedirect: (publicCode: string) => `/q/${publicCode}`,
  apiHealth: "/api/health",
} as const;
