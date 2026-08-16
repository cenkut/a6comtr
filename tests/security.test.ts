import { describe, expect, it } from "vitest";
import {
  assertSafeHttpUrl,
  isAllowedDocumentUpload,
} from "../src/lib/security";
import { hashOtpCode, safeEqualHex } from "../src/lib/crypto";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.SKIP_ENV_VALIDATION = "true";

describe("security helpers", () => {
  it("blocks javascript: and data: URLs", () => {
    expect(() => assertSafeHttpUrl("javascript:alert(1)")).toThrow();
    expect(() => assertSafeHttpUrl("data:text/html,hi")).toThrow();
  });

  it("accepts https URLs", () => {
    expect(assertSafeHttpUrl("https://example.com/path")).toContain(
      "https://example.com",
    );
    expect(assertSafeHttpUrl("example.com")).toContain("https://");
  });

  it("blocks unsafe document uploads", () => {
    expect(
      isAllowedDocumentUpload({
        mimeType: "application/pdf",
        filename: "catalog.pdf",
        sizeBytes: 1024,
        maxBytes: 10_000_000,
      }),
    ).toBe(true);

    expect(
      isAllowedDocumentUpload({
        mimeType: "application/javascript",
        filename: "evil.js",
        sizeBytes: 100,
        maxBytes: 10_000_000,
      }),
    ).toBe(false);

    expect(
      isAllowedDocumentUpload({
        mimeType: "application/pdf",
        filename: "x.exe",
        sizeBytes: 100,
        maxBytes: 10_000_000,
      }),
    ).toBe(false);
  });

  it("OTP hash is not reversible plaintext", async () => {
    const { hashOtpCode: hash } = await import("../src/lib/crypto");
    const h = hash("user@example.com", "123456");
    expect(h).not.toContain("123456");
    expect(h).toHaveLength(64);
  });

  it("timing-safe compare rejects mismatches", () => {
    const a = hashOtpCode("a@b.com", "111111");
    const b = hashOtpCode("a@b.com", "222222");
    expect(safeEqualHex(a, a)).toBe(true);
    expect(safeEqualHex(a, b)).toBe(false);
  });
});
