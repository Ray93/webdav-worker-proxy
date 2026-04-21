import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "../../../src/worker/security/password.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("password helpers", () => {
  it("hashes the same password differently each time", async () => {
    const password = "correct horse battery staple";

    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toBe(second);
  });

  it("verifies the correct password against the stored hash", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects the wrong password for the stored hash", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(
      verifyPassword("tr0ub4dor&3", hash),
    ).resolves.toBe(false);
  });

  it("returns false for malformed stored hash input", async () => {
    await expect(
      verifyPassword("correct horse battery staple", "not-a-valid-hash"),
    ).resolves.toBe(false);
  });

  it("keeps PBKDF2 iterations within Cloudflare Workers limits", async () => {
    const deriveBitsSpy = vi.spyOn(crypto.subtle, "deriveBits");

    await hashPassword("correct horse battery staple");

    const [algorithm] = deriveBitsSpy.mock.calls[0] ?? [];
    expect(algorithm).toMatchObject({
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 100_000,
    });
  });
});
