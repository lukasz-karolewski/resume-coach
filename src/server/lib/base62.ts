"server-only";

import { randomInt } from "node:crypto";

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateBase62Id(length: number) {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new Error("Base62 ID length must be a positive integer");
  }

  let id = "";

  // randomInt rejection-samples internally, so every character is uniform.
  for (let index = 0; index < length; index += 1) {
    id += BASE62_ALPHABET[randomInt(BASE62_ALPHABET.length)];
  }

  return id;
}
