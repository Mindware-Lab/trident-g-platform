
## Capacity Gym Screen Flow & UI Architecture

### Core Design Principles

1. **Zero-friction onboarding** — No account creation required; localStorage only 
2. **Immediate gameplay** — First block starts within 60 seconds of app open
3. **Progressive disclosure** — Teach mechanics across first 3 blocks, not upfront
4. **Circular interface consistency** — All games use the same spatial framework
5. **Meta-game as constellation** — Hub central, relational games as orbiting nodes

---

## Screen Flow Diagram

```
[Splash] → [Today/Home] → [Pre-Block Briefing] → [Gameplay Circle] → [Block Results] → [Inter-Block Coach]
   ↓           ↓ (first launch)        ↑ (repeat 10x)              ↓ (after block 10)
[Name Entry]  [Interactive Tutorial]   [Session Results] ← [Post-Session Summary]
                                              ↓
                                        [Unlock Celebration]
                                              ↓
                                        [Return to Today/Home]
```

---

## Detailed Screen Specifications

### 1. Splash Screen (2 seconds max)

**Purpose:** Brand recognition + immediate value proposition

**Visual:**
- Full-screen dark gradient (`z-p0` to `z-p1`)
- Central animated logo (pulsing network nodes from icon set)
- Tagline: "Train cognitive control. 10 minutes a day."

**Behavior:**
- Auto-advance to Today/Home
- No tap required (reduces friction)
- Show loading state only if localStorage migration needed

---

### 2. Today/Home Screen (Central Hub)

**Purpose:** Daily orientation + mission status + game selection

**Layout:**
```
┌─────────────────────────────────────┐
│  [Top Bar: Logo | Streak 🔥 | Ψ Units] │
├─────────────────────────────────────┤
│                                     │
│  TODAY'S MISSION                    │
│  ┌─────────────────────────────┐   │
│  │ Tier 0: Control [○────] 0/1 │   │
│  │ Complete 1 Hub session      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Start Recommended Session]        │
│     ↳ Hub (cat) — N=2 recommended   │
│                                     │
│  ─── OR CHOOSE ───                  │
│                                     │
│     [HUB]        [RELATIONAL]       │
│    ◉ hub_cat      ○ transitive      │
│    ◉ hub_noncat   ○ graph           │
│                    ○ propositional  │
│                    (locked 🔒)      │
│                                     │
│  Unlock checklist:                  │
│  ✓ hub_cat qualified                │
│  ○ hub_noncat pending               │
│                                     │
└─────────────────────────────────────┘
```

**Key Interactions:**
- **Primary CTA:** "Start Recommended Session" (coach-selected)
- **Secondary:** Direct game selection with visual lock states
- **Meta-game visualization:** Simple progress rings, not complex graphs

---

### 3. Pre-Block Briefing (Modal Overlay)

**Purpose:** Context for next block without breaking flow

**For First Block Only:**
```
┌─────────────────────────────────────┐
│  BLOCK 1 OF 10                      │
│                                     │
│  Target: LOCATION                   │
│  N-Back: 2                          │
│  Speed: Slow (3s)                   │
│                                     │
│  [?] How to play (optional)         │
│                                     │
│  [ START BLOCK ]                    │
└─────────────────────────────────────┘
```

**For Subsequent Blocks:**
- Mini-banner from bottom: "Block 3: N=3, Speed: Fast" 
- Auto-dismiss after 1.5s or tap to dismiss

---

### 4. Gameplay Screen (The Circle)

**Universal Layout for All Game Modes:**

