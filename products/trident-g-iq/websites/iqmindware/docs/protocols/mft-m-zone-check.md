# MFT-m Zone Check Protocol

## Purpose

Zone Pulse is the daily readiness and dose-setting check for the IQMindware Coach-led programme.

It uses a browser implementation of the masked Majority Function Task (MFT-m / MFT-M) to estimate current cognitive control throughput under uncertainty. The result is used to decide whether the day should be a full training route, a reduced route, a support route, or a repeat/invalid check.

The practical question is:

> Is today's state good enough for high-quality capacity and reasoning training?

## What the task measures

The MFT-m asks the user to decide which direction most arrows are pointing under brief exposure and masking.

The task is useful for training guidance because it combines:

- controlled uncertainty;
- time pressure;
- perceptual conflict;
- accuracy demands;
- response-timing stability;
- lapse and error-pattern signals.

The intended construct is cognitive control capacity (CCC): a behavioural estimate of how much task-relevant information can be brought under control per unit time in this paradigm.

IQMindware reports this as bits per second, alongside state and confidence labels.

## Source task foundation

Wu, Dufford, Mackie, Egan, and Fan (2016) introduced the backward masking Majority Function Task as a way to estimate cognitive control capacity from a perceptual decision-making task.

In the original task:

- arrow sets were briefly shown and then masked;
- participants judged the majority arrow direction;
- set size and majority/minority ratio manipulated information entropy;
- exposure time manipulated available processing time;
- accuracy was modelled as a function of information rate;
- the resulting CCC estimate was expressed in bits per second.

The original adult sample produced a mean estimated CCC of about 3.45 bps, with a 95% CI of 3.12 to 3.70 bps, and split-half reliability of 0.86 across two sessions. This supports the use of MFT-M as a repeatable behavioural measure of cognitive control throughput under uncertainty.

## Current IQMindware implementation

The IQMindware Zone Pulse is a shortened training-readiness implementation, not a 43-minute laboratory replication.

Current app parameters:

- full check: about 180 seconds;
- quick re-check: about 75 seconds;
- five-arrow displays;
- easy majority condition: 4:1;
- hard majority condition: 3:2;
- catch condition: 5:0;
- backward masking after each display;
- adaptive exposure duration;
- response timeout and browser timing-quality checks;
- local history used to improve personal baseline interpretation over time.

The app preserves the core logic of the MFT-M:

- majority-direction decision;
- masking;
- uncertainty and exposure-time pressure;
- accuracy and lapse sensitivity;
- behavioural throughput estimate in bits per second.

It adds training-router features:

- reaction-time variability;
- timeout rate;
- fast-error pattern;
- post-error slowing;
- catch failures;
- bursty error patterns;
- focus-loss and browser-timing invalidation;
- confidence level for the state classification.

## Reasonable conclusions for training guidance

The evidence supports these practical conclusions.

### 1. MFT-m is a meaningful cognitive-control probe

The MFT-M has a clear information-processing rationale. It increases uncertainty and reduces available exposure time, then estimates how well the user can resolve the majority direction under those constraints.

For IQMindware, that makes it a better pre-training readiness signal than a mood check alone.

### 2. Bits/sec can guide dose, not diagnose ability

The bits/sec estimate is useful as a current-state and trend signal. It should be used to guide training dose and timing, especially when compared with the user's own recent valid checks.

It should not be used as:

- a diagnosis;
- a clinical marker;
- a standalone IQ score;
- a fixed trait label;
- proof that a given day will or will not transfer.

### 3. MFT-m can also act as light attention-control training

Zhang et al. (2024) trained healthy young adults with MFT-M for seven consecutive days and compared them with a sham-control group.

The MFT-M training group showed better performance on selected ANT-R flanker/location conditions and learning trials in a verbal memory test, plus ERP changes during 2-back and task-switching tasks consistent with altered attentional processing.

For IQMindware, this supports a reasonable operational stance:

- the Zone Pulse is not just a passive questionnaire;
- it is a short attention-control challenge;
- it can warm up the control system before training;
- it can help route the user into a better-matched training dose.

It does not mean a single Zone Pulse is sufficient training by itself.

