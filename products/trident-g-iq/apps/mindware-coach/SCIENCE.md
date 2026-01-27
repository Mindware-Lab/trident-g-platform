# Scientific basis and technical report — **IQ Mindware Coach (Trident-G)**

## 1) What the app is trying to do 

**IQ Mindware Coach** is designed to help users practise a core set of practical thinking tools (“mindware operators/tools”) using **timed scenario questions with right/wrong feedback**, then apply the same tool to a **real-life mission** so that it becomes easier to recall and use later.

This app alone is **not** claiming to raise IQ or guarantee broad far transfer. The app is built around a conservative principle:

> Far transfer is *more likely* when training targets **explicit, generalisable rules**, uses **feedback**, and repeatedly **tests the same rule across varied contexts** (plus real-world use), rather than relying on insight or repetition within a single format.

---

## 2) Core scientific ideas the app is built on

### 2.1 Test-enhanced learning (retrieval practice) and “transfer through testing”

A major risk in “thinking skills” products is passive familiarity: users feel they “get it” but cannot deploy it quickly in context. A robust learning finding is that **retrieving** an answer (a test) improves later retention more than additional study, and can support generalisation when the test forces meaningful retrieval rather than recognition alone (Roediger & Karpicke, 2006).

Crucially for your design, some evidence suggests that **repeated testing** can produce better transfer than repeated study, especially when tests require the learner to reconstruct the knowledge and apply it (Butler, 2010). 

**App mapping**

* Timed scenario questions force *active retrieval* of the tool.
* “Spot the trap” and “pick the best check” formats aim to make retrieval **discriminative**, not merely familiar.

### 2.2 Feedback that corrects misconceptions and stabilises the rule

Practice without feedback risks rehearsing the wrong rule, especially under time pressure. Reviews of educational feedback show that **feedback is most helpful when it is information-rich and task-focused**, reducing the gap between current performance and the target rule (Hattie & Timperley, 2007).

**App mapping**

* Each question returns (a) correct/incorrect, (b) a one-line *why*, and (c) why the main trap fails.
* This is designed to compress “error → correction → rule” in a tight loop.

### 2.3 Transfer requires variation: the same rule in different contexts

A consistent theme in transfer research is that what generalises is not the surface activity but the **underlying structure** the learner learns to notice and use. Taxonomies of transfer emphasise that “far” transfer is hard because contexts change (domain, modality, function), so generalisation is more likely when training explicitly targets the deeper structure and practises it across context shifts (Barnett & Ceci, 2002).  

**App mapping**

* “Portability checks” are implemented as **context swaps**: keep the same mindware tool, change the mission type (**Understand / Discuss / Choose / Plan & Do**).
* The design goal is to make the tool feel like a *reusable rule* rather than a “test trick”.

### 2.4 “Mindware” as a trainable component of rational thinking

The “mindware” framing (often associated with rational thinking and decision competence) treats many reasoning failures as **missing rules**, **misapplied rules**, or **failure to trigger the right rule under pressure**. Contemporary discussion in this area highlights that mindware is not just knowledge but also the capacity to deploy the right rule in context (e.g., recognition and override of tempting defaults).  

**App mapping**

* Tools are trained as **triggerable scripts** (see §3) and tested under time pressure to approximate real constraints.

### 2.5 Debiasing and reasoning training: what evidence supports (and what it doesn’t)

Broad “debiasing” is difficult, but there is evidence that **targeted training** can improve judgment in measurable ways, including outside the classroom, when it teaches concrete strategies and provides practice. For example, field evidence shows that structured debiasing training can improve decision performance in real settings (Sellier et al., 2019). 
Classic laboratory work also shows that training in statistical/causal reasoning can improve reasoning performance beyond the immediate training context (Nisbett et al., 1987). ([ResearchGate][6])

**App mapping**

* Your tools are intentionally narrow and procedural (what to do next), rather than abstract slogans.
* The mission step is treated as a required bridge to real-world behaviour, not a “nice extra”.

