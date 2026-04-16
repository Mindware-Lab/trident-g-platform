# Capacity Gym v2 SFX

Capacity Gym v2 works without audio assets by using synthesized Web Audio fallbacks.

Optional polished WAV variants can be added with this filename pattern:

`cg_sfx_<event_id>_<variant>.wav`

Example:

`cg_sfx_trial_hit_1.wav`

To enable optional WAV loading without creating missing-file browser 404 noise, add the event's variant count to `ASSET_VARIANTS` in `../audio.js`.

## Event IDs

- `ui_tap_soft`
- `session_start`
- `block_start`
- `match_primary_press`
- `match_spatial_press`
- `match_object_press`
- `trial_hit`
- `trial_false_alarm`
- `trial_miss`
- `pause_on`
- `resume_on`
- `session_stop_discard`
- `block_complete_neutral`
- `n_level_up`
- `n_level_down`
- `credit_award_small`
- `credit_award_large`
- `programme_bonus`
- `invalid_action`
