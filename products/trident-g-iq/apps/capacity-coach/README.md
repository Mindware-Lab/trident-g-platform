# IQ Capacity Coach v1

IQ Capacity Coach is a structured training app for building cognitive stability under pressure.

It is designed to help users improve:
- sustained focus
- working-memory control
- resistance to distraction and overload
- consistency across changing task formats

This app is part of Trident-G, but it also works standalone.

## What Users Experience

At a high level, each session follows this pattern:
1. Home recommends a session style for today.
2. User chooses game and session settings.
3. User runs a guided 10-block session.
4. User logs quick block-level check-ins.
5. App summarizes quality and suggests next actions.
6. User optionally sets a small real-life mission and checks in later.

The app emphasizes reliable performance over one-off spikes.

## Program Model

- Program length target: `24` training sessions.
- Baseline session size: `10` guided blocks.
- Session recommendation adapts to recent evidence quality and performance shape.

Session styles:
- `Build` (`TUNE`)
- `Explore` (`EXPLORE`)
- `Stabilise` (`TIGHTEN`)
- `Switch test` (`PROBE`)
- `Later check` (`RECHECK`)
- `Reset day` (`RESET`)

## Training Games

The app currently supports 4 variants:
- `Classic n-back`
- `Emotional n-back`
- `Non-categorical n-back`
- `Logic-gated n-back`

The app can recommend switching game type when appropriate to test whether gains are robust.

## Why Switch Tests and Re-checks Exist

Capacity Coach does not only track "did score go up?"

It also checks:
- can performance hold when task demands shift?
- does improvement persist later (not just in-the-moment)?

This is why the app uses:
- `PROBE` sessions (switch tests)
- `RECHECK` sessions (later validation)

## Mission Bridge

The app can attach a small real-world mission after training:
- cue
- success signal
- optional value tag

Next time, user logs mission outcome:
- cue fired?
- success met?
- blocker and value context

This helps connect training to real daily behavior.

## Data and Local Storage

Main keys:
- `iqmw.capacity.settings.v1`
- `iqmw.capacity.program.v1`
- `iqmw.capacity.sessions.v1`
- `iqmw.capacity.missions.v1`
- `iqmw.capacity.lastSession`
- `iqmw.capacity.lastGameSelection`

Legacy/back-compat keys:
- `iqmw.progress.v1`
- `trainingProgress`

## File Map

- App: `index.html`
- Science/context notes: `SCIENCE.md`
- Ethics/transparency notes: `ETHICS_AND_TRANSPARENCY.md`
- This document: `README.md`

## Relationship to Mindware Coach

Capacity Coach trains cognitive control capacity.
Mindware Coach trains decision/reasoning scripts and transfer through scenario practice and missions.

In the full stack:
1. regulate state
2. train capacity
3. train scripts
4. apply in real tasks

## Notes

- This tool supports training habits and better judgment routines.
- It is not medical advice or treatment.

## Rollback Note

Recent Zone Coach integration commits:
- `c8ffd5d` - optional Zone Coach handoff + local PVT-based Zone probe integration
- `2444ccc` - optional embedded Zone Coach panel in Capacity Coach

If needed, revert either change with:
- `git revert c8ffd5d`
- `git revert 2444ccc`
