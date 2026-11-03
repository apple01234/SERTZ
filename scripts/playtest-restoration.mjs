import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { newCampaign } from "../src/game/campaign/progress.ts";
const base = process.env.BASE_URL ?? "http://127.0.0.1:3003";
const output = process.env.OATH_SCREENSHOTS ?? "/tmp/oath-restoration";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const key = "sertz:memory-oath-v1:characters";
async function seed(page, camp = false) {
  const progress = newCampaign("복구검증", "warrior", "restore-test");
  await page.addInitScript(
    ({ progress, key, camp }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            activeId: progress.characterId,
            characters: [progress],
          }),
        );
        localStorage.setItem("sertz_save_v2", "legacy-sentinel");
        if (camp)
          localStorage.setItem(
            "sertz:memory-oath-v1:rpg:sertz_char_" + progress.characterId,
            JSON.stringify({
              stage: "village",
              lv: 60,
              exp: 0,
              maxHp: 1000,
              atk: 50,
              cleared: false,
              playerName: progress.name,
              cls: "warrior",
              startCls: "warrior",
              tutorialDone: true,
              visited: ["village"],
              ap: 5,
              stats: { str: 0, dex: 0, int: 0, luk: 0 },
              gold: 10000,
              owned: ["weapon_1", "armor_1", "weapon_2", "furn_table"],
            }),
          );
      }
    },
    { progress, key, camp },
  );
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/assets/") && r.status() >= 400)
      errors.push(`Asset ${r.status()}: ${r.url()}`);
  });
}
const scene = () => window.__OATH_INSPECT__();
const world = () => window.__SERTZ_DEBUG__.game.scene.getScene("world");
async function go(page, x, y) {
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x + (x / 1024) * box.width,
    box.y + (y / 640) * box.height,
  );
}
try {
  const c = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }),
    p = await c.newPage();
  await seed(p);
  await p.goto(base + "/?resume=1");
  await p.waitForFunction(
    () => !!window.__OATH_INSPECT__ && !window.__OATH_INSPECT__().paused,
  );
  await p.waitForTimeout(250);
  await p.keyboard.down("d");
  const frames = [];
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(65);
    frames.push((await p.evaluate(scene)).player.frame);
  }
  await p.keyboard.up("d");
  assert.ok(
    new Set(frames).size > 1,
    "directional walking must display different original frames",
  );
  assert.ok(frames.every((f) => f.startsWith("jobm_guardian_walkside")));
  await p.keyboard.down("w");
  await p.waitForTimeout(140);
  assert.match((await p.evaluate(scene)).player.animation, /walk-up/);
  await p.keyboard.up("w");
  await p.keyboard.down("Space");
  await p.waitForTimeout(100);
  assert.match((await p.evaluate(scene)).player.animation, /atk/);
  await p.keyboard.up("Space");
  await go(p, 512, 300);
  await p.getByRole("dialog", { name: "이야기 대화" }).waitFor();
  await p.waitForTimeout(350);
  const cinematic = await p.evaluate(scene);
  assert.equal(cinematic.paused, true);
  assert.ok(cinematic.camera.zoom > cinematic.camera.baseZoom);
  await p.keyboard.down("d");
  await p.waitForTimeout(150);
  await p.keyboard.up("d");
  assert.equal((await p.evaluate(scene)).player.x, cinematic.player.x);
  await p.getByRole("button", { name: "건너뛰기" }).click();
  await p.waitForTimeout(100);
  const resumed = await p.evaluate(scene);
  assert.equal(resumed.paused, false);
  assert.equal(resumed.camera.zoom, resumed.camera.baseZoom);
  const before = resumed.player;
  const solid = resumed.objects.find((o) => o.solid && o.x > 700).solid;
  await go(p, solid.x + solid.width / 2, solid.y + solid.height / 2 - 16);
  await p.waitForTimeout(300);
  const blocked = await p.evaluate(scene);
  assert.ok(
    Math.hypot(blocked.player.x - before.x, blocked.player.y - before.y) < 2,
    "clicking inside a prop must not enter it",
  );
  await p.screenshot({ path: `${output}/story-original-animation.png` });
  const boss = Object.assign(newCampaign("연출검증", "ranger", "intro-test"), {
    chapterId: "a1-03",
    objective: 2,
    completed: ["a1-01", "a1-02"],
    memories: ["a1-01", "a1-02"],
  });
  await p.evaluate(
    ({ boss, key }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          activeId: boss.characterId,
          characters: [boss],
        }),
      ),
    { boss, key },
  );
  await p.reload();
  await p.waitForFunction(
    () => !!window.__OATH_INSPECT__ && !window.__OATH_INSPECT__().paused,
  );
  await p.evaluate(() =>
    window.__SERTZ_EB__.on("campaign:view", (v) => {
      window.__restoredBattle = v.battle;
    }),
  );
  await go(p, 512, 240);
  await p.getByRole("status", { name: "보스 등장 연출" }).waitFor();
  assert.equal(
    await p.evaluate(() => window.__restoredBattle?.time),
    0,
    "boss introduction must not advance offline combat",
  );
  await p.getByRole("button", { name: "건너뛰기 · E", exact: true }).click();
  await p
    .getByRole("status", { name: "보스 등장 연출" })
    .waitFor({ state: "hidden" });
  await p.waitForFunction(() => window.__restoredBattle?.time > 0);
  const introRestored = await p.evaluate(scene);
  assert.equal(introRestored.camera.zoom, introRestored.camera.baseZoom);
  console.log("PASS: story frame animation, collision, dialogue and boss-intro skip/camera restore");
  await c.close();

  const camp = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }),
    page = await camp.newPage();
  await seed(page, true);
  await page.goto(base + "/camp");
  await page.waitForFunction(
    () => !!window.__SERTZ_DEBUG__?.game?.scene.getScene("world")?.player?.body,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForTimeout(500);
  const initial = await page.evaluate(() => {
    const s = window.__SERTZ_DEBUG__.game.scene.getScene("world");
    return {
      textures: s.textures.getTextureKeys().length,
      solids: s.solidGroup.getLength(),
      dialoguing: s.dialoguing,
    };
  });
  assert.ok(
    initial.textures > 3000,
    "original RPG asset packs must actually load",
  );
  assert.equal(
    initial.dialoguing,
    false,
    "removed story opening must not reappear",
  );
  const nav = page.getByRole("navigation", { name: "연합 거점 메뉴" });
  await nav.getByRole("button", { name: "가방·장비", exact: true }).click();
  await page.getByRole("button", { name: "weapon_2", exact: true }).click();
  await page.getByRole("button", { name: "장착", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => window.__SERTZ_DEBUG__.game.scene.getScene("world").player.weapon,
    ),
    "weapon_2",
  );
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "능력치", exact: true }).click();
  await page.getByRole("button", { name: "+1", exact: true }).first().click();
  assert.equal(
    await page.evaluate(
      () => window.__SERTZ_DEBUG__.game.scene.getScene("world").player.ap,
    ),
    4,
  );
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "전직·스킬", exact: true }).click();
  assert.ok((await page.locator("body").innerText()).includes("전직"));
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "하우징", exact: true }).click();
  await page.getByRole("button", { name: /아침 식탁.*배치/ }).click();
  await page.getByRole("button", { name: "빈 칸 3,3", exact: true }).click();
  let placed = await page.evaluate(() => {
    const s = window.__SERTZ_DEBUG__.game.scene.getScene("world");
    return {
      count: s.player.homeDecor.length,
      solids: s.solidGroup.getLength(),
    };
  });
  assert.equal(placed.count, 1);
  assert.equal(placed.solids, initial.solids + 1);
  await page
    .getByRole("button", { name: "아침 식탁 회수", exact: true })
    .click({ button: "right" });
  assert.equal(
    await page.evaluate(
      () =>
        window.__SERTZ_DEBUG__.game.scene.getScene("world").player.homeDecor[0]
          .rot,
    ),
    1,
  );
  assert.equal(
    await page.evaluate(() =>
      window.__SERTZ_DEBUG__.game.scene
        .getScene("world")
        .solidGroup.getLength(),
    ),
    initial.solids + 1,
  );
  await page
    .getByRole("button", { name: "아침 식탁 회수", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() =>
      window.__SERTZ_DEBUG__.game.scene
        .getScene("world")
        .solidGroup.getLength(),
    ),
    initial.solids,
    "removing furniture must remove its collision body",
  );
  await page.getByRole("button", { name: "집 꾸미기 닫기" }).click();
  await nav.getByRole("button", { name: "제작·상점", exact: true }).click();
  await page.getByRole("button", { name: /상점 닫기/ }).click();
  await page.screenshot({ path: `${output}/restored-town.png` });
  // Exercise the actual original scene transition and boss-spawn integration.
  await page.evaluate(() =>
    window.__SERTZ_DEBUG__.game.scene
      .getScene("world")
      .startTransition("forest10", { delay: 0 }),
  );
  await page.waitForFunction(
    () => {
      const s = window.__SERTZ_DEBUG__.game.scene.getScene("world");
      return s?.stageDef?.key === "forest10" && !!s.boss?.alive;
    },
    { timeout: 15000 },
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.__SERTZ_DEBUG__.game.scene.getScene("world").currentQuest().type,
    ),
    "boss",
  );
  await page.screenshot({ path: `${output}/original-training-boss.png` });
  await nav.getByRole("link", { name: "이야기", exact: true }).click();
  await page.waitForURL(/resume=1/);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sertz_save_v2")),
    "legacy-sentinel",
  );
  const saved = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("sertz:memory-oath-v1:rpg:sertz_char_restore-test"),
    ),
  );
  assert.equal(saved.weapon, "weapon_2");
  assert.equal(saved.ap, 4);
  assert.equal(
    JSON.parse(await page.evaluate((k) => localStorage.getItem(k), key))
      .characters[0].objective,
    0,
    "RPG saving must not overwrite story progress",
  );
  await camp.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: original directional animation, attack, cutscene pause/skip/camera restore, prop click blocking, >3000 original textures, real equipment/AP, furniture placement/rotation/removal collision cleanup, save isolation and route return.",
  );
} catch (error) {
  for (const [i, page] of browser
    .contexts()
    .flatMap((c) => c.pages())
    .entries()) {
    await page
      .screenshot({ path: `${output}/failure-${i}.png` })
      .catch(() => {});
    console.error(
      await page
        .locator("body")
        .innerText()
        .catch(() => ""),
    );
  }
  throw error;
} finally {
  await browser.close();
}
