import test from "node:test";
import assert from "node:assert/strict";
import {
  clampProgress,
  calculateStageProgress,
  getNextSlideIndex,
  isValidEmail,
  validatePassword,
  RAG_STAGES,
} from "./rag-pipeline";

test("clampProgress bounds numbers between 0 and 100", () => {
  assert.equal(clampProgress(-10), 0);
  assert.equal(clampProgress(45.6), 46);
  assert.equal(clampProgress(150), 100);
});

test("calculateStageProgress correctly partitions stages", () => {
  const atZero = calculateStageProgress(0, RAG_STAGES);
  assert.equal(atZero.stageIndex, 0);
  assert.equal(atZero.currentStage, RAG_STAGES[0]);

  const atMid = calculateStageProgress(50, RAG_STAGES);
  assert.equal(atMid.stageIndex, 2);
  assert.equal(atMid.currentStage, RAG_STAGES[2]);

  const atEnd = calculateStageProgress(100, RAG_STAGES);
  assert.equal(atEnd.stageIndex, RAG_STAGES.length - 1);
  assert.equal(atEnd.currentStage, RAG_STAGES[RAG_STAGES.length - 1]);
});

test("getNextSlideIndex cycles infinitely in both directions", () => {
  assert.equal(getNextSlideIndex(0, 7, 1), 1);
  assert.equal(getNextSlideIndex(6, 7, 1), 0);
  assert.equal(getNextSlideIndex(0, 7, -1), 6);
  assert.equal(getNextSlideIndex(3, 7, -1), 2);
});

test("isValidEmail checks standard RFC email formats", () => {
  assert.equal(isValidEmail("upolabdhi-kali@gmail.com"), true);
  assert.equal(isValidEmail("test@example.org"), true);
  assert.equal(isValidEmail("invalid-email"), false);
  assert.equal(isValidEmail("test@"), false);
  assert.equal(isValidEmail(""), false);
});

test("validatePassword enforces length constraints", () => {
  assert.equal(validatePassword("short").valid, false);
  assert.equal(validatePassword("validPassword123").valid, true);
});
