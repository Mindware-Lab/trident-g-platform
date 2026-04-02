const STORAGE_KEYS = {
  pack: "trident-g-pack",
  mission: "trident-g-mission"
};

const defaultState = {
  pack: "performance",
  mission: "understand"
};

const missionConfig = {
  performance: {
    packLabel: "Performance Pack",
    packCopy: "Optimise focused performance by chaining viability, capacity, reasoning, and mission grammar into one transfer-aware run.",
    telemetryFocus: "Zone stability, g lift, working-memory hold, and syntax-swap carryover.",
    understand: {
      label: "Understand",
      cardCopy: "Map what is going on.",
      copy: "Current run foregrounds map-building, abstraction, and syntax-stable comprehension.",
      reasoning: "Mapping, analogy, probe",
      mission: "Understand frame scenario",
      title: "Understand - Scenario 04",
      brief: "Build the simplest map that explains why two product signals diverged after the same release, then pick the most informative next check.",
      runSummary: "Capacity stabilises the map, reasoning sharpens the map, and mission grammar turns the map into a next move.",
      capacityTask: "Shield and Hold - Dual Stream",
      capacityHint: "Match position or symbol while preserving a stable task-set.",
      reasoningTask: "Syntax Stable Distinction",
      reasoningHint: "Preserve the same relation while shifting syntax or wrapper.",
      transferTask: "Swap symbol burst into a spatial wrapper without losing pace."
    },
    choose: {
      label: "Choose",
      cardCopy: "Make tradeoffs under uncertainty.",
      copy: "Current run foregrounds tradeoffs, uncertainty handling, and cleaner commitment under pressure.",
      reasoning: "Comparison, evaluation, commit",
      mission: "Choose frame scenario",
      title: "Choose - Scenario 03",
      brief: "A team has two viable launch options with different upside, risk, and time cost. Pick the next question that best separates them before committing.",
      runSummary: "Capacity protects working bandwidth, reasoning sharpens tradeoffs, and mission grammar improves justified commitment.",
      capacityTask: "Hold and Compare - Split Stream",
      capacityHint: "Maintain two candidate options without drift while switching focus cleanly.",
      reasoningTask: "Tradeoff Relation Check",
      reasoningHint: "Compare relative gains, costs, and constraints without overbuilding the map.",
      transferTask: "Retest the same choice logic in a new decision wrapper."
    },
    plan: {
      label: "Plan and Do",
      cardCopy: "Turn the map into action.",
      copy: "Current run foregrounds sequence quality, execution monitoring, and adaptive follow-through.",
      reasoning: "Sequence, probe, execute",
      mission: "Plan and Do scenario",
      title: "Plan and Do - Scenario 05",
      brief: "Turn a rough map into a short executable plan with a check, a boundary, and a stop rule before resources are committed.",
      runSummary: "Capacity protects sequence stability, reasoning clarifies dependencies, and mission grammar shapes executable action.",
      capacityTask: "Re-entry and Sequence Hold",
      capacityHint: "Resume the action chain after interruption without losing the next critical step.",
      reasoningTask: "Dependency Map Probe",
      reasoningHint: "Identify the smallest missing dependency before committing to the next step.",
      transferTask: "Run the plan logic again in a different execution context."
    },
    learn: {
      label: "Learn",
      cardCopy: "Acquire and transfer a script.",
      copy: "Current run foregrounds acquisition, early transfer, and script installation under wrapper variation.",
      reasoning: "Abstract, instantiate, validate",
      mission: "Learn frame scenario",
      title: "Learn - Scenario 02",
      brief: "Extract the invariant from a newly trained pattern, then reapply it in a slightly different wrapper without losing the structure.",
      runSummary: "Capacity keeps the pattern active, reasoning extracts the invariant, and mission grammar converts the invariant into a reusable script.",
      capacityTask: "Encode and Hold - Pattern Burst",
      capacityHint: "Retain the candidate rule long enough to test it in another wrapper.",
      reasoningTask: "Invariant Extraction",
      reasoningHint: "Strip surface familiarity and keep only what actually travels.",
      transferTask: "Retest the same script under a syntax swap before banking."
    }
  },
  resilience: {
    packLabel: "Resilience Pack",
    packCopy: "Reduce overload, re-enter faster, and build mission control that survives pressure, salience spikes, and interruption.",
    telemetryFocus: "Drift reduction, recovery speed, interference control, and wrapper-stable scripts.",
    understand: {
      label: "Create Distance",
      cardCopy: "Reduce salience hijack and map clearly.",
      copy: "Current run foregrounds cleaner mapping under pressure and reduced salience hijack.",
      reasoning: "Re-represent, evaluate, distance",
      mission: "Distance scenario",
      title: "Create Distance - Scenario 02",
      brief: "A high-pressure message just arrived. Build a calmer map of what is known, what is guessed, and what should be checked next.",
      runSummary: "Capacity reduces overload, reasoning reframes the signal, and mission grammar keeps the loop clean under pressure.",
      capacityTask: "Shield and Re-enter",
      capacityHint: "Protect the task-set from salience spikes and restore clean hold.",
      reasoningTask: "Re-representation Check",
      reasoningHint: "Shift frame or level without losing the important structure.",
      transferTask: "Test the distancing routine in a different emotional wrapper."
    },
    choose: {
      label: "Prioritise",
      cardCopy: "Rank loops and prevent thrash.",
      copy: "Current run foregrounds mission ranking, interference control, and reduced thrash.",
      reasoning: "Tradeoff, threshold, order",
      mission: "Prioritise scenario",
      title: "Prioritise - Scenario 06",
      brief: "Three loops are competing for attention. Choose what to do now, what to park, and what to externalise without drifting out of band.",
      runSummary: "Capacity reduces interference, reasoning separates value from urgency, and mission grammar supports cleaner prioritisation.",
      capacityTask: "Attention Arbitration Burst",
      capacityHint: "Hold the active target while suppressing lower-value captures.",
      reasoningTask: "Priority Threshold Check",
      reasoningHint: "Separate consequence, urgency, and effort before choosing the next loop.",
      transferTask: "Apply the same prioritisation rule in a new daily-life wrapper."
    },
    plan: {
      label: "Recover and Re-enter",
      cardCopy: "Restore viability after overload.",
      copy: "Current run foregrounds restoring clean execution after overload or interruption.",
      reasoning: "Stabilise, simplify, restart",
      mission: "Recover scenario",
      title: "Recover - Scenario 01",
      brief: "The task-set slipped after interruption. Pick the smallest restart sequence that restores viable re-entry without overloading the loop.",
      runSummary: "Capacity rebuilds hold, reasoning simplifies the map, and mission grammar selects the smallest viable restart.",
      capacityTask: "Re-entry Lock",
      capacityHint: "Rebuild the active set with minimal overhead after a slip.",
      reasoningTask: "Simplify Before Push",
      reasoningHint: "Reduce model weight before taking the next step.",
      transferTask: "Run the same recovery script under a different interruption pattern."
    },
    learn: {
      label: "Calibrate Mode",
      cardCopy: "Switch between widening and tightening.",
      copy: "Current run foregrounds switching between widening and tightening without panic-grind.",
      reasoning: "Mode shift, abstraction, control",
      mission: "Calibrate scenario",
      title: "Calibrate Mode - Scenario 03",
      brief: "Decide whether the next move should widen search or tighten execution, then justify the switch with one clear signal.",
      runSummary: "Capacity preserves control stability, reasoning chooses the right frame, and mission grammar sets the correct mode policy.",
      capacityTask: "Mode Switch Burst",
      capacityHint: "Shift cleanly between two control states without leaving the corridor.",
      reasoningTask: "Mode Signal Test",
      reasoningHint: "Use one clean signal to decide whether to widen or tighten.",
      transferTask: "Retest the mode rule in a different task family."
    }
  },
  longevity: {
    packLabel: "Longevity Pack",
    packCopy: "Build reliable everyday cognition with low-friction routines, lower drift, and stronger delayed carryover.",
    telemetryFocus: "Routine hold, everyday g support, delayed transfer, and cue-fired script durability.",
    understand: {
      label: "Understand",
      cardCopy: "Clarify everyday signals with low drift.",
      copy: "Current run foregrounds everyday clarity, low-drift comprehension, and wrapper-stable routines.",
      reasoning: "Map, simplify, retain",
      mission: "Everyday understanding scenario",
      title: "Understand - Everyday Scenario",
      brief: "A routine changed and two reminders now conflict. Build a simple map that clarifies what changed and what should happen next.",
      runSummary: "Capacity supports stable hold, reasoning simplifies everyday structure, and mission grammar improves reliable follow-through.",
      capacityTask: "Low-Drift Hold",
      capacityHint: "Keep the practical details active without overloading the loop.",
      reasoningTask: "Everyday Clarity Check",
      reasoningHint: "Map only what is needed for the next safe move.",
      transferTask: "Retest the same routine logic in another familiar daily wrapper."
    },
    choose: {
      label: "Choose",
      cardCopy: "Make reliable practical tradeoffs.",
      copy: "Current run foregrounds practical tradeoffs, pacing, and reliable next moves.",
      reasoning: "Compare, pace, commit",
      mission: "Everyday choice scenario",
      title: "Choose - Everyday Scenario",
      brief: "You have limited time, energy, and two useful errands. Pick the next best move with the least drift and the highest payoff.",
      runSummary: "Capacity protects control under low energy, reasoning compares tradeoffs, and mission grammar improves reliable commitment.",
      capacityTask: "Pace and Hold",
      capacityHint: "Keep the best next move active without rushing or hovering.",
      reasoningTask: "Practical Tradeoff Check",
      reasoningHint: "Balance payoff, effort, and timing in one clean comparison.",
      transferTask: "Retest the same tradeoff logic in another everyday decision."
    },
    plan: {
      label: "Plan and Do",
      cardCopy: "Build cue-fired routines with low friction.",
      copy: "Current run foregrounds routine reliability, re-entry, and lower execution friction.",
      reasoning: "Sequence, cue, action",
      mission: "Routine planning scenario",
      title: "Plan and Do - Everyday Scenario",
      brief: "Turn a small health routine into a cue-fired plan with one checkpoint and one safe stop rule.",
      runSummary: "Capacity reduces execution slips, reasoning clarifies the sequence, and mission grammar converts the sequence into a daily routine.",
      capacityTask: "Routine Sequence Hold",
      capacityHint: "Keep the cue, step, and checkpoint aligned through the burst.",
      reasoningTask: "Cue to Action Check",
      reasoningHint: "Test whether the stored cue really leads to the intended next step.",
      transferTask: "Try the same routine in a new time or location wrapper."
    },
    learn: {
      label: "Learn",
      cardCopy: "Retain and reuse practical scripts.",
      copy: "Current run foregrounds retention, wrapper stability, and practical carryover into daily use.",
      reasoning: "Repeat, swap, carry",
      mission: "Everyday learning scenario",
      title: "Learn - Everyday Scenario",
      brief: "A new cueing rule worked in training. Pick the best wrapper swap to test whether it travels into normal daily use.",
      runSummary: "Capacity keeps the cue active, reasoning checks portability, and mission grammar helps the script survive into everyday use.",
      capacityTask: "Retain and Re-fire",
      capacityHint: "Hold the new cue long enough to retrieve it on demand.",
      reasoningTask: "Carryover Validation",
      reasoningHint: "Confirm the script travels for the right reason, not just from recent practice.",
      transferTask: "Retest the cueing rule under a delayed real-world wrapper."
    }
  }
};

