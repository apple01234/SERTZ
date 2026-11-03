import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CHAPTERS } from "../../src/game/campaign/catalog.ts";

test("Drive art retains original bytes, native grids, provenance and every boss portrait", async () => {
  const root = new URL("../../public/assets/campaign/drive/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("manifest.json", root), "utf8"),
  );
  assert.equal(manifest.license, "CC0-1.0");
  for (const chapter of CHAPTERS.filter((c) => c.boss))
    assert.ok(manifest.files[`boss-${chapter.id}`], chapter.id);
  for (const art of Object.values(manifest.files)) {
    assert.match(
      art.archivePath,
      /^CERTZ\/assets_dl\/extracted\/dungeoncrawl_32x32\//,
    );
    const bytes = await readFile(new URL(art.file, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), art.sha256);
    assert.equal(bytes.readUInt32BE(16), 32, art.file);
    assert.equal(bytes.readUInt32BE(20), 32, art.file);
  }
  for (const art of Object.values(manifest.projectFiles)) {
    const bytes = await readFile(
      new URL(`../../public${art.url}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(bytes).digest("hex"), art.sha256);
    if (art.url.endsWith(".png")) {
      assert.equal(bytes.readUInt32BE(16), art.width);
      assert.equal(bytes.readUInt32BE(20), art.height);
    } else {
      assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
      assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
    }
  }
  for (const art of Object.values(manifest.audioFiles)) {
    const bytes = await readFile(
      new URL(`../../public${art.url}`, import.meta.url),
    );
    assert.equal(bytes.subarray(0, 4).toString(), "OggS");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), art.sha256);
  }
  assert.deepEqual(
    (await readdir(root)).sort(),
    [
      "LICENSE.txt",
      "README.txt",
      "manifest.json",
      ...Object.values(manifest.files).map((a) => a.file),
    ].sort(),
  );
});

test("original directional player, boss and skill animation frames remain unmodified", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        "../../public/assets/campaign/drive/manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.ok(Object.keys(manifest.animationFiles).length >= 150);
  for (const frame of Object.values(manifest.animationFiles)) {
    const data = await readFile(
      new URL(`../../public${frame.url}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(data).digest("hex"), frame.sha256);
  }
  for (const prefix of [
    "jobm_guardian",
    "jobm_sniper",
    "jobm_archmage",
    "jobm_nightblade",
    "jobm_stormcaptain",
  ]) {
    for (const action of [
      "idle",
      "walk",
      "walkside",
      "walkup",
      "atk",
      "atkdown",
      "atkup",
    ])
      for (let i = 0; i < 4; i++)
        assert.ok(manifest.animationFiles[`${prefix}_${action}${i}`]);
    assert.ok(
      new Set(
        [0, 1, 2, 3].map(
          (i) => manifest.animationFiles[`${prefix}_walk${i}`].sha256,
        ),
      ).size > 1,
    );
  }
});

test("whole original boss sheets keep their native animation grid and source hashes", async () => {
  const manifest = JSON.parse(await readFile(new URL("../../public/assets/campaign/drive/manifest.json", import.meta.url), "utf8"));
  assert.equal(new Set(Object.values(manifest.bossSheets).map((s) => s.url)).size, 6);
  for (const sheet of Object.values(manifest.bossSheets)) {
    const bytes = await readFile(new URL(`../../public${sheet.url}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sheet.sha256);
    assert.equal(bytes.readUInt32BE(16), sheet.width);
    assert.equal(bytes.readUInt32BE(20), sheet.height);
    assert.equal(sheet.width % sheet.frameWidth, 0);
    assert.equal(sheet.height % sheet.frameHeight, 0);
    assert.ok(sheet.height / sheet.frameHeight >= 7, "idle/walk/attack/special/death rows retained");
  }
});
