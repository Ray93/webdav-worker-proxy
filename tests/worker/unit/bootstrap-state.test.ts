import { describe, expect, it } from "vitest";
import { getBootstrapState } from "../../../src/worker/store/bootstrap-store";

describe("getBootstrapState", () => {
  it("returns ready only when password hash and worker secret are both present", () => {
    expect(
      getBootstrapState({
        passwordHash: "hashed",
        hasRuntimeSecret: true,
      }),
    ).toBe("ready");

    expect(
      getBootstrapState({
        passwordHash: null,
        hasRuntimeSecret: true,
      }),
    ).toBe("uninitialized");

    expect(
      getBootstrapState({
        passwordHash: "hashed",
        hasRuntimeSecret: false,
      }),
    ).toBe("uninitialized");

    expect(
      getBootstrapState({
        passwordHash: null,
        hasRuntimeSecret: false,
      }),
    ).toBe("uninitialized");
  });
});
