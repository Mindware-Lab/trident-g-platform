export const psiResponseOptions = Object.freeze([
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Very often" }
]);

export const psiCbsManifest = Object.freeze({
  id: "psi-cbs",
  label: "Psi-CBS",
  familyId: "bandwidth",
  familyLabel: "Bandwidth",
  mode: "psi",
  core: {
    id: "psi-core",
    label: "Psi-CBS Core",
    shortLabel: "Core",
    estimateMinutes: 4,
    introTitle: "Bandwidth core check",
    introCopy:
      "Eight self-report items about focus and processing across the past two weeks. This is the regular lightweight evidence check for the Basic route.",
    instructions:
      "Answer from your everyday work, study, or project flow over the past two weeks.",
    questions: [
      {
        id: "C1",
        text: "I can start a focused work block within about 5 minutes of sitting down without drifting into tabs or messages.",
        factor: "focus"
      },
      {
        id: "C2",
        text: "After an interruption, I can return to the same task and regain full focus within about 5 minutes.",
        factor: "focus"
      },
      {
        id: "C3",
        text: "I miss important details in emails or docs and only notice later, or when someone points them out.",
        factor: "focus",
        reverse: true
      },
      {
        id: "C4",
        text: "I make action slips at work, such as sending the wrong link, pasting the wrong version, or clicking the wrong option.",
        factor: "focus",
        reverse: true
      },
      {
        id: "C5",
        text: "When faced with a new and complex problem, I can break it into clear sub-problems and identify the next best step.",
        factor: "processing"
      },
      {
        id: "C6",
        text: "Before committing to a decision, I explicitly check assumptions and consider at least one alternative explanation or option.",
        factor: "processing"
      },
      {
        id: "C7",
        text: "I can learn a new tool or process quickly enough to use it confidently within 1 or 2 work sessions.",
        factor: "processing"
      },
      {
        id: "C8",
        text: "After reading or training, I can recall and apply the key points later without having to re-read or re-watch.",
        factor: "processing"
      }
    ]
  },
  ad: {
    id: "psi-ad",
    label: "Psi-CBS-AD",
    shortLabel: "AD",
    estimateMinutes: 4,
    introTitle: "Allostatic dysregulation supplement",
    introCopy:
      "Optional coach-gated supplement covering stickiness, exploit lock-in, explore lock-in, dropout, and cycling. Higher raw values mean more dysregulation.",
    instructions:
      "Only add this when the coach wants a broader resilience read. Answer from the same past-two-weeks window.",
    sections: [
      {
        id: "AD1",
        name: "Re-entry stickiness",
        items: [
          "After a stressful trigger, I stayed wound up or unsettled for hours, even after the situation had passed.",
          "Small cues such as a message, uncertainty, bodily sensation, or awkward interaction quickly escalated into a big shift in my mental state.",
          "Even when I tried to reset with a break, walk, breathing, or sleep, the improvement often did not stick and I slid back into the same mental state."
        ]
      },
      {
        id: "AD2",
        name: "Exploit-lock-in basin",
        items: [
          "Discomfort or uncertainty pulled me into repeated checking, monitoring, analysing, or reassurance-seeking.",
          "Even when I could tell the checking or analysing was not helping, it was hard to stop.",
          "I narrowed onto getting it right and struggled to tolerate a good-enough solution."
        ]
      },
      {
        id: "AD3",
        name: "Explore-lock-in basin",
        items: [
          "I kept searching for the right plan or explanation instead of running a small test and updating from the concrete result.",
          "I generated lots of options or ideas, but struggled to choose one and carry it through to completion.",
          "I got stuck in information-gathering as a substitute for deciding and acting."
        ]
      },
      {
        id: "AD4",
        name: "Autopilot drop-out basin",
        items: [
          "When things felt hard, I postponed or avoided key tasks even when they mattered.",
          "Under pressure, I tended to freeze, go blank, or drift into low-effort distraction rather than taking a small next step.",
          "I withdrew mentally or socially and operated on bare-minimum autopilot."
        ]
      },
      {
        id: "AD5",
        name: "Cycling across basins",
        items: [
          "Across the past two weeks, I swung between overdrive and crash.",
          "When I started to settle into one state, I often went too far and later swung to the opposite state.",
          "My sleep-energy rhythm felt unstable with noticeable shifts that coincided with shifts in drive, mood, or focus."
        ]
      }
    ]
  },
  ai: {
    id: "psi-ai",
    label: "Psi-CBS-AI",
    shortLabel: "AI",
    estimateMinutes: 3,
    introTitle: "AI multiplier effects supplement",
    introCopy:
      "Optional coach-gated supplement for people who have used AI tools in the past two weeks. It tracks whether AI improves or drags execution.",
    instructions:
      "Only answer this section if you used AI tools in the past two weeks for work, study, or projects.",
    sections: [
      {
        id: "AI1",
        name: "AI effects on Core outcomes",
        pairs: [
          {
            id: "AI1",
            name: "Focus and error resistance",
            positive: "When I used AI tools, they helped me stay on track and reduce avoidable mistakes.",
            negative: "When I used AI tools, I became more distractible or switched tasks more often."
          },
          {
            id: "AI2",
            name: "Active processing and reasoning",
            positive: "AI helped me compare options and produce clearer explanations or justifications.",
            negative: "AI led me to accept the first plausible answer and stop checking alternatives."
          },
          {
            id: "AI3",
            name: "Learning and transfer",
            positive: "After using AI, I understood the ideas well enough to explain or apply them later without AI.",
            negative: "After using AI, I struggled to reproduce the reasoning later without AI."
          }
        ]
      },
      {
        id: "AI2B",
        name: "AI effects on Trident G control markers",
        pairs: [
          {
            id: "AI4",
            name: "Engagement and calibration",
            positive: "AI helped me anticipate difficulty and brace realistically, with a clearer plan and fewer nasty surprises.",
            negative: "AI gave me a false sense of simplicity and I later got caught off guard by the true demands."
          },
          {
            id: "AI5",
            name: "Niche coupling and friction",
            positive: "AI reduced workflow friction with clearer drafts, smoother handoffs, or better external memory.",
            negative: "AI increased workflow friction with more tool sprawl, coordination drag, or rework."
          }
        ]
      },
      {
        id: "AI3B",
        name: "AI extended cognition",
        pairs: [
          {
            id: "AI6",
            name: "Portability and situatedness",
            positive: "If AI were unavailable tomorrow, I could still perform most of my key tasks effectively.",
            negative: "My current effectiveness depends on having my usual AI tools available in my workflow."
          }
        ]
      }
    ]
  }
});
