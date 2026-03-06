# Zone Coach (Trident G IQ)

Zone Coach is a short **Cognitive Control Capacity (CCC)** check that helps you understand your current brain state before doing demanding work or training.

It is designed to answer a practical question:

**"Am I in the right state right now for high-quality cognitive work or training?"**

The app runs a brief masked arrow task (MFT-M / CCC-style probe), estimates your current state, and gives a simple next-step recommendation.

## What the app is for

Zone Coach helps you:

- Check your current cognitive state in about **3 minutes**
- See whether you look more like:
  - **In the Zone**
  - **Flat**
  - **Locked In**
  - **Spun Out**
- Get a practical recommendation for what to do next
- Avoid doing high-challenge training when you are in a poor state for transferable learning
- Track your **CCC bits/second** trend over time (locally, on your device)

## What you get after a valid check

After the test, Zone Coach shows:

- **Bits / second (CCC)**
- **Cognitive State**
- **Confidence Level**
- A short explanation of the likely mechanism/state pattern
- A recommended next cognitive block (1-4 hours)
- Three guidance areas:
  - **Cognitive Training**
  - **Work**
  - **Other Intervention**

You can also open a small graph (`See Data`) to view a rolling 24-day local CCC bits/second trace, including an estimated In the Zone band once enough in-zone recordings exist.

## Important (local storage)

Zone Coach stores results in **local browser storage** on your device.

This means:

- Your data is **not** automatically synced across devices
- To track your trend over time, use the **same device and same browser** each time
- If you clear browser storage/site data, your local history will be reset

## How to use Zone Coach

## 1. Start on the splash screen

- (Optional) Select how your state feels right now:
  - `Flat`
  - `In the Zone`
  - `Locked In`
  - `Spun Out`
- Use **What are these?** if you want a quick explanation of the state labels
- Use **Instructions** for the test instructions and usage notes

Then press:

- **Start Cognitive Control Capacity check**

## 2. Complete the CCC check

The task briefly shows arrow patterns.
Your job is to decide the **majority direction** (left or right) as quickly and accurately as possible.

### Controls

- **Desktop / laptop:** use the **Left Arrow** and **Right Arrow** keys
- **Mobile / tablet:** use the on-screen **left / right** buttons

### During the run

- Respond **fast and accurately**
- Complete the full run if possible
- Do not switch tabs/apps during the test
- If unsure on a trial, make your best decision anyway

## 3. Read your result

After the run, the app shows your **Brain State Result**.

From there you can:

- Review your state and confidence
- Open more detail for:
  - **Cognitive Training**
  - **Work**
  - **Other Intervention**
- Re-run the test (full or quick re-check)
- Open the CCC bits/second graph (`See Data`)

## Quick re-check

Zone Coach also supports a shorter **Quick re-check (75s)** to reassess your state after an intervention (for example: breathing, movement, attention reset).

Completed quick re-checks are also included in your local CCC graph history.

## Using the recommendations well

The app is intended to help you make better decisions about timing and state, for example:

- Use **In the Zone** windows for demanding work and high-challenge training
- Use **Flat / Locked In / Spun Out** recommendations to stabilise, widen, or constrain state first
- Re-check before starting high-challenge cognitive training if you are out of the zone

The app may warn against doing Trident G IQ training while out of the zone because low-quality state can promote **thin automation** (surface-feature task strategies rather than broader transferable gains).

## Privacy and safety

- Zone Coach is a **coaching/readiness tool**, not a diagnosis tool
- State labels are **not medical or psychiatric diagnoses**
- Use common sense and stop if you are overly fatigued, distressed, or unable to focus safely

## Technical notes

- Built as a browser app (`index.html`) with local storage history
- Pop-up/help windows are used for instructions, explanations, and graph views
- On mobile, the app uses a mobile-safe open path for these info screens

## Running the app

If you are using this from the repository:

- Open `products/trident-g-iq/apps/zone-coach/index.html` in a modern browser
- Allow popups/new tabs for the info/help screens if prompted

## Related files in this folder

- `index.html` - main app
- `SCIENCE.md` - science notes / references
- `STATES.md` - state definitions / mapping notes
- `MARKET.md` - product/positioning notes

## License / ownership

Mindware Lab / Trident G IQ