---

## 3) The Trident-G learning loop inside this app: **effort → compilation → reuse** (Gf → Gc → Gf)

A useful way to interpret your design (without over-claiming neuroscience) is standard skill-acquisition logic: repeated successful execution of a procedure can become faster, more reliable, and less attention-demanding over time.

In app terms:

1. **Effort mode (Gf)**
   The user executes the tool step-by-step in scenarios (often slowly at first).

2. **Compilation (Gc)**
   If it worked, they compress it into a **Mindware Script**:
   **Trigger → Steps → Quick check → Common trap**
   This is a deliberate act of “proceduralising” the rule into a compact recall unit.

3. **Reuse under load (back to Gf when needed)**
   The script is re-prompted in a *different* mission type and in daily life, strengthening cue-driven retrieval and stabilising the rule across contexts.

**Why the “script” step matters scientifically**
Transfer often fails because learners do not retrieve the right method at the right moment. Converting a tool into a short, cue-linked script is a practical way to target **retrieval conditions**, not just understanding.

---

## 4) Technical design: practice engine, portability logic, and mission integration

### 4.1 Scenario bank structure (content layer)

Each mindware tool has a scenario bank organised by:

* **Mission type**: Understand / Discuss / Choose / Plan & Do
* **Difficulty**: intro → standard → pressured
* **Trap family**: common failure modes for that tool
* **Question format**:

  * single best answer
  * spot the trap
  * order the steps
  * pick the best check/metric
  * “minimum useful simplification” choice

Each item stores:

* `prompt`
* `options[]`
* `correctIndex`
* `rationaleCorrect` (1–2 sentences)
* `rationaleTrap` (1 sentence for top trap)
* `timeLimitSec` (optional)
* `tags` (tool, mission type, trap family, difficulty)

### 4.2 Scoring and measures (measurement layer)

Minimum viable metrics per item:

* **Accuracy** (0/1)
* **Response time** (ms)
* **Trap selection flag** (did they pick the “tempting wrong” option)
* **Confidence** (optional, 1–5) to support calibration tracking

Session-level summaries:

* `accuracyOverall`
* `medianRT`
* `trapRate`
* `byMissionType` performance breakdown
* `byQuestionFormat` breakdown (useful for tuning content)

Transfer-relevant indicators (lightweight, but meaningful):

* **Cross-wrapper retention**: performance on the *same tool* when the mission type changes
* **Near-miss resistance**: performance on “spot the trap” items after correct feedback
* **Mission follow-through**: completion + self-rated usefulness

### 4.3 Portability scheduling (logic layer)

A simple scheduling rule that matches your intent:

* On day *t*, practise tool **X** in mission type **A**.
* On day *t+1* or *t+2*, practise tool **X** again but in mission type **B** (a portability check).
* Periodically interleave **mission prompt only** (“run your script now”) without scenarios to strengthen real-world retrieval.

This is conceptually aligned with treating transfer as a **retrieval-and-discrimination** problem, not just a knowledge problem.  

### 4.4 Mission step and implementation intentions (behaviour bridge)

The mission step is the app’s “behavioural anchor”:

* User chooses a mission they genuinely need to do (10–20 mins)
* App prompts an **if-then plan** (cue-based implementation intention):

  * **If** (cue/context) … **then** (run Mindware Script X for 2 minutes, then do step 1)

Implementation intentions have strong evidence for improving goal completion by linking cues to actions (Gollwitzer, 1999; Gollwitzer & Sheeran, 2006). 

---

## 5) How this design addresses the “far transfer problem” (without pretending it’s solved)

The literature is clear that “general cognitive training” often fails to generalise widely, even when training improves the practised tasks.  

So the app’s far-transfer strategy is intentionally *procedural and evidence-aligned*:

