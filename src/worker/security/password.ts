const SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes: Uint8Array<ArrayBuffer>): string {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string): Uint8Array<ArrayBuffer> | null {
  if (value.length === 0 || value.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(value)) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

async function deriveBits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
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
      iterations: PBKDF2_ITERATIONS,
      salt,
    },
    baseKey,
    256,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const digest = await deriveBits(password, salt);
  return `${toHex(salt)}:${toHex(new Uint8Array(digest))}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [saltHex, digestHex, extra] = hash.split(":");
  if (!saltHex || !digestHex || extra) {
    return false;
  }

  const salt = fromHex(saltHex);
  const digest = fromHex(digestHex);
  if (!salt || !digest) {
    return false;
  }

  const computed = await deriveBits(password, salt);
  return toHex(new Uint8Array(computed)) === toHex(digest);
}
