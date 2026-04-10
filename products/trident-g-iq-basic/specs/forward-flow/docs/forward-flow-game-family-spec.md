# Forward Flow Game Family Spec

Version: `v0.1`

Status: working product spec for `trident-g-iq-basic`

## 1. Purpose

This spec defines a new `Forward Flow` game family for `trident-g-iq-basic`.

The family is intended to train semantic movement and generative flexibility when the user is already:

- `Locked In`
- `in-band`
- sufficiently stable for exploratory training

It should not be treated as another n-back wrapper. It is a separate game family with different mechanics, different feedback, and different session-routing logic.

## 2. Product Role

### 2.1 Position in the training stack

The clean product split is:

- `Sustained Attention` lane
  - use when the user is `Spun Out`, unstable, or regulation-first
- `Forward Flow` lane
  - use when the user is `Locked In`, ready, and capable of controlled generative movement

This means the Hub or Zone handoff should route users into one of two families rather than forcing all users into the same game logic.

### 2.2 What this game is training

This game aims to train:

- semantic exploration without obvious looping
- moving beyond the current associative neighborhood
- controlled novelty rather than random word spam
- sustained generative momentum under light rules

It does not claim to prove far transfer or creativity change by itself.

## 3. Core Game Concept

### 3.1 Round structure

One run begins with:

- a cue word
- a visible timer or turn count
- a simple instruction:
  - "Type the next word that moves further while still fitting the stream."

The player then generates a chain of responses.

Each response is scored against:

- earlier responses in the same run
- the early-run baseline for that run
- the player's session history baseline

### 3.2 MVP response format

For MVP:

- allow single-word responses only
- lowercase and normalize input before scoring
- reject punctuation-only or empty entries
- reject direct repeats

Phrase support can be added later, but should not be part of the first playable version.

### 3.3 Session structure

Recommended first-pass session:

- `3` runs per session
- `60` seconds per run, or `15` valid responses max
- `20` to `30` seconds rest between runs

Recommended session length:

- `4` to `6` minutes active time

## 4. Canonical Semantic Backend

### 4.1 Recommended data stack

Recommended MVP semantic stack:

1. `GloVe` vectors as the primary semantic distance engine
2. `WordNet` as a lexical guardrail layer
3. `Supabase Postgres + pgvector` as the backend store and scoring surface

Use:

- `GloVe`
  - primary word-level semantic distance
- `WordNet`
  - synonym / hypernym / trivial-neighbor checks
- `Supabase`
  - user data, telemetry, progression, reward logging, and optional server-side scoring

### 4.2 Why this stack

`GloVe` is the recommended MVP choice because it is:

- simple
- commercially cleaner than ShareAlike alternatives
- strong enough for single-word cosine distance
- easy to preprocess into a game vocabulary

`WordNet` is recommended as a support layer, not the main scorer. It helps detect:

- direct synonyms
- same lemma family
- obvious category camping
- lexical cheating patterns

### 4.3 Phrase support later

If multi-word responses are allowed later:

- add a sentence-embedding layer such as `all-MiniLM-L6-v2`
- run phrase scoring server-side
- do not mix phrase and single-word scoring in the MVP rules

## 5. Database and Asset Design

### 5.1 Recommended Supabase architecture

Use Supabase for:

- auth
- session history
- reward logs
- state routing
- semantic vector lookup
- telemetry

Recommended storage split:

- `Postgres`
  - normalized vocabulary and vector references
  - player runs
  - item-level telemetry
  - reward transactions
- `pgvector`
  - embedding vectors for allowed words
- `Storage`
  - raw import packs and offline lexicon exports

### 5.2 Recommended tables

#### `ff_vocab`

- `word text primary key`
- `lemma text`
- `embedding vector(100)` or chosen dimension
- `zipf_band int null`
- `allowed boolean not null default true`
- `wordnet_synset_count int null`
- `is_function_word boolean not null default false`

#### `ff_word_links`

- `source_word text`
- `target_word text`
- `link_type text`
  - `synonym`
  - `hypernym`
  - `hyponym`
  - `same_lemma`
- composite index on `(source_word, target_word, link_type)`

#### `ff_runs`

- `id uuid primary key`
- `user_id uuid`
- `cue_word text`
- `zone_state text`
- `session_id uuid null`
- `run_index int`
- `started_at timestamptz`
- `finished_at timestamptz null`
- `valid_responses int`
- `mean_inst_flow numeric`
- `mean_cue_relevance numeric`
- `loop_rate numeric`
- `run_score numeric`
- `credit_awarded int`

#### `ff_run_items`

- `id uuid primary key`
- `run_id uuid`
- `turn_index int`
- `raw_input text`
- `normalized_word text`
- `valid boolean`
- `invalid_reason text null`
- `cue_distance numeric null`
- `inst_flow numeric null`
- `delta_vs_early numeric null`
- `delta_vs_player_baseline numeric null`
- `feedback_band text null`
- `beep_type text null`
- `credit_delta int not null default 0`
- `created_at timestamptz`

#### `ff_player_baselines`

