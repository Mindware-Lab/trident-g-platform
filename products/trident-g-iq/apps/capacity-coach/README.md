 # IQ Capacity Training Coach (Trident-G)

IQ Capacity Training Coach is a **short, structured cognitive training app** built around n-back games designed to strengthen:

* **Core cognitive efficiency** (stable attention, working memory control, interference resistance)
* **Relational structure learning** (learning map-like relations that can generalise beyond one game)

It supports carryover to real life by combining:

1. **Tuning and consolidation** (smooth gains within a stable setup), and
2. **Portability checks (“wrapper swaps”)** after a “click/breakthrough” to test whether a strategy carries across a different task.

> **Important note:** evidence for far transfer from working-memory training in general is mixed. This app is designed to *increase the probability* of portable gains by building in portability checks and (optionally) real-world “missions”.

---

## Three ways to use this app

### 1) Standalone (simple)

Use IQ Capacity Training Coach on its own as a structured daily training session.

### 2) Integrated with **Ψ Zone Coach** (recommended)

Run **Ψ Zone Coach first** (once per day), then run Capacity training.

In the integrated system:

* **Out of Ψ zone** → the app recommends **standard n-back** (stability and tuning)
* **In Ψ zone** → the app recommends **relational n-back** (structure learning)

### 3) Full **G-Loop** system (Zone → Capacity → Mindware → Missions)

If you are using the integrated Trident-G stack, the Capacity Coach can be embedded in a **G-Loop**:

1. **Zone Coach**: check state and get a recommendation (Proceed, Light, Recovery)
2. **Capacity Coach**: train for control or structure, with wrapper swaps and portability probes
3. **Mindware Coach**: choose a strategy to deploy (the “operator” for today)
4. **Mission**: apply it to a short real-world task (10–20 mins) so portability is tested outside the game

This is the simplest way to turn training into real-world carryover: **train → swap-test → deploy**.

---

## Missions (real-world deployment)

A **mission** is a small, repeatable, measurable task you genuinely need to do. It is not extra homework. It is the “transfer step”.

### The four mission wrappers

For consistency, missions are grouped into four categories:

* **Comprehension mission**: real text you need to understand
* **Argumentation mission**: evaluate or produce an argument
* **Decision mission**: choose between options under trade-offs
* **Planning and action mission**: execute a plan with constraints

### Phase 1: Guided rotation (build the “four wrappers” habit)

**Weeks 1–2:** the app guides you through **one small mission in each wrapper**.

Missions stay short (10–20 mins) so you can complete them reliably. The goal is to build the habit of:

* identifying the wrapper
* choosing a strategy
* applying it
* checking whether it helped

### Phase 2: User-selected missions (project-relevant)

**From week 3 onwards:** you choose whichever mission category matches your current projects.

The app can still recommend a wrapper (for example, “this looks like a decision under uncertainty”), but you choose what matters most right now.

### Simple mission checks (examples)

Keep these light and practical:

* **Comprehension**: write a 5-sentence summary, or answer 3–5 questions you generate from the text
* **Argumentation**: write a claim + 2 reasons + 1 counterpoint, then revise once
* **Decision**: fill a quick weighted decision grid and do a small sensitivity check
* **Planning and action**: define constraints, write the next 3 steps, execute step 1 immediately

---

## The games (v1)

### A) Standard n-back (rule-specified: colour / letter / location)

Each trial contains all three features:

* a **colour**
* a **letter**
* a **location**

But only **one dimension is relevant at a time** (the current “rule”).
You train by tracking that dimension and responding to n-back matches.

**N-back levels:** up to **8 levels** (depending on settings).

---

### B) Relational n-backs (structure learning)

These games train n-back matching **over relations**, not single features.

Included relational games:

1. **Transitive n-back**
2. **Graph n-back**
3. **Propositional logic n-back**

**N-back levels:** **3 levels** (kept tighter because relational difficulty rises quickly).

---

## Speed control (all games)

Every game includes a 3-step speed slider:

* **3 seconds** (slow)
* **2 seconds** (medium)
* **1 second** (fast)

Speed and n-back level are the two main difficulty levers.

---

## Block length (all games)

Each block contains a short sequence of trials:

* **Block length = (20 + N) trials**

So higher n-back levels naturally create slightly longer blocks.

---

## Session flow (how training actually runs)

### Minimum session size

A session is built from blocks. The **minimum** full session is:

* **10 blocks** (the default baseline session)

### No fixed upper bound (you can extend)

After you finish the baseline session, you can add more training in small chunks:

* after 10 blocks, the app can offer **+5 more blocks**
* after each added chunk, you can choose **+5 again**

So there is **no fixed upper limit**. You decide how far to extend, and the app will nudge you to stop if motivation drops or performance starts drifting.

---

## Game switching (wrapper swaps) — within-session and between sessions

