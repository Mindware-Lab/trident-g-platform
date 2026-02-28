function isMessy(blockResult) {
  const wrapper = String(blockResult?.wrapper || "");
  const isHub = wrapper === "hub_cat" || wrapper === "hub_noncat";
  const noInputs = (blockResult?.hits ?? 0) + (blockResult?.falseAlarms ?? 0) === 0;

  if (isHub) {
    return Boolean(
      noInputs
        || (blockResult?.errorBursts ?? 0) >= 2
        || (blockResult?.accuracy ?? 0) < 0.7
    );
  }

  return Boolean(
    (blockResult?.lapseCount ?? 0) > 0
      || (blockResult?.errorBursts ?? 0) >= 2
      || (blockResult?.accuracy ?? 0) < 0.7
  );
}

function isStable(blockResult, outcomeBand) {
  return Boolean(
    (outcomeBand === "UP" || outcomeBand === "HOLD")
      && (blockResult?.lapseCount ?? 0) === 0
      && (blockResult?.errorBursts ?? 0) <= 1
  );
}

function pulsedRecently(completedBlocks, pulseType, lookback = 2) {
  const recent = completedBlocks.slice(-lookback);
  return recent.some((entry) => entry?.plan?.flags?.pulseType === pulseType);
}

function plateauTriggered(completedBlocks) {
  if (completedBlocks.length < 3) {
    return false;
  }
  const recent = completedBlocks.slice(-3);
  const firstPlan = recent[0]?.plan;
  if (!firstPlan) {
    return false;
  }

  const sameDials = recent.every((entry) => (
    entry?.plan?.wrapper === firstPlan.wrapper
      && entry?.plan?.speed === firstPlan.speed
      && entry?.plan?.interference === firstPlan.interference
  ));
  const holdNoDown = recent.every((entry) => entry?.outcomeBand === "HOLD");

  return sameDials && holdNoDown;
}

function otherHubWrapper(wrapper) {
  return wrapper === "hub_noncat" ? "hub_cat" : "hub_noncat";
}

function withFlags(patch, flags) {
  return {
    ...patch,
    flags: {
      coachState: flags?.coachState ?? undefined,
      pulseType: flags?.pulseType ?? null,
      swapSegment: flags?.swapSegment ?? null,
      wasSwapProbe: Boolean(flags?.wasSwapProbe)
    }
  };
}

function withRelationalFlags(patch, coachState = null) {
  return {
    ...patch,
    flags: {
      coachState,
      pulseType: null,
      swapSegment: null,
      wasSwapProbe: false
    }
  };
}

export function coachPlanSession() {
  return Array.from({ length: 10 }, (_, index) => (
    withFlags({
      blockIndex: index + 1,
      wrapper: "hub_cat",
      n: 1,
      speed: "slow",
      interference: "low"
    }, {
      coachState: "STABILISE",
      pulseType: null,
      swapSegment: null,
      wasSwapProbe: false
    })
  ));
}

