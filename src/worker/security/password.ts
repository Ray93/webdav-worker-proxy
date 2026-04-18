const SALT = "webdav-worker-proxy.v1";

async function deriveBits(password: string): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 120_000,
      salt: new TextEncoder().encode(SALT),
    },
    baseKey,
    256,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const digest = await deriveBits(password);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}