```
┌─────────────────────────────────────┐
│  Block 2/10  │  N=3  │  Ψ 12        │  ← Status bar (minimal)
├─────────────────────────────────────┤
│                                     │
│         [Target: LOCATION]          │  ← Cue (fades after 2s)
│                                     │
│              ┌───┐                  │
│           ┌──┤ ○ ├──┐               │
│          │   └───┘   │              │
│         [○]       [○]               │
│          │   ┌───┐   │              │
│           └──┤ ○ ├──┘               │  ← 4-position circle
│              └───┘                  │
│         (stimuli appear here)       │
│                                     │
│         ┌─────────────┐             │
│         │   MATCH     │             │  ← Large touch target
│         │  (spacebar) │             │
│         └─────────────┘             │
│                                     │
│  [Coach Notice: "Stabilise block"]  │  ← Brief, action-only
│                                     │
└─────────────────────────────────────┘
```

**Circular Frame Specifications:**
- **Outer ring:** Subtle gradient border (`brand-border` to `brand-border-crisp`)
- **4 positions:** 12, 3, 6, 9 o'clock for Hub location mode
- **Center zone:** For color/symbol stimuli (fills center circle)
- **Relational modes:** Same frame, different content:
  - Transitive: Letters at positions with arrows
  - Graph: Nodes at positions with connecting edges
  - Propositional: Symbols with implication arrows

**Animation Principles:**
- Stimulus appears with 150ms fade-in
- Match response triggers 100ms green flash at circle edge
- False alarm triggers 100ms red flash + brief vibration (if enabled)

---

### 5. Block Results Screen

**Purpose:** Immediate competence feedback 

```
┌─────────────────────────────────────┐
│  BLOCK 2 COMPLETE                   │
├─────────────────────────────────────┤
│                                     │
│  Accuracy: 87%                      │
│  [HOLD] — N stays at 3              │
│                                     │
│  Next block targets:                │
│  ≥75% for HOLD, ≥90% to advance     │
│                                     │
│  [Clean Control ✓]                  │  ← Badge if earned
│  No lapses, no error bursts         │
│                                     │
│  RT: 890ms avg | Lapses: 0          │
│                                     │
│  ─────────────────                  │
│                                     │
│  [Coach Override Available]         │  ← Only for TUNE/SPIKE_TUNE
│  Coach recommends: Speed pulse      │
│  [Accept Coach] [Try Alternative]   │
│                                     │
│  ─────────────────                  │
│                                     │
│  [ NEXT BLOCK ]                     │
│     (or [ VIEW SUMMARY ] if #10)   │
│                                     │
└─────────────────────────────────────┘
```

---

### 6. Session Results Screen

**Purpose:** Progress summary + mission completion + streak update

```
┌─────────────────────────────────────┐
│  SESSION COMPLETE                   │
│  Hub (cat) — 10 blocks              │
├─────────────────────────────────────┤
│                                     │
│  PEAK N: 4                          │
│  FINAL N: 3                         │
│  STABILITY: 7/10 blocks HOLD/UP     │
│                                     │
│  [All Blocks Clean ✨]               │  ← Prestige flair
│                                     │
│  ─────────────────                  │
│                                     │
│  SESSION UNITS: +12                 │
│  Mission Bonus: +3                  │
│  ─────────────                      │
│  BANK TOTAL: Ψ 47                   │
│                                     │
│  STREAK: 3 days 🔥 (best: 5)        │
│                                     │
│  ─────────────────                  │
│                                     │
│  [All Blocks Clean] note added to   │
│  your history.                      │
│                                     │
│  [ CONTINUE ]                       │
│                                     │
└─────────────────────────────────────┘
```

---

### 7. Unlock Celebration (Modal)

**Purpose:** Competence satisfaction + clear next goal