- `user_id uuid primary key`
- `runs_count int`
- `mean_run_score numeric`
- `mean_inst_flow numeric`
- `mean_peak_inst_flow numeric`
- `updated_at timestamptz`

### 5.3 Asset import strategy

Do not ship the full original vector dump directly to the client.

Instead:

1. curate an allowed vocabulary
2. import vectors into Supabase
3. expose only the words allowed by product rules
4. optionally cache a small local pack for fast autocomplete

Recommended MVP vocabulary size:

- `5,000` to `15,000` words

This is large enough to feel flexible and small enough to keep the game manageable.

## 6. Input Normalization Rules

Before scoring, normalize each response:

1. trim whitespace
2. lowercase
3. strip punctuation at the edges
4. map obvious inflections to lemma where safe
5. reject if not in `ff_vocab.allowed`

Immediate invalid states:

- empty response
- repeated exact word
- word not in allowed vocabulary
- function-word only response
- same lemma repeated too soon

Later hardening can add:

- typo correction
- autocomplete
- variant collapsing

## 7. Core Calculations

### 7.1 Vector distance

For two valid words `a` and `b`:

```text
cosine_similarity(a, b) = dot(vec_a, vec_b) / (||vec_a|| * ||vec_b||)
semantic_distance(a, b) = 1 - cosine_similarity(a, b)
```

Distance is higher when the meanings are further apart in embedding space.

### 7.2 Instantaneous forward flow

For response `r_n`, calculate distance from all prior valid responses in the run:

```text
inst_flow(n) =
  average( semantic_distance(r_n, r_1 ... r_(n-1)) )
```

Only compute this once at least one prior valid response exists.

### 7.3 Run forward-flow score

For a run with `k` valid responses:

```text
run_flow =
  average( inst_flow(2) ... inst_flow(k) )
```

This is the run-level semantic movement score.

### 7.4 Cue relevance guardrail

A pure distance metric can be gamed by producing unrelated words. The game therefore needs a relevance guardrail to the cue.

For each response:

```text
cue_relevance(n) = cosine_similarity(r_n, cue_word)
```

Use a low floor:

- if cue relevance is below a minimum threshold, mark the response as weak-fit
- weak-fit responses can score less credit even if they are far away

This is a product guardrail, not a claim that the original forward-flow paper requires cue relevance.

### 7.5 Loop penalty

Penalize staying inside one semantic pocket.

Example signals:

- low `inst_flow` for multiple turns in a row
- direct synonym pair from `WordNet`
- same hypernym cluster repeated several times

Recommended simple loop flag:

```text
loop_flag(n) =
  true if inst_flow(n) < low_flow_threshold
  for 2 consecutive valid turns
```

### 7.6 Early-run baseline

Use the early part of the run as a local comparison baseline.

Recommended early-run window:

- first `4` valid responses after the cue

Compute:

```text
early_baseline =
  average(inst_flow values from the early window)
```

Then for later turns:

```text
delta_vs_early(n) = inst_flow(n) - early_baseline
```

This gives the live comparison needed for beep feedback.

### 7.7 Session and player baseline

Maintain a rolling player baseline over recent valid runs.

Recommended first-pass baseline:

- trailing `12` completed runs

Compute:

```text
player_baseline_flow =
  average(run_flow over recent runs)
```

Then:

```text
delta_vs_player_baseline =
  current_run_flow - player_baseline_flow
```

This supports between-session progression feedback.

## 8. Feedback Logic

### 8.1 Consumer feedback rule

Foreground only:

- whether the move was strong, weak, or invalid
- whether the player is pushing further than earlier in the run
- points gained

Do not foreground:

- raw cosine scores
- full telemetry
- WordNet link labels
- internal threshold tables

### 8.2 In-run beep feedback

Use simple audio tones, not speech.

Recommended mapping:

- `beep_rise`
  - valid response with clearly higher `inst_flow` than early baseline
- `beep_neutral`
  - valid response near baseline
- `beep_drop`
  - valid but quite small semantic movement
- `beep_invalid`
  - invalid or rejected response

Recommended threshold bands:

```text
if invalid:
  feedback = beep_invalid
else if delta_vs_early >= +0.08:
  feedback = beep_rise
else if delta_vs_early <= -0.05:
  feedback = beep_drop
else:
  feedback = beep_neutral
```

These thresholds should be tuned against real telemetry.

### 8.3 Positive reinforcement

Give positive feedback when:

- the response exceeds the early-run baseline
- the response exceeds the player's recent average
- the run finishes with good consistency and acceptable cue relevance

Consumer-facing copy examples:

- `Further`
- `Nice jump`
- `You moved beyond your early pattern`
- `Best run this week`

### 8.4 Negative or corrective feedback

The negative signal should be light, not punishing.

Use:

- lower beep tone
- no bonus credit
- optional small visual cue:
  - `too close`
  - `still circling`

Avoid harsh copy.

The game should feel like shaping, not scolding.

## 9. Credit and Reward Logic

### 9.1 Goals

Credits should reward:

- valid participation
- genuine semantic movement
- improved movement relative to baseline
- stable completion

Credits should not reward:

