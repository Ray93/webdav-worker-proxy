import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin index.html", () => {
  it("declares a real favicon asset", () => {
    const indexHtmlPath = resolve(process.cwd(), "src/admin/index.html");
    const indexHtml = readFileSync(indexHtmlPath, "utf8");

    expect(indexHtml).toContain('href="/admin/favicon.svg"');
    expect(existsSync(resolve(process.cwd(), "src/admin/public/favicon.svg"))).toBe(true);
  });
});