export function coachUpdateAfterBlock(lastBlockResult, partialSession = {}) {
  const completedBlocks = Array.isArray(partialSession.completedBlocks)
    ? partialSession.completedBlocks
    : [];
  const coachContext = partialSession.coachContext && typeof partialSession.coachContext === "object"
    ? partialSession.coachContext
    : {};
  const nextContext = {
    pendingStabilise: Boolean(coachContext.pendingStabilise),
    pendingSwapReturnWrapper: coachContext.pendingSwapReturnWrapper || null
  };
  const outcomeBand = lastBlockResult?.outcomeBand || "HOLD";
  const messy = isMessy(lastBlockResult);
  const stable = isStable(lastBlockResult, outcomeBand);

  // Swap sandwich return path runs before generic routing.
  if (nextContext.pendingSwapReturnWrapper) {
    const wrapperA = nextContext.pendingSwapReturnWrapper;
    nextContext.pendingSwapReturnWrapper = null;

    if (messy) {
      nextContext.pendingStabilise = true;
      return {
        patch: withFlags({
          wrapper: "hub_cat",
          n: Math.max(1, (lastBlockResult?.nEnd ?? 1) - 1),
          speed: "slow",
          interference: "low"
        }, {
          coachState: "RECOVER"
        }),
        coachContext: nextContext,
        notice: "Swap probe was messy. Recovery block scheduled."
      };
    }

    if (outcomeBand === "DOWN") {
      return {
        patch: withFlags({
          wrapper: wrapperA,
          targetModality: lastBlockResult?.targetModality,
          speed: "slow",
          interference: "low"
        }, {
          coachState: "STABILISE",
          swapSegment: "A"
        }),
        coachContext: nextContext,
        notice: "Swap probe failed. Returning to wrapper A for stabilise."
      };
    }

    if (stable) {
      return {
        patch: withFlags({
          wrapper: wrapperA,
          targetModality: lastBlockResult?.targetModality
        }, {
          coachState: "SPIKE_TUNE",
          swapSegment: "A",
          wasSwapProbe: true
        }),
        coachContext: nextContext,
        notice: "Swap probe passed. Returning to wrapper A."
      };
    }
  }

  if (messy) {
    nextContext.pendingStabilise = true;
    return {
      patch: withFlags({
        wrapper: "hub_cat",
        n: Math.max(1, (lastBlockResult?.nEnd ?? 1) - 1),
        speed: "slow",
        interference: "low"
      }, {
        coachState: "RECOVER"
      }),
      coachContext: nextContext,
      notice: "Messy block detected. Recovery block scheduled."
    };
  }

  if (nextContext.pendingStabilise) {
    nextContext.pendingStabilise = false;
    return {
      patch: withFlags({
        wrapper: "hub_cat",
        speed: "slow",
        interference: "low"
      }, {
        coachState: "STABILISE"
      }),
      coachContext: nextContext,
      notice: "Recovery cleared. Running one stabilise block."
    };
  }

  if (plateauTriggered(completedBlocks)) {
    const lastPlan = completedBlocks[completedBlocks.length - 1]?.plan || {};

    if (lastPlan.interference === "low" && !pulsedRecently(completedBlocks, "interference")) {
      return {
        patch: withFlags({
          interference: "high"
        }, {
          coachState: "TUNE",
          pulseType: "interference"
        }),
        coachContext: nextContext,
        notice: "Plateau detected. Interference pulse scheduled."
      };
    }

    if (lastPlan.speed === "slow" && !pulsedRecently(completedBlocks, "speed")) {
      return {
        patch: withFlags({
          speed: "fast"
        }, {
          coachState: "TUNE",
          pulseType: "speed"
        }),
        coachContext: nextContext,
        notice: "Plateau detected. Speed pulse scheduled."
      };
    }

    const swapWrapper = otherHubWrapper(lastPlan.wrapper || "hub_cat");
    nextContext.pendingSwapReturnWrapper = lastPlan.wrapper || "hub_cat";
    return {
      patch: withFlags({
        wrapper: swapWrapper,
        targetModality: lastPlan.targetModality
      }, {
        coachState: "SPIKE_TUNE",
        swapSegment: "B",
        wasSwapProbe: true
      }),
      coachContext: nextContext,
      notice: "Plateau detected. Wrapper swap probe block scheduled."
    };
  }

  return {
    patch: withFlags({}, {
      coachState: "STABILISE"
    }),
    coachContext: nextContext,
    notice: ""
  };
}

export function relationalCoachUpdateAfterBlock(lastBlockResult, partialSession = {}) {
  const coachContext = partialSession.coachContext && typeof partialSession.coachContext === "object"
    ? partialSession.coachContext
    : {};
  const nextContext = {
    pendingStabilise: Boolean(coachContext.pendingStabilise),
    consolidateNextSession: Boolean(coachContext.consolidateNextSession)
  };
  const outcomeBand = lastBlockResult?.outcomeBand || "HOLD";
  const nEnd = Number.isFinite(lastBlockResult?.nEnd) ? lastBlockResult.nEnd : 1;
  const nStart = Number.isFinite(lastBlockResult?.nStart) ? lastBlockResult.nStart : nEnd;
  const messy = isMessy(lastBlockResult);
  const spike = outcomeBand === "UP" && nEnd > nStart;

  if (messy) {
    nextContext.pendingStabilise = true;
    return {
      patch: withRelationalFlags({
        n: Math.max(1, nEnd - 1),
        speed: "slow",
        interference: "low"
      }, "RECOVER"),
      coachContext: nextContext,
      notice: "Messy block detected. Recovery block scheduled."
    };
  }

  if (nextContext.pendingStabilise) {
    nextContext.pendingStabilise = false;
    return {
      patch: withRelationalFlags({
        n: Math.max(1, nEnd),
        speed: "slow",
        interference: "low"
      }, "STABILISE"),
      coachContext: nextContext,
      notice: "Recovery cleared. Running one stabilise block."
    };
  }

  if (spike) {
    nextContext.consolidateNextSession = true;
    return {
      patch: withRelationalFlags({}, "CONSOLIDATE"),
      coachContext: nextContext,
      notice: "Performance spike detected. Consolidate state flagged."
    };
  }

  return {
    patch: withRelationalFlags({}, null),
    coachContext: nextContext,
    notice: ""
  };
}
