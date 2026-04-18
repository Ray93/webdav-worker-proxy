import { describe, expect, it } from "vitest";
import {
  signSession,
  verifySession,
} from "../../../src/worker/security/session.ts";

describe("verifySession", () => {
  it("returns false for malformed token input instead of throwing", async () => {
    await expect(verifySession("x.y", "secret")).resolves.toBe(false);
  });

  it("verifies a token created by signSession", async () => {
    const secret = "secret";
    const now = 1_700_000_000_000;
    const token = await signSession(secret, now);
    await expect(verifySession(token, secret, now)).resolves.toBe(true);
  });
});