const page = document.body.dataset.page || "";

function readStateValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStateValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage failures so the prototype still runs from file:// or privacy-restricted contexts.
  }
}

function getStoredState() {
  const storedPack = readStateValue(STORAGE_KEYS.pack) || defaultState.pack;
  const pack = missionConfig[storedPack] ? storedPack : defaultState.pack;
  const storedMission = readStateValue(STORAGE_KEYS.mission) || defaultState.mission;
  const mission = missionConfig[pack][storedMission] ? storedMission : defaultState.mission;

  return {
    pack,
    mission
  };
}

function saveState(pack, mission) {
  writeStateValue(STORAGE_KEYS.pack, pack);
  writeStateValue(STORAGE_KEYS.mission, mission);
}

const storedState = getStoredState();
let activePack = storedState.pack;
let activeMission = storedState.mission;

function getMissionState() {
  return missionConfig[activePack][activeMission];
}

function setActive(group, matcher) {
  group.forEach((item) => {
    item.classList.toggle("active", matcher(item));
  });
}

function syncLauncher() {
  const launcherSelection = document.getElementById("launcherSelection");
  if (!launcherSelection) {
    return;
  }

  const missionState = getMissionState();
  launcherSelection.textContent = `${missionConfig[activePack].packLabel} | ${missionState.label}`;
}

