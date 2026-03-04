# Zone Coach — Core Recording Protocol & Recommendation Logic (MVP)

This document describes the **core daily check** and the **abstract recommendation logic** used by Zone Coach.

It is intended to be stable across markets. Market variants (corporate, longevity, athletes) can later customise copy, examples, and dashboards without changing the underlying protocol.

Zone Coach is a **readiness and self-regulation tool**, not a medical device.

---

## 1) What Zone Coach does (one sentence)

Zone Coach runs a short daily **mind–body check** and routes the user to the best next 1–4 hour block by combining:

* a **behavioural cognitive control** signal (CCC), and
* a **physiological autonomic** signal (HR/HRV/DFA α1 from RR intervals).

The design assumption is that learning and performance are best supported in an **in-zone corridor** where the system can switch flexibly between routine autopilot, focused exploitation, and relaxed exploration, while **out-of-zone extremes** (too low/depleted, too rigid, or too noisy) reduce learning quality and increase state drift.

---

## 2) Core daily recording protocol (6–7 minutes)

### Setup (30 seconds)

* Place phone on a **flat surface** (reduces touch timing noise and RR artefacts).
* Wear Polar H10 with good skin contact (moisten electrodes if needed).
* Optional self-label (“How do you feel?”) for comparison and insight, not for state assignment.

### Segment A0 — Quiet baseline physiology (1:00)

**Activity:** seated, still, silent.
**Record:** RR intervals. *(Optional: phone mic breathing, silent only.)*
**Purpose:**

* compute baseline body features (resting HR, lnRMSSD/RMSSD)
* provide the cleanest window for optional breathing metrics / breath-synchronised RSA proxy

### Segment A1 — Mind + task-context physiology (3:00)

**Activity:** CCC probe (MFT-M / CCC style), seated and still.
**Record:** behavioural responses + RR intervals.
**Purpose:**

* estimate MindState (throughput + stability signatures)
* compute task-context body features (for example HR/HRV during the cognitive probe, labelled as *during task*, not resting baseline)

### Segment B — Light challenge physiology (2:00)

**Activity:** stand and march-in-place / step test (standard cadence).
**Record:** RR intervals.
**Purpose:**

* compute DFA α1 under mild load
* characterise mobilisation and regulation under challenge (supports the body “fork”)

### Segment C — Seated recovery physiology (1:00) *(recommended add-on; makes the full check 7 minutes)*

**Activity:** stillness (standing or seated, but keep it consistent).
**Record:** RR intervals.
**Purpose:**

* compute a simple recovery/settling feature (for example HR recovery over 60 s)
* improve confidence and detect “doesn’t settle” patterns

### Express check (optional fallback)

If the user cannot do the full protocol:

* run **Segment A1 only** (CCC + RR during the probe)
* baseline physiology (Segment A0) and challenge physiology (Segment B) are missing
* BodyState is likely **unknown / low-resolution**
* recommendations become more mind-led and conservative, with a preference for minimum effective dose

---

## 3) Data quality and confidence (always applied)

Zone Coach computes:

* **signal quality flags** (artefacts, missing segments, insufficient data)
* **confidence** (Low/Medium/High) for MindState and BodyState

If the cognitive probe is invalid (interrupted/too few trials), Zone Coach:

* returns `Session not valid`
* recommends `Reset → re-check` rather than providing a normal state label

If RR is too noisy, baseline is missing/invalid, or the challenge segment is missing/invalid, Zone Coach:

* returns `Body unknown` (or caps Body confidence)
* routes conservatively (mind-led, minimum effective dose, re-check suggested)

---

## 4) State outputs (what the user sees)

Zone Coach outputs two state labels plus a coupling label.

### The target state: **In the Zone**

“In the Zone” is treated as a **higher bar** than “not obviously bad”.
It is the corridor where control and arousal are sufficient for good learning, while remaining flexible and stable.

### MindState (from CCC)

* **In the Zone** *(corridor target)*
* **Autopilot** *(healthy low-effort routine mode; optional flavour within subcritical)*
* **Flat** *(depleted subcritical; low engagement/low yield)*
* **Locked In** *(off-zone supercritical: hyper-control/rigidity; tunnel vision risk)*
* **Spun Out** *(off-zone supercritical: hyper-entropy/instability)*
* **Session not valid** *(quality failure)*

> Implementation note: MVP can keep a single “subcritical” label internally, with an optional flavour tag shown when confidence is adequate (Autopilot vs Flat/Depleted).

### BodyState (from HR/HRV/DFA α1)

* **In the Zone** *(corridor target)*
* **Subcritical (Restorative)** *(healthy downshift; low mobilisation + good regulation; optional flavour)*
* **Subcritical (Depleted)** *(low reserve; protect recovery; optional flavour)*
* **Locked In** *(off-zone supercritical: mobilised + regulated under mild load; “too tight” — time-box load and move back toward allostasis)*
* **Spun Out** *(off-zone supercritical: mobilised + dysregulated under mild load and/or messy recovery — downshift and simplify)*
* **Body unknown** *(quality failure)*

> Note: “Locked In” and “Spun Out” are **off-zone extremes**, not target states. Zone Coach treats **In the Zone** as the primary target for learning quality and sustainable progress.

