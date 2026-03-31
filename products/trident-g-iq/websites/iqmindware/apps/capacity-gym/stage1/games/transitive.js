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

function sortPair(left, right) {
  return left < right ? [left, right] : [right, left];
}

function makeOrdToken(hi, lo) {
  return {
    kind: "ORD",
    hi,
    lo,
    canonKey: `ORD:${hi}>${lo}`
  };
}

function makeEqToken(left, right) {
  const [a, b] = sortPair(left, right);
  return {
    kind: "EQ",
    a,
    b,
    canonKey: `EQ:${a}=${b}`
  };
}

function formatTokenSymbolic(token) {
  if (token.kind === "ORD") {
    return `${token.hi} > ${token.lo}`;
  }
  return `${token.a} = ${token.b}`;
}

function formatTokenSurface(token, rng) {
  if (token.kind === "ORD") {
    return rng() < 0.5
      ? `${token.hi} > ${token.lo}`
      : `${token.lo} < ${token.hi}`;
  }
  return rng() < 0.5
    ? `${token.a} = ${token.b}`
    : `${token.b} = ${token.a}`;
}

function createBlockSpec(sessionContext, blockIndex) {
  const rng = createSeededRng(hash32(`transitive_v2:${sessionContext.sessionSeed}:block:${blockIndex}`));
  const [l0, l1, l2, l3] = sessionContext.chain;
  const d = sessionContext.distractor;

  const corePremises = [
    makeOrdToken(l0, l1),
    makeEqToken(l1, l2),
    makeOrdToken(l2, l3)
  ];

  // Keep distractors intentionally sparse (0..1) to guarantee no alternate exact-2 chain paths.
  const distractorCandidates = [
    makeOrdToken(d, l1),
    makeOrdToken(l1, d),
    makeOrdToken(d, l2),
    makeOrdToken(l2, d),
    makeEqToken(d, l0),
    makeEqToken(d, l3)
  ];
  const distractors = [];
  if (rng() < 0.5) {
    const pick = distractorCandidates[randomInt(rng, 0, distractorCandidates.length - 1)];
    distractors.push(pick);
  }

  return {
    blockIndex,
    letters: { l0, l1, l2, l3, d },
    corePremises,
    distractors,
    tokenPool: corePremises.concat(distractors)
  };
}

function getBlockSpec(sessionContext, blockIndex) {
  const safeIndex = Number.isFinite(blockIndex) ? Math.max(1, Math.floor(blockIndex)) : 1;
  if (!sessionContext.blockSpecs[safeIndex]) {
    sessionContext.blockSpecs[safeIndex] = createBlockSpec(sessionContext, safeIndex);
  }
  return sessionContext.blockSpecs[safeIndex];
}

function makeQuizPrompt(hi, lo) {
  return `From the block premises, is ${hi} > ${lo} true?`;
}

function slotTruth(blockIndex, slotIndex) {
  const oddBlock = (Math.max(1, blockIndex) % 2) === 1;
  return slotIndex === 0 ? oddBlock : !oddBlock;
}

export const transitiveMode = {
  wrapper: "transitive",
  buildSessionContext(sessionSeed) {
    const rng = createSeededRng(hash32(`transitive:${sessionSeed}`));
    const picks = sampleDistinct(SAFE_LETTERS, 5, rng);
    return {
      chain: picks.slice(0, 4),
      distractor: picks[4],
      sessionSeed,
      blockSpecs: {}
    };
  },
  buildTokenPool(sessionContext, context = {}) {
    const blockIndex = context.blockIndex || 1;
    const spec = getBlockSpec(sessionContext, blockIndex);
    return {
      tokens: spec.tokenPool.map((token) => ({ ...token })),
      meta: {
        premiseBankLines: spec.corePremises.map((token) => formatTokenSymbolic(token))
      }
    };
  },
  renderToken({ token, rng }) {
    return {
      type: "text",
      text: formatTokenSurface(token, rng),
      caption: `Token: ${token.canonKey}`
    };
  },
  buildQuizItems({ sessionContext, blockIndex, rng }) {
    const spec = getBlockSpec(sessionContext, blockIndex);
    const { l0, l1, l2, l3 } = spec.letters;

    const slotATrue = slotTruth(blockIndex, 0);
    const slotBTrue = slotTruth(blockIndex, 1);
    const tokenA = slotATrue ? makeOrdToken(l0, l2) : makeOrdToken(l2, l0);
    const tokenB = slotBTrue ? makeOrdToken(l1, l3) : makeOrdToken(l3, l1);

    return [
      {
        prompt: makeQuizPrompt(tokenA.hi, tokenA.lo),
        answerTrue: slotATrue
      },
      {
        prompt: makeQuizPrompt(tokenB.hi, tokenB.lo),
        answerTrue: slotBTrue
      }
    ];
  }
};

