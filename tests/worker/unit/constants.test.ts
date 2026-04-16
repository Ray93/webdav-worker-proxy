import { describe, expect, it } from "vitest";
import {
  ADMIN_SECRET_NAME,
  ADMIN_UI_PREFIX,
  ADMIN_API_PREFIX,
  RESERVED_PREFIXES,
} from "../../../src/shared/constants";

describe("shared constants", () => {
  it("exposes the reserved prefixes used by runtime routing", () => {
    expect(ADMIN_SECRET_NAME).toBe("ADMIN_SESSION_SECRET");
    expect(ADMIN_UI_PREFIX).toBe("/admin");
    expect(ADMIN_API_PREFIX).toBe("/api/admin");
    expect(RESERVED_PREFIXES).toEqual(["/admin", "/api/admin"]);
  });
});