### Coupling (mind–body relationship)

* **Aligned** (mind and body in the same family)
* **Dissociated** (mismatch)
* **Unknown** (if mind or body is unknown)

---

## 5) Abstract recommendation logic (core routing)

### Principle: return to the corridor; protect the constrained system

Zone Coach treats readiness as two partly separable systems:

* **Mind readiness** (control quality for cognition/learning)
* **Body readiness** (mobilisation/regulation and recovery reserve)

Zone Coach aims to move the user toward **allostatic in-zone functioning**, rather than chasing extremes.

Because mind and body can partially dissociate, Zone Coach supports:

* **corridor days** (both in-zone) → prioritise high-value work/training
* **edge days** (locked-in) → time-box and actively return toward in-zone
* **dissociation days** (mismatch) → use the ready system while protecting the constrained one
* **uncertain days** (low confidence) → minimum effective dose + re-check

### Recommendation categories (route keys)

Zone Coach routes the next 1–4 hours into one of five abstract plans:

1. **In-zone block (deep work / high-quality learning / precision practice)**
   Use when mind is **in-zone** and body is not signalling strain.

   * If mind is **Autopilot**: use for routine execution, maintenance and well-learned tasks.
   * If body is **restorative subcritical**: keep physical load gentle even if cognition is usable.

2. **Edge-state block (time-boxed precision + corridor return)**
   Use when mind and/or body is **Locked In** (hyper-control).

   * Do **one short precision block** (or one simple session) only.
   * Immediately follow with a **broadening / downshift** step (walk, open monitoring, breathwork).
   * Aim: use the available focus without reinforcing rigidity or stacking load.

   *(Implementation note: this can still use the `deep_work` route key, but copy must indicate “time-box + return to in-zone”.)*

3. **Simple movement / physical training block (state shift + continuity)**
   Use when **body is in-zone** but **mind is spun out or depleted**.

   * Keep complexity low (steady Zone 2, fixed circuit, walk).
   * Aim: stabilise state and maintain habit continuity, not maximal performance.
   * Optional: quick cognitive re-check after movement.

4. **Reset → quick re-check (stabilise before committing)**
   Use when:

   * mind is spun out,
   * the session is borderline/ambiguous, or
   * coupling is dissociated and the next step is high-stakes.
   * Short intervention (3–6 min) then a 75-second quick check.
   * Aim: move toward the corridor before committing to deep work or load.

5. **Recovery downshift (protect reserve; avoid load stacking)**
   Use when:

   * body is **depleted subcritical** or **spun out**, or
   * both mind and body are red.
   * Low stimulation + gentle movement only.
   * Aim: protect recovery reserve and reduce state drift.

6. **Light admin / routine execution (low error-cost)**
   Use when:

   * mind is subcritical but stable (autopilot-like), or
   * confidence is low / body is unknown.
   * Low-error-cost tasks only.
   * Aim: keep momentum without training instability.

> Implementation note: If you want to keep exactly five route keys, fold “Edge-state block” into `deep_work` with an `edgeState=true` flag that changes copy, duration caps and re-check rules.

---

## 6) Dissociation and synergy rules (explicit)

### True synergy (corridor day)

* **Mind in-zone + Body in-zone**: best window for deep learning and demanding work.

### Edge synergy (useful, but not a target)

* **Mind in-zone + Body locked-in**: do a valuable block, but cap load and include a corridor-return step.
* **Mind locked-in + Body in-zone**: one time-boxed precision block, then broaden/reset.
* **Mind locked-in + Body locked-in**: treat as an edge day; do not stack intensity; prioritise returning to in-zone.

### Dissociation (one system constrained)

* **Mind in-zone + Body red (depleted or spun out)**: cognition may be usable, but protect recovery (shorter blocks, gentle movement only, earlier finish).
* **Body in-zone + Mind red (flat or spun out)**: use simple movement and routine tasks; stabilise mind before high-stakes cognition.
* **Mind locked-in + Body red**: avoid “powering through”; do at most one short precision block, then downshift.

### Unknown / low confidence

* Prefer minimum effective dose, softer commitments, and re-check prompts.
* Avoid strong prescriptions when the data are not adequate.

---

## 7) Minimum effective dose and safety language

When confidence is low, coupling is dissociated, or an edge state is detected:

* shorten block duration
* add a re-check after the first block/session
* avoid “push through” language
* present “do this now” as a safe experiment, not a verdict

---

## 8) What Zone Coach meaningfully gives the user

Zone Coach converts a short daily measurement into:

* a **named state** (corridor vs specific drift pattern)
* a **mind–body alignment check** (dissociation awareness)
* a **practical next block** recommendation (1–4 hours)
* a **confidence rating** that prevents over-interpretation on noisy days
* a personal **trend** (baseline-relative context over time)

The aim is not maximum effort, but **higher-quality work and training** through better timing, better state protection, fewer wasted sessions, and consistent return toward the corridor.

---

## 9) What this document does not include

This file does not specify:

* market-specific wording (corporate vs longevity vs athletes)
* detailed thresholds/weights used in the classifiers
* UI design and presentation details

Those live in separate protocol and implementation documents.
