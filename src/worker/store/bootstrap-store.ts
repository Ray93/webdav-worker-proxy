import type { BootstrapState } from "../../shared/types";

export interface BootstrapStateInput {
  passwordHash: string | null;
  hasRuntimeSecret: boolean;
}

export function getBootstrapState(input: BootstrapStateInput): BootstrapState {
  if (!input.hasRuntimeSecret || !input.passwordHash) {
    return "uninitialized";
  }

  return "ready";
}
