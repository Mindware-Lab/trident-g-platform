# G-Tracker (Trident-G) — Cognitive Testing (10-minute checks)

G-Tracker is a **short, repeatable cognitive testing app** for tracking change over time in the Trident-G / IQ suite.

It is built around:
- a **10-minute fluid reasoning check** using **open matrix-reasoning items** (Open Matrices Item Bank), and
- a small set of **brief self-report scales** (well-being / resilience / applied cognition markers), stored locally.

G-Tracker is **assessment**, not training. It is designed to answer:
> “Am I improving, stable, or drifting?”  
…without turning your life into a testing session.

---

## Where it fits in the Trident-G / IQ suite

You can use G-Tracker in three ways:

1) **Standalone (assessment only)**  
   Quick checks you can repeat weekly or fortnightly.

2) **Alongside the training apps (recommended)**  
   Use G-Tracker to track whether your training is showing up in **stable change**, not just “a good day”.

3) **Full integrated protocol (future)**  
   A future **G Loop Coach** hub can coordinate the full session flow across:
   **Ψ Zone Coach → IQ Capacity Training Coach → IQ Mindware Coach → Mission**, plus **G-Tracker** as the weekly/fortnightly measurement layer.

---

## What G-Tracker measures (v1)

### 1) Fluid reasoning (10 minutes): Pattern / matrix reasoning
A timed set of matrix problems designed to index **fluid reasoning** (pattern discovery and rule integration).

- Uses items drawn from the **Open Matrices Item Bank (OMIB)**.
- Each session draws a fresh mix of items so repeat testing is viable.

### 2) Brief scales (self-report)
G-Tracker can include short questionnaires used for tracking and research.

- **Cognitive Resilience Scale (CRS-10)** (Mindware Lab)  
- **Applied intelligence / cognitive bandwidth markers** (Mindware Lab; pilot evaluation included in repo docs)  
- **Everyday Decision Habits Scale (EDHS) v1** (Mindware Lab; validation in progress)  
- Other scale modules may be included as optional add-ons, where item sources are established and psychometric evaluation is ongoing.

> **Important note on validation:**  
> Some measures in this app are already supported by online studies/pilots. Others are **adapted from established measures** and are **still being validated**. G-Tracker is built to support that validation process (repeatable measurement, clean item tracking, consistent scoring).

---

## What a typical user session looks like

### A) “Weekly check” (recommended)
1. **Matrix reasoning test (10 mins)**
2. **One or two brief scales (2–4 mins)**
3. **Results screen** (trend vs last time)

Total: **12–15 minutes**.

### B) “Baseline + follow-up”
- Baseline at the start of a training phase
- Follow-up every 2–4 weeks

This is the simplest way to test whether the rest of the Trident-G stack is “moving the needle”.

---

## Scoring and feedback (user-friendly)

G-Tracker focuses on **tracking**, not labelling.

### Matrix reasoning
- **Accuracy** (and optional difficulty-weighted scoring, depending on build)
- **Time taken**
- **Consistency** across sessions (trend)

### Scales
- Standardised subscale totals (where applicable)
- Simple trend indicators:
  - **Stable**
  - **Up**
  - **Down**
  - **Noisy / variable**

> G-Tracker does **not** provide a clinical diagnosis and is not intended to replace professional assessment.

---

## The Open Matrices Item Bank (OMIB)

The OMIB provides an **open, validated** pool of matrix reasoning items suitable for research and applied use.

In this app, OMIB items are used to create short forms that can be repeated over time while limiting simple “item memorisation”.

Source paper and materials:
- Koch, M., Spinath, F. M., Greiff, S., & Becker, N. (2022). *Development and validation of the Open Matrices Item Bank.* **Journal of Intelligence, 10**, 41. https://doi.org/10.3390/jintelligence10030041  
- Item graphics/templates are available via OSF (see paper supplementary materials and OSF link in the paper).

---

## Data and privacy

By default, G-Tracker is **local-first**:
- results are stored in your browser using `localStorage`
- no account needed
- no cloud upload by default

Stored items may include:
- session timestamps
- matrix test summary scores
- scale totals
- basic trends

Optional exports (planned/optional):
- **Download JSON/CSV** for personal records or research use

If you clear your browser storage, your local history resets.

---

## Practical limitations (honest and important)

- **Practice effects exist** in repeated cognitive testing.  
  Using a large item bank helps, but it does not eliminate all practice effects.
- A short test is good for **tracking**, not for high-stakes decisions.
- Results are most meaningful when you keep conditions consistent (sleep, timing, distractions, etc.).

---

## Repo structure (suggested)

- `/app/` — React app source
- `/data/omib/` — OMIB item metadata (and item assets if your licence allows bundling)
- `/docs/scales/` — CRS-10, EDHS v1, Ψ-CBS notes, pilot evaluation PDFs
- `/docs/science/` — research notes and validation plan
- `/branding/` — shared Trident-G / Mindware Lab styling

---

## Licensing note (OMIB)

OMIB materials are openly available, but **licensing terms still apply**.
Before bundling OMIB item assets directly into a commercial product, check:
- the **paper’s supplementary material notes**, and
- the **OSF project licence/terms** attached to the item graphics/templates.

---

## Roadmap (v1 → v2)

**v1**
- 10-minute matrix reasoning check (OMIB)
- CRS-10 + selected brief scales
- local trends (simple graphs / deltas)

**v2**
- optional adaptive item selection (difficulty targeting)
- export (CSV/JSON)
- integrated view inside future **G Loop Coach** hub

---

## References (core)

- Koch, M., Spinath, F. M., Greiff, S., & Becker, N. (2022). Development and validation of the Open Matrices Item Bank. *Journal of Intelligence, 10*, 41. https://doi.org/10.3390/jintelligence10030041