1. **Explicit tools** (mindware rules that can be named and taught)
2. **Repeated retrieval under constraints** (timed practice)
3. **Immediate corrective feedback**
4. **Context variation** (portability swaps across mission types)
5. **Real-world missions** (behavioural deployment)
6. **Cue-linked scripts** (implementation intentions to trigger use outside the app)

This is not a guarantee of broad far transfer, but it is a defensible attempt to increase the probability of carryover relative to (a) unguided reflection, or (b) practising only one task format.

---

## 6) Integration with the wider Trident-G stack (technical note)

**Ψ Zone Coach** remains responsible for state check and recovery guidance. IQ Mindware Coach:

* does **not** do state recalibration,
* can optionally read the last zone state (from shared local storage) to recommend shorter/longer practice blocks or choose a less cognitively demanding scenario set.

**IQ Capacity Training Coach** can optionally provide a short warm-up before timed mindware practice (for attentional stability or relational “priming”), but the scientific claims of IQ Mindware Coach do not depend on that integration.

A future **G Loop Coach** can coordinate:

* which app runs first,
* dose rules,
* and a single session log record for the user.

---

## 7) Evaluation plan (recommended if you want publishable evidence)

To assess whether the app produces meaningful carryover:

**Design**

* Randomised controlled trial or crossover with preregistration
* Control condition matched for time and engagement (e.g., untimed reading + reflection, or quizzes without missions)

**Primary outcomes**

* Near transfer: scenario performance improvements for trained tools
* Cross-context transfer: same tool performance across mission types (portability checks)
* Real-world outcomes: mission completion rates + objective artefacts where feasible (e.g., quality-rated decision tables, argument maps)

**Secondary outcomes**

* Calibration: confidence–accuracy alignment
* Persistence: delayed re-tests (1–4 weeks)
* General decision competence measures (carefully chosen, and interpreted cautiously)

---

## References  

Barnett, S. M., & Ceci, S. J. (2002). When and where do we apply what we learn?: A taxonomy for far transfer. *Psychological Bulletin, 128*(4), 612–637. [https://doi.org/10.1037/0033-2909.128.4.612](https://doi.org/10.1037/0033-2909.128.4.612)

Butler, A. C. (2010). Repeated testing produces superior transfer of learning relative to repeated studying. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 36*(5), 1118–1133. [https://doi.org/10.1037/a0019902](https://doi.org/10.1037/a0019902) ([e-teaching.org][2])

Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*(7), 493–503. [https://doi.org/10.1037/0003-066X.54.7.493](https://doi.org/10.1037/0003-066X.54.7.493)

Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38*, 69–119. [https://doi.org/10.1016/S0065-2601(06)38002-1](https://doi.org/10.1016/S0065-2601%2806%2938002-1) ([IPCRG][7])

Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81–112. [https://doi.org/10.3102/003465430298487](https://doi.org/10.3102/003465430298487)

Nisbett, R. E., Fong, G. T., Lehman, D. R., & Cheng, P. W. (1987). Teaching reasoning. *Science, 238*(4827), 625–631. [https://doi.org/10.1126/science.3672116](https://doi.org/10.1126/science.3672116) ([ResearchGate][6])

Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. [https://doi.org/10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x)

Sellier, A.-L., Scopelliti, I., & Morewedge, C. K. (2019). Debiasing training improves decision making in the field. *Proceedings of the National Academy of Sciences, 116*(17), 8251–8256. [https://doi.org/10.1073/pnas.1818798116](https://doi.org/10.1073/pnas.1818798116) ([PubMed][5])

Simons, D. J., Boot, W. R., Charness, N., Gathercole, S. E., Chabris, C. F., Hambrick, D. Z., & Stine-Morrow, E. A. L. (2016). Do “brain-training” programs work? *Psychological Science in the Public Interest, 17*(3), 103–186. [https://doi.org/10.1177/1529100616661983](https://doi.org/10.1177/1529100616661983) ([Semantic Scholar][1])

Stanovich, K. E. (Selected discussions of mindware and rational thinking; see also recent overviews). ([PMC][4])

---

 
