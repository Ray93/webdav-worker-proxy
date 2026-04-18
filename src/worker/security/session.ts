interface SessionPayload {
  exp: number;
  iat: number;
  v: 1;
}

function encode(data: string): string {
  return btoa(data)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decode(data: string): string {
  const normalized = data.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(padded);
}

async function signBody(body: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${secret}.${body}`),
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function signSession(secret: string, now = Date.now()): Promise<string> {
  const payload: SessionPayload = { exp: now + 1000 * 60 * 60 * 12, iat: now, v: 1 };
  const body = encode(JSON.stringify(payload));
  return `${body}.${await signBody(body, secret)}`;
}

export async function verifySession(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const [body, proof] = token.split(".");
  if (!body || !proof) return false;
  const expected = await signBody(body, secret);
  const payload = JSON.parse(decode(body)) as SessionPayload;
  return expected === proof && payload.exp > now;
}