```
┌─────────────────────────────────────┐
│                                     │
│           [UNLOCKED 🎉]             │
│                                     │
│     Relational Modes Available      │
│                                     │
│     [Graph Icon]  [Transitive]      │
│     [Order Icon]   [Prop Icon]      │
│                                     │
│  New mission tier tomorrow:         │
│  Reset → Control → Reason           │
│                                     │
│  [ START RELATIONAL TUTORIAL ]      │
│  [ RETURN HOME ]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## Meta-Game Visualization (Constellation View)

**Alternative Home Screen Layout** (toggle or post-unlock):

```
┌─────────────────────────────────────┐
│         YOUR COGNITIVE GYM          │
├─────────────────────────────────────┤
│                                     │
│              [HUB]                  │
│           ◉ hub_cat                 │
│           ◉ hub_noncat              │
│              /    \                 │
│             /      \                │
│    [TRANSITIVE]  [GRAPH]            │
│        ◉            ◉               │
│             \      /                │
│              \    /                 │
│          [PROPOSITIONAL]            │
│               ◉                     │
│                                     │
│  Lines connect qualified modes      │
│  Glowing = available now            │
│  Dimmed = locked                    │
│                                     │
│  [Start Recommended] [Choose Mode]  │
│                                     │
└─────────────────────────────────────┘
```

**Rationale:** 
- Creates **visual progression map** 
- Reinforces "hub-and-spoke" architecture
- Locked states visible but not frustrating (clear path to unlock)
- Consistent with circular motif of gameplay

---

## Navigation Structure

### Tab Bar (Persistent)
1. **Today** — Home/mission status (default)
2. **Train** — Game selection (constellation view)
3. **Progress** — History/stats (your existing graph.svg style)
4. **Settings** — Audio, theme, data export

### Screen Transitions
- **Fade** (200ms) between non-gameplay screens
- **No transition** (instant) between blocks to maintain flow
- **Slide up** for modal overlays (briefings, results)

---

## Onboarding Flow (First Launch)

**Goal:** Player starts first trial within 60 seconds 

```
T+0s:  Splash → Today screen
T+2s:  "Welcome to Capacity Gym" tooltip on Today screen
T+5s:  User taps "Start Recommended Session"
T+6s:  Pre-block briefing appears
T+8s:  "How to play" available but optional (small [?])
T+10s: User taps START BLOCK
T+12s: First trial begins (N=1, slow speed, location mode)

[During first 3 blocks:]
- Block 1: Tooltip "Press MATCH when location repeats"
- Block 2: Tooltip "Ignore color and symbol"
- Block 3: No tooltip, full speed
```

**Progressive Tutorial Content:**

| Block | Concept | Teaching Method |
|-------|---------|-----------------|
| 1 | Match response | Tooltip on first match trial |
| 1 | N-back concept | Visual: "Same as 1 back" label |
| 2 | Ignoring distractors | Fade non-target modalities |
| 3 | Speed increase | No teaching, just faster |
| 5 | Interference (if HIGH) | Brief flash: "Lures active" |

---

## Key UX Decisions

### Why No Upfront Tutorial?
Research shows **80% of users drop off in first 3 days** if onboarding is lengthy . For cognitive training specifically, users need to experience the "flow state" of the task immediately to understand its value .

### Why Circular Frame for All Modes?
- **Spatial consistency** reduces cognitive load when switching modes
- **Metaphor alignment** — working memory as "mental workspace" with limited slots
- **Technical feasibility** — same rendering code for Hub and Relational

### Why "Action-reflecting" Coach Notices?
Per your SPEC and SDT research , hidden thresholds undermine autonomy. Notices describe what the coach *did*, not what the player *should feel*.

### Why No Leaderboards?
Explicitly out of scope per your constraints. Streaks and "All Blocks Clean" provide **personal competence benchmarks** without social comparison that can undermine motivation for lower performers .

---

## Implementation Priority

**P0 (MVP Critical):**
- Splash → Today → Gameplay Circle → Block Results → Session Results
- Basic coach notices (text only)
- Streak and units display

**P1 (Strongly Recommended):**
- Constellation meta-game view
- Clean Control badges
- Unlock celebration modal

**P2 (Post-MVP):**
- Detailed history visualizations
- Alternative coach override UI
- Advanced animations

This flow respects your **2-hour MVP constraint** while incorporating **evidence-based retention principles** from mobile game UX research.
