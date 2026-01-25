const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = 'relnback_v1_state';
const BLOCKS_PER_SESSION = 10;
const BASE_TRIALS_DEFAULT = 20;
const MATCH_RATE = 0.3;
const MIN_MATCHES = 3;
const N_LEVELS = [1, 2, 3];
const SPEEDS = [3000, 1500];
const GAME_MODES = [
  { id: 'graph', label: 'Graph n-back', blurb: 'Follow coloured nodes and directed edges.' },
  { id: 'transitive', label: 'Transitive n-back', blurb: 'Work with letter relations and inference.' }
];

const NODES = [
  { id: 'A', label: 'Red', colour: '#ef4444' },
  { id: 'B', label: 'Blue', colour: '#2563eb' },
  { id: 'C', label: 'Green', colour: '#22c55e' },
  { id: 'D', label: 'Yellow', colour: '#f59e0b' }
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSeed(...parts) {
  let seed = 2166136261;
  for (const p of parts) {
    seed ^= p + 0x9e3779b9 + (seed << 6) + (seed >>> 2);
    seed >>>= 0;
  }
  return seed >>> 0;
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle(rng, arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function edgeKey(edge) {
  return `${edge.from}->${edge.to}`;
}

function edgesToKey(edges) {
  return edges.map(edgeKey).sort().join('|');
}

function generateGraphWorld(rng) {
  const pairs = [];
  for (let i = 0; i < NODES.length; i += 1) {
    for (let j = 0; j < NODES.length; j += 1) {
      if (i !== j) pairs.push({ from: i, to: j });
    }
  }

  const baseEdges = [];
  const pool = shuffle(rng, pairs);
  for (const edge of pool) {
    if (baseEdges.length >= 3) break;
    if (!baseEdges.some((e) => edgeKey(e) === edgeKey(edge))) {
      baseEdges.push(edge);
    }
  }

  const baseKeys = new Set(baseEdges.map(edgeKey));
  const foilCandidates = pairs.filter((e) => !baseKeys.has(edgeKey(e)));
  const foilEdge = foilCandidates.length
    ? foilCandidates[randInt(rng, 0, foilCandidates.length - 1)]
    : pool[0];

  return { baseEdges, foilEdge };
}

function generateGraphToken(world, rng, avoidKey) {
  const pool = [...world.baseEdges, world.foilEdge];
  const options = pool.filter((edge) => edgeKey(edge) !== avoidKey);
  const pick = options.length
    ? options[randInt(rng, 0, options.length - 1)]
    : pool[0];
  return { edge: { ...pick }, key: edgeKey(pick) };
}

function relationKey(relation) {
  if (relation.type === '=') {
    const pair = [relation.a, relation.b].sort().join('|');
    return `${pair}|=`;
  }
  return `${relation.a}->${relation.b}|>`;
}

function generateTransitiveWorld(rng) {
  const letterPool = shuffle(rng, LETTERS).slice(0, 5);
  const baseLetters = letterPool.slice(0, 4);
  const pairs = [];
  for (let i = 0; i < baseLetters.length; i += 1) {
    for (let j = i + 1; j < baseLetters.length; j += 1) {
      pairs.push([baseLetters[i], baseLetters[j]]);
    }
  }

  const baseRelations = [];
  for (const pair of shuffle(rng, pairs)) {
    if (baseRelations.length >= 3) break;
    const type = rng() < 0.2 ? '=' : '>';
    const [a, b] = pair;
    if (type === '=') {
      baseRelations.push({ a, b, type });
    } else {
      const flip = rng() < 0.5;
      baseRelations.push({ a: flip ? b : a, b: flip ? a : b, type });
    }
  }

  const baseKeys = new Set(baseRelations.map(relationKey));
  const foilPairs = [];
  for (let i = 0; i < letterPool.length; i += 1) {
    for (let j = 0; j < letterPool.length; j += 1) {
      if (i === j) continue;
      const a = letterPool[i];
      const b = letterPool[j];
      const key = relationKey({ a, b, type: '>' });
      if (!baseKeys.has(key)) foilPairs.push({ a, b });
    }
  }

  const foilPick = foilPairs.length
    ? foilPairs[randInt(rng, 0, foilPairs.length - 1)]
    : { a: baseLetters[0], b: baseLetters[1] };
  const foilRelation = { a: foilPick.a, b: foilPick.b, type: '>' };

  return { letters: baseLetters, baseRelations, foilRelation };
}

function generateTransitiveToken(world, rng, avoidKey) {
  const pool = [...world.baseRelations, world.foilRelation];
  const options = pool.filter((rel) => relationKey(rel) !== avoidKey);
  const pick = options.length
    ? options[randInt(rng, 0, options.length - 1)]
    : pool[0];
  return {
    relation: { ...pick },
    key: relationKey(pick),
    displayFlip: rng() < 0.5
  };
}

function scheduleMatches(trials, nLevel, rng) {
  const maxPossible = Math.max(0, trials - nLevel);
  const minTarget = Math.max(MIN_MATCHES, Math.floor(trials * 0.28));
  const maxTarget = Math.ceil(trials * 0.32);
  let target = Math.round(trials * MATCH_RATE);
  target = clamp(target, minTarget, maxTarget);
  target = Math.min(target, maxPossible);
  if (target <= 0) return [];

  const candidates = [];
  for (let t = nLevel; t < trials; t += 1) {
    candidates.push(t);
  }

  let picks = [];
  let gap = 2;
  for (let pass = 0; pass < 2; pass += 1) {
    picks = [];
    for (const idx of shuffle(rng, candidates)) {
      if (picks.length >= target) break;
      if (picks.every((p) => Math.abs(p - idx) > gap)) {
        picks.push(idx);
      }
    }
    if (picks.length >= target) break;
    gap = 1;
  }

  if (picks.length < target) {
    for (const idx of candidates) {
      if (picks.length >= target) break;
      if (!picks.includes(idx)) picks.push(idx);
    }
  }

  return picks.sort((a, b) => a - b);
}

function generateBlock(mode, nLevel, baseTrials, rng) {
  const trials = baseTrials + nLevel;
  const world = mode === 'transitive' ? generateTransitiveWorld(rng) : generateGraphWorld(rng);
  const matchIndices = scheduleMatches(trials, nLevel, rng);
  const matchSet = new Set(matchIndices);
  const tokens = new Array(trials);

  for (let t = 0; t < trials; t += 1) {
    const prevToken = t >= nLevel ? tokens[t - nLevel] : null;
    if (matchSet.has(t) && prevToken) {
      if (mode === 'transitive') {
        tokens[t] = {
          relation: { ...prevToken.relation },
          key: prevToken.key,
          displayFlip: nextTransitiveDisplayFlip(prevToken, rng, nLevel)
        };
      } else {
        tokens[t] = { edge: { ...prevToken.edge }, key: prevToken.key };
      }
    } else {
      const avoidKey = prevToken ? prevToken.key : null;
      tokens[t] = mode === 'transitive'
        ? generateTransitiveToken(world, rng, avoidKey)
        : generateGraphToken(world, rng, avoidKey);
    }
  }

  return { trials, world, tokens, matchSet, mode };
}

function reachableExact(edges, start, end, steps) {
  let current = new Set([start]);
  for (let i = 0; i < steps; i += 1) {
    const next = new Set();
    for (const node of current) {
      for (const edge of edges) {
        if (edge.from === node) next.add(edge.to);
      }
    }
    current = next;
  }
  return current.has(end);
}

function generateGraphQuiz(world, rng) {
  const questions = [];
  const used = new Set();
  const targets = [
    { steps: 2, count: 4 },
    { steps: 3, count: 2 }
  ];

  for (const target of targets) {
    let tries = 0;
    while (questions.filter((q) => q.steps === target.steps).length < target.count && tries < 200) {
      tries += 1;
      const start = randInt(rng, 0, NODES.length - 1);
      const end = randInt(rng, 0, NODES.length - 1);
      if (start === end) continue;
      const key = `${target.steps}-${start}-${end}`;
      if (used.has(key)) continue;
      used.add(key);
      const truth = reachableExact(world.baseEdges, start, end, target.steps);
      questions.push({
        id: key,
        steps: target.steps,
        start,
        end,
        truth,
        prompt: `Can you go from ${NODES[start].label} to ${NODES[end].label} in exactly ${target.steps} moves?`
      });
    }
  }

  return questions;
}

function relationsToEdges(relations, letters) {
  const index = new Map(letters.map((l, i) => [l, i]));
  const edges = [];
  for (const rel of relations) {
    const from = index.get(rel.a);
    const to = index.get(rel.b);
    if (rel.type === '=') {
      edges.push({ from, to });
      edges.push({ from: to, to: from });
    } else {
      edges.push({ from, to });
    }
  }
  return edges;
}

function generateTransitiveQuiz(world, rng) {
  const questions = [];
  const used = new Set();
  const edges = relationsToEdges(world.baseRelations, world.letters);

  while (questions.length < 6) {
    const start = randInt(rng, 0, world.letters.length - 1);
    const end = randInt(rng, 0, world.letters.length - 1);
    if (start === end) continue;
    const key = `2-${start}-${end}`;
    if (used.has(key)) continue;
    used.add(key);
    const truth = reachableExact(edges, start, end, 2);
    const startLetter = world.letters[start];
    const endLetter = world.letters[end];
    questions.push({
      id: key,
      steps: 2,
      start,
      end,
      truth,
      prompt: `Is ${startLetter} > ${endLetter}?`
    });
  }

  return questions;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function squarePositions() {
  return [
    { x: 80, y: 80 },
    { x: 240, y: 80 },
    { x: 80, y: 240 },
    { x: 240, y: 240 }
  ];
}

function nextPositions(rng, prevOrder) {
  const base = squarePositions();
  let order = shuffle(rng, [0, 1, 2, 3]);
  if (prevOrder && order.join(',') === prevOrder.join(',')) {
    order = order.slice();
    [order[0], order[1]] = [order[1], order[0]];
  }
  const jitter = 10;
  return {
    order,
    positions: order.map((idx) => base[idx]).map((pos) => ({
      x: pos.x + randInt(rng, -jitter, jitter),
      y: pos.y + randInt(rng, -jitter, jitter)
    }))
  };
}

function nextTransitiveDisplayFlip(prevToken, rng, nLevel) {
  if (!prevToken || prevToken.relation.type !== '>') return rng() < 0.5;
  if (nLevel === 1) return !prevToken.displayFlip;
  return rng() < 0.5;
}

function useKeyPress(handler) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handler();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler]);
}

function Chart({ values }) {
  const width = 420;
  const height = 140;
  const pad = 20;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (values.length - 1);
    const y = height - pad - ((v - 1) / (max - 1 || 1)) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#2563eb"
        strokeWidth="3"
      />
      {points.map((pt, idx) => {
        const [x, y] = pt.split(',');
        return <circle key={idx} cx={x} cy={y} r="4" fill="#2563eb" />;
      })}
    </svg>
  );
}

