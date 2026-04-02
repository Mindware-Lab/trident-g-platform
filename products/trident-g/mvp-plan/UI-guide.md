***

# UI/UX Specifications: Trident-G MVP (Freemium & Coaching Model) - Design Logic

## 1. Product Philosophy & Core UX Rule
The core design rule of the MVP dictates that the internal engine may be rich, but the surface should stay simple. The UI must function as a focused, high-performance tactical interface rather than a cluttered entertainment app. 

* **Primary Goal:** Facilitate the training of portable intelligent action.
* **UX Metaphor:** A lean, local-first intelligence terminal.
* **Anti-patterns to Avoid:** Complex virtual shops, social leaderboards, or exposing deep internal telemetry on the primary hub.

---

## 2. Global Information Architecture & Theming Logic

### A. Typography Hierarchy
To maintain a technical feel while ensuring readability, the typography system requires a strict, three-tier functional hierarchy:
1.  **Data & Primary Headings:** A highly legible, distinct style reserved strictly for numerical metrics, scores, and top-level system titles. It should feel precise and quantifiable.
2.  **Structural Micro-copy:** A contrasting style used for UI labels, tags, and table headers. This establishes the scaffolding of the interface without competing with the actual data.
3.  **Prose & Reading:** A clean, neutral style utilized for Coach explanations, user inputs, and longer descriptions. Prioritize reading comprehension over stylized flair.

### B. Semantic Theming
Visual weight and thematic cues must communicate system state and stack-layer identity, never serving as pure decoration.
* **Layer Identity:** Each layer of the stack (Zone, Capacity, Reasoning, Mission, Real Missions) needs a distinct visual signature so the user instantly knows where they are operating.
* **State Communication:** The interface must use clear visual shifts to instantly communicate whether an outcome is successful, a warning, a hard stop, or an optimal "in band" state.

---

## 3. Screen 1: The G-Loop Hub (Freemium Dashboard)

This dashboard serves as the central control room and must remain extremely lean.

### Top Navigation Bar
* **Account Status:** Must clearly indicate the user's current tier (e.g., "Free Tier") to set expectations.
* **System Activity:** Include a subtle, continuous visual indicator demonstrating that background telemetry and tracking are actively running, building trust in the unseen engine.

### The State Tile (Top Left)
* **Purpose:** Displays the output of the 4-State Matrix.
* **Logic:** The visual framing of this tile must dynamically adapt to instantly communicate the user's current readiness (Optimal, Under-aroused, Over-aroused, or Rigid) before they even read the text.

### The Coach Card (Top Right)
* **Purpose:** The singular focal point for daily goals and dynamic friction. Instead of a traditional quest log, the system serves "Transfer Quests" sequentially.
* **Freemium Integration:** This component is the primary vehicle for gentle scarcity. It should clearly display daily usage limits or progression caps, signaling premium boundaries without hard-locking the user out of basic app navigation.

### The Scripts Card (Bottom)
* **Purpose:** The visual representation of the progression economy.
* **Logic:** It must display the ledger of Banked, Holding, and Candidate scripts. The layout must avoid looking like an RPG inventory; instead, it should be structured like a clean financial statement or capability audit, placing the heaviest visual emphasis on "Banked" items to reinforce the ultimate goal.

---

## 4. Screen 2: Deep Telemetry (The Coaching Paywall)

This screen functions as a high-ticket B2B/Premium teaser. It leverages the gap between what the system knows and what the user can interpret to drive coaching sales.

### The Tease (Background Grid)
* **Purpose:** Prove that the internal engine is capturing highly complex biological and cognitive data.
* **Logic:** The underlying layout should display structural evidence of deep data (e.g., matrices, structural graphs, raw feed placeholders). However, this layer must be heavily obscured or visually scrambled so that no actionable insights can be extracted. It proves the value exists without giving it away.

### The Gate (Foreground Overlay)
* **Purpose:** The primary conversion point for human-led cognitive coaching.
* **Logic:** Positioned directly over the obscured data, this overlay must reframe the locked information. The copy should explain that raw telemetry is useless without expert, supervised analysis. 
* **The CTA:** The call-to-action to book a session must be the most prominent, high-contrast interactive element on the screen.

---

## 5. Interaction & Component Logic

* **Feedback Loops:** Interactive elements must provide immediate, subtle visual feedback to acknowledge user input. Avoid heavy graphical animations; keep interactions feeling flat, instantaneous, and digital.
* **Spatial Separation:** Rely on minimal, thin delineations to separate content areas. The UI should feel like a functional wireframe or a specialized piece of equipment, reinforcing the "tool over toy" philosophy.
