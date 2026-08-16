/**
 * Development seed only.
 * Production must never auto-seed demo data (plan.md §24).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Seed is disabled in production.");
    process.exit(1);
  }

  await prisma.schemaMeta.upsert({
    where: { key: "app" },
    create: { key: "app", value: "a6" },
    update: { value: "a6" },
  });

  await prisma.schemaMeta.upsert({
    where: { key: "seeded_at" },
    create: { key: "seeded_at", value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  });

  console.log("Development seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
