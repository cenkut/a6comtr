import { checkDatabaseConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness + readiness probe for Docker / K8s / load balancers.
 * Does not expose secrets or internal stack details.
 */
export async function GET() {
  const started = Date.now();
  const database = await checkDatabaseConnection();

  const body = {
    status: database.ok ? "ok" : "degraded",
    service: "a6",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    checks: {
      database: {
        ok: database.ok,
        latencyMs: database.latencyMs,
      },
    },
    totalLatencyMs: Date.now() - started,
  };

  return NextResponse.json(body, {
    status: database.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
