import { randomInt } from "node:crypto";

/**
 * Human-friendly, non-sequential public codes.
 * Alphabet excludes ambiguous 0/O, 1/I/L.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generatePublicCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

export function isValidPublicCodeFormat(code: string): boolean {
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6,12}$/.test(code);
}
