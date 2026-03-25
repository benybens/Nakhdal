import test from "node:test";
import assert from "node:assert/strict";
import { advanceSession, applyAnswerResult, chooseMode, createSessionState, evaluateAnswer, generateSession } from "../src/logic/sessionEngine.ts";

const wordId = "session-test-word";

test("chooseMode uses mcq for new or unstable words and recall for stronger words", () => {
  assert.equal(chooseMode(undefined), "mcq");
  assert.equal(chooseMode({ word_id: wordId, success_count: 0, failure_count: 0, last_seen: null, mastery_level: 1 }), "mcq");
  assert.equal(chooseMode({ word_id: wordId, success_count: 1, failure_count: 2, last_seen: null, mastery_level: 2 }), "mcq");
  assert.equal(chooseMode({ word_id: wordId, success_count: 3, failure_count: 0, last_seen: null, mastery_level: 2 }), "recall");
});

test("generateSession includes MCQ options inside session items", () => {
  const session = generateSession({ type: "global" }, 10, {}, Date.UTC(2026, 0, 1));
  const mcqItem = session.find((item) => item.mode === "mcq");

  assert.ok(mcqItem);
  assert.equal(mcqItem!.options.length, 4);
  assert.equal(new Set(mcqItem!.options).size, 4);
});

test("applyAnswerResult requires two correct answers to reach mastery level 3", () => {
  let progress = {};

  progress = applyAnswerResult(progress, {
    word_id: wordId,
    mode: "mcq",
    is_correct: true,
    expected_answer: "bonjour",
    submitted_answer: "bonjour",
  }, Date.UTC(2026, 0, 1));
  assert.equal(progress[wordId].mastery_level, 2);
  assert.equal(progress[wordId].success_count, 1);

  progress = applyAnswerResult(progress, {
    word_id: wordId,
    mode: "recall",
    is_correct: true,
    expected_answer: "bonjour",
    submitted_answer: null,
  }, Date.UTC(2026, 0, 2));
  assert.equal(progress[wordId].mastery_level, 3);
  assert.equal(progress[wordId].success_count, 2);
  assert.ok(typeof progress[wordId].last_seen === "string");
});

test("applyAnswerResult increments failures and can demote mastered words", () => {
  const progress = applyAnswerResult({
    [wordId]: {
      word_id: wordId,
      success_count: 4,
      failure_count: 0,
      last_seen: null,
      mastery_level: 3,
    },
  }, {
    word_id: wordId,
    mode: "recall",
    is_correct: false,
    expected_answer: "bonjour",
    submitted_answer: null,
  }, Date.UTC(2026, 0, 4));

  assert.equal(progress[wordId].failure_count, 1);
  assert.equal(progress[wordId].mastery_level, 2);
});

test("generateSession samples a fixed-size subset and can vary between runs", () => {
  const firstSession = generateSession({ type: "global" }, 10, {}, Date.UTC(2026, 0, 1));
  const secondSession = generateSession({ type: "global" }, 10, {}, Date.UTC(2026, 0, 2));

  assert.equal(firstSession.length, 10);
  assert.equal(secondSession.length, 10);
  assert.notDeepEqual(
    firstSession.map((item) => item.word_id),
    secondSession.map((item) => item.word_id),
  );
});

test("advanceSession requeues wrong answers within the next two questions with a max of two retries", () => {
  let progress = {};
  let session = createSessionState({ type: "global" }, 4, progress);
  const firstWordId = session.currentItem?.word_id;

  assert.ok(firstWordId);

  let result = advanceSession(
    session,
    progress,
    evaluateAnswer(session.currentItem!, { value: "totally wrong" }),
  );

  progress = result.progress;
  session = result.session;

  const firstRetryCandidate = session.currentItem?.word_id;
  assert.ok(firstRetryCandidate);

  if (firstRetryCandidate !== firstWordId) {
    result = advanceSession(
      session,
      progress,
      evaluateAnswer(session.currentItem!, { self_assessed_correct: true }),
    );
    progress = result.progress;
    session = result.session;
  }

  assert.equal(session.currentItem?.word_id, firstWordId);

  result = advanceSession(
    session,
    progress,
    evaluateAnswer(session.currentItem!, { value: "still wrong" }),
  );
  progress = result.progress;
  session = result.session;

  let seenAdditionalRetry = false;
  for (let step = 0; step < 4 && session.currentItem; step += 1) {
    if (session.currentItem.word_id === firstWordId) {
      seenAdditionalRetry = true;
      result = advanceSession(
        session,
        progress,
        evaluateAnswer(session.currentItem, { value: "wrong again" }),
      );
    } else {
      result = advanceSession(
        session,
        progress,
        evaluateAnswer(session.currentItem, { self_assessed_correct: true }),
      );
    }

    progress = result.progress;
    session = result.session;
  }

  assert.equal(seenAdditionalRetry, true);

  const futureWordIds: string[] = [];
  for (let step = 0; step < 6 && session.currentItem; step += 1) {
    futureWordIds.push(session.currentItem.word_id);
    result = advanceSession(
      session,
      progress,
      evaluateAnswer(session.currentItem, { self_assessed_correct: true }),
    );
    progress = result.progress;
    session = result.session;
  }

  assert.equal(futureWordIds.includes(firstWordId), false);
});
