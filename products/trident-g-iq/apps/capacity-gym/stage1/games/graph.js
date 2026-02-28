import { createSeededRng, hash32, randomInt } from "../lib/rng.js";

const NODE_IDS = ["R", "G", "B", "Y"];
const NODE_COLORS = {
  R: "#dc2626",
  G: "#16a34a",
  B: "#2563eb",
  Y: "#f59e0b"
};
const NODE_RADIUS_PCT = 9;

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

function projectArrowToNodeEdges(fromPos, toPos, nodeRadiusPct = NODE_RADIUS_PCT) {
  const dx = toPos.xPct - fromPos.xPct;
  const dy = toPos.yPct - fromPos.yPct;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.0001) {
    return {
      x1: fromPos.xPct,
      y1: fromPos.yPct,
      x2: toPos.xPct,
      y2: toPos.yPct
    };
  }

  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: fromPos.xPct + (ux * nodeRadiusPct),
    y1: fromPos.yPct + (uy * nodeRadiusPct),
    x2: toPos.xPct - (ux * nodeRadiusPct),
    y2: toPos.yPct - (uy * nodeRadiusPct)
  };
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

function slotTruth(blockIndex, slotIndex) {
  const oddBlock = (Math.max(1, blockIndex) % 2) === 1;
  return slotIndex === 0 ? oddBlock : !oddBlock;
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
    return {
      blockSeed
    };
  },
  renderToken({ token, trialIndex, blockVisualState, rng }) {
    const trialSeed = hash32(`${blockVisualState.blockSeed}:trial:${trialIndex}`);
    const trialRng = createSeededRng(trialSeed);
    const rotationDeg = trialRng() * 360;
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
    const arrow = projectArrowToNodeEdges(fromPos, toPos);

    return {
      type: "graph",
      nodes,
      arrow,
      caption
    };
  },
  buildQuizItems({ blockIndex }) {
    const slotATrue = slotTruth(blockIndex, 0);
    const slotBTrue = slotTruth(blockIndex, 1);

    return [
      {
        prompt: promptForPath(slotATrue ? "R" : "B", slotATrue ? "B" : "R"),
        answerTrue: slotATrue
      },
      {
        prompt: promptForPath(slotBTrue ? "G" : "Y", slotBTrue ? "Y" : "G"),
        answerTrue: slotBTrue
      }
    ];
  }
};

