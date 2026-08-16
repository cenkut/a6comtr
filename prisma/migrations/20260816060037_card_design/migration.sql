-- CreateEnum
CREATE TYPE "ButtonStyle" AS ENUM ('SOLID', 'OUTLINE', 'SOFT');

-- CreateEnum
CREATE TYPE "LogoShape" AS ENUM ('SQUARE', 'ROUNDED', 'CIRCLE');

-- CreateEnum
CREATE TYPE "ProfileSectionKey" AS ENUM ('HERO', 'ABOUT', 'QUICK_ACTIONS', 'CONTACT', 'LOCATIONS', 'COMPANY_INFO', 'SOCIAL', 'DOCUMENTS', 'CUSTOM_FIELDS');

-- CreateTable
CREATE TABLE "company_profile_themes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#18181b',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#18181b',
    "buttonStyle" "ButtonStyle" NOT NULL DEFAULT 'SOLID',
    "logoShape" "LogoShape" NOT NULL DEFAULT 'ROUNDED',
    "showCover" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profile_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile_sections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" "ProfileSectionKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profile_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_themes_companyId_key" ON "company_profile_themes"("companyId");

-- CreateIndex
CREATE INDEX "company_profile_sections_companyId_sortOrder_idx" ON "company_profile_sections"("companyId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_sections_companyId_key_key" ON "company_profile_sections"("companyId", "key");

-- AddForeignKey
ALTER TABLE "company_profile_themes" ADD CONSTRAINT "company_profile_themes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_sections" ADD CONSTRAINT "company_profile_sections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
