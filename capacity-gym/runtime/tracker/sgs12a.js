const MATRIX_OPTIONS = Object.freeze(["A", "B", "C", "D", "E", "F", "None of these", "I don't know"]);
const ROTATION_OPTIONS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);

export const sgs12aManifest = Object.freeze({
  id: "sgs12a",
  label: "SgS-12A",
  shortLabel: "Form A",
  familyId: "reasoning",
  familyLabel: "Reasoning",
  mode: "sgs",
  benchmarkLevel: "baseline",
  estimateMinutes: 6,
  introTitle: "Reasoning snapshot baseline",
  introCopy:
    "Twelve short reasoning items across matrices, verbal logic, series, and mental rotation. This creates the opening RS-IQ snapshot for the Basic route.",
  items: [
    {
      id: "AM1",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12a/matrices/AM1.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 3
    },
    {
      id: "AM2",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12a/matrices/AM2.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 2
    },
    {
      id: "AM3",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12a/matrices/AM3.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 0
    },
    {
      id: "AM4",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12a/matrices/AM4.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 4
    },
    {
      id: "AM5",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12a/matrices/AM5.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 4
    },
    {
      id: "VR1",
      kind: "verbal",
      prompt:
        "Joshua is 12 years old and his sister is three times as old as he. When Joshua is 23 years old, how old will his sister be?",
      responseOptions: ["35", "39", "44", "47", "53", "57", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "VR2",
      kind: "verbal",
      prompt: "What number is one fifth of one fourth of one ninth of 900?",
      responseOptions: ["2", "3", "4", "5", "6", "7", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "VR3",
      kind: "verbal",
      prompt:
        "Please mark the word that does not match the other words: (1) Sycamore (2) Buckeye (3) Elm (4) Daffodil (5) Hickory (6) Sequoia",
      responseOptions: ["1", "2", "3", "4", "5", "6", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "SR1",
      kind: "series",
      prompt: "In the following number series, what number comes next? 64, 81, 100, 121, 144, ...",
      responseOptions: ["154", "156", "162", "169", "178", "196", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "SR2",
      kind: "series",
      prompt: "In the following alphanumeric series, what letter comes next? Q, S, N, P, L, ...",
      responseOptions: ["J", "H", "I", "N", "M", "L", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "AR1",
      kind: "rotation",
      prompt: "Choose the rotated shape that matches the target.",
      stemImageUrl: "./assets/tests/sgs12a/rotation/AR1.jpg",
      responseOptions: ROTATION_OPTIONS,
      correctOptionIndex: 5
    },
    {
      id: "AR2",
      kind: "rotation",
      prompt: "Choose the rotated shape that matches the target.",
      stemImageUrl: "./assets/tests/sgs12a/rotation/AR2.jpg",
      responseOptions: ROTATION_OPTIONS,
      correctOptionIndex: 1
    }
  ]
});