- random unrelated words
- repeated synonyms
- invalid spam

### 9.2 First-pass turn-level credit

For each valid response:

```text
base_turn_credit = 1
```

Bonus:

```text
+1 if delta_vs_early >= +0.05
+1 if cue_relevance is inside the healthy band
+1 if delta_vs_player_baseline >= +0.05
```

Penalty:

```text
0 bonus if response is weak-fit
0 bonus if loop_flag is true
0 total if invalid
```

Recommended cap:

- `0` to `4` credits per turn

### 9.3 Run completion bonus

Add a run bonus for clean runs.

Example:

```text
+5 if valid_responses >= 12
+3 if run_flow > player_baseline_flow
+2 if loop_rate remains below threshold
```

### 9.4 Session bonus

At session end:

- grant a small completion bonus
- grant a higher bonus if at least one run clearly beats recent baseline

This should integrate with the existing basic-product economy rather than inventing a separate wallet.

## 10. Zone Routing Logic

Recommended first-pass routing:

- `Locked In`
  - default to `Forward Flow`
- `Ready`
  - allow either, but recommend based on recent history
- `Spun Out`
  - route to `Sustained Attention`
- `Flat`
  - route to a short activation or low-load sustained-attention block first

Recommended simple policy:

```text
if zone_state == "Locked In":
  recommend forward_flow
else if zone_state == "Spun Out":
  recommend sustained_attention
else if zone_state == "Flat":
  recommend sustained_attention_light
else:
  recommend last_successful_lane
```

## 11. Difficulty and Progression

This game should not use n-back levels.

Difficulty should be controlled by:

- cue abstractness
- run length
- response deadline
- stricter cue-relevance floor
- reduced autocomplete support
- harder anti-loop rules

Recommended progression ladder:

### Stage 1

- concrete cue words
- generous timer
- autocomplete enabled
- no phrase input

### Stage 2

- broader cue set
- slightly shorter timer
- stronger bonus for improved distance

### Stage 3

- more abstract cues
- reduced autocomplete
- stronger weak-fit penalties

### Stage 4

- mixed cue types
- challenge runs
- compare against personal historical baseline

## 12. UI and Player Feedback Surface

### 12.1 Live screen

The live screen should show:

- cue word
- response input
- remaining time or turns
- current run points
- short feedback strip
- simple progress meter

### 12.2 Audio feedback

Audio is a core mechanic here.

Recommended audio palette:

- rising chime for strong semantic jump
- soft neutral click for acceptable move
- low dull tone for small move
- short reject tone for invalid move

### 12.3 End-of-run feedback

Show only:

- total points
- strongest jump
- average flow versus early run
- average flow versus recent self
- simple suggestion:
  - `Push further`
  - `Keep the chain coherent`
  - `Strong movement today`

### 12.4 Coaching-only telemetry

Keep available in logs but not foregrounded:

- raw cosine distances
- lexical guardrail flags
- loop diagnostics
- cue-relevance distributions
- baseline update details

## 13. Anti-Cheating and Validity Rules

Reject or downweight:

- exact repeats
- direct synonym recycling
- obvious lemma variants
- unrelated random words far from cue
- too many rare words in a row if they damage playability

Recommended hard rule:

- if cue relevance falls below floor on `2` consecutive valid responses:
  - suppress bonus credits until coherence recovers

## 14. Technical Build Plan

### Phase 1: Spec and data prep

1. finalize the allowed vocabulary size
2. choose the GloVe vector dimensionality
3. import vocabulary into a preprocessing script
4. build WordNet link tables for guardrails
5. create Supabase schema

### Phase 2: Scoring service

1. build normalization helpers
2. build vector lookup and cosine-distance calculation
3. build turn scorer
4. build run scorer
5. persist run and item telemetry

### Phase 3: Playable MVP

1. cue display
2. response input
3. timer
4. beep feedback
5. points display
6. end-of-run summary

### Phase 4: Progression and lane routing

1. pull Zone result into the routing rule
2. recommend `Forward Flow` vs `Sustained Attention`
3. compute player baseline from recent runs
4. add session and week-over-week improvement summaries

### Phase 5: Tuning

1. inspect distribution of `inst_flow`
2. retune beep thresholds
3. retune credit weights
4. tighten invalid / weak-fit rules
5. review whether the game feels trainable rather than random

## 15. Canonical MVP Recommendation

If only one version is built now, build this:

- single-word input only
- `GloVe` semantic distance
- `WordNet` synonym / trivial-neighbor checks
- `Supabase + pgvector` backend
- early-run baseline beeps
- points awarded for further semantic movement
- light negative beep when movement is too small

This is the most practical forward-flow MVP that is:

- commercially sane
- technically feasible
- compatible with the current Trident-G product logic
- easy to extend later

## 16. Open Questions For Later Iteration

- whether phrase-level input should ever be allowed in the consumer product
- whether cue relevance should be visible or remain backend only
- whether rare-word exploitation becomes a real issue
- whether forward-flow performance should gate later game unlocks
- whether a separate `creative lane` label is better than `forward flow` in the consumer UI
