import type { BootstrapState } from "../../shared/types";

export interface BootstrapStateInput {
  passwordHash: string | null;
  hasRuntimeSecret: boolean;
}

export function getBootstrapState(input: BootstrapStateInput): BootstrapState {
  if (!input.passwordHash) {
    return "uninitialized";
  }

  if (!input.hasRuntimeSecret) {
    return "secret_pending";
  }

  return "ready";
}
