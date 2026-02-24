
# The Mind-Body Dynamic Range Framework: Definitive Specification v2.2

---

## 1. The 3D State Space (Cross-Domain Mapping)

The architecture relies on the mathematical homology between heart and brain. Both complex adaptive systems are tracked across three identical dimensions:

| Dimension | Body (HRV) | Mind (MFT-M) | What It Measures |
|-----------|------------|---------------|-------------------|
| **Y-Axis: Amplitude** | **lnRMSSD** | **`bps`** | Processing bandwidth / energetic capacity. |
| **X-Axis: Structure** | **DFA $\alpha_1$** | **`RT lag-1`** | Temporal order. Optimal state is fractal / 1/f pink noise. |
| **Z-Axis: Irregularity** | **SampEn** | **`RT CV` & Error Burstiness** | System noise. Identifies structural decoupling or random guessing. |

> **Note:** While all three dimensions define the full state space, core tracking and visualization focus on the **2D Mind‑Body plane** (Amplitude dimensions). Structure and Irregularity serve as **quality gates** that validate whether a point represents a truly adaptive state.

---

## 2. Standardizing the Currencies (Confidence‑Weighted Z‑Scores)

To combine cardiovascular (`lnRMSSD`) and cognitive (`bps`) metrics without one dominating the other, both are converted into personalized standard deviations (Z‑scores) relative to their Exponentially Weighted Moving Average (EWMA) baselines.

### Cognitive Confidence Weighting
Because cognitive data relies on trial‑by‑trial sampling, shorter assessments have lower statistical power. We apply a confidence weight using the Law of Large Numbers:

$$Z_{\text{mind}}^{\text{weighted}} = \left( \frac{\text{Current bps} - \text{EWMA}_{\text{bps}}}{SD_{\text{bps}}} \right) \times \left(1 - \frac{1}{\sqrt{N_{\text{trials}}}}\right)$$

### Physiological Confidence Weighting
HRV metrics also benefit from longer recordings. The confidence weight is based on recording duration relative to a target (e.g., 180 seconds):

$$Z_{\text{body}}^{\text{weighted}} = \left( \frac{\text{Current lnRMSSD} - \text{EWMA}_{\text{lnRMSSD}}}{SD_{\text{lnRMSSD}}} \right) \times \min\left(1, \sqrt{\frac{\text{duration}}{180}}\right)$$

### Baseline Adaptation
All EWMA baselines update continuously with new data, allowing the system to track gradual shifts in the user's set point while remaining responsive to recent changes.

---

## 3. The Quality Gates (Protecting the Data)

Raw amplitude/speed is invalid if the system is structurally compromised. Both mind and body gates are now **continuous** to avoid sharp discontinuities.

### The Mind Gate ($V_{\text{mind}}$)

Optimal cognitive flow (pink noise) corresponds to an `RT lag-1` of roughly $0.3$. A Gaussian penalty smoothly degrades validity as temporal structure drifts:

$$V_{\text{mind}} = e^{-k_{\text{mind}}(RT_{\text{lag1}} - 0.3)^2}$$

with $k_{\text{mind}} = 5$, defining the width of the acceptable pink noise curve (penalty ~0.6 at 0.1 and 0.5, ~0.14 at 0.0 and 0.6).

### The Body Gate ($V_{\text{body}}$)

For the body, DFA $\alpha_1$ has biological boundary conditions, but transitions are smoothed to avoid cliffs:

$$
V_{\text{body}} = 
\begin{cases}
e^{-k_{\text{low}}(0.75 - \alpha_1)^2} & \alpha_1 < 0.75 \\[4pt]
1 & 0.75 \le \alpha_1 \le 1.15 \\[4pt]
e^{-k_{\text{high}}(\alpha_1 - 1.15)^2} & \alpha_1 > 1.15
\end{cases}
$$

where $k_{\text{low}} = 10$ and $k_{\text{high}} = 20$ create asymmetric penalties: gentle decay below 0.75 (decoupling), steeper decay above 1.15 (rigidity).

### Combined Gate
Overall validity of a point is the product:

$$V_{\text{total}} = V_{\text{mind}} \times V_{\text{body}}$$

Points with $V_{\text{total}} < 0.5$ are excluded from dynamic range calculations but may still be shown as "low‑quality" states for awareness.

---

## 4. Context‑Aware Indices (Mind‑Body Coupling)

The relationship between brain and body depends on environmental demand. The app calculates one of two distinct indices based on session context.

### A. The "Neurovisceral Sync" Index (Recovery & Rest)

- **Context:** Breathing exercises, meditation, sleep prep, pattern flow task
- **Goal:** Both systems improve together
- **Formula:**

$$\text{Sync Index} = (Z_{\text{mind}}^{\text{weighted}} \times V_{\text{mind}}) + (Z_{\text{body}}^{\text{weighted}} \times V_{\text{body}})$$

- **Interpretation:** High positive = perfect integration—the vagus nerve quieted both heart and prefrontal noise. Both systems move in the same direction (up and right in the 2D space).

### B. The "Executive Override" Index (Stress & Load)

