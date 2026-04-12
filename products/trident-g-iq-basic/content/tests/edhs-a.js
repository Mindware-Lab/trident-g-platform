export const edhsAVersionManifest = Object.freeze({
  id: "edhs-a",
  label: "EDHS-A",
  shortLabel: "Form A",
  familyId: "decision",
  familyLabel: "Decision Making",
  mode: "edhs",
  estimateMinutes: 5,
  introTitle: "Everyday decision habits baseline",
  introCopy:
    "Eight scenario-based questions about planning, avoidance, future consequences, and follow-through. Form A is the baseline decision-making snapshot.",
  questions: [
    {
      id: "A1",
      title: "Too many tasks",
      text: "You've got too many tasks and not enough time today. What do you do first?",
      options: [
        { id: "A", text: "Start with the task that feels most interesting and get going with that.", score: 2 },
        { id: "B", text: "Do a few of the simpler tasks first so you can get some quick wins.", score: 3 },
        { id: "C", text: "Take a couple of minutes to list your tasks, choose the one with the biggest impact or tightest deadline, and block time for it.", score: 4 },
        { id: "D", text: "Look through your messages and notifications and see what comes up as you go.", score: 1 }
      ]
    },
    {
      id: "A2",
      title: "Big project starting",
      text: "You've just been given a new project that will run for a month. What do you do in the first couple of days?",
      options: [
        { id: "A", text: "Skim the brief and then get started on a part that seems manageable.", score: 2 },
        { id: "B", text: "Leave it for now and assume you'll work out the details closer to the time.", score: 1 },
        { id: "C", text: "Break the project into a few main steps, sketch a rough timeline, and set a first small milestone.", score: 4 },
        { id: "D", text: "Ask someone else what they think you should do and mostly follow their suggestions.", score: 3 }
      ]
    },
    {
      id: "A3",
      title: "Difficult phone call",
      text: "You need to call someone to sort out an awkward issue. How do you usually handle it?",
      options: [
        { id: "A", text: "Put it off and plan to deal with it when things feel a bit calmer.", score: 1 },
        { id: "B", text: "Send a short, non-specific message instead and see how they respond.", score: 2 },
        { id: "C", text: "Decide on a time, note the key points you need to cover, and make the call then.", score: 4 },
        { id: "D", text: "Leave it for now and wait to see if the other person raises it first.", score: 1 }
      ]
    },
    {
      id: "A4",
      title: "Messy problem at work or study",
      text: "There's a messy problem at work or on your course that keeps coming back. What do you tend to do?",
      options: [
        { id: "A", text: "Focus on your own tasks and leave the wider problem to one side.", score: 1 },
        { id: "B", text: "Talk about it with a friend or colleague but don't usually take steps yourself.", score: 2 },
        { id: "C", text: "Set aside a bit of time to understand the problem and take at least one concrete step to move it forward.", score: 4 },
        { id: "D", text: "Assume that someone else will deal with it in due course.", score: 1 }
      ]
    },
    {
      id: "A5",
      title: "Spending vs saving",
      text: "You receive a significant, unexpected amount of money. What are you most likely to do?",
      options: [
        { id: "A", text: "Use most of it on things you've been wanting to buy.", score: 1 },
        { id: "B", text: "Put a small part aside but mainly enjoy spending it now.", score: 2 },
        { id: "C", text: "Decide on a specific longer-term use and put most of it towards that.", score: 4 },
        { id: "D", text: "Keep it in your account without a clear plan and notice it goes on day-to-day spending over time.", score: 1 }
      ]
    },
    {
      id: "A6",
      title: "Sleep vs one more episode",
      text: "It's late and you have an important day tomorrow, but you're watching a series or on your phone. What do you usually do?",
      options: [
        { id: "A", text: "Carry on watching or scrolling until you feel properly tired and turn in then.", score: 1 },
        { id: "B", text: "Tell yourself you'll just watch a bit more, which often ends up being longer than planned.", score: 2 },
        { id: "C", text: "Set a clear cut-off, stop at that point, and get to bed.", score: 4 },
        { id: "D", text: "Let it run in the background while you get some things ready for tomorrow.", score: 3 }
      ]
    },
    {
      id: "A7",
      title: "Starting a new habit",
      text: "You decide you want to start a new habit. What's closest to your usual approach?",
      options: [
        { id: "A", text: "Think I'd like to do that and see if it happens when the moment feels right.", score: 1 },
        { id: "B", text: "Try it once or twice and then see whether the habit continues on its own.", score: 2 },
        { id: "C", text: "Choose a specific time and place and link it to something you already do.", score: 4 },
        { id: "D", text: "Make a mental note to do more of it at some point during the week.", score: 2 }
      ]
    },
    {
      id: "A8",
      title: "Remembering to use a strategy",
      text: "You've learned a planning strategy you know would help. How do you usually make sure you use it?",
      options: [
        { id: "A", text: "Rely on remembering it when a suitable moment comes up.", score: 1 },
        { id: "B", text: "Wait until you feel really stuck and then try to recall what the strategy was.", score: 2 },
        { id: "C", text: "Set a simple reminder or visual cue tied to a specific moment in the day.", score: 4 },
        { id: "D", text: "Intend to use it when your schedule feels a bit quieter.", score: 1 }
      ]
    }
  ],
  factors: {
    "Planning & prioritisation": ["A1", "A2"],
    "Facing hard decisions vs avoidance": ["A3", "A4"],
    "Considering future consequences": ["A5", "A6"],
    "Concrete follow-through planning": ["A7", "A8"]
  }
});