### Within a single training session

The app can recommend a **swap during the same session** when:

* you report a **click/breakthrough**, or
* motivation drops and you want variety, or
* the session plan calls for a portability probe

Swaps are offered between blocks so the training stays coherent.

### Between sessions

The app can also recommend different games on different days (especially when integrated with Ψ Zone Coach).

---

## How swapping works (simple rules)

### Standard game swaps

The “wrapper” is the current relevant rule:

* swap **colour ↔ letter ↔ location**

### Relational game swaps

The “wrapper” is the relational family:

* swap **transitive ↔ graph ↔ propositional**

The point of swapping is to test:

> “Was that a portable strategy, or a game-specific trick?”

---

## Difficulty adjustments (tuning and consolidation)

When you cross a high or low performance threshold, the app offers **one** simple adjustment:

* Move **n-back level** up or down by one, OR
* Move **speed** up or down by one step (if viable)

Rule: the app never changes multiple settings at once. You remain in control.

---

## After each relational block: a short “map inference” quiz

After each relational n-back block, you’ll get a **very short quiz** that tests whether you’ve internalised the underlying structure.

This encourages learning the **map**, not just matching the token stream.

---

## What “clicks” are (and why we care)

A “click” is the feeling that:

* a strategy suddenly became clearer, or
* the task felt simpler and more controllable, or
* performance stabilised at a new level (for example, moving from 2-back to stable 3-back)

When that happens, the app may suggest a short **transfer probe** (a swap) within the same session, then return you to consolidate if needed.

**Clean rule:** test portability fast, then lock it in.

---

## What this app stores (privacy)

IQ Capacity Training Coach stores session summaries **locally in your own browser** (via `localStorage`) so the hub and other apps can read the handoff.

* No account needed
* No cloud upload by default
* Rolling local history

If you clear your browser storage, your local history resets.

---

## Troubleshooting

**GitHub Pages shows an old version**

* Hard refresh: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
* It can take a minute or two for Pages to serve the newest build.

---

## What this app is really doing (one sentence)

IQ Capacity Training Coach builds **stable cognitive control** and **relational structure learning**, then uses **controlled swaps (within-session)** and optional **missions (real-world deployment)** to test whether your breakthroughs are portable beyond one game.

---

## Evidence-informed design (optional reading)

* Zheng, Y., Wolf, N., Ranganath, C., O’Reilly, R. C., & McKee, K. L. (2025). *Flexible prefrontal control over hippocampal episodic memory for goal-directed generalization* (arXiv:2503.02303). [https://doi.org/10.48550/arXiv.2503.02303](https://doi.org/10.48550/arXiv.2503.02303)
* Morris, C. D., Bransford, J. D., & Franks, J. J. (1977). Levels of processing versus transfer-appropriate processing. *Journal of Verbal Learning and Verbal Behavior, 16*(5), 519–533. [https://doi.org/10.1016/S0022-5371(77)80016-9](https://doi.org/10.1016/S0022-5371%2877%2980016-9)
* Butler, A. C. (2010). Repeated testing produces superior transfer of learning relative to repeated studying. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 36*(5), 1118–1133. [https://doi.org/10.1037/a0019902](https://doi.org/10.1037/a0019902)
* Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation. *American Psychologist, 57*(9), 705–717. [https://doi.org/10.1037/0003-066X.57.9.705](https://doi.org/10.1037/0003-066X.57.9.705)
* Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*(7), 493–503. [https://doi.org/10.1037/0003-066X.54.7.493](https://doi.org/10.1037/0003-066X.54.7.493)
* Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. [https://doi.org/10.1037/bul0000209](https://doi.org/10.1037/bul0000209)
* Firth, J., Rivers, I., & Boyle, J. (2021). A systematic review of interleaving as a concept learning strategy. *Review of Education, 9*(2), 642–684. [https://doi.org/10.1002/rev3.3266](https://doi.org/10.1002/rev3.3266)

---

© Mindware Lab • IQ Mindware


[1]: https://arxiv.org/abs/2503.02303?utm_source=chatgpt.com "Flexible Prefrontal Control over Hippocampal Episodic Memory for Goal-Directed Generalization"
[2]: https://www.sciencedirect.com/science/article/pii/S0022537177800169?utm_source=chatgpt.com "Levels of processing versus transfer appropriate processing"
[3]: https://pubmed.ncbi.nlm.nih.gov/20804289/?utm_source=chatgpt.com "Repeated testing produces superior transfer of learning ..."
[4]: https://pubmed.ncbi.nlm.nih.gov/12237980/?utm_source=chatgpt.com "Building a practically useful theory of goal setting and task ..."
[5]: https://pubmed.ncbi.nlm.nih.gov/31556629/?utm_source=chatgpt.com "A meta-analysis of interleaved learning and its moderators"
