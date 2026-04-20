import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin styles headline scale", () => {
  it("uses the medium Swiss Workbench headline scale", () => {
    const stylesPath = resolve(process.cwd(), "src/admin/styles.css");
    const styles = readFileSync(stylesPath, "utf8");

    expect(styles).toContain("max-width: none;");
    expect(styles).toContain("font-size: clamp(2.1rem, 4vw, 3.4rem);");
    expect(styles).toContain("letter-spacing: -0.03em;");
    expect(styles).toContain("font-size: clamp(1.95rem, 8vw, 2.8rem);");
  });
});
