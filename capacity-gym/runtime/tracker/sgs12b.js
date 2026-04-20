const MATRIX_OPTIONS = Object.freeze(["A", "B", "C", "D", "E", "F", "None of these", "I don't know"]);
const ROTATION_OPTIONS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);

export const sgs12bManifest = Object.freeze({
  id: "sgs12b",
  label: "SgS-12B",
  shortLabel: "Form B",
  familyId: "reasoning",
  familyLabel: "Reasoning",
  mode: "sgs",
  benchmarkLevel: "followup",
  estimateMinutes: 6,
  introTitle: "Reasoning repeat form",
  introCopy:
    "A second 12-item reasoning form for follow-up checks. Use it after the baseline rather than on the same opening pass.",
  items: [
    {
      id: "BM1",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12b/matrices/BM1.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 1
    },
    {
      id: "BM2",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12b/matrices/BM2.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 2
    },
    {
      id: "BM3",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12b/matrices/BM3.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 4
    },
    {
      id: "BM4",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12b/matrices/BM4.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 3
    },
    {
      id: "BM5",
      kind: "matrix",
      prompt: "Choose the option that best completes the matrix.",
      stemImageUrl: "./assets/tests/sgs12b/matrices/BM5.jpg",
      responseOptions: MATRIX_OPTIONS,
      correctOptionIndex: 3
    },
    {
      id: "BVR1",
      kind: "verbal",
      prompt: 'The opposite of a "stubborn" person is a "_____" person.',
      responseOptions: ["Flexible", "Passionate", "Mediocre", "Reserved", "Pigheaded", "Persistent", "None of these", "I don't know"],
      correctOptionIndex: 0
    },
    {
      id: "BVR2",
      kind: "verbal",
      prompt:
        "Adam and Melissa went fly-fishing and caught a total of 32 salmon. Melissa caught three times as many salmon as Adam. How many salmon did Adam catch?",
      responseOptions: ["7", "8", "9", "10", "11", "12", "None of these", "I don't know"],
      correctOptionIndex: 1
    },
    {
      id: "BVR3",
      kind: "verbal",
      prompt:
        "Please mark the word that does not match the other words: (1) Buenos Aires (2) Melbourne (3) Seattle (4) Cairo (5) Morocco (6) Milan",
      responseOptions: ["Buenos Aires", "Melbourne", "Seattle", "Cairo", "Morocco", "Milan", "None of these", "I don't know"],
      correctOptionIndex: 4
    },
    {
      id: "BSR1",
      kind: "series",
      prompt: "In the following alphanumeric series, what letter comes next? I, J, L, O, S, ...",
      responseOptions: ["T", "U", "V", "X", "Y", "Z", "None of these", "I don't know"],
      correctOptionIndex: 3
    },
    {
      id: "BSR2",
      kind: "series",
      prompt: "In the following alphanumeric series, what letter comes next? V, Q, M, J, H, ...",
      responseOptions: ["E", "F", "G", "H", "I", "J", "None of these", "I don't know"],
      correctOptionIndex: 2
    },
    {
      id: "BR1",
      kind: "rotation",
      prompt: "Choose the rotated shape that matches the target.",
      stemImageUrl: "./assets/tests/sgs12b/rotation/BR1.jpg",
      responseOptions: ROTATION_OPTIONS,
      correctOptionIndex: 6
    },
    {
      id: "BR2",
      kind: "rotation",
      prompt: "Choose the rotated shape that matches the target.",
      stemImageUrl: "./assets/tests/sgs12b/rotation/BR2.jpg",
      responseOptions: ROTATION_OPTIONS,
      correctOptionIndex: 2
    }
  ]
});
