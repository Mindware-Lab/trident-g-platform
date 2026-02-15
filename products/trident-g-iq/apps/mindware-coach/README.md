# IQ Mindware Coach v1

Mindware Coach is a practice app for building reliable thinking habits you can use in real work, especially under pressure and in AI-assisted workflows.

## What This App Does

The app trains **mindware scripts**: short, repeatable thinking steps for decisions, arguments, planning, and problem-solving.

Core loop:
1. Teach
2. Worked example (untimed)
3. Timed practice
4. Quick repair (optional Reasoning Gym)
5. Try it in real life (mission)
6. Check-in next time

The goal is transfer: not just getting answers in-app, but applying scripts in real tasks.

## User Experience Principles

- Plain-language guidance first, no internal tags in primary UI.
- Teach-before-test gate on first use of a script.
- Non-blocking nudges (users can still skip and continue).
- Mission bridge after practice so learning carries into real work.
- Quick repair only when repeated reasoning mistakes appear.

## Scripts

Scripts are internally stored as `Y0`-`Y10`, but user-facing labels are loaded from `lessons_v1.json` (`display_name`, `display_subtitle`).

The app now includes:
- "When not to use this" guidance per script
- "If this is the real issue, start with..." script-switch hints

## Reasoning Gym

Reasoning Gym is a support layer, not a separate course. It targets repeated reasoning errors using five families:
- If-then logic
- Find the counterexample
- Base rates
- Cause vs coincidence
- Structure vs surface

It includes switch items for:
- `wrong_tool`: "Is this the right approach?"
- `flip_trigger`: "What would change your mind?"

## Home “Bigger Picture” Help

Home includes:
- "How this helps" strip (collapsed by default)
- "How it works" modal
- "Why missions?" modal
- Start-session "Why" line
- Mission bridge banner (pending vs no pending mission)

This copy is managed via a `COPY` object in `index.html`.

## Content Packs

Located in `content/packs/`:
- `lessons_v1.json`: Teach content + guided item per script
- `core_v1.json`: primary timed practice scenarios
- `reasoning_gym_v1.json`: logic/reliability repair scenarios
- `logic_injections_v1.json`: additional logic scenarios
- `manifest_v1.json`: pack routing

## Local State Keys

- `tg_mindware_state_v1`
- `tg_shared_state_v1`
- `tg_mindware_events_v1`
- `tg_mindware_content_cache_v1`

Notable state areas:
- `operator_intro`: teach/guided completion by script and version
- `missions`: planned and completed transfer tasks
- `probe`: transfer checks, re-checks, and Gym suggestions
- `ui`: Home help preferences and last opened guide timestamp

## File Map

- App shell/UI: `index.html`
- Lessons pack: `content/packs/lessons_v1.json`
- Reasoning Gym pack: `content/packs/reasoning_gym_v1.json`

## Notes

- This app supports clearer thinking habits; it is not medical advice.
- For behavior changes, prefer updating pack content first, then UI copy.
