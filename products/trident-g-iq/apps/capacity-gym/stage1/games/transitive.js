import { createSeededRng, hash32, randomInt } from "../lib/rng.js";

const SAFE_LETTERS = ["A", "B", "C", "D", "E", "F", "H", "J", "K", "M", "N", "P", "R", "T", "V", "W", "X", "Y", "Z"];

function sampleDistinct(list, count, rng) {
  const copy = list.slice();
  const selected = [];
  for (let i = 0; i < count && copy.length; i += 1) {
    const idx = randomInt(rng, 0, copy.length - 1);
    selected.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return selected;
}

function makeOrdToken(hi, lo) {
  return {
    canonKey: `ORD:${hi}>${lo}`,
    hi,
    lo
  };
}

function makePrompt(hi, lo) {
  return `Is ${hi} > ${lo} in exactly 2 steps?`;
}

export const transitiveMode = {
  wrapper: "transitive",
  buildSessionContext(sessionSeed) {
    const rng = createSeededRng(hash32(`transitive:${sessionSeed}`));
    const picks = sampleDistinct(SAFE_LETTERS, 5, rng);
    return {
      chain: picks.slice(0, 4),
      distractor: picks[4]
    };
  },
  buildTokenPool(sessionContext) {
    const [l0, l1, l2, l3] = sessionContext.chain;
    const d = sessionContext.distractor;
    return [
      makeOrdToken(l0, l1),
      makeOrdToken(l1, l2),
      makeOrdToken(l2, l3),
      // Distractors involve D only and cannot introduce alternative chain-to-chain paths.
      makeOrdToken(d, l0),
      makeOrdToken(d, l3)
    ];
  },
  renderToken({ token, rng }) {
    const flip = rng() < 0.5;
    const text = flip
      ? `${token.hi} > ${token.lo}`
      : `${token.lo} < ${token.hi}`;
    return {
      type: "text",
      text,
      caption: `Token: ${token.canonKey}`
    };
  },
  buildQuizItems({ sessionContext, rng }) {
    const [l0, l1, l2, l3] = sessionContext.chain;
    const truths = [
      { hi: l0, lo: l2 },
      { hi: l1, lo: l3 }
    ];
    const falseCandidates = [
      { hi: l0, lo: l3 }, // exact-3, not exact-2
      { hi: l2, lo: l0 },
      // D > L1 is exact-2 true via D > L0 > L1, so use D > L2 (exact-3) as false.
      { hi: sessionContext.distractor, lo: l2 }
    ];

    const trueItem = truths[randomInt(rng, 0, truths.length - 1)];
    const falseItem = falseCandidates[randomInt(rng, 0, falseCandidates.length - 1)];
    const items = [
      {
        prompt: makePrompt(trueItem.hi, trueItem.lo),
        answerTrue: true
      },
      {
        prompt: makePrompt(falseItem.hi, falseItem.lo),
        answerTrue: false
      }
    ];

    return rng() < 0.5 ? items : items.reverse();
  }
};
