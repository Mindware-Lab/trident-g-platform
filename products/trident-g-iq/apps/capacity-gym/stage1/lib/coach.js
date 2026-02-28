export function coachPlanSession() {
  return Array.from({ length: 10 }, (_, index) => ({
    blockIndex: index + 1,
    wrapper: "hub_cat",
    n: 1,
    speed: "slow",
    interference: "low"
  }));
}

export function coachUpdateAfterBlock() {
  return {};
}
