# Scientific rationale + decision algorithms (spec)


> **Scope note (important):** Ψ Zone Coach is a *non-medical* self-regulation and readiness tool. It can be used as:
> 1) a **standalone cognitive readiness check** for broad work or learning, and  
> 2) a **pre-training state gate** before Trident-G capacity training (e.g., n-back).
>
> The aim is not “diagnosis”. The aim is **better training hygiene**: enter a stable, trainable corridor, or choose a lighter/recovery day.

---

## 0) Conceptual model: “Ψ Zone” as a trainable corridor (not a diagnosis)

### Why a “zone” at all?
Cognitive performance is state-dependent. Acute stress/arousal can impair working memory and cognitive flexibility, with nuanced effects across inhibition subtypes (meta-analytic evidence).  
- Shields et al. (2016) review: stress tends to impair **working memory** and **cognitive flexibility**, and affects inhibition in domain-specific ways.  
  (See References: Shields et al., 2016.)

### Why “near-critical” language?
The “near-critical” framing is a **theoretical lens**: many complex systems show useful computational properties near phase transitions. In neuroscience, *criticality* is actively debated, with both supportive reviews and explicit scepticism.  
- Shew & Plenz (2013) review functional benefits claimed near criticality (dynamic range, information transmission, capacity).  
- Beggs & Timme (2012) present major objections and counter-arguments.

**Implementation stance:** the app does **not** “measure brain criticality”. It targets a **practical behavioural/physiological corridor** that tends to support learning and stable control.

---

## 1) Step-by-step flow (inputs → decisions → interventions → outputs)

### Step 1 — Input (optional): Pair a Polar H10 (or similar) to capture RR + heart rate
**What happens**
- If paired, the app streams:
  - **Heart rate (HR)**
  - **RR intervals** (if device exposes them)

**Rationale**
- RR-based metrics (HRV family) reflect autonomic regulation and organismic demand.
- In this app, RR is used for **baseline trend tracking**, not for “today’s verdict”.

**Implementation**
- Browser BLE: standard Heart Rate service.
- If RR is unavailable, proceed normally with behavioural probe + self-ratings.

---

### Step 2 — Input: Daily Prime (η, χ, λ)
**What happens**
User sets three fast context ratings:
- **Confidence (η):** “How capable do I feel today?”
- **Consistency (χ):** “How coherent/settled do I feel?”
- **Support (λ):** “How supportive is my environment right now?”

**Rationale**
These are *priors* for day-level planning. They capture:
- self-efficacy/expectancy effects (performance-relevant beliefs),
- perceived stability/fragmentation,
- environmental friction/support.

**Implementation (simple, transparent)**
- Store η, χ, λ (0–10).
- Use them as *modulators* for final behavioural suggestions, not as the primary classifier.

Recommended mapping:
- `primeIndex = mean(normalise01(η), normalise01(χ), normalise01(λ))`

---

### Step 3 — Input (optional): Baseline complexity trend (DFA α1) ≈ 2 minutes
**What happens**
- If RR is available, record a calm 2-min baseline and compute **DFA α1**.
- Display as a **sparkline trend** across days/weeks.

**Rationale**
- DFA α1 (short-term scaling exponent) is used in HRV research as a proxy for *global organismic demand* and can behave as a fatigue marker in endurance contexts.
- **Crucially:** this is best treated as **individual baseline + trend**, not a single-day pass/fail.

**Implementation (trend only)**
- Compute DFA α1 from RR time series using standard DFA on the beat interval series.
- Store `{date, dfa_a1, duration_s, artefact_pct_est}`.
- Do **not** use DFA α1 to override behavioural readiness outputs.

---

### Step 4 — Input: Pre-reset dot probe (GO/NO-GO) + optional HR
**What happens**
A short GO/NO-GO-style dot probe (with “lures”):
- press only on **GO** dot
- withhold on **NO-GO** dot
- avoid pre-tapping

If strap paired:
- compute `hr_pre = mean(HR during probe)`

**Rationale**
GO/NO-GO performance indexes:
- response control (false alarms),
- sustained attention/steadiness (misses, RT variability),
- “slips” under noise/interruption.

**Implementation metrics (minimum set)**
From the pre-probe:
- `hitRate` (GO accuracy)
- `falseAlarmRate` (NO-GO commission errors)
- `meanRT` on correct GO
- `rtSD` (or robust SD)
- `rtCV = rtSD / meanRT` (stability proxy)
- `interruptCount` (tab blur, pause, etc.)

---

### Step 5 — Input: Self-ratings (0–10)
**What happens**
User rates **five** dimensions (O and F dropped):
- **Energy (E)**
- **Tension (S)**
- **Mental chatter (N)**
- **Plan switching (C)**
- **Stuckness (R)**

**Rationale**
These dimensions are deliberately:
- quickly introspectable,
- interpretable,
- aligned with common state-drift patterns (underpowered vs overloaded vs scattered vs rigid).

**Implementation**
- Store vector `x = [E, S, N, C, R]` (each 0–10).

---

## 2) Step 6 — Decision block: primary mode label + uncertainties

