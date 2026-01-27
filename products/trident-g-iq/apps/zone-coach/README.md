# Zone Coach (Trident-G) — Daily Prime → Baseline Complexity → State Gate → Reset → Start Training

Zone Coach is a quick **pre-training state gate** you run once per day before any Trident-G training session.

Its job is simple:

- Help you start in a **trainable mental state** (the “G Zone”), instead of guessing.
- Reduce **state drift** (overload, scatteredness, low drive, shaky control) before you train.
- Protect learning quality by recommending either a normal session or a lighter stabilising session.

Trident-G compounds by **training consistently in the right state**, not by grinding harder.

---

## What you’ll do (the full flow)

### 0) Optional: Pair a Polar H10 (or similar chest strap) for RR + heart rate
If you have a **Polar H10**, you can pair it once per session to record:

- **RR intervals** (for the baseline DFA α1 trend)
- **Heart rate** during the dot probe (before and after breathing)

If you’re already wearing the strap, this is usually quick: tap **Pair sensor** and select your strap.

- You’ll be asked for permission by the browser
- Works best in **Chrome/Edge** (desktop or Android). Safari does not support this pairing method.

**Good news:** Zone Coach uses the **standard Bluetooth Heart Rate service**, so the same pairing method and code usually works with other devices that expose **Heart Rate Measurement + RR intervals** (many chest straps do).  
If a device does not broadcast RR intervals, Zone Coach will still run normally (you’ll just skip the DFA α1 baseline).

You can also skip pairing and run Zone Coach using only the dot probe + self-ratings.

---

### 1) Daily Prime (≈20–30 seconds)
Three quick ratings that shape today’s session:

- **Confidence** (η): “How capable do I feel today?”
- **Consistency** (χ): “How coherent/settled do I feel?”
- **Support** (λ): “How supportive is my environment right now?”

These aren’t diagnoses. They’re a short daily “set” that helps you start training cleanly and consistently.

---

### 2) Baseline Complexity (DFA α1) — **trend only** (≈2 minutes)
You take one calm baseline reading of **DFA α1** (a heart-rhythm complexity/correlation metric), using **RR intervals** from the strap.

- Normal breathing (not paced)
- Same posture each day if possible
- No “pass/fail” here: this is tracked as a **long-run trend**

Zone Coach will show a tiny sparkline over days/weeks so you can see whether baseline dynamics shift across training.

> Important: this baseline is **not** used as your immediate “in the zone” verdict for today’s session.

If no sensor is paired (or RR intervals aren’t available), Zone Coach simply skips this step and continues.

---

### Optional research add-on: EEG “brain criticality” trend (experimental)
In a future version, Zone Coach could also record a short **EEG baseline** during the **same 2 minutes** as the DFA α1 reading, and track a combined **mind–body criticality** trend over training.

Example hardware: **BrainBit Headband** (4-channel EEG at O1, O2, T3, T4; Bluetooth LE; SDK access to raw EEG and rhythms).

How it would work (high level):

- Pair the **BrainBit** headband (separate Bluetooth device) and start a 2-minute baseline alongside the Polar H10
- Compute an EEG stability/criticality-style feature during the same window (e.g. **long-range temporal correlations, LRTC**, or another non-linear marker you choose)
- Combine the EEG marker with DFA α1 into a single **Mind–Body Criticality Index** (trend only)

**Important notes**
- This would be treated as a **trend metric** over days/weeks, not a “today you’re in the zone” decision rule.
- Implementation is likely to use the **BrainBit SDK** (often via a lightweight native bridge such as React Native/Capacitor/Electron), because browser-only Bluetooth support varies across devices and platforms.
- This remains a **non-medical** exploratory feature for training telemetry.

---

### 3) Fast dot probe with lures (≈60–90 seconds) + heart rate (optional)
A short reaction-time check to sample steadiness and impulse control.

- Press **only** when the **GO dot** appears (e.g., white)
- **Do not press** for the **NO-GO dot** (e.g., lime)
- Don’t “pre-tap” while waiting

