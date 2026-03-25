import test from "node:test";
import assert from "node:assert/strict";
import { generateWordId, migrateProgress } from "../src/store/migration.ts";

const dz = "ana";
const fr = "moi";
const wordId = generateWordId(dz, fr);

test("migrateProgress maps mastered legacy progress to mastery level 3", () => {
  const migrated = migrateProgress({
    modules: {
      legacy: {
        completed: false,
        wordStats: {
          [dz]: {
            successCount: 2,
            exposed: true,
            mastered: true,
          },
        },
      },
    },
    revisionWords: [{ dz, fr }],
  });

  assert.equal(migrated[wordId].word_id, wordId);
  assert.equal(migrated[wordId].mastery_level, 3);
  assert.equal(migrated[wordId].success_count, 2);
  assert.equal(migrated[wordId].failure_count, 0);
  assert.equal(migrated[wordId].last_seen, 0);
});

test("migrateProgress maps exposed-only progress to mastery level 1", () => {
  const migrated = migrateProgress({
    modules: {
      legacy: {
        completed: false,
        wordStats: {
          [dz]: {
            successCount: 0,
            exposed: true,
            mastered: false,
          },
        },
      },
    },
    revisionWords: [{ dz, fr }],
  });

  assert.equal(migrated[wordId].mastery_level, 1);
});

test("migrateProgress keeps the strongest state when the same word appears twice", () => {
  const migrated = migrateProgress({
    modules: {
      first: {
        completed: false,
        wordStats: {
          [dz]: {
            successCount: 1,
            exposed: true,
            mastered: false,
          },
        },
      },
      second: {
        completed: false,
        wordStats: {
          [dz]: {
            successCount: 3,
            exposed: true,
            mastered: true,
          },
        },
      },
    },
    revisionWords: [{ dz, fr }],
  });

  assert.equal(migrated[wordId].mastery_level, 3);
  assert.equal(migrated[wordId].success_count, 3);
});
