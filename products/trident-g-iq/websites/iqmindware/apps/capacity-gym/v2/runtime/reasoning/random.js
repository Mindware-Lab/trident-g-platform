import { createSeededRng, hash32, randomInt } from "../rng.js";

export { createSeededRng, hash32, randomInt };

export function reasoningSeed(parts = []) {
  return hash32(parts.filter((part) => part !== null && part !== undefined).join(":"));
}

export function shuffleWithRng(values, rng) {
  const next = values.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
