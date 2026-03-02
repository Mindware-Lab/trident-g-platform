# Capacity Gym Stage 1 SFX Asset Spec

Drop exported sound files in this directory using:

`cg_sfx_<event_id>_<variant>.wav`

Example:

`cg_sfx_trial_hit_1.wav`

## Event IDs

- `ui_tap_soft`
- `game_match_press`
- `trial_hit`
- `trial_false_alarm`
- `trial_miss`
- `pause_on`
- `resume_on`
- `session_stop_discard`
- `quiz_answer_lock`
- `quiz_correct`
- `quiz_incorrect`
- `quiz_timeout`
- `block_complete_neutral`
- `n_level_up`
- `n_level_down`
- `coach_next_block`
- `session_complete`
- `bank_units_awarded`
- `mission_bonus_awarded`
- `unlock_relational`
- `warning_flash`

## Suggested variant counts

- `ui_tap_soft`: 2
- `game_match_press`: 3
- `trial_hit`: 3
- `trial_false_alarm`: 3
- `trial_miss`: 2
- all others: 1 (optional 2)

## Technical format

- WAV, 48 kHz, 24-bit masters
- Keep tails short and trim dead air
- Avoid harsh, fatiguing transients

If assets are missing, the app automatically falls back to internal synthesized SFX.
