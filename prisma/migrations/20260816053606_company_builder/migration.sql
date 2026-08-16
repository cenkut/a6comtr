-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('HEADQUARTERS', 'BRANCH', 'STORE', 'WAREHOUSE', 'FACTORY', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X', 'YOUTUBE', 'TIKTOK', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'PHONE', 'EMAIL', 'URL', 'NUMBER', 'DATE');

-- CreateTable
CREATE TABLE "company_locations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "addressLine" TEXT,
    "district" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'TR',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "workingHours" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL DEFAULT 'OTHER',
    "label" TEXT,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL DEFAULT 'TEXT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_locations_companyId_sortOrder_idx" ON "company_locations"("companyId", "sortOrder");

-- CreateIndex
CREATE INDEX "social_links_companyId_sortOrder_idx" ON "social_links"("companyId", "sortOrder");

-- CreateIndex
CREATE INDEX "custom_fields_companyId_sortOrder_idx" ON "custom_fields"("companyId", "sortOrder");

-- AddForeignKey
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
