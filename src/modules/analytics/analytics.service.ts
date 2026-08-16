import type { AnalyticsEventType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/modules/authz/access";

export type TrackEventInput = {
  companyId: string;
  type: AnalyticsEventType;
  qrCodeId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  country?: string | null;
};

export async function trackEvent(input: TrackEventInput): Promise<void> {
  await db.analyticsEvent.create({
    data: {
      companyId: input.companyId,
      type: input.type,
      qrCodeId: input.qrCodeId ?? null,
      referrer: input.referrer?.slice(0, 500) ?? null,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
      deviceType: detectDeviceType(input.userAgent),
      country: input.country?.slice(0, 8) ?? null,
    },
  });
}

export type MetricsSummary = {
  today: number;
  last7Days: number;
  last30Days: number;
  total: number;
};

export type DashboardMetrics = {
  qrScan: MetricsSummary;
  profileView: MetricsSummary;
  phoneClick: MetricsSummary;
  whatsappClick: MetricsSummary;
  websiteClick: MetricsSummary;
  directionsClick: MetricsSummary;
  vcardDownload: MetricsSummary;
  actionClicks: MetricsSummary;
};

const ACTION_TYPES: AnalyticsEventType[] = [
  "PHONE_CLICK",
  "WHATSAPP_CLICK",
  "EMAIL_CLICK",
  "WEBSITE_CLICK",
  "DIRECTIONS_CLICK",
  "VCARD_DOWNLOAD",
  "DOCUMENT_CLICK",
  "SOCIAL_CLICK",
];

export async function getCompanyMetrics(
  userId: string,
  companyId: string,
): Promise<DashboardMetrics> {
  await requireCompanyAccess(userId, companyId, "VIEWER");

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  async function summarize(
    type: AnalyticsEventType | AnalyticsEventType[],
  ): Promise<MetricsSummary> {
    const types = Array.isArray(type) ? type : [type];
    const base: Prisma.AnalyticsEventWhereInput = {
      companyId,
      type: { in: types },
    };

    const [today, last7Days, last30Days, total] = await Promise.all([
      db.analyticsEvent.count({
        where: { ...base, timestamp: { gte: startOfToday } },
      }),
      db.analyticsEvent.count({
        where: { ...base, timestamp: { gte: last7 } },
      }),
      db.analyticsEvent.count({
        where: { ...base, timestamp: { gte: last30 } },
      }),
      db.analyticsEvent.count({ where: base }),
    ]);

    return { today, last7Days, last30Days, total };
  }

  const [
    qrScan,
    profileView,
    phoneClick,
    whatsappClick,
    websiteClick,
    directionsClick,
    vcardDownload,
    actionClicks,
  ] = await Promise.all([
    summarize("QR_SCAN"),
    summarize("PROFILE_VIEW"),
    summarize("PHONE_CLICK"),
    summarize("WHATSAPP_CLICK"),
    summarize("WEBSITE_CLICK"),
    summarize("DIRECTIONS_CLICK"),
    summarize("VCARD_DOWNLOAD"),
    summarize(ACTION_TYPES),
  ]);

  return {
    qrScan,
    profileView,
    phoneClick,
    whatsappClick,
    websiteClick,
    directionsClick,
    vcardDownload,
    actionClicks,
  };
}

function detectDeviceType(userAgent?: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return "mobile";
  if (/tablet/.test(ua)) return "tablet";
  return "desktop";
}