function syncMissionCards() {
  const missionCards = document.querySelectorAll(".mission-card");
  missionCards.forEach((card) => {
    const missionKey = card.dataset.mission;
    const mission = missionConfig[activePack][missionKey];
    const name = card.querySelector(".mission-name");
    const copy = card.querySelector(".mission-copy");

    if (name) {
      name.textContent = mission.label;
    }
    if (copy) {
      copy.textContent = mission.cardCopy;
    }

    card.classList.toggle("active", missionKey === activeMission);
  });
}

function syncGLoop() {
  const missionState = getMissionState();
  const packState = missionConfig[activePack];
  const selectedMissionLabel = document.getElementById("selectedMissionLabel");
  const selectedMissionCopy = document.getElementById("selectedMissionCopy");
  const selectedPackLabel = document.getElementById("selectedPackLabel");
  const selectedPackCopy = document.getElementById("selectedPackCopy");
  const selectedTelemetryFocus = document.getElementById("selectedTelemetryFocus");
  const reasoningFocus = document.getElementById("reasoningFocus");
  const missionFocus = document.getElementById("missionFocus");
  const mapMissionLabel = document.getElementById("mapMissionLabel");
  const packChips = document.querySelectorAll(".pack-chip");

  syncMissionCards();
  setActive(packChips, (chip) => chip.dataset.pack === activePack);

  if (selectedPackLabel) {
    selectedPackLabel.textContent = packState.packLabel;
  }
  if (selectedPackCopy) {
    selectedPackCopy.textContent = packState.packCopy;
  }
  if (selectedTelemetryFocus) {
    selectedTelemetryFocus.textContent = packState.telemetryFocus;
  }
  if (selectedMissionLabel) {
    selectedMissionLabel.textContent = missionState.label;
  }
  if (selectedMissionCopy) {
    selectedMissionCopy.textContent = missionState.copy;
  }
  if (reasoningFocus) {
    reasoningFocus.textContent = missionState.reasoning;
  }
  if (missionFocus) {
    missionFocus.textContent = missionState.mission;
  }
  if (mapMissionLabel) {
    mapMissionLabel.textContent = missionState.label;
  }
}

