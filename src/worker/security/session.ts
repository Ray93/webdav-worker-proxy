interface SessionPayload {
  exp: number;
  iat: number;
  v: 1;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    payload.v === 1 &&
    typeof payload.iat === "number" &&
    Number.isFinite(payload.iat) &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp)
  );
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
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [body, proof] = parts;
  if (!body || !proof) {
    return false;
  }

  try {
    const expected = await signBody(body, secret);
    if (expected !== proof) {
      return false;
    }

    const payload = JSON.parse(decode(body)) as unknown;
    if (!isSessionPayload(payload)) {
      return false;
    }

    return payload.exp > now;
  } catch {
    return false;
  }
}
