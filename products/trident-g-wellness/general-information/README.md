# Zone Coach — Core Recording Protocol & Recommendation Logic (MVP)

This document describes the **core daily check** and the **abstract recommendation logic** used by Zone Coach.

It is intended to be stable across markets. Market variants (corporate, longevity, athletes) can later customise copy, examples, and dashboards without changing the underlying protocol.

Zone Coach is a **readiness and self-regulation tool**, not a medical device.

---

## 1) What Zone Coach does (one sentence)

Zone Coach runs a short daily **mind–body check** and routes the user to the best next 1–4 hour block by combining:
- a **behavioural cognitive control** signal (CCC), and
- a **physiological autonomic** signal (HR/HRV/DFA α1 from RR intervals).

---

## 2) Core daily recording protocol (6 minutes)

### Setup (30 seconds)
- Place phone on a **flat surface** (reduces touch timing noise and RR artefacts).
- Wear Polar H10 with good skin contact (moisten electrodes if needed).
- Optional: user self-label (“How do you feel?”) for later comparison, not for routing.

### Segment A — Mind + Rest-like physiology (3:00)
**Activity:** CCC probe (MFT-M / CCC style), seated and still.  
**Record:** behavioural responses + RR intervals.  
**Purpose:**
- estimate MindState (throughput + stability signatures)
- compute rest-like body features (resting HR, lnRMSSD)

### Segment B — Light challenge physiology (2:00)
**Activity:** stand and march-in-place / step test (standard cadence).  
**Record:** RR intervals.  
**Purpose:**
- compute DFA α1 under mild load
- characterise mobilisation and regulation under challenge

### Segment C — Recovery physiology (1:00)
**Activity:** stillness (standing or seated).  
**Record:** RR intervals.  
**Purpose:**
- compute a simple recovery/settling feature (e.g., HR recovery over 60 s)

### Express check (optional fallback)
If the user cannot do the full protocol:
- run Segment A only (CCC + rest-like RR)
- BodyState is likely **unknown / low-resolution**
- recommendations become more mind-led and conservative

---

## 3) Data quality and confidence (always applied)

Zone Coach computes:
- **signal quality flags** (artefacts, missing segments, insufficient data)
- **confidence** (Low/Medium/High) for MindState and BodyState

If the cognitive probe is invalid (interrupted/too few trials), Zone Coach:
- returns `Session not valid`
- recommends `Reset → re-check` rather than providing a normal state label

If RR is too noisy or the challenge segment is missing, Zone Coach:
- returns `Body unknown`
- routes conservatively (mind-led, minimum effective dose, re-check suggested)

---

## 4) State outputs (what the user sees)

Zone Coach outputs two state labels plus a coupling label:

### MindState (from CCC)
- **In the Zone**
- **Flat** (subcritical)
- **Locked In** (supercritical hyper-control / rigidity)
- **Spun Out** (supercritical hyper-entropy / instability)
- **Session not valid** (quality failure)

### BodyState (from HR/HRV/DFA α1)
- **In the Zone**
- **Subcritical** (optionally: restorative vs depleted)
- **Locked In** (mobilised + regulated)
- **Spun Out** (mobilised + dysregulated)
- **Body unknown** (quality failure)

### Coupling
- **Aligned** (mind and body in the same family)
- **Dissociated** (mismatch)
- **Unknown** (if mind or body is unknown)

---

## 5) Abstract recommendation logic (core routing)

### Principle: protect the red axis; use the green axis
Zone Coach treats readiness as two partly separable systems:
- **Mind readiness** (control quality for cognition/learning)
- **Body readiness** (mobilisation/regulation and recovery reserve)

When these systems disagree (dissociated), Zone Coach:
- avoids loading the constrained system
- uses the ready system for a productive block
- suggests a short intervention + re-check where appropriate

### Recommendation categories (route keys)
Zone Coach routes the next 1–4 hours into one of five abstract plans:

1) **Deep work / high-quality cognitive block**
   - Use when mind is in-zone (or stable enough) and body is not signalling high strain.
   - Time-box if mind is “Locked In” (hyper-control risk).

2) **Simple physical training / movement block**
   - Use when body is green but mind is red (spun out or flat).
   - Keep complexity low (steady Zone 2, fixed circuit, walk).
   - Aim: state shift + habit continuity, not maximal performance.

3) **Reset → quick re-check**
   - Use when results are ambiguous, mind is spun out, or CCC run is borderline.
   - Short intervention (3–6 min) then a 75-second quick check.
   - Aim: confirm whether the user can move into a trainable band today.

4) **Recovery downshift**
   - Use when both mind and body are red, or body is clearly strained.
   - Low stimulation + gentle movement only.
   - Aim: protect recovery reserve and reduce state drift.

5) **Light admin / routine execution**
   - Use when mind is subcritical but stable (autopilot) or when confidence is low.
   - Low-error-cost tasks only.
   - Aim: keep momentum without training instability.

### Minimum effective dose rule
When confidence is low or coupling is dissociated:
- shorten the block duration
- add a re-check after the first block/session
- avoid “push through” language

### Off-zone extremes rule
Both supercritical forks are treated as **off-zone extremes**, not target states:
- **Locked In (hyper-control):** time-box, include a break, avoid tunnel vision decisions
- **Spun Out (hyper-entropy):** stabilise first (reset/movement), avoid high-stakes cognition

---

## 6) What Zone Coach meaningfully gives the user

Zone Coach converts a short daily measurement into:
- a **state label** that names the kind of drift (flat vs rigid vs scattered)
- a **mind–body alignment check** (dissociation awareness)
- a **practical next block** recommendation (1–4 hours)
- a **confidence rating** that prevents over-interpretation on noisy days
- a personal **trend** (baseline-relative context over time)

The aim is not maximum effort, but **higher-quality work and training** through better timing, better state protection, and fewer wasted sessions.

---

## 7) What this document does not include
This file does not specify:
- market-specific wording (corporate vs longevity vs athletes)
- detailed thresholds/weights used in the classifiers
- UI design and presentation details

Those live in separate protocol and implementation documents.
