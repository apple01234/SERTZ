import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scopedRpgStorage,
  RPG_PREFIX,
  isCampStage,
  trainingQuests,
} from "../../src/game/campaign/rpgSession.ts";
function baseStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(i) {
      return [...values.keys()][i] ?? null;
    },
    getItem(k) {
      return values.get(k) ?? null;
    },
    setItem(k, v) {
      values.set(k, String(v));
    },
    removeItem(k) {
      values.delete(k);
    },
    clear() {
      values.clear();
    },
  };
}
test("training boss fields preserve spawn and exit quest mechanics without removed story dialogue", () => {
  const quests = trainingQuests("forest10", { name: "수호자" });
  assert.deepEqual(
    quests.map((q) => q.type),
    ["boss", "reach"],
  );
  assert.equal(quests[0].targetLabel, "수호자");
  assert.ok(quests.every((q) => !q.dialogue && q.id.startsWith("training-")));
  assert.deepEqual(trainingQuests("forest1"), []);
});
test("original RPG saves, slots and union stay isolated from legacy and story records", () => {
  const base = baseStorage();
  base.setItem("sertz_save_v2", "legacy-bytes");
  base.setItem("sertz:memory-oath-v1:characters", "story-bytes");
  const scoped = scopedRpgStorage(base);
  assert.equal(scoped.getItem("sertz_save_v2"), null);
  scoped.setItem("sertz_save_v2", "new-rpg");
  scoped.setItem("sertz_char_abc", "equipment");
  scoped.setItem("sertz_union_v1", "union");
  assert.equal(base.getItem(RPG_PREFIX + "sertz_char_abc"), "equipment");
  assert.equal(scoped.length, 3);
  assert.equal(scoped.key(0), "sertz_save_v2");
  scoped.clear();
  assert.equal(scoped.length, 0);
  assert.equal(base.getItem("sertz_save_v2"), "legacy-bytes");
  assert.equal(base.getItem("sertz:memory-oath-v1:characters"), "story-bytes");
});
test("removed story routes cannot re-enter the RPG camp through old DLC gates", () => {
  for (const key of [
    "village",
    "interior_home",
    "dojang",
    "tower",
    "gate",
    "forest1",
  ])
    assert.equal(isCampStage(key), true, key);
  for (const key of [
    "youngprincessv",
    "howlrstone1",
    "dlcstargate1",
    "../../forest1",
  ])
    assert.equal(isCampStage(key), false, key);
});
