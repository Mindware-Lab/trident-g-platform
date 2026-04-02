# Trident-G MVP: Game Layer Specification

## Overview

This document outlines the game layer for the Trident-G MVP. In accordance with the core product principle, the MVP is a playable, proof-first web app. The overarching design rule is that the internal engine may be rich, but the surface should stay simple. 

Therefore, the game layer avoids heavy UI clutter, complex meta-shops, and multiplayer mechanics. Instead, it gamifies the existing five-part loop (Zone → Capacity → Reasoning → Mission → Real Missions) using the internal data schemas to drive retention through meaningful progression and highly responsive system feedback.

---

## 1. The Core Economy: "Banked Mastery"

Instead of arbitrary points, the primary currency and win-state of the game is verified real-world capability. 

* **The Mechanism:** The game tracks a script's lifecycle from a compiled **Script Candidate** (cue, steps, check, trap/boundary, stop rule) to a fully **Banked Script**. 
* **The Economy Loop:** A candidate is promoted to a banked script only after enough evidence of portability and deployment. Banking a script is the ultimate player achievement.
* **Player-Facing UI:** The main hub features a simple summary of Banked scripts showing counts for "saved", "reused", and "ready to bank". It must not look like a complex shop or armory in the MVP.

---

## 2. The Entry Gate: The 4-State Zone Matrix

The Zone gate is the entry condition for the whole loop, checking whether the user is in a viable operating state. Based on a 20–40 second brief cognitive control probe, the game deterministically routes the player into one of four states, dictating their daily path.

### The Four States & Routing Logic:
1. **In the zone (Optimal)**
   * **State:** System is clean and ready.
   * **Game Path:** Full vertical stack ladder (Zone ↓ Capacity ↓ Reasoning ↓ Mission) is unlocked.
   * **Coach Action:** Promotes normal upward progression.

2. **Flat (Under-aroused)**
   * **State:** Low cognitive energy; heavy inference will likely fail.
   * **Game Path:** Upper layers are blocked. 
   * **Coach Action:** Triggers a **Push** action class to increase challenge slightly and wake the system up.

3. **Spun out (Over-aroused / Scattered)**
   * **State:** High cognitive interference.
   * **Game Path:** Heavy training is blocked. 
   * **Coach Action:** Triggers a **Recover** action class to route the player to a recovery routine.

4. **Locked in (Rigid / Tunnel-visioned)**
   * **State:** High focus but prone to rote execution; lacking cognitive flexibility.
   * **Game Path:** Mission layers are restricted until flexibility is proven.
   * **Coach Action:** Triggers a **Switch it up** action class (e.g., a syntax swap) right out of the gate to break rigidity.

---

## 3. The Progression Loop: "Transfer Quests"

The game turns the dry requirement of testing far-transfer into an active gameplay loop. 

* **The Mechanism:** The MVP requires a portability staircase to validate scripts: syntax swap, wrapper swap, mission-context swap, delayed re-check, and cue-fired real use. 
* **Gamification:** These requirements are served to the player as active quests.
* **Player-Facing UI:** Delivered one at a time via the single "Next best move" coach card on the hub. For example, the coach may prompt the player to **Deploy** the method in a real task to satisfy the cue-fired requirement. 

---

## 4. Dynamic Response: The "Rescue & Push" Coach

The internal telemetry—specifically plateau detection, overload detection, and drift—is used to make the game feel alive and highly responsive, turning background adjustments into satisfying UI moments.

* **The Mechanism:** When the system detects suboptimal performance, it triggers one of the visible action classes: **Recover**, **Push**, **Switch it up**, or **Step down**.
* **Player-Facing UI:** The background system event is translated into deliberate, satisfying copy on the "Next best move" card. 
  * *Example 1 (Overload):* "Cognitive load high. Stepping down to Capacity layer." (Translating a **Step down** action).
  * *Example 2 (Plateau):* "Rote execution detected. Switching syntax." (Translating a **Switch it up** action).

---

## 5. Excluded Mechanics (Phase 1 Guardrails)

To protect the MVP architecture, the following game elements are strictly excluded from v1:

* **Social Proof & Multiplayer:** The first version is a static web app with local-only storage. There is no cloud sync initially, making leaderboards, squads, and social cohorts technically unviable.
* **Build Identities (Explore vs. Exploit Profiles):** There is no server-side personalisation in MVP. The user's specific missions inputted into the Mission Ledger provide sufficient "IKEA effect" customization for now.
* **The Visual Vault / Shop UI:** The player should not be overwhelmed. The banked scripts remain a simple summary rather than a complex inventory management screen.
