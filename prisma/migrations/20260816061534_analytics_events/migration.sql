-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('QR_SCAN', 'PROFILE_VIEW', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'DIRECTIONS_CLICK', 'VCARD_DOWNLOAD', 'DOCUMENT_CLICK', 'SOCIAL_CLICK');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "type" "AnalyticsEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "country" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_companyId_timestamp_idx" ON "analytics_events"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_companyId_type_timestamp_idx" ON "analytics_events"("companyId", "type", "timestamp");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
