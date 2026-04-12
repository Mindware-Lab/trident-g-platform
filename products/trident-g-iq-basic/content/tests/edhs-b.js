export const edhsBVersionManifest = Object.freeze({
  id: "edhs-b",
  label: "EDHS-B",
  shortLabel: "Form B",
  familyId: "decision",
  familyLabel: "Decision Making",
  mode: "edhs",
  estimateMinutes: 5,
  introTitle: "Everyday decision habits follow-up",
  introCopy:
    "Eight alternate scenario-based items for the decision-making follow-up form. Use Form B after the baseline rather than as the opening pass.",
  questions: [
    {
      id: "B1",
      title: "Weekend chores",
      text: "It's Saturday and you have several chores plus one enjoyable activity. How do you usually tackle it?",
      options: [
        { id: "A", text: "Start with whichever task feels most appealing at the time.", score: 2 },
        { id: "B", text: "Do the quickest and easiest jobs first so you can build some momentum.", score: 3 },
        { id: "C", text: "Take a few minutes to list everything, decide what really matters today, and plan an order and rough time slots.", score: 4 },
        { id: "D", text: "Move between tasks and messages as they come up without much structure.", score: 1 }
      ]
    },
    {
      id: "B2",
      title: "Overflowing inbox",
      text: "Your email or message inbox is overflowing. What's your typical response?",
      options: [
        { id: "A", text: "Leave it for now and assume you'll spot what's important when you need to.", score: 1 },
        { id: "B", text: "Skim through and reply to messages that catch your eye.", score: 2 },
        { id: "C", text: "Sort messages quickly into groups and deal with the high-impact ones first.", score: 4 },
        { id: "D", text: "Ask someone else what they think you should focus on and mainly go with that.", score: 3 }
      ]
    },
    {
      id: "B3",
      title: "Performance feedback",
      text: "You suspect you'll get some uncomfortable feedback in an upcoming review or tutorial. What do you tend to do?",
      options: [
        { id: "A", text: "Try to put it to the back of your mind and focus on other things.", score: 1 },
        { id: "B", text: "Think about moving or delaying the meeting to another time.", score: 1 },
        { id: "C", text: "Keep the appointment, prepare a few questions, and think in advance about how you might respond constructively.", score: 4 },
        { id: "D", text: "Attend the meeting but keep your involvement fairly minimal so you don't have to go into too much detail.", score: 2 }
      ]
    },
    {
      id: "B4",
      title: "Health appointment",
      text: "You've been putting off a health or dental check-up that you know would probably be useful. What usually happens?",
      options: [
        { id: "A", text: "You hold off booking until symptoms or discomfort become more noticeable.", score: 1 },
        { id: "B", text: "You plan to call next week but don't usually set a specific time.", score: 2 },
        { id: "C", text: "You pick a date, book the appointment, and make a quick note of questions or points to mention.", score: 4 },
        { id: "D", text: "You mention it in conversation with others but don't typically take steps yourself.", score: 1 }
      ]
    },
    {
      id: "B5",
      title: "Short-term gig vs training",
      text: "You're offered a short-term job that pays quickly just as you're thinking about doing a course that could help your future work. What do you do?",
      options: [
        { id: "A", text: "Take the job and let the idea of the course drop for the time being.", score: 1 },
        { id: "B", text: "Take the job now and keep the course in mind without making specific plans for it.", score: 2 },
        { id: "C", text: "Weigh up both options and, if the course looks valuable, either choose it or plan the job in a way that still lets you start the course soon.", score: 4 },
        { id: "D", text: "Leave both options open for now and see what happens over time.", score: 1 }
      ]
    },
    {
      id: "B6",
      title: "Food choice",
      text: "At lunchtime you're tired and hungry. You can grab fast food, or pick something lighter or more balanced. What's closest to what you usually do?",
      options: [
        { id: "A", text: "Choose the option that's quickest and most satisfying in the moment.", score: 1 },
        { id: "B", text: "Aim for a lighter choice but often switch to the quickest option when you're hungry.", score: 2 },
        { id: "C", text: "Think about how you want to feel later in the day and week, and pick something that balances taste and health.", score: 4 },
        { id: "D", text: "Sometimes skip a full lunch and then rely on whatever snacks are around later.", score: 1 }
      ]
    },
    {
      id: "B7",
      title: "Learning project",
      text: "You want to start learning something new. How do you usually approach it?",
      options: [
        { id: "A", text: "Think it would be good to do and wait until you feel ready to begin.", score: 1 },
        { id: "B", text: "Watch a few videos or download an app and see how far you get.", score: 2 },
        { id: "C", text: "Decide exactly when and where you'll practise and set it up in your calendar or app.", score: 4 },
        { id: "D", text: "Mention it to someone close to you but don't usually make a concrete plan.", score: 2 }
      ]
    },
    {
      id: "B8",
      title: "Budget habit",
      text: "You decide it would help to review your spending regularly. What are you most likely to do?",
      options: [
        { id: "A", text: "Intend to look at your statements when money feels tight.", score: 1 },
        { id: "B", text: "Open your banking app from time to time when it crosses your mind.", score: 2 },
        { id: "C", text: "Pick a specific day and time, set a reminder, and use the same simple checklist each time.", score: 4 },
        { id: "D", text: "Decide in general to pay more attention to your spending without setting anything specific up.", score: 1 }
      ]
    }
  ],
  factors: {
    "Planning & prioritisation": ["B1", "B2"],
    "Facing hard decisions vs avoidance": ["B3", "B4"],
    "Considering future consequences": ["B5", "B6"],
    "Concrete follow-through planning": ["B7", "B8"]
  }
});
