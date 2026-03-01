
## 1) Design principles to anchor the look

**Tone:** calm, clinical-adjacent, “trustworthy wellbeing” (not neon biohacker).
**Information hierarchy:** one primary action per screen; everything else secondary.
**Feedback:** subtle haptics + clear visual confirmation on taps and segment transitions. ([Apple Developer][2])
**Accessibility defaults:**

* Text contrast at least WCAG AA (4.5:1 for normal text). ([W3C][3])
* Touch targets meet WCAG 2.2 target size guidance (minimum 24×24 CSS px; larger is better for comfort). ([W3C][3])

---

## 2) Navigation model (keep it minimal)

Use **bottom navigation** with **3–4 top-level destinations** (standard mobile pattern): ([Material Design][4])

1. **Home** (today’s check + status)
2. **Trends** (history, simple charts)
3. **Plan** (recommendation library / next-block guidance)
4. **Profile** (settings, devices, privacy, exports)

Use **cards** for all primary “units” (Today card, Result card, Recommendation card). ([Material Design][5])

---

## 3) Core screen flow (the “happy path”)

### Screen 0 — Welcome

* Logo + one sentence (“6-minute mind–body check for your next best block”)
* Buttons: **Get started**, **Sign in** (optional)
* Trust line: “Not a medical device. Data stays on your device unless you choose to sync.”

### Screen 1 — Mode select (market skin)

Single choice with 3 tiles:

* **Work** (corporate)
* **Longevity** (50+)
* **Sport** (athletes)

This only changes copy and suggested “next blocks” later (same engine).

### Screen 2 — Permissions + device setup

Card stack:

* **Connect Polar H10** (status pill: Not connected / Connected)
* “How to wear strap” micro-instructions (2–3 bullets)
* Optional: “Use local-only mode” vs “Sync to cloud” toggle

Keep permission requests contextual and minimal (health apps lose trust when they ask for everything upfront). Apple’s Health/HealthKit guidance is a good reference point for privacy-forward expectations. ([Apple Developer][6])

### Screen 3 — Home (Today)

This is your primary daily landing screen.

**Top area**

* “Today’s check” card with:

  * last check time
  * **Start check** button (primary CTA)
  * small streak badge (if you do streaks)

**Secondary**

* “Last recommendation” preview
* “Trends snapshot” (tiny 7-day sparkline)

### Screen 4 — Guided check (6 minutes) — 3-step wizard

One screen that transitions between segments; don’t make users navigate.

**Segment A: CCC (3:00)**

* Big instruction: “Phone flat. Sit still.”
* CCC task UI (your existing probe)
* Small strap indicator (RR incoming / signal quality)

**Segment B: Light challenge (2:00)**

* “Stand up: march in place” + optional metronome toggle
* Big timer ring + “Keep a steady pace”
* Strap indicator

**Segment C: Recovery (1:00)**

* “Stand still / sit. Breathe normally.”
* Timer ring + calming microcopy

Use consistent “progress ring + timer” patterns; add subtle haptic ticks on segment start/end. ([Apple Developer][2])

### Screen 5 — Results (single, digestible view)

This is where “modern health app” style matters most.

**Top result card**

* **Mind state chip** (e.g., In the Zone / Flat / Locked In / Spun Out)
* **Body state chip** (e.g., In the Zone / Subcritical / Locked In / Spun Out / Unknown)
* **Coupling pill**: Aligned / Dissociated / Unknown
* **Confidence** (High/Med/Low) with an info icon

**One-sentence interpretation**

* “Mind is scattered, body is ready → use movement to stabilise before precision work.”

**“Why” accordion (optional)**

* 2–3 plain-language bullets only (no raw metrics unless user taps “See data”).

### Screen 6 — Recommendation (next 1–4 hours)

One primary recommendation with two alternatives.

**Primary card**

* Title: “Next best block”
* Route icon + duration:

  * Deep work (time-boxed) / Simple movement / Reset + re-check / Downshift / Light admin
* “Do this now” 3 bullets
* “Stop rule” 1 line

**Secondary options**

* “If you can’t do that…” (2 lighter alternatives)

**Re-check CTA**

* “Quick re-check (75s)” appears when confidence is low or coupling is dissociated.

---

## 4) Trends (simple, health-style analytics)

### Trends screen

* **Calendar strip** (dots for days you checked)
* **24-day line chart** for CCC bps and/or “Zone band” (keep it simple; no clutter)
* Toggle: Mind / Body / Both
* “Recovery speed” tile (e.g., “Back to Zone in 1–2 days” conceptually)

Use NHS-style clarity principles: plain language, consistent labels, no jargon without an explanation. ([nhs.uk][7])

---

## 5) Gamification (lightweight, non-stressful)

Keep it **personal progress** rather than competition. Nielsen Norman’s framing is “game mechanics in non-game contexts”, done best with a user-centred mindset. ([Nielsen Norman Group][8])

### What to include (clean)

* **Streak**: “Check-in streak” (with gentle wording; don’t shame breaks)
* **Badges** (few, meaningful):

  * “7-Day Starter”
  * “Consistency Week”
  * “Recovered Fast” (returned to zone after an off day)
  * “Good Judgement” (user followed a downshift recommendation)
* **Points** (optional): “Consistency points” that only reward completing the check + following a recommended block (not “max intensity”).

### What to avoid (especially for wellness)

* Public leaderboards
* “Punishment” for missed days
* Aggressive push notifications

---

## 6) Trust, safety, and accessibility checklist (for the designer)

* **Clear non-medical positioning** on onboarding and results.
* **Privacy-first** language and a simple “what we store” panel.
* **Touch targets** and spacing meet WCAG 2.2 guidance. ([Accessibility manual][9])
* **Contrast** meets WCAG AA. ([W3C][3])
* **Feedback** uses a mix of visual + haptic so users aren’t dependent on sound. ([Apple Developer][2])
* Keep feedback requests non-intrusive and timed after completion, not mid-task. ([Nielsen Norman Group][10])

---

## 7) What to ask your designer to deliver (Figma packet)

1. **Design system mini-kit**

* typography scale, spacing scale, corner radius, shadows, button styles
* state chips + confidence pill + coupling pill
* cards (primary/secondary), timers/progress rings

2. **Core frames**

* Welcome
* Mode select (Work/Longevity/Sport)
* Device connect + strap guidance
* Home (Today)
* 6-minute check (A/B/C segment states)
* Results
* Recommendation
* Trends
* Profile/settings

3. **Two themes**

* Light + dark (health apps should support both well)