### 2.1 Mode classifier: prototype + Euclidean distance (current design)
Modes (examples):
- **SUB** = underpowered / “too cold”
- **PSI** = in-band / “in the Ψ zone”
- **ENT** = supercritical-scattered
- **MIT** = supercritical-rigid

**Prototypes (0–10)**
(Updated by dropping O and F from the older 7-feature prototypes.)

- SUB: `E=2, S=3, N=5, C=3, R=7`
- PSI: `E=5, S=3, N=2, C=3, R=2`
- ENT: `E=6, S=6, N=8, C=8, R=3`
- MIT: `E=6, S=8, N=3, C=2, R=9`

**Distance**
Let `p_m` be the prototype vector for mode `m` and `x` be today’s rating vector.

- `d(m) = sqrt( Σ_i (x_i − p_mi)^2 )`

**Primary mode**
- `primaryMode = argmin_m d(m)`

### 2.2 Mode confidence (classifier confidence)
Two transparent options (either is acceptable; choose one and keep it stable across versions):

**Option A (softmax over distances)**
- `score(m) = exp( −d(m) / τ )`
- `P(m) = score(m) / Σ_k score(k)`
- `modeConfidence = max_m P(m)`

**Option B (distance margin)**
- Let `d1` = smallest distance, `d2` = second smallest.
- `margin = d2 − d1`
- `modeConfidence = clamp01( margin / marginMax )`  (choose marginMax empirically, e.g., 6–10)

> **UI:** show `modeConfidence` as a badge: High / Medium / Low.

### 2.3 Signal quality (behavioural probe reliability)
Purpose: prevent over-interpreting a messy probe (interruptions, gaming, random tapping).

Example scoring (0–1):
- `q1 = 1 − falseAlarmRate`
- `q2 = hitRate`
- `q3 = 1 − clamp01(rtCV / 0.35)`  (0.35 is a tunable “too variable” anchor)
- `q4 = 1 − clamp01(interruptCount / 2)`

Combine:
- `signalQuality = mean(q1, q2, q3, q4)`

Map to labels:
- `>= 0.80` = Good
- `0.60–0.79` = OK
- `< 0.60` = Poor

### 2.4 State confidence (agreement between ratings and probe)
Purpose: “Do the two channels tell a compatible story?”

Define a simple mismatch rule:
- If ratings suggest “steady” (PSI) but probe shows high instability (false alarms high OR rtCV high), reduce confidence.

Example:
- `ratingsSuggestPSI = (primaryMode == "PSI")`
- `probeSuggestInstability = (falseAlarmRate > 0.18) OR (rtCV > 0.30) OR (hitRate < 0.80)`
- `mismatch = ratingsSuggestPSI AND probeSuggestInstability`

Then:
- `stateConfidence = signalQuality`
- if mismatch: `stateConfidence *= 0.70`

### 2.5 Overall confidence (used for gating)
Combine mode and state confidence.

Recommended:
- `overallConfidence = sqrt(modeConfidence * stateConfidence)`  (geometric mean)

---

## 3) Step 7 — Intervention: breathing protocol selection + rationale

### Selection logic (as implemented)
`selectBreathingPattern(primaryMode):`
- `SUB → Upshift`
- `PSI → Amplify`
- `ENT/MIT/(other) → Downshift`

### Breathing protocols (3 minutes each)

#### A) Upshift (SUB): inhale-led gentle activation
- Pattern: **2–4s inhale**, **2–3s exhale** (slightly inhale-weighted)
- Goal: increase alertness/engagement without overshooting into jitter.

Mechanistic rationale:
- Breathing phase couples to autonomic dynamics; inhale tends to coincide with heart-rate acceleration (RSA principles), and shorter exhale reduces strong parasympathetic bias.

#### B) Amplify (PSI): slow stabilising rhythm (resonance-style)
- Pattern: **4s inhale**, **6s exhale** (~6 breaths/min)
- Goal: stabilise, increase coherence, support sustained attention.

Evidence base:
- Slow-paced breathing / HRV-biofeedback literature shows changes in HRV and related regulation outcomes, often around ~0.1 Hz breathing.

#### C) Downshift (ENT/MIT): cyclic sighing
- Pattern: **two 1s inhales + 7s exhale** (repeat)
- Goal: rapidly reduce physiological arousal and “reset” high-activation states.

Evidence base:
- RCT evidence exists that structured cyclic sighing style respiration can reduce anxiety and physiological arousal over short interventions.

**Safety**
- Stop if dizziness, tingling, panic, or discomfort occurs.
- Return to normal breathing.

---

## 4) Step 8 — Recheck: post-breathing dot probe + optional HR
Repeat the dot probe (shortened is fine).

Compute:
- `signalQuality_post`
- `hr_post = mean(HR during post probe)` if available

---

## 5) Step 9 — Subjective shift rating (fast)
One question:
- **Do you feel more / neutral / less in the Ψ zone than before?**

Encode:
- `shift ∈ {+1, 0, −1}`

---

## 6) Step 10 — “Did it work?” (simple improvement score)
Compute change in probe reliability:
- `ΔQ = signalQuality_post − signalQuality_pre`