### 4. State quality matters for far transfer

The IQMindware programme aims for transfer beyond one-game practice. That requires clean learning, controlled effort, and enough state stability to avoid building brittle, surface-specific habits.

Zone Pulse is therefore used before Coach-led training to reduce the chance of training hard when the user is flat, noisy, rigid, distracted, or browser/timing compromised.

## Zone states and route decisions

The app classifies a valid result into one of four public state labels.

| Zone state | Interpretation | Training route |
|---|---|---|
| In Zone | Stable, efficient, flexible control | Full core route |
| Flat | Lower activation, slower/lapse-prone control | Reduced core route |
| Locked In | Rigid, over-controlled, exploit-heavy pattern | Support route |
| Spun Out | Variable, noisy, over-exploratory pattern | Support route |
| Invalid | Focus loss, browser timing issue, or incomplete run | Repeat check / no route |

Current Coach-led route mapping:

| Zone state | Capacity target | Reasoning target | Counts toward 20-session programme |
|---|---:|---:|---|
| In Zone | 10 blocks | 10 items | yes |
| Flat | 5 blocks | 8 items | yes |
| Locked In | 4 blocks | 4 items | no |
| Spun Out | 3 blocks | 4 items | no |
| Invalid | 0 | 0 | no |

Support routes are real training. They are used to stabilise or rebuild control, but they do not advance the core 20-session programme count.

## Validity and quality rules

A Zone Pulse should be treated as usable only when:

- the run completes;
- the tab/window remains active;
- browser timing is stable enough;
- response data are sufficient;
- catch and probe data are not dominated by lapses or timing failure.

Invalid runs should not set the training route. The user should repeat the check later or use light manual practice.

Low-confidence results should be handled conservatively:

- use the lower-risk route;
- avoid unnecessary difficulty escalation;
- consider a quick re-check after a short stabilisation block.

## How to use Zone Pulse in the 20-day programme

Recommended sequence:

1. Run SgS-12 Pre before the programme begins.
2. Before each Coach-led training day, run Zone Pulse.
3. Use the Zone result to set the day's route and dose.
4. Complete both Capacity Gym and Reasoning Gym targets for the route.
5. Use support routes when state is not suitable for core progress.
6. Use Tracker interval checks as scheduled.
7. Run SgS-12 Post after the programme.

The key training rule is:

> A valid Zone Pulse sets the route. A core session advances only when both Capacity Gym and Reasoning Gym targets are complete.

## Interpretation boundaries

Allowed claims:

- MFT-m provides a research-grounded behavioural estimate of cognitive control throughput under uncertainty.
- Zone Pulse is designed to guide training readiness and dose.
- MFT-m training has evidence of transfer to selected executive-function, memory-learning, and neural-processing outcomes in healthy young adults.
- Repeated valid checks can improve personal baseline interpretation.
- Out-of-zone results are useful reasons to reduce load, stabilise, or re-check before deep training.

Not allowed:

- Zone Pulse diagnoses cognitive, medical, or psychiatric status.
- A single bits/sec score proves intelligence level.
- A single high Zone Pulse guarantees transfer.
- A single low Zone Pulse proves the user cannot train or learn.
- MFT-m alone replaces the full Capacity Gym, Reasoning Gym, and Tracker loop.

## Source references

- Wu, T., Dufford, A. J., Mackie, M. A., Egan, L. J., & Fan, J. (2016). The capacity of cognitive control estimated from a perceptual decision making task. Scientific Reports, 6, Article 34025. https://doi.org/10.1038/srep34025
- Zhang, H., Fan, S., Yang, J., Yi, J., Guan, L., He, H., Zhang, X., Luo, Y., & Guan, Q. (2024). Attention control training and transfer effects on cognitive tasks. Neuropsychologia, 200, 108910. https://doi.org/10.1016/j.neuropsychologia.2024.108910
- Chen, Y., Spagna, A., Wu, T., Kim, T. H., Wu, Q., Chen, C., Wu, Y., & Fan, J. (2019). Testing a cognitive control model of human intelligence. Scientific Reports, 9, Article 2898. https://doi.org/10.1038/s41598-019-39685-2
