import test from "node:test";
import assert from "node:assert/strict";
import { computePriority, recencyBoost, weightedPick } from "../src/logic/scheduler.ts";

const weakWord = {
  id: "weak-word",
  dz: "ana",
  fr: "moi",
  type: "word",
  frequencyScore: 0.9,
  examples: [],
  moduleId: "module_survie",
  submoduleId: "module_survie_basics",
};

const masteredWord = {
  ...weakWord,
  id: "mastered-word",
  frequencyScore: 0.1,
};

test("recencyBoost prefers unseen and older words", () => {
  const now = Date.UTC(2026, 0, 4);
  assert.equal(recencyBoost(null, now), 1);
  assert.equal(recencyBoost(new Date(now).toISOString(), now), 0);
  assert.ok(recencyBoost(new Date(now - 72 * 60 * 60 * 1000).toISOString(), now) >= 0.99);
});

test("computePriority ranks weak failed frequent words above mastered fresh words", () => {
  const now = Date.UTC(2026, 0, 4);
  const weakPriority = computePriority(weakWord, {
    word_id: weakWord.id,
    success_count: 0,
    failure_count: 4,
    last_seen: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    mastery_level: 1,
  }, now);
  const masteredPriority = computePriority(masteredWord, {
    word_id: masteredWord.id,
    success_count: 5,
    failure_count: 0,
    last_seen: new Date(now).toISOString(),
    mastery_level: 3,
  }, now);

  assert.ok(weakPriority > masteredPriority);
});

test("weightedPick respects 50/30/20 bucket distribution when supply is available", () => {
  const candidates = [
    ...Array.from({ length: 5 }, (_, index) => ({ word_id: `weak-${index}`, priority: 10 - index, bucket: "weak" })),
    ...Array.from({ length: 3 }, (_, index) => ({ word_id: `new-${index}`, priority: 8 - index, bucket: "new" })),
    ...Array.from({ length: 2 }, (_, index) => ({ word_id: `mastered-${index}`, priority: 6 - index, bucket: "mastered" })),
  ];

  const picked = weightedPick(candidates, 10);
  const weakCount = picked.filter((id) => id.startsWith("weak-")).length;
  const newCount = picked.filter((id) => id.startsWith("new-")).length;
  const masteredCount = picked.filter((id) => id.startsWith("mastered-")).length;

  assert.equal(weakCount, 5);
  assert.equal(newCount, 3);
  assert.equal(masteredCount, 2);
});

