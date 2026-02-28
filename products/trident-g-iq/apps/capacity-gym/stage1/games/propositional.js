import { createSeededRng, hash32, randomInt } from "../lib/rng.js";

const RULE_TYPES = ["MP", "MT", "DS"];

function sortPair(left, right) {
  return left < right ? [left, right] : [right, left];
}

function makeAtom(symbol) {
  return {
    kind: "ATOM",
    symbol,
    canonKey: `ATOM:${symbol}`
  };
}

function makeNot(symbol) {
  return {
    kind: "NOT",
    symbol,
    canonKey: `NOT:${symbol}`
  };
}

function makeImp(from, to) {
  return {
    kind: "IMP",
    from,
    to,
    canonKey: `IMP:${from}->${to}`
  };
}

function makeOr(left, right) {
  const [a, b] = sortPair(left, right);
  return {
    kind: "OR",
    a,
    b,
    canonKey: `OR:${a}|${b}`
  };
}

function formatTokenSurface(token, family, rng = Math.random) {
  if (token.kind === "ATOM") {
    return family === "symbolic" ? token.symbol : `${token.symbol} is true`;
  }
  if (token.kind === "NOT") {
    return family === "symbolic" ? `~${token.symbol}` : `${token.symbol} is not true`;
  }
  if (token.kind === "IMP") {
    return family === "symbolic"
      ? `${token.from} -> ${token.to}`
      : `If ${token.from} then ${token.to}`;
  }

  const flip = rng() < 0.5;
  const left = flip ? token.b : token.a;
  const right = flip ? token.a : token.b;
  return family === "symbolic"
    ? `${left} v ${right}`
    : `Either ${left} or ${right}`;
}

function formatQuizStatement(token) {
  if (token.kind === "ATOM") {
    return `${token.symbol} is true`;
  }
  if (token.kind === "NOT") {
    return `${token.symbol} is not true`;
  }
  if (token.kind === "IMP") {
    return `if ${token.from} then ${token.to}`;
  }
  return `either ${token.a} or ${token.b}`;
}

function createInstance(ruleType, left, right) {
  if (ruleType === "MP") {
    return {
      ruleType,
      premises: [makeAtom(left), makeImp(left, right)],
      conclusion: makeAtom(right),
      foils: [makeNot(right), makeNot(left)]
    };
  }
  if (ruleType === "MT") {
    return {
      ruleType,
      // MT is encoded as an explicit rule template, not an implication rewrite permission.
      premises: [makeNot(right), makeImp(left, right)],
      conclusion: makeNot(left),
      foils: [makeAtom(right), makeAtom(left)]
    };
  }
  return {
    ruleType: "DS",
    premises: [makeOr(left, right), makeNot(left)],
    conclusion: makeAtom(right),
    foils: [makeNot(right), makeAtom(left)]
  };
}

function createBlockSpec(sessionContext, blockIndex) {
  const rng = createSeededRng(hash32(`prop:${sessionContext.sessionSeed}:block:${blockIndex}`));
  const ruleA = RULE_TYPES[randomInt(rng, 0, RULE_TYPES.length - 1)];
  const ruleB = RULE_TYPES[randomInt(rng, 0, RULE_TYPES.length - 1)];
  const instanceA = createInstance(ruleA, "P", "Q");
  const instanceB = createInstance(ruleB, "R", "S");
  const premiseBank = instanceA.premises.concat(instanceB.premises);

  for (let i = premiseBank.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    const temp = premiseBank[i];
    premiseBank[i] = premiseBank[j];
    premiseBank[j] = temp;
  }

  const uniquePremiseKeys = new Set(premiseBank.map((token) => token.canonKey));
  if (premiseBank.length !== 4 || uniquePremiseKeys.size !== 4) {
    throw new Error("Propositional block premise bank must contain exactly 4 unique premises.");
  }

  return {
    blockIndex,
    instanceA,
    instanceB,
    premiseBank
  };
}

function getBlockSpec(sessionContext, blockIndex) {
  const safeIndex = Number.isFinite(blockIndex) ? Math.max(1, Math.floor(blockIndex)) : 1;
  if (!sessionContext.blockSpecs[safeIndex]) {
    sessionContext.blockSpecs[safeIndex] = createBlockSpec(sessionContext, safeIndex);
  }
  return sessionContext.blockSpecs[safeIndex];
}

function selectFoil(instance, premiseKeySet, rng) {
  const validFoils = instance.foils.filter((token) => !premiseKeySet.has(token.canonKey));
  if (validFoils.length) {
    return validFoils[randomInt(rng, 0, validFoils.length - 1)];
  }

  // Defensive fallback if all default foils were present in premises.
  const conclusion = instance.conclusion;
  if (conclusion.kind === "ATOM") {
    return makeNot(conclusion.symbol);
  }
  if (conclusion.kind === "NOT") {
    return makeAtom(conclusion.symbol);
  }
  if (conclusion.kind === "IMP") {
    return makeNot(conclusion.to);
  }
  return makeNot(conclusion.a);
}

function buildQuizItem(instance, truthValue, premiseKeySet, rng) {
  const statementToken = truthValue
    ? instance.conclusion
    : selectFoil(instance, premiseKeySet, rng);
  return {
    prompt: `From the block premises, ${formatQuizStatement(statementToken)}.`,
    answerTrue: truthValue
  };
}

export const propositionalMode = {
  wrapper: "propositional",
  buildSessionContext(sessionSeed) {
    return {
      symbols: ["P", "Q", "R", "S"],
      sessionSeed,
      blockSpecs: {}
    };
  },
  buildTokenPool(sessionContext, context = {}) {
    const blockIndex = context.blockIndex || 1;
    const spec = getBlockSpec(sessionContext, blockIndex);
    return {
      tokens: spec.premiseBank.map((token) => ({ ...token })),
      meta: {
        premiseBankLines: spec.premiseBank.map((token) => formatTokenSurface(token, "symbolic")),
        premiseRules: [spec.instanceA.ruleType, spec.instanceB.ruleType]
      }
    };
  },
  renderToken({ token, rng }) {
    const family = rng() < 0.5 ? "symbolic" : "verbal";
    return {
      type: "text",
      text: formatTokenSurface(token, family, rng),
      caption: `Premise: ${token.canonKey}`
    };
  },
  buildQuizItems({ sessionContext, blockIndex, rng }) {
    const spec = getBlockSpec(sessionContext, blockIndex);
    const premiseKeySet = new Set(spec.premiseBank.map((premise) => premise.canonKey));
    const itemAIsTrue = rng() < 0.5;
    const items = [
      buildQuizItem(spec.instanceA, itemAIsTrue, premiseKeySet, rng),
      buildQuizItem(spec.instanceB, !itemAIsTrue, premiseKeySet, rng)
    ];
    return rng() < 0.5 ? items : items.reverse();
  }
};
