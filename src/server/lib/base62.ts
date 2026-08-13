"server-only";

import { randomBytes } from "node:crypto";

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateBase62Id(length: number) {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new Error("Base62 ID length must be a positive integer");
  }

  const output: string[] = [];
  const largestUnbiasedByte = Math.floor(256 / BASE62_ALPHABET.length) * 62;

  while (output.length < length) {
    for (const byte of randomBytes(length - output.length)) {
      if (byte >= largestUnbiasedByte) continue;

      output.push(BASE62_ALPHABET[byte % BASE62_ALPHABET.length]!);
    }
  }

  return output.join("");
}
