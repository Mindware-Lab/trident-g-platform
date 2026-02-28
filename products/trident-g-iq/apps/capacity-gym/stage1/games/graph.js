function makeSessionId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dateLocal(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function createFakeGraphSession() {
  const tsStart = Date.now();
  const tsEnd = tsStart + 150000;

  return {
    id: makeSessionId("graph"),
    tsStart,
    tsEnd,
    dateLocal: dateLocal(tsStart),
    wrapperFamily: "relational",
    blocksPlanned: [],
    blocks: [],
    notes: {
      click: false,
      clickNote: "Stage 1 fake graph session"
    }
  };
}