Define:
- `improved = (ΔQ >= +0.08) OR (shift == +1)`
- `worse = (ΔQ <= −0.08) OR (shift == −1)`

(Thresholds are tunable; keep them stable once chosen.)

---

## 7) Step 11 — Final gate: Proceed vs Light vs Rest day vs Stop

### 7.1 Proceed (normal training)
Recommend **Proceed** if ALL:
- `primaryMode == PSI` OR (moved toward PSI after breathing; optional future enhancement)
- `overallConfidence >= 0.65`
- `signalQuality != "Poor"`
- `worse == false`

### 7.2 Light session (stabilising training hygiene)
Recommend **Light** if ANY:
- `overallConfidence in [0.35, 0.65)`  
- `signalQuality == "Poor"`  
- `primaryMode in {SUB, ENT, MIT}` but `improved == true` (you stabilised but are not fully in-band)

Light session behaviour suggestion (Trident-G-aligned defaults):
- fewer blocks
- no extra difficulty toggles
- prioritise clean reps and exit on drift

### 7.3 Rest day (new)
Recommend **Rest day** when regulation is clearly off-band AND not recovering with one reset.

One conservative rule:
- If `primaryMode in {ENT, MIT}` AND `signalQuality_pre < 0.60` AND `improved == false`, then Rest day.

Or a stricter rule:
- After **two** breathing attempts (if implemented), if still `worse == true` OR `overallConfidence < 0.35`, then Rest day.

Rest day behaviour suggestions (non-medical, low friction):
- skip capacity training today
- do one short downshift (or a gentle walk)
- prioritise sleep window, hydration, and low-stakes work

### 7.4 Stop and reset (safety / “not today”)
If the user reports feeling unwell, panicky, dizzy, or HR symptoms, show:
- **Stop and reset** + safety text (return to normal breathing, consider professional advice if needed)

---

## 8) Step 12 — Behavioural suggestions output (what the app says at the end)

### Output bundle
Always show:
1) **Primary mode** (SUB / PSI / ENT / MIT)
2) **Confidence badges**  
   - Mode confidence  
   - Signal quality  
   - Overall confidence
3) **Recommendation**  
   - Proceed / Light / Rest day / Stop
4) **One behavioural next step** (single actionable suggestion)

### Suggested copy (examples)
- **Proceed:** “You’re in-band. Do your normal session. Keep it clean.”
- **Light:** “You’re close but not fully stable. Do a short stabilising session.”
- **Rest day:** “Today looks dysregulated. Take a recovery day and come back tomorrow.”
- **Stop:** “Stop and reset. Return to normal breathing.”

---

## 9) Data and privacy (local-first)
Store locally (browser localStorage):
- Daily Prime: η, χ, λ
- Baseline trend: DFA α1 (if available)
- Probe metrics pre/post + HR pre/post (if available)
- Ratings vector (E,S,N,C,R)
- Final labels + confidences + recommendation

No cloud upload by default.

---

## 10) Evidence summary (what is “strong” vs “exploratory”)

### Stronger support (near-term, pragmatic)
- Acute stress impacts executive functions (WM/flexibility) and can degrade task performance.  
- Slow paced breathing and structured respiration can alter autonomic state and reduce anxiety/arousal.  
- Go/no-go style probes capture lapses/false alarms consistent with control and sustained attention.

### Exploratory / theory-lens
- “Near-critical” framing is an interpretive layer grounded in criticality literature, but not something this app directly measures.

---

## References 
1. Shields, G. S., Sazma, M. A., & Yonelinas, A. P. (2016). *The effects of acute stress on core executive functions: A meta-analysis and comparison with cortisol.* Neuroscience & Biobehavioral Reviews, 68, 651–668. https://doi.org/10.1016/j.neubiorev.2016.06.038  
2. Zaccaro, A., et al. (2018). *How breath-control can change your life: A systematic review on psycho-physiological correlates of slow breathing.* Frontiers in Human Neuroscience, 12, 353. https://doi.org/10.3389/fnhum.2018.00353  
3. Balban, M. Y., et al. (2023). *Brief structured respiration practices enhance mood and reduce physiological arousal.* Cell Reports Medicine, 4(1), 100895. https://doi.org/10.1016/j.xcrm.2022.100895  
4. Gronwald, T., et al. (2020). *Fractal Correlation Properties of Heart Rate Variability: A New Biomarker for the Overall Adaptation to Exercise?* Frontiers in Physiology, 11, 550572. https://doi.org/10.3389/fphys.2020.550572  
5. Schaffarczyk, M., et al. (2022). *Fractal correlation properties of HRV as a noninvasive biomarker of fatigue and “readiness to train”.* BMC Sports Science, Medicine and Rehabilitation, 14, 174. https://doi.org/10.1186/s13102-022-00596-x  
6. Shew, W. L., & Plenz, D. (2013). *The functional benefits of criticality in the cortex.* The Neuroscientist, 19(1), 88–100. https://doi.org/10.1177/1073858412445487  
7. Beggs, J. M., & Timme, N. (2012). *Being critical of criticality in the brain.* Frontiers in Physiology, 3, 163. https://doi.org/10.3389/fphys.2012.00163  

---

