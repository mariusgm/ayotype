// Deterministic seed from inputs
export function seedFrom(s: string) {
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 ^= h1 >>> 16; h2 ^= h2 >>> 16;
  return ((BigInt(h1 >>> 0) << 32n) | BigInt(h2 >>> 0)).toString(36);
}

export function sanitizeLine(s: string, max = 20) {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, max).trim();
}

export type Mode = "emoji" | "ascii" | "both";

export type Result = {
  meta: { mode: Mode; tone: string; seed: string };
  emoji: { combo: string; name: string }[];
  ascii: { combo: string; name: string }[];
};