function syncGameplay() {
  const missionState = getMissionState();
  const playPackBadge = document.getElementById("playPackBadge");
  const playMissionBadge = document.getElementById("playMissionBadge");
  const playRunSummary = document.getElementById("playRunSummary");
  const playCapacityTask = document.getElementById("playCapacityTask");
  const playCapacityHint = document.getElementById("playCapacityHint");
  const playReasoningTask = document.getElementById("playReasoningTask");
  const playReasoningHintText = document.getElementById("playReasoningHintText");
  const playMissionTitle = document.getElementById("playMissionTitle");
  const missionBriefText = document.getElementById("missionBriefText");
  const playTransferTask = document.getElementById("playTransferTask");
  const playFarTransferNote = document.getElementById("playFarTransferNote");

  if (playPackBadge) {
    playPackBadge.textContent = missionConfig[activePack].packLabel;
  }
  if (playMissionBadge) {
    playMissionBadge.textContent = missionState.label;
  }
  if (playRunSummary) {
    playRunSummary.textContent = missionState.runSummary;
  }
  if (playCapacityTask) {
    playCapacityTask.textContent = missionState.capacityTask;
  }
  if (playCapacityHint) {
    playCapacityHint.textContent = missionState.capacityHint;
  }
  if (playReasoningTask) {
    playReasoningTask.textContent = missionState.reasoningTask;
  }
  if (playReasoningHintText) {
    playReasoningHintText.textContent = missionState.reasoningHint;
  }
  if (playMissionTitle) {
    playMissionTitle.textContent = missionState.title;
  }
  if (missionBriefText) {
    missionBriefText.textContent = missionState.brief;
  }
  if (playTransferTask) {
    playTransferTask.textContent = missionState.transferTask;
  }
  if (playFarTransferNote) {
    playFarTransferNote.textContent = missionState.transferTask;
  }
}

