export const crs10ResponseOptions = Object.freeze([
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neither" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" }
]);

export const crs10Manifest = Object.freeze({
  id: "crs10",
  label: "CRS-10",
  shortLabel: "Resilience scale",
  familyId: "resilience",
  familyLabel: "Cognitive Resilience",
  mode: "crs",
  estimateMinutes: 3,
  introTitle: "Cognitive resilience under pressure",
  introCopy:
    "Ten agree-disagree items about how clearly and flexibly you think under stress, setbacks, and high-stakes conditions.",
  responseOptions: crs10ResponseOptions,
  questions: [
    {
      id: "CRS1",
      text: "Stress helps me cognitively, to focus, make decisions, problem solve and learn.",
      reverse: false
    },
    {
      id: "CRS2",
      text: "Stressful situations make it difficult for me to monitor myself and adapt to new circumstances.",
      reverse: true
    },
    {
      id: "CRS3",
      text: "Obstacles and setbacks give me a mental buzz and sharpen my thinking.",
      reverse: false
    },
    {
      id: "CRS4",
      text: "I over-think situations and suffer from paralysis of analysis when I am under a lot of pressure.",
      reverse: true
    },
    {
      id: "CRS5",
      text: "I suffer from tunnel vision and am less flexible in my judgements and decision-making when I'm highly stressed.",
      reverse: true
    },
    {
      id: "CRS6",
      text: "Failure, loss, and major obstacles are demotivating for me.",
      reverse: true
    },
    {
      id: "CRS7",
      text: "My focus and problem-solving strategies are sharper when I need to overcome major setbacks.",
      reverse: false
    },
    {
      id: "CRS8",
      text: "I have to force myself to focus and problem solve when facing major obstacles, the motivation is often lacking.",
      reverse: true
    },
    {
      id: "CRS9",
      text: "I attain my highest levels of mental clarity and performance in high-pressure situations where there is a lot on the line.",
      reverse: false
    },
    {
      id: "CRS10",
      text: "My ability to make judgements and decisions stays sharp when I am stressed.",
      reverse: false
    }
  ]
});