- **Context:** Intense exercise, cold exposure, high‑pressure work, WM challenge
- **Goal:** Mind stays sharp while body stresses
- **Formula:**

$$\text{Override Index} = (Z_{\text{mind}}^{\text{weighted}} \times V_{\text{mind}}) - (Z_{\text{body}}^{\text{weighted}} \times V_{\text{body}})$$

- **Interpretation:** High positive = elite dissociation—body redlining but cognition intact. The mind stays sharp (positive Z_mind) while the body stresses (negative Z_body).

---

## 5. The 4‑Quadrant Attractor Landscape with Transition Dynamics

The four quadrants are treated as **dynamical attractor basins** with measurable transition velocities between them. These quadrants directly visualize the Sync and Override relationships.

### The Quadrants

| Basin / Quadrant | Physiology | Cognition | System Interpretation | Mind-Body Relationship |
|------------------|------------|-----------|------------------------|------------------------|
| **The Zenith** (Top Right) | Relaxed / Open | Flow ($V_{\text{mind}} \approx 1$) | **Natural Attractor:** Deep recovery, integrated health. | **High Sync** (both positive) |
| **The Clutch** (Bottom Right) | Stressed / Rigid | Flow ($V_{\text{mind}} \approx 1$) | **High‑Energy Override:** Elite performance. Metabolically costly. | **High Override** (mind positive, body negative) |
| **The Drift** (Top Left) | Relaxed / Open | Decoupled / Sluggish | **Entropy Attractor:** Under‑arousal, sleep onset. | **Low Sync** (body positive, mind negative) |
| **The Crash** (Bottom Left) | Stressed / Rigid | Brittle / Errors | **Defense Attractor:** System overload, panic. | **Low Override** (both negative) |

### Transition Velocity

During any session with multiple measurements (e.g., the stress‑recovery cycle), track the path through state space:

$$\text{Velocity}_{t} = \frac{\sqrt{(Z_{\text{mind}}^{t+1} - Z_{\text{mind}}^{t})^2 + (Z_{\text{body}}^{t+1} - Z_{\text{body}}^{t})^2}}{\Delta t_{\text{minutes}}}$$

- **Fast transitions** between quadrants suggest system flexibility.
- **Slow or stalled transitions** suggest "stickiness"—inability to shift states.
- **Oscillations** (back‑and‑forth) suggest instability.

Recovery velocity (from Clutch/Crash toward Zenith/Drift) is a key resilience metric.

---

## 6. The Stress‑Recovery Cycle Protocol

To probe latent capacity and recovery dynamics, a structured challenge protocol is used. This protocol explicitly tests both **Override** (during WM challenge) and **Sync** (during pattern flow recovery).

### Protocol Structure

| Phase | Duration | Task | Purpose |
|-------|----------|------|---------|
| **Baseline** | 3 min | MFT‑M | Establish resting state ($P_{\text{base}}$) |
| **High Load** | 3‑5 min | WM challenge (adaptive n‑back) | Push upper bound—test Override |
| **Probe 1** | 2 min | MFT‑M | Capture stressed state ($P_{\text{stress}}$) |
| **Pattern Flow** | 3‑4 min | Coherent motion detection | Induce flow/recovery—test Sync |
| **Probe 2** | 2 min | MFT‑M | Capture recovered state ($P_{\text{recover}}$) |

### Points Captured
- **$P_{\text{base}}$**: Pre‑challenge resting state
- **$P_{\text{stress}}$**: State under cognitive load
- **$P_{\text{recover}}$**: State after flow induction

### Metrics Derived

**Stress Reactivity:**
$$\Delta_{\text{stress}} = \|P_{\text{stress}} - P_{\text{base}}\|$$

**Recovery Vector (Direction-Aware):**
Let $\vec{S} = P_{\text{stress}} - P_{\text{base}}$
Let $\vec{R} = P_{\text{recover}} - P_{\text{base}}$

**Recovery Along Stress Axis:**
$$\text{RecoveryParallel} = \frac{\vec{R} \cdot \vec{S}}{\|\vec{S}\|}$$

**True Elasticity (Direction-Aware):**
$$\text{Elasticity} = 
\begin{cases}
1.0 + \dfrac{\|\vec{R}\|}{\|\vec{S}\|} & \text{if } Z_{\text{mind}}^{\text{recover}} > Z_{\text{mind}}^{\text{base}} \text{ and } Z_{\text{body}}^{\text{recover}} > Z_{\text{body}}^{\text{base}} \\[8pt]
\dfrac{\|\vec{S}\| - \max(0, \text{RecoveryParallel})}{\|\vec{S}\|} & \text{otherwise}
\end{cases}$$

This rewards:
- **Elasticity = 1.0** = perfect return to baseline
- **Elasticity > 1.0** = supercompensation (better than baseline)
- **Elasticity < 1.0** = incomplete recovery

**Flow Induction Effect:**
$$\text{FlowEffect} = \frac{Z_{\text{mind}}^{\text{recover}} \times V_{\text{mind}}^{\text{recover}}}{Z_{\text{mind}}^{\text{base}} \times V_{\text{mind}}^{\text{base}}}$$