function initModeTabs() {
  const modeTabs = document.querySelectorAll(".mode-tab");
  const playStates = document.querySelectorAll(".play-state");
  if (!modeTabs.length || !playStates.length) {
    return;
  }

  const showMode = (modeName) => {
    setActive(modeTabs, (tab) => tab.dataset.mode === modeName);
    setActive(playStates, (state) => state.id === `play-${modeName}`);
  };

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => showMode(tab.dataset.mode));
  });
}

function initOptionSelection() {
  const options = document.querySelectorAll(".m-option");
  if (!options.length) {
    return;
  }

  const activateOption = (option) => {
    setActive(options, (item) => item === option);
  };

  options.forEach((option) => {
    option.addEventListener("click", () => {
      activateOption(option);
    });

    option.addEventListener("keydown", (event) => {
      const currentIndex = Array.from(options).indexOf(option);

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % options.length;
        options[nextIndex].focus();
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const previousIndex = (currentIndex - 1 + options.length) % options.length;
        options[previousIndex].focus();
      }
    });
  });
}

function initTopTimer() {
  const timerDisplay = document.getElementById("timerDisplay");
  if (!timerDisplay) {
    return;
  }

  let timerSeconds = page === "gameplay" ? 59 : 112;
  setInterval(() => {
    timerSeconds = timerSeconds > 0 ? timerSeconds - 1 : (page === "gameplay" ? 59 : 112);
    const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const seconds = String(timerSeconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function initGLoopActions() {
  const packChips = document.querySelectorAll(".pack-chip");
  const missionCards = document.querySelectorAll(".mission-card");
  const enterRunButton = document.getElementById("enterRunButton");
  const previewGameButton = document.getElementById("previewGameButton");
  const resetMissionButton = document.getElementById("resetMissionButton");

  packChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activePack = chip.dataset.pack;
      saveState(activePack, activeMission);
      syncGLoop();
      syncLauncher();
      syncGameplay();
    });
  });

  missionCards.forEach((card) => {
    card.addEventListener("click", () => {
      activeMission = card.dataset.mission;
      saveState(activePack, activeMission);
      syncGLoop();
      syncLauncher();
      syncGameplay();
    });
  });

  if (enterRunButton) {
    enterRunButton.addEventListener("click", () => {
      saveState(activePack, activeMission);
      window.location.href = "game-play.html";
    });
  }

  if (previewGameButton) {
    previewGameButton.addEventListener("click", () => {
      saveState(activePack, activeMission);
      window.location.href = "game-play.html";
    });
  }

  if (resetMissionButton) {
    resetMissionButton.addEventListener("click", () => {
      activePack = defaultState.pack;
      activeMission = defaultState.mission;
      saveState(activePack, activeMission);
      syncGLoop();
      syncLauncher();
      syncGameplay();
    });
  }
}

function init() {
  saveState(activePack, activeMission);
  syncLauncher();
  syncGLoop();
  syncGameplay();
  initModeTabs();
  initOptionSelection();
  initTopTimer();

  if (page === "gloop") {
    initGLoopActions();
  }
}

init();
