# IQ Capacity Training Coach (Trident-G)

IQ Capacity Training Coach is a **short, structured cognitive training app** built around n-back games designed to strengthen:

- **Core cognitive efficiency** (stable attention, working memory control, interference resistance)
- **Relational structure learning** (learning map-like relations that can generalise beyond one game)

It supports far transfer by combining:
1) **Tuning/consolidation** (smooth gains within a stable setup), and  
2) **Portability checks (“wrapper swaps”)** after a “click/breakthrough” to test whether a strategy carries across a different task.

---

## Two ways to use this app

### 1) Standalone (simple)
Use IQ Capacity Training Coach on its own as a structured daily training session.

### 2) Integrated with **Ψ Zone Coach** (recommended)
Run **Ψ Zone Coach first** (once per day), then run Capacity training.

In the integrated system:
- **Out of Ψ zone** → the app recommends **standard n-back** (stability/tuning)
- **In Ψ zone** → the app recommends **relational n-back** (structure learning)

---

## The games (v1)

### A) Standard n-back (rule-specified: colour / letter / location)
Each trial contains all three features:
- a **colour**
- a **letter**
- a **location**

But only **one dimension is relevant at a time** (the current “rule”).
You train by tracking that dimension and responding to n-back matches.

**N-back levels:** up to **8 levels** (e.g., 1-back through 8-back, depending on settings).

---

### B) Relational n-backs (structure learning)
These games train n-back matching **over relations**, not single features.

Included relational games:
1) **Transitive n-back**
2) **Graph n-back**
3) **Propositional logic n-back**

**N-back levels:** **3 levels** (kept tighter because relational difficulty rises quickly).

---

## Speed control (all games)
Every game includes a 3-step speed slider:

- **3 seconds** (slow)
- **2 seconds** (medium)
- **1 second** (fast)

Speed and n-back level are the two main difficulty levers.

---

## Block length (all games)
Each block contains a short sequence of trials:

- **Block length = (20 + N) trials**

So higher n-back levels naturally create slightly longer blocks.

---

## Session flow (how training actually runs)

### Minimum session size
A session is built from blocks. The **minimum** full session is:

- **10 blocks** (the default baseline session)

### No fixed upper bound (you can extend)
After you finish the baseline session, you can add more training in small chunks:

- after 10 blocks, the app can offer **+5 more blocks**
- after each added chunk, you can choose **+5 again**

So there is **no fixed upper limit**. You decide how far to extend, and the app will nudge you to stop if motivation drops or performance starts drifting.

---

## Game switching (wrapper swaps) — within-session and between sessions
This is important: switching is not only something you do on different days.

### Within a single training session
The app can recommend a **swap during the same session** when:
- you report a **click/breakthrough**, or
- motivation drops and you want variety, or
- the session plan calls for a portability probe

Swaps are offered at clean boundaries (between blocks), so the training stays coherent.

### Between sessions
The app can also recommend different games on different days (especially when integrated with Ψ Zone Coach).

---

## How swapping works (simple rules)

### Standard game swaps (within the standard game)
The “wrapper” is the current relevant rule:
- swap **colour ↔ letter ↔ location**

### Relational game swaps (between relational games)
The “wrapper” is the relational family:
- swap **transitive ↔ graph ↔ propositional**

The point of swapping is to test:
> “Was that a portable strategy, or a game-specific trick?”

---

## Difficulty adjustments (tuning/consolidation)
When you cross a high or low performance threshold, the app offers **one** simple adjustment:

- Move **n-back level** up/down by one, OR
- Move **speed** up/down by one step (if viable)

Rule: the app never changes multiple settings at once.
You remain in control of what gets adjusted.

---

## After each relational block: a short “map inference” quiz
After each relational n-back block, you’ll get a **very short quiz** that tests whether you’ve internalised the underlying structure.

This encourages learning the **map**, not just matching the surface token stream.

---

## What “clicks” are (and why we care)
A “click” is the feeling that:
- a strategy suddenly became clearer, or
- the task felt simpler and more controllable, or
- performance stabilised at a new level (e.g., moving from 2-back to stable 3-back)

When that happens, the app may suggest a short **transfer probe** (a swap) *within the same session*,
then return you to consolidate if needed.

**Clean rule:** test portability fast, then lock it in.

---

## What this app stores (privacy)
IQ Capacity Training Coach stores session summaries **locally in your own browser** (via `localStorage`) so the hub/other apps can read the handoff.

- No account needed
- No cloud upload by default
- Rolling local history

If you clear your browser storage, your local history resets.

---

## Troubleshooting

**GitHub Pages shows an old version**
- Hard refresh: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
- It can take a minute or two for Pages to serve the newest build.

---

## What this app is really doing (one sentence)
IQ Capacity Training Coach builds **stable cognitive control** and **relational structure learning**, then uses **controlled swaps (within-session)** to test whether your breakthroughs are portable beyond one game.

---

© Mindware Lab • IQ Mindware
