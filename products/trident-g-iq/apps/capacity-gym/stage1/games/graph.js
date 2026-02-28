import { createSeededRng, hash32, randomInt } from "../lib/rng.js";

const NODE_IDS = ["R", "G", "B", "Y"];
const NODE_COLORS = {
  R: "#dc2626",
  G: "#16a34a",
  B: "#2563eb",
  Y: "#f59e0b"
};

function shuffle(values, rng) {
  const list = values.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

function buildArenaSlots(rotationDeg, radiusPct = 42) {
  const slots = [];
  for (let i = 0; i < 4; i += 1) {
    const thetaDeg = rotationDeg + (i * 90);
    const theta = (thetaDeg * Math.PI) / 180;
    slots.push({
      xPct: 50 + (radiusPct * Math.cos(theta)),
      yPct: 50 + (radiusPct * Math.sin(theta))
    });
  }
  return slots;
}

function makeEdgeToken(from, to) {
  return {
    canonKey: `EDGE:${from}->${to}`,
    from,
    to
  };
}

function promptForPath(from, to) {
  return `Is there a path from ${from} to ${to} in exactly 2 steps?`;
}

export const graphMode = {
  wrapper: "graph",
  buildSessionContext() {
    return {
      nodeIds: NODE_IDS.slice()
    };
  },
  buildTokenPool() {
    return [
      makeEdgeToken("R", "G"),
      makeEdgeToken("G", "B"),
      makeEdgeToken("B", "Y")
    ];
  },
  buildBlockVisualState(_sessionContext, blockSeed) {
    const rng = createSeededRng(blockSeed);
    return {
      blockSeed,
      baseRotationDeg: rng() * 360
    };
  },
  renderToken({ token, trialIndex, blockVisualState, rng }) {
    const trialSeed = hash32(`${blockVisualState.blockSeed}:trial:${trialIndex}`);
    const trialRng = createSeededRng(trialSeed);
    const rotationDeg = (blockVisualState.baseRotationDeg + (trialRng() * 360)) % 360;
    const slots = buildArenaSlots(rotationDeg, 42);
    const shuffledIds = shuffle(NODE_IDS, trialRng);
    const mapping = {};
    for (let i = 0; i < shuffledIds.length; i += 1) {
      mapping[shuffledIds[i]] = i;
    }

    const fromPos = slots[mapping[token.from]];
    const toPos = slots[mapping[token.to]];
    const nodes = NODE_IDS.map((nodeId) => {
      const slot = slots[mapping[nodeId]];
      return {
        nodeId,
        colorHex: NODE_COLORS[nodeId],
        xPct: slot.xPct,
        yPct: slot.yPct
      };
    });
    const caption = rng() < 0.5
      ? `Edge: ${token.from} -> ${token.to}`
      : `Edge: ${token.to} <- ${token.from}`;

    return {
      type: "graph",
      nodes,
      arrow: {
        x1: fromPos.xPct,
        y1: fromPos.yPct,
        x2: toPos.xPct,
        y2: toPos.yPct
      },
      caption
    };
  },
  buildQuizItems({ rng }) {
    const truths = [
      { from: "R", to: "B" },
      { from: "G", to: "Y" }
    ];
    const falseCandidates = [
      { from: "R", to: "Y" }, // exact-3, not exact-2
      { from: "Y", to: "R" },
      { from: "B", to: "R" }
    ];

    const trueItem = truths[randomInt(rng, 0, truths.length - 1)];
    const falseItem = falseCandidates[randomInt(rng, 0, falseCandidates.length - 1)];
    const items = [
      {
        prompt: promptForPath(trueItem.from, trueItem.to),
        answerTrue: true
      },
      {
        prompt: promptForPath(falseItem.from, falseItem.to),
        answerTrue: false
      }
    ];

    return rng() < 0.5 ? items : items.reverse();
  }
};

