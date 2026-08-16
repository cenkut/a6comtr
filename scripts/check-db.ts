/**
 * CLI: verify PostgreSQL connectivity via Prisma.
 * Usage: npm run db:check
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  // Mask password in log
  const safeUrl = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  console.log(`Connecting to ${safeUrl} ...`);

  const prisma = new PrismaClient();
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    const latencyMs = Date.now() - started;
    console.log(`PASS: database connectivity OK (${latencyMs}ms)`);

    // Ensure schema_meta is reachable after migrations
    try {
      const count = await prisma.schemaMeta.count();
      console.log(`PASS: schema_meta table accessible (rows=${count})`);
    } catch {
      console.log(
        "WARN: schema_meta not available yet — run migrations (npm run db:migrate)",
      );
    }

    process.exit(0);
  } catch (error) {
    console.error(
      "FAIL: database connectivity",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
