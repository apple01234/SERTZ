import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBattle,
  stepBattle,
  STEP,
  hazardContains,
} from "../../src/game/campaign/battle.ts";
import { signProof, verifyProof } from "../../src/game/campaign/receipts.ts";
import { CHAPTERS } from "../../src/game/campaign/catalog.ts";
import { buildCampaignMap, canWalkAt } from "../../src/game/campaign/world.ts";
import { SKILLS } from "../../src/game/campaign/skills.ts";
const member = { id: "one", name: "증인", family: "warrior" };
test("skills have startup, one release, recovery and cooldown; dodge cancels pending damage", () => {
  for (const family of Object.keys(SKILLS)) {
    const b = createBattle("skill", "a1-03", "story", [{ ...member, family }]);
    const p = b.players[0];
    p.x = 512;
    p.y = 300;
    const hp = b.boss.hp;
    stepBattle(b, { one: { x: 0, y: 0, skill: true } });
    const cooldown = p.skillAt;
    assert.equal(b.boss.hp, hp, `${family}: no damage on keydown`);
    while (b.time + STEP < p.castAt) stepBattle(b, {});
    assert.equal(b.boss.hp, hp);
    while (p.castAt > 0) stepBattle(b, {});
    assert.equal(b.boss.hp, hp - 34);
    const attackAt = p.attackAt;
    stepBattle(b, { one: { x: 0, y: 0, attack: true, skill: true } });
    assert.equal(p.attackAt, attackAt, "recovery blocks basic attack");
    assert.equal(p.skillAt, cooldown, "held skill cannot bypass cooldown");
    for (let i = 0; i < 5; i++) stepBattle(b, {});
    assert.equal(b.boss.hp, hp - 34, "one cast damages once");
    const cancelled = createBattle("cancel", "a1-03", "story", [
      { ...member, family },
    ]);
    cancelled.players[0].x = 512;
    cancelled.players[0].y = 300;
    stepBattle(cancelled, { one: { x: 0, y: 0, skill: true } });
    stepBattle(cancelled, { one: { x: 0, y: 0, dodge: true } });
    for (let i = 0; i < 15; i++) stepBattle(cancelled, {});
    assert.equal(cancelled.players[0].castAt, 0);
    assert.equal(cancelled.players[0].skillReleasedAt, 0);
    assert.equal(cancelled.boss.hp, cancelled.boss.maxHp);
    assert.ok(
      cancelled.players[0].skillAt > cancelled.time,
      "cancel retains cooldown",
    );
  }
});
test("every encounter spawn is walkable and dodging cannot phase through rendered props", () => {
  for (const chapter of CHAPTERS.filter((c) => c.boss)) {
    const map = buildCampaignMap(chapter.theme, chapter.episode, true);
    const b = createBattle("collision", chapter.id, "coop", [
      member,
      { ...member, id: "two" },
      { ...member, id: "three" },
    ]);
    for (const p of b.players)
      assert.ok(canWalkAt(map, p), `${chapter.id}/${p.id} spawn`);
    const obstacle = map.objects.find(
      (o) => o.solid && o.solid.y > 170 && o.solid.y < 500,
    );
    if (!obstacle) continue;
    const r = obstacle.solid,
      p = b.players[0];
    p.x = r.x + r.width / 2;
    p.y = r.y + r.height + 14 - 16;
    if (!canWalkAt(map, p)) continue;
    const before = p.y;
    for (let i = 0; i < 8; i++)
      stepBattle(b, { one: { x: 0, y: -1, dodge: true } });
    assert.ok(
      p.y >= before - 1,
      `${chapter.id}: dodge crosses ${obstacle.key}`,
    );
  }
});
test("fixed combat enforces attack range/cooldown and bounds", () => {
  const b = createBattle("run", "a1-03", "story", [member]);
  stepBattle(b, { one: { x: Infinity, y: NaN, attack: true } });
  assert.equal(b.boss.hp, b.boss.maxHp);
  b.players[0].x = 512;
  b.players[0].y = 300;
  const hp = b.boss.hp;
  stepBattle(b, { one: { x: 0, y: 0, attack: true } });
  assert.equal(b.boss.hp, hp);
  b.time = 1000;
  stepBattle(b, { one: { x: 0, y: 0, attack: true } });
  assert.ok(b.boss.hp < hp);
  const after = b.boss.hp;
  stepBattle(b, { one: { x: 0, y: 0, attack: true } });
  assert.equal(b.boss.hp, after);
  for (let i = 0; i < 400; i++) stepBattle(b, { one: { x: 999, y: 999 } });
  assert.ok(b.players[0].x <= 984 && b.players[0].y <= 590);
});
test("telegraphs do not damage early, only hit once, and dodge grants a real invulnerability window", () => {
  const b = createBattle("run", "a1-03", "solo", [member]);
  b.hazards = [
    {
      id: 1,
      kind: "circle",
      x: 380,
      y: 470,
      radius: 90,
      at: 300,
      until: 700,
      hit: [],
    },
  ];
  stepBattle(b, {});
  assert.equal(b.players[0].hp, 100);
  b.time = 300;
  stepBattle(b, { one: { x: 0, y: 0, dodge: true } });
  assert.equal(b.players[0].hp, 100);
  const c = createBattle("run", "a1-03", "solo", [member]);
  c.time = 300;
  c.hazards = b.hazards.map((h) => ({ ...h, hit: [] }));
  stepBattle(c, {});
  assert.equal(c.players[0].hp, 65);
  stepBattle(c, {});
  assert.equal(c.players[0].hp, 65);
});
test("hard and cooperative encounters exceed story HP, fallen allies can be revived", () => {
  const story = createBattle("a", "a1-03", "story", [member]),
    solo = createBattle("b", "a1-03", "solo", [member]),
    coop = createBattle("c", "a1-03", "coop", [
      member,
      { ...member, id: "two" },
      { ...member, id: "three" },
    ]);
  assert.ok(
    story.boss.maxHp < solo.boss.maxHp && solo.boss.maxHp < coop.boss.maxHp,
  );
  coop.players[1].hp = 0;
  coop.players[1].x = coop.players[0].x;
  coop.players[1].y = coop.players[0].y;
  coop.boss.nextAttack = 10000;
  for (let i = 0; i < 62; i++)
    stepBattle(coop, { one: { x: 0, y: 0, revive: true } });
  assert.equal(coop.players[1].hp, 45);
});
test("proofs reject tampering, expiration, and missing server configuration", () => {
  const secret = "test-secret-not-production-1234567890";
  const token = signProof({ id: "a", exp: 2000 }, secret);
  assert.equal(verifyProof(token, secret, 1000).id, "a");
  assert.equal(verifyProof(token, secret, 2001), null);
  assert.equal(verifyProof(token + "x", secret, 1000), null);
  assert.equal(verifyProof(token, "", 1000), null);
});
