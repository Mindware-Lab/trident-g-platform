# Trident-G Platform (IQ Mindware Suite)

A unified, modular app suite for training **general adaptive intelligence**:

1. Staying in a workable **trainable zone** under load, and
2. Converting solves into **portable mindware** that still works when the surface situation changes.

This repo is the **root** for two sister products that share a common architecture and several shared apps:

- **Trident-G-IQ** (performance, reasoning, applied intelligence)
- **Trident-G-Resilience** (burnout/anxiety load-management, fast re-entry, stable thinking on bad days)

---

## 1) What this is optimising (the core promises)

### A. Trainable zone (state control + fast re-entry)

Your best strategies don’t help if you can’t access them under fatigue, stress, interruptions, or pressure. The suite treats “state” as a first-class variable: you learn to **enter**, **stay**, and **re-enter** a workable band.

**Zone labels (internal, consistent across apps):**

- `too_hot` (overloaded, reactive, tunnel vision)
- `in_band` (workable, trainable)
- `too_cold` (flat, avoidant, under-engaged)
- `shaky` (volatile, unstable, drifting)

### B. Far transfer as the product 

Most training improves performance inside the training wrapper. Trident-G only counts a “win” when the learning survives:

- a **wrapper swap** (same deep demand, different surface),
- a **constraint change** (time, stakes, missing info, etc.),
- a **delayed re-check**, and
- at least one **real-world cue-fired use**.

### C. The intelligence cycle (Gf → Gc → Gf)

Solve (fluid) → **crystallise into a tool** (portable card) → redeploy under novelty (fluid again).  
This is how “insight” becomes a repeatable operator rather than a one-off moment.

---

## 2) Product ladder (offerings + pricing)

### Standalone apps

- **Cognitive Tracking Battery** — **$19.99**  
  A lightweight assessment hub and repeatable “difference report” engine.
- **Zone Coach** — **$19.99**  
  State check-ins, re-entry operators, and basic corridor metrics.

### Bundles (Trident-G-IQ / Trident-G-Resilience)

- **IQ Core — $59.99**  
  Capacity training + Zone Coach + Tracking.  
  “Train capacity, regulate state, track score trends.”
- **IQ Pro — $149**  
  Everything in Core + Mindware Operator Coach + GPT practice apps.  
  “Full self-guided far-transfer loop.”
- **IQ Live — $299**  
  Everything in Pro + 4 live webinar sessions with me as the cognitive coach.  
  “Cohort troubleshooting + calibration engine.”
- **IQ 1:1 Premium — $499**  
  Everything in Pro + 4 private coaching sessions with me.  
  “Personalised fastest path.”

> **Note:** This is **performance and self-regulation training**, not diagnosis or a medical device.

---

## 3) Four-phase development plan 

### Phase 1 — Ship now (hybrid stack)

- N-back games delivered via the **legacy Adobe AIR desktop app** (downloadable).
- Web apps on GitHub Pages provide:
  - Zone Coach
  - Tracking battery
  - Capacity/Mindware coaches that guide the loop, log progress, and bridge training into real life
- Data storage: **localStorage** (+ simple export)

### Phase 2 — Replace AIR with web relational n-backs

- AIR app retired (or kept as optional legacy)
- Add **3–4 relational n-back** web apps (GitHub Pages hosted)
- Integrate them into the same session routing:
  - Zone gate → training block(s) → micro-log → optional mindware capture

### Phase 3 — Platform upgrade (auth + DB + commerce)

- Add **Supabase** (or equivalent) for:
  - user accounts (email/password)
  - subscription gating
  - centralised telemetry + dashboards
  - cohort/coaching features
- Keep “local-first” principles where possible (privacy + resilience), but stop relying on localStorage for core tracking.

### Phase 4 — Derive Trident-G-Resilience from the IQ platform

- Use the now-stable Trident-G-IQ platform (Phases 1–3) as the **shared base**.
- Create the **Resilience product variant** by swapping **content and configuration**, not by rewriting apps:
  - Capacity training uses **resilience-oriented n-back variants** (e.g., emotional/interoceptive load management) rather than IQ-oriented relational sets.
  - Mindware packs shift towards **self-regulation and reframing operators** (burnout/anxiety contexts, re-entry under stress, coping planning, etc.).
  - Tracking battery emphasises **cognitive resilience metrics** (state drift, re-entry time, stability/consistency trends) alongside any shared cognitive probes.
- Maintain a shared architecture and shared apps where possible (especially **Zone Coach**), with differences driven by:
  - product-specific `profile` configs
  - product-specific scenario packs and catalogues
  - product-specific copy (onboarding, prompts, language)

---

## 4) Architecture: the shared Trident-G loop (how apps fit together)

**Universal loop unit (runs at micro/meso/macro scales):**  
**Gate → Frame → Map → Choose mode → Test → Update → Compile (or reframe)**

### Shared app roles

- **Zone Coach**  
  State gate + re-entry operators + rigour defaults + “stop rules” (prevents panic-grind and avoidant wandering).
- **Capacity Coach (training hub)**  
  Type-1 primitives that make operators cheaper to run: interference control, updating/switching, calibration, relational fluency.
- **Mindware Coach**  
  Type-2 operator installation: map/tether → discriminating test → compression into a portable card → portability checks → cue-fired mission.
- **Tracking Battery**  
  Pre/post and longitudinal probes for “difference reports” (not just in-app scores).

---

## 5) Repo layout (root)

This repo is organised as a **single “platform root”** with shared assets and two product “sites”.

```text
trident-g-platform/
  README.md

  branding/                      # Shared brand assets (logos, CSS, icons, typography)
    brand.css
    Trident-Icon.svg
    ...

  shared/                        # Shared code/data used by both products (Phase 1–2: lightweight)
    lib/                         # Shared JS helpers (storage keys, logging, routing, UI helpers)
    schemas/                     # JSON schemas for logs, scenario packs, exports
    content/                     # Shared copy blocks, legal/disclaimer snippets, onboarding text

  products/
    trident-g-iq/                # “IQ” product site (GitHub Pages path)
      index.html                 # IQ hub entry
      apps/                      # IQ app suite
        zone-coach/              # Zone Coach (shared app, IQ skin)
        capacity-coach/          # Capacity training hub (routes to AIR in Phase 1; to web games in Phase 2)
        mindware-coach/          # Mindware operator coach (scenario-based)
          scenarios/             # JSON scenario packs (versioned)
        assessments-hub/         # Hub UX for assessments
      assessments/               # Tracking battery tasks
        sgs12a/
        sgs12b/
        psi-cbs/
        crs10/
        edhs/
      docs/                      # Product-specific notes, release notes, research notes

    trident-g-resilience/        # “Resilience” product site (GitHub Pages path)
      index.html                 # Resilience hub entry
      apps/
        zone-coach/              # Same engine, resilience framing + prompts
        capacity-coach/          # Resilience-focused training routing
        mindware-coach/          # CBT-style reframes + operator drills (when appropriate)
          scenarios/
        assessments-hub/
      assessments/
        ...                      # Either shared set or resilience-specific probes
      docs/

  legacy-redirects/              # Optional: redirect stubs to preserve old public URLs
    iq-assessments/              # Old repo/path mirrors with meta refresh + location.replace
    ...

  tools/                         # Dev utilities (optional in Phase 1–2)
    scripts/                     # Build/copy scripts for shared assets, pack versioning, export helpers
    qa/                          # Link checklists, smoke-test steps, release checklists

