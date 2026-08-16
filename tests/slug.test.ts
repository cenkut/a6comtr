import { describe, expect, it } from "vitest";
import { slugify } from "../src/lib/slug";

describe("slugify", () => {
  it("handles turkish characters", () => {
    expect(slugify("ProAltes Yazılım")).toBe("proaltes-yazilim");
    expect(slugify("Şirket Ğözü")).toBe("sirket-gozu");
  });

  it("collapses separators", () => {
    expect(slugify("  Hello---World  ")).toBe("hello-world");
  });
});