If a strap is paired, Zone Coach also records **average heart rate during the dot probe**.
This is used as a *supporting* arousal signal (it doesn’t override the dot probe).

---

### 4) Quick self-ratings (0–10)
A fast snapshot of trainability **right now**, e.g.:

- **Drive / energy**
- **Tension**
- **Focus steadiness**
- **Mental chatter**
- **Stuckness**

Keep it quick and honest.

---

### 5) You get a state label + a recommended reset (≈60–120 seconds)
Zone Coach shows your current state and gives **one** short breathing reset:

- **Upshift** (if you’re underpowered)
- **Stabilise** (if you’re shaky / inconsistent)
- **Downshift** (if you’re overloaded / too hot)

If you feel dizzy or unwell at any point, stop and return to normal breathing.

---

### 6) Recheck (≈30–60 seconds) + heart rate (optional)
After breathing:

- A short recheck dot probe
- One simple question:  
  **Do you feel more / neutral / less “in the zone” than before?**

If a strap is paired, Zone Coach also records **average heart rate during the recheck dot probe**.

Zone Coach then computes a simple “today improved?” readout based primarily on:
- dot probe stability (fewer false alarms, steadier responses)
- your subjective shift (more/neutral/less)

Heart rate is treated as a *secondary* corroborator only.

---

### 7) Your recommendation (what to do next)
Zone Coach ends with one clear output:

- **Proceed with training** (normal session), or
- **Light session recommended** (shorter, stabilising, lower intensity), or
- **Stop and reset** (if you can’t re-enter after two attempts)

A button then sends you to the **Capacity Training Coach** (your n-back session).

---

## What the labels mean (plain English)

### **In the G Zone**
Alert enough, steady enough, not overloaded. Best for normal training and deeper work.

### **Too cold (underpowered)**
Low activation/drive. You can still train, but gently. Goal is engagement, not heroics.

### **Too hot (overloaded)**
High strain, scatteredness, or rigid “stuck” control. Training quality usually drops unless you downshift first.

### **Shaky (unstable)**
Fluctuating control and inconsistent responding. The goal is stabilisation and clean reps.

---

## How to use Zone Coach (the compounding method)

**Run it once per day before training.** Consistency beats perfect readings.

Make it clean:
- Phone on silent
- Close extra tabs
- Sit comfortably
- Take it seriously, but keep it light

Follow the recommendation.
If you get “light session”, that’s not failure. That’s smart training hygiene.

---

## What Zone Coach stores (privacy)
Zone Coach stores your recent check results **locally in your own browser** (via localStorage) so the next app can read the handoff.

- No account needed
- No cloud upload by default
- Your browser holds the recent history (rolling window)

If you clear browser storage, your local history resets.

---

## Safety notes
- This tool is for **training readiness**, not medical assessment.
- If you feel dizzy, panicky, or unwell during breathing, **stop** and breathe normally.
- If you have medical concerns (especially respiratory/cardiovascular), use common sense and seek appropriate professional advice.

---

## Troubleshooting

**Bluetooth pairing doesn’t appear**
- Use **Chrome or Edge**
- Make sure Bluetooth is enabled on your device
- Wear the strap (it must be awake) and disconnect it from other apps
- Your site must be on **https** (or `localhost`) for pairing

**Signal quality seems inconsistent**
- Sit still for the 2-minute baseline
- Don’t pre-tap during the dot probe
- Avoid interruptions (don’t tab away)
- Try to measure at a similar time each day

**GitHub Pages shows an old version**
- Hard refresh: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
- It can take a minute or two for Pages to serve the newest build.

---

## What this app is really doing (in one sentence)
Zone Coach helps you **enter and maintain the trainable corridor** where Trident-G training produces portable gains, and (optionally) tracks baseline mind–body dynamics as a long-run trend using RR/heart rate (and, in future, EEG).

---

© Mindware Lab • IQ Mindware
