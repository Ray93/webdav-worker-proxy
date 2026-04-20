import { ADMIN_SECRET_NAME } from "../../shared/constants";
import type { AppEnv } from "../../shared/types";
import { hasRuntimeSecret } from "../env";
import { hashPassword } from "../security/password";
import { getBootstrapState } from "../store/bootstrap-store";
import { KV_KEYS, putText } from "../store/kv";

export async function handleBootstrap(env: AppEnv): Promise<Response> {
  const passwordHash = await env.APP_KV.get(KV_KEYS.passwordHash);
  const state = getBootstrapState({
    passwordHash,
    hasRuntimeSecret: hasRuntimeSecret(env),
  });

  return Response.json({
    state,
    hasRuntimeSecret: hasRuntimeSecret(env),
    secretName: ADMIN_SECRET_NAME,
  });
}

export async function handleSetup(env: AppEnv, request: Request): Promise<Response> {
  const { password } = (await request.json()) as { password: string };
  const passwordHash = await hashPassword(password);
  await putText(env, KV_KEYS.passwordHash, passwordHash);
  const secretBytes = crypto.getRandomValues(new Uint8Array(32));
  const generatedSecret = btoa(String.fromCharCode(...secretBytes));

  return Response.json({
    secretName: ADMIN_SECRET_NAME,
    generatedSecret,
  });
}
