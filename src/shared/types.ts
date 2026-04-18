export type BootstrapState = "uninitialized" | "secret_pending" | "ready";

export interface AppEnv {
  APP_KV: KVNamespace;
  ASSETS: Fetcher;
  ADMIN_SESSION_SECRET?: string;
}