function GraphView({ token, positions }) {
  const width = 320;
  const height = 320;
  const edge = token?.edge || null;
  const nodeRadius = 20;
  const nodeStroke = 2;
  const arrowGap = 8;

  const shortenLine = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const offset = nodeRadius + nodeStroke + arrowGap;
    const ux = dx / dist;
    const uy = dy / dist;
    return {
      x1: from.x + ux * offset,
      y1: from.y + uy * offset,
      x2: to.x - ux * offset,
      y2: to.y - uy * offset
    };
  };

  return (
    <div className="graph-board">
      <svg width={width} height={height}>
        <defs>
          <marker
            id="arrow"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L12,6 L0,12 Z" fill="#111111" />
          </marker>
        </defs>
        {edge && (() => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          const line = shortenLine(from, to);
          return (
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#111111"
              strokeWidth="6"
              strokeLinecap="round"
              markerEnd="url(#arrow)"
            />
          );
        })()}
        {positions.map((pos, idx) => (
          <g key={NODES[idx].id}>
            <circle cx={pos.x} cy={pos.y} r={nodeRadius} fill={NODES[idx].colour} />
            <circle cx={pos.x} cy={pos.y} r={nodeRadius + 4} fill="none" stroke="#111111" strokeWidth={nodeStroke} />
          </g>
        ))}
      </svg>
    </div>
  );
}

