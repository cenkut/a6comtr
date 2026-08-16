import { describe, expect, it } from "vitest";

/**
 * Pure logic baseline for health payload shape (no network).
 */
function buildHealthPayload(databaseOk: boolean, latencyMs: number) {
  return {
    status: databaseOk ? "ok" : "degraded",
    service: "a6",
    checks: {
      database: {
        ok: databaseOk,
        latencyMs,
      },
    },
  } as const;
}

describe("health payload", () => {
  it("reports ok when database is reachable", () => {
    const payload = buildHealthPayload(true, 3);
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("a6");
    expect(payload.checks.database.ok).toBe(true);
  });

  it("reports degraded when database fails", () => {
    const payload = buildHealthPayload(false, 12);
    expect(payload.status).toBe("degraded");
    expect(payload.checks.database.ok).toBe(false);
  });
});
