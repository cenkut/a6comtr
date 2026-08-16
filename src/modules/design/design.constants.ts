import type { ButtonStyle, LogoShape, ProfileSectionKey } from "@prisma/client";

export const DEFAULT_SECTIONS: {
  key: ProfileSectionKey;
  sortOrder: number;
  enabled: boolean;
}[] = [
  { key: "HERO", sortOrder: 0, enabled: true },
  { key: "QUICK_ACTIONS", sortOrder: 1, enabled: true },
  { key: "ABOUT", sortOrder: 2, enabled: true },
  { key: "CONTACT", sortOrder: 3, enabled: true },
  { key: "LOCATIONS", sortOrder: 4, enabled: true },
  { key: "COMPANY_INFO", sortOrder: 5, enabled: true },
  { key: "CUSTOM_FIELDS", sortOrder: 6, enabled: true },
  { key: "SOCIAL", sortOrder: 7, enabled: true },
  { key: "DOCUMENTS", sortOrder: 8, enabled: true },
];

export const PRESET_THEMES = [
  {
    id: "classic",
    name: "Klasik",
    primaryColor: "#18181b",
    backgroundColor: "#ffffff",
    textColor: "#18181b",
    buttonStyle: "SOLID" as ButtonStyle,
    logoShape: "ROUNDED" as LogoShape,
    showCover: true,
  },
  {
    id: "ocean",
    name: "Okyanus",
    primaryColor: "#0e7490",
    backgroundColor: "#f0fdfa",
    textColor: "#134e4a",
    buttonStyle: "SOLID" as ButtonStyle,
    logoShape: "CIRCLE" as LogoShape,
    showCover: true,
  },
  {
    id: "slate",
    name: "Kurumsal",
    primaryColor: "#1e3a5f",
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    buttonStyle: "OUTLINE" as ButtonStyle,
    logoShape: "SQUARE" as LogoShape,
    showCover: false,
  },
] as const;