function TransitiveView({ token }) {
  if (!token?.relation) return null;
  const { a, b, type } = token.relation;
  let left = a;
  let right = b;
  let symbol = type;
  if (type === '>') {
    if (token.displayFlip) {
      left = b;
      right = a;
      symbol = '<';
    }
  }

  return (
    <div className="relation-card">
      <div className="relation-text">
        <span>{left}</span>
        <span>{symbol}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function App() {
  const stored = useMemo(loadState, []);
  const [sessionNumber, setSessionNumber] = useState(stored?.sessionNumber || 0);
  const [lastNLevel, setLastNLevel] = useState(stored?.lastNLevel || 1);
  const [speedMs, setSpeedMs] = useState(stored?.lastSpeedMs || 3000);
  const [baseTrials, setBaseTrials] = useState(stored?.lastBaseTrials || BASE_TRIALS_DEFAULT);
  const [sessions, setSessions] = useState(stored?.sessions || []);
  const [gameMode, setGameMode] = useState(stored?.lastGameMode || 'graph');
  const [screen, setScreen] = useState('gameSelect');
  const [currentBlock, setCurrentBlock] = useState(0);
  const [nLevel, setNLevel] = useState(1);
  const [blockData, setBlockData] = useState(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const initialPos = nextPositions(mulberry32(1), null);
  const positionsOrderRef = useRef(initialPos.order);
  const [positions, setPositions] = useState(initialPos.positions);
  const [blockStats, setBlockStats] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [sessionBlocks, setSessionBlocks] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const sessionSeedRef = useRef(Date.now());
  const rngRef = useRef(mulberry32(1));

  const responseRef = useRef(false);
  const statsRef = useRef({
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0
  });

  useKeyPress(() => {
    if (screen !== 'trials') return;
    if (responseRef.current) return;
    responseRef.current = true;
  });

  const lastSession = [...sessions].reverse().find((s) => (s.mode || 'graph') === gameMode) || null;

  const startSession = () => {
    sessionSeedRef.current = Date.now();
    setSessionBlocks([]);
    setCurrentBlock(0);
    setNLevel(1);
    beginBlock(0, 1, gameMode);
  };

  const selectMode = (modeId) => {
    setGameMode(modeId);
    setScreen('home');
    setShowChart(false);
    setShowHelp(true);
  };

  const beginBlock = (blockIndex, nextN, mode) => {
    const seed = makeSeed(sessionSeedRef.current, blockIndex + 1, nextN);
    rngRef.current = mulberry32(seed);
    const data = generateBlock(mode, nextN, baseTrials, rngRef.current);
    setBlockData(data);
    setTrialIndex(0);
    const nextPos = nextPositions(rngRef.current, positionsOrderRef.current);
    positionsOrderRef.current = nextPos.order;
    setPositions(nextPos.positions);
    statsRef.current = { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
    setBlockStats(null);
    setQuizData([]);
    setQuizAnswers({});
    setScreen('trials');
  };

  useEffect(() => {
    if (screen !== 'trials' || !blockData) return;
    if (trialIndex >= blockData.trials) {
      const questions = blockData.mode === 'transitive'
        ? generateTransitiveQuiz(blockData.world, rngRef.current)
        : generateGraphQuiz(blockData.world, rngRef.current);
      setQuizData(questions);
      setQuizAnswers({});
      setScreen('quiz');
      return;
    }

    responseRef.current = false;
    const nextPos = nextPositions(rngRef.current, positionsOrderRef.current);
    positionsOrderRef.current = nextPos.order;
    setPositions(nextPos.positions);

    const timer = setTimeout(() => {
      const match = blockData.matchSet.has(trialIndex);
      const responded = responseRef.current;
      if (match && responded) statsRef.current.hits += 1;
      if (match && !responded) statsRef.current.misses += 1;
      if (!match && responded) statsRef.current.falseAlarms += 1;
      if (!match && !responded) statsRef.current.correctRejections += 1;
      setTrialIndex((t) => t + 1);
    }, speedMs);

    return () => clearTimeout(timer);
  }, [screen, blockData, trialIndex, speedMs]);

  useEffect(() => {
    if (screen !== 'quiz' || quizData.length === 0) return;
    if (Object.keys(quizAnswers).length !== quizData.length) return;

    const correct = quizData.reduce((sum, q) => {
      return sum + (quizAnswers[q.id] === q.truth ? 1 : 0);
    }, 0);
    const quizAccuracy = correct / quizData.length;

    const totalTrials = blockData.trials;
    const { hits, misses, falseAlarms, correctRejections } = statsRef.current;
    const accuracy = (hits + correctRejections) / totalTrials;

    const stats = {
      blockIndex: currentBlock + 1,
      nLevel,
      trials: totalTrials,
      accuracy,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      quizAccuracy,
      speedMs,
      mode: gameMode
    };

    setBlockStats(stats);
    setScreen('blockSummary');
  }, [screen, quizData, quizAnswers, blockData, currentBlock, nLevel, speedMs]);

  const handleQuizAnswer = (id, value) => {
    setQuizAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const nextLevel = (accuracy) => {
    if (accuracy > 0.85) return clamp(nLevel + 1, 1, 3);
    if (accuracy < 0.7) return clamp(nLevel - 1, 1, 3);
    return nLevel;
  };

  const continueAfterBlock = () => {
    const nextN = nextLevel(blockStats.accuracy);
    const updatedBlocks = [...sessionBlocks, blockStats];
    setSessionBlocks(updatedBlocks);

    if (currentBlock + 1 >= BLOCKS_PER_SESSION) {
      const newSessionNumber = sessionNumber + 1;
      const newSessions = [
        ...sessions,
        { timestamp: new Date().toISOString(), blocks: updatedBlocks, mode: gameMode }
      ];
      const state = {
        sessionNumber: newSessionNumber,
        lastNLevel: nextN,
        lastSpeedMs: speedMs,
        lastBaseTrials: baseTrials,
        lastGameMode: gameMode,
        sessions: newSessions
      };
      saveState(state);
      setSessionNumber(newSessionNumber);
      setLastNLevel(nextN);
      setSessions(newSessions);
      setScreen('sessionEnd');
      return;
    }

    setCurrentBlock((b) => b + 1);
    setNLevel(nextN);
    beginBlock(currentBlock + 1, nextN, gameMode);
  };

  useEffect(() => {
    if (screen !== 'home') return;
    const state = {
      sessionNumber,
      lastNLevel,
      lastSpeedMs: speedMs,
      lastBaseTrials: baseTrials,
      lastGameMode: gameMode,
      sessions
    };
    saveState(state);
  }, [screen, sessionNumber, lastNLevel, speedMs, baseTrials, sessions]);

  const displaySessionNumber = screen === 'home' || screen === 'gameSelect'
    ? sessionNumber
    : screen === 'sessionEnd'
      ? sessionNumber
      : sessionNumber + 1;

  const modeMeta = GAME_MODES.find((m) => m.id === gameMode) || GAME_MODES[0];
  const accuracyPercent = (value) => `${Math.round(value * 100)}%`;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-badge">N</div>
          <div>
            <p className="brand-title">Relational N-Back</p>
            <p className="brand-subtitle">{modeMeta.label}</p>
          </div>
        </div>
        <div className="pill">Session {displaySessionNumber}</div>
      </div>

      <div className="content">
        {screen === 'gameSelect' && (
          <div className="panel">
            <div className="card">
              <h1 className="title">Choose a game</h1>
              <p className="subtitle">Pick a relational n-back variant to start your session.</p>
              <div className="stat-grid" style={{ marginTop: 16 }}>
                {GAME_MODES.map((mode) => (
                  <div key={mode.id} className="stat">
                    <div className="stat-label">{mode.label}</div>
                    <div className="subtitle" style={{ marginTop: 8 }}>{mode.blurb}</div>
                    <button
                      className="btn"
                      style={{ marginTop: 12, width: '100%' }}
                      onClick={() => selectMode(mode.id)}
                    >
                      Choose {mode.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === 'home' && (
          <div className="panel">
            <div className="card">
            <h1 className="title">Start a new session</h1>
            <p className="subtitle">
              Ten blocks. Each block includes N-back trials followed by a short relational quiz.
            </p>
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn" onClick={startSession}>Start session</button>
              <button className="btn btn-ghost" onClick={() => setShowChart(false)}>Reset chart</button>
              <button className="btn btn-ghost" onClick={() => setScreen('gameSelect')}>Change game</button>
            </div>
            <div className="card card--soft" style={{ marginTop: 16 }}>
              <div className="row">
                <div className="pill">Base trials: {baseTrials}</div>
                <div className="pill">Speed: {speedMs} ms</div>
                <div className="pill">Last N: {lastNLevel}</div>
              </div>
              <p className="subtitle" style={{ marginTop: 10 }}>
                Adjust base trials to set the block length for this session.
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <label className="input-label" htmlFor="baseTrials">
                  Base trials
                </label>
                <input
                  id="baseTrials"
                  type="range"
                  min="15"
                  max="30"
                  step="1"
                  value={baseTrials}
                  onChange={(e) => setBaseTrials(parseInt(e.target.value, 10))}
                  className="input-range"
                />
                <span className="input-value">{baseTrials}</span>
              </div>
            </div>

            {lastSession && (
              <div className="card card--soft" style={{ marginTop: 16 }}>
                <h2 className="title" style={{ fontSize: 20 }}>Last session summary</h2>
                <p className="subtitle">Completed on {new Date(lastSession.timestamp).toLocaleString()}.</p>
                <div className="stat-grid" style={{ marginTop: 12 }}>
                  <div className="stat">
                    <div className="stat-label">Blocks</div>
                    <div className="stat-value">{lastSession.blocks.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Final N</div>
                    <div className="stat-value">{lastSession.blocks[lastSession.blocks.length - 1]?.nLevel}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Average accuracy</div>
                    <div className="stat-value">
                      {accuracyPercent(
                        lastSession.blocks.reduce((s, b) => s + b.accuracy, 0) / lastSession.blocks.length
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card card--soft" style={{ marginTop: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h2 className="title" style={{ fontSize: 20, marginBottom: 0 }}>How to play</h2>
                <button className="btn btn-ghost" onClick={() => setShowHelp((v) => !v)}>
                  {showHelp ? 'Hide' : 'Show'}
                </button>
              </div>
              {showHelp && (
                <ul className="help-list">
                  <li>
                    {gameMode === 'transitive'
                      ? 'Watch the relation and press Match (or Space) if it matches n-back, even when the letter order flips.'
                      : 'Watch the single edge and press Match (or Space) if it matches n-back.'
                    }
                  </li>
                  <li>Do nothing for non-matches. Accuracy counts non-response trials.</li>
                  <li>
                    {gameMode === 'transitive'
                      ? 'Each block ends with True/False questions on two-step inference.'
                      : 'Each block ends with a True/False quiz on 2- and 3-move relations.'
                    }
                  </li>
                  <li>N levels adjust block-to-block based on accuracy.</li>
                </ul>
              )}
            </div>
            </div>
          </div>
        )}

        {screen === 'trials' && blockData && (
          <div className="panel">
            <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h1 className="title">Block {currentBlock + 1}</h1>
                <p className="subtitle">
                  Press Match (or Space) when the {blockData.mode === 'transitive' ? 'relation' : 'edge'} matches {nLevel}-back.
                </p>
              </div>
              <div className="stack">
                <div className="pill">N = {nLevel}</div>
                <div className="pill">{speedMs} ms</div>
              </div>
            </div>

            {showBanner && (
              <div className="banner">
                <div>
                  Block {currentBlock + 1} • N = {nLevel} • {speedMs} ms • Base trials {baseTrials}
                </div>
                <button className="btn btn-ghost" onClick={() => setShowBanner(false)}>
                  Hide
                </button>
              </div>
            )}

            <div className="arena" style={{ marginTop: 16 }}>
              {blockData.mode === 'transitive'
                ? <TransitiveView token={blockData.tokens[trialIndex]} />
                : <GraphView token={blockData.tokens[trialIndex]} positions={positions} />
              }
              <div className="stack">
                <div className="graph-meta">
                  <span>Trial {Math.min(trialIndex + 1, blockData.trials)} / {blockData.trials}</span>
                  <span>Matches scheduled: {blockData.matchSet.size}</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${(trialIndex / blockData.trials) * 100}%` }}
                  />
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => { if (!responseRef.current) responseRef.current = true; }}
                >
                  Match
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {screen === 'quiz' && (
          <div className="panel">
            <div className="card">
            <h1 className="title">Relational quiz</h1>
            <p className="subtitle">Answer True or False for each question.</p>
            <div className="quiz-list" style={{ marginTop: 16 }}>
              {quizData.map((q, idx) => (
                <div key={q.id} className="quiz-item">
                  <div>
                    Q{idx + 1}. {q.prompt}
                  </div>
                  <div className="btn-group">
                    <button
                      className={`btn ${quizAnswers[q.id] === true ? '' : 'btn-ghost'}`}
                      onClick={() => handleQuizAnswer(q.id, true)}
                    >
                      True
                    </button>
                    <button
                      className={`btn ${quizAnswers[q.id] === false ? '' : 'btn-ghost'}`}
                      onClick={() => handleQuizAnswer(q.id, false)}
                    >
                      False
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {screen === 'blockSummary' && blockStats && (
          <div className="panel">
            <div className="card">
            <h1 className="title">Block {blockStats.blockIndex} results</h1>
            <div className="stat-grid" style={{ marginTop: 12 }}>
              <div className="stat">
                <div className="stat-label">Accuracy</div>
                <div className="stat-value">{accuracyPercent(blockStats.accuracy)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Hits</div>
                <div className="stat-value">{blockStats.hits}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Misses</div>
                <div className="stat-value">{blockStats.misses}</div>
              </div>
              <div className="stat">
                <div className="stat-label">False alarms</div>
                <div className="stat-value">{blockStats.falseAlarms}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Correct rejections</div>
                <div className="stat-value">{blockStats.correctRejections}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Quiz accuracy</div>
                <div className="stat-value">{accuracyPercent(blockStats.quizAccuracy)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Current N</div>
                <div className="stat-value">{blockStats.nLevel}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Next N</div>
                <div className="stat-value">{nextLevel(blockStats.accuracy)}</div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <div className="toggle">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    className={speedMs === speed ? 'active' : ''}
                    onClick={() => setSpeedMs(speed)}
                  >
                    {speed} ms
                  </button>
                ))}
              </div>
              <button className="btn" onClick={continueAfterBlock}>
                {currentBlock + 1 >= BLOCKS_PER_SESSION ? 'Finish session' : 'Next block'}
              </button>
            </div>
            </div>
          </div>
        )}

        {screen === 'sessionEnd' && (
          <div className="panel">
            <div className="card">
            <h1 className="title">Session complete</h1>
            <p className="subtitle">Here is your summary for blocks 1 to {sessionBlocks.length}.</p>
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Block</th>
                  <th>N</th>
                  <th>Trials</th>
                  <th>Accuracy</th>
                  <th>Hits</th>
                  <th>Misses</th>
                  <th>False alarms</th>
                  <th>Correct rejections</th>
                  <th>Quiz</th>
                </tr>
              </thead>
              <tbody>
                {sessionBlocks.map((b) => (
                  <tr key={`block-${b.blockIndex}`}>
                    <td>{b.blockIndex}</td>
                    <td>{b.nLevel}</td>
                    <td>{b.trials}</td>
                    <td>{accuracyPercent(b.accuracy)}</td>
                    <td>{b.hits}</td>
                    <td>{b.misses}</td>
                    <td>{b.falseAlarms}</td>
                    <td>{b.correctRejections}</td>
                    <td>{accuracyPercent(b.quizAccuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowChart((v) => !v)}>
                {showChart ? 'Hide N chart' : 'Show N chart'}
              </button>
              <button className="btn" onClick={() => setScreen('home')}>Back to home</button>
            </div>

            {showChart && (
              <div style={{ marginTop: 12 }}>
                <Chart values={sessionBlocks.map((b) => b.nLevel)} />
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