- **>1** = pattern flow improved cognitive state beyond baseline.
- **<1** = incomplete recovery.

---

## 7. Ultimate Metrics: Multi‑Timescale Dynamic Range

The framework distinguishes between **session‑specific traversal** and **global dynamic range**.

### A. Session-Specific Traversal (Intra-Day)

For any session with multiple measurements (including the full protocol), we measure the **total path traversed** rather than triangle area to avoid the collinearity problem:

$$\text{SessionTraversal} = \|P_{\text{stress}} - P_{\text{base}}\| + \|P_{\text{recover}} - P_{\text{stress}}\|$$

**Path Efficiency (Recovery Directness):**  
Let $\vec{V}_{\text{actual}} = P_{\text{recover}} - P_{\text{stress}}$ (the path actually taken during recovery)  
Let $\vec{V}_{\text{ideal}} = P_{\text{base}} - P_{\text{stress}}$ (the direct, perfect path back to baseline)

$$\text{PathEfficiency} = \frac{\vec{V}_{\text{actual}} \cdot \vec{V}_{\text{ideal}}}{\|\vec{V}_{\text{actual}}\| \,\|\vec{V}_{\text{ideal}}\|}$$

- **Efficiency = 1.0:** Perfect straight‑line recovery ($\cos 0^\circ$).
- **Efficiency = 0.0:** Wandering orthogonal to the ideal path ($\cos 90^\circ$).
- **Efficiency < 0:** Active deterioration during recovery ($\cos >90^\circ$).

### B. Global Dynamic Range (Long‑Term Envelope)

Let $S_{\text{valid}}$ be the set of all points across all sessions where $V_{\text{total}} \ge 0.5$, collected over a rolling window (e.g., past 30 days or all‑time).

The **global dynamic range** is the area of the convex hull of $S_{\text{valid}}$:

$$\text{GlobalRange} = \text{Area}(\text{ConvexHull}(S_{\text{valid}}))$$

This represents the full adaptive capacity—the envelope of all states the system can occupy while maintaining structural integrity.

### C. Normalized Volume (0‑1 Scale)

To track progress relative to personal best:

$$\text{NormalizedVolume} = \frac{\text{GlobalRange}_{\text{current}}}{\max(\text{GlobalRange}_{\text{all time}})}$$

A value of 1.0 means the user is currently accessing their full known capacity.

### D. Population Comparison

For users who opt in, compare to anonymized aggregates:

$$\text{PopulationPercentile} = \text{Percentile}(\text{GlobalRange}, \text{PopulationDistribution})$$

Display as: "Your dynamic range is in the top X% of users your age."

### E. The Resilience Quotient (Composite)

Combine range, recovery, and structural integrity into a single metric:

$$RQ = \frac{\text{GlobalRange}}{\text{GlobalRange}_{\text{population median}}} \times \frac{\text{AvgElasticity}}{\text{PopulationAvgElasticity}} \times \frac{\text{AvgGateProduct}}{\text{PopulationAvgGate}}$$

This rewards:
- Wide accessible range
- Fast, complete recovery (with bonus for supercompensation)
- High structural integrity (gates near 1.0)

---

## 8. Visualization Strategy

### Dashboard
- **Primary:** Global range envelope (convex hull) with today's path overlaid.
- **Trend:** Normalized volume over time (weeks/months).
- **Secondary:** Recovery velocity trend, population percentile.

### Session View
- Real‑time quadrant tracking—see Sync and Override relationships in action.
- Post‑session: Stress reactivity, true elasticity score, path efficiency.
- "You expanded your range today!" notification if $P_{\text{stress}}$ or $P_{\text{recover}}$ extends the global hull.

### Insights
- "Your recovery velocity has improved 30% this month."
- "You're spending less time in The Crash quadrant under stress."
- "Your global range is expanding—you're building resilience."

---

## 9. Summary of Edge Cases Addressed

| Concern | Solution |
|---------|----------|
| Binary body gate | Continuous asymmetric penalty function |
| Dynamic volume normalization | Personal best normalization + population percentiles |
| Transition speeds | Velocity metrics between quadrants |
| Dark matter / latent capacity | Stress‑recovery protocol with probe points |
| Baseline drift | Global hull tracks absolute range, not just relative Z‑scores |
| Short assessment reliability | Confidence weighting by trials/duration |
| Session vs. long‑term range | Session traversal vs. global convex hull |
| Supercompensation penalty | Direction-aware elasticity with bonus for Zenith states |
| Collinear paths | Path traversal replaces triangle area |
| Path efficiency trap | Cosine similarity measures recovery directness, not displacement |

---

This specification now provides a complete, mathematically rigorous, and biologically faithful foundation for tracking mind‑body resilience across multiple timescales, with clear protocols for probing latent capacity and clear metrics for tracking improvement over time. The **Sync Index** and **Override Index** are central to the framework, capturing the two fundamental modes of mind-body coupling: integration during recovery and dissociation during stress.
```
