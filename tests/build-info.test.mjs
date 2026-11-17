import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as data from "../src/game/data.ts";
import * as classes from "../src/game/classes.ts";

const require = createRequire(import.meta.url);
const module = { exports: {} };
const source = fs.readFileSync(new URL("../src/components/game/BuildInfo.tsx", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  module, exports: module.exports,
  require: (id) => id === "@/game/data" ? data : id === "@/game/classes" ? classes : require(id),
});
const { ElementGuide, SetChangePreview } = module.exports;
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));

test("모든 직업의 안내가 실제 공격 원소와 9원소 판정에 일치한다", () => {
  for (const cls of Object.keys(classes.CLASSES)) {
    const family = classes.familyOf(cls);
    const attack = data.FAMILY_ELEM[family] ?? "none";
    const html = render(ElementGuide, { cls });
    assert.ok(html.includes(`내 공격 원소 · ${data.ELEMENT_META[attack].name}`), cls);
    assert.equal((html.match(/<th scope="row"/g) ?? []).length, 9, cls);
    for (const target of Object.keys(data.ELEMENT_META).filter((e) => e !== "none")) {
      const row = html.match(new RegExp(`<th scope="row"[^>]*>${data.ELEMENT_META[target].name}<\\/th>(.*?)<\\/tr>`))?.[1];
      assert.ok(row?.includes(`×${data.elemAdvantage(attack, target)}`), `${cls} → ${target}`);
      const reaction = data.elementReaction(attack, target);
      assert.ok(row?.includes(reaction ? data.ELEM_REACTION_META[reaction].name : "—"));
    }
  }
});

test("미전직은 무속성 안내이며 상성과 반응 배율을 혼동하지 않는다", () => {
  const untrained = render(ElementGuide, { cls: null });
  assert.match(untrained, /현재는 원소 상성 보정과 반응이 없습니다/);
  assert.doesNotMatch(untrained, /<table/);
  const mage = render(ElementGuide, { cls: "mage" });
  assert.match(mage, /불<\/th><td[^>]*>×0\.85<\/td><td[^>]*>융해/);
  assert.match(mage, /기본 상성은 반응·방어력·직업 보정 전/);
});

test("장착 전 세트 활성과 해제를 실제 보너스로 미리 보여준다", () => {
  const rpg = { weapon: "weapon_1", armor: "sfa_forest", accessories: ["sfr_forest"] };
  const before = JSON.stringify(rpg);
  const gain = render(SetChangePreview, { rpg, candidate: "sfw_forest" });
  assert.match(gain, /숲의 수호자 세트 활성/);
  assert.match(gain, /공격 \+3% · 방어 \+1 · 최대 HP \+40/);
  assert.equal(JSON.stringify(rpg), before, "미리보기는 장비를 바꾸지 않는다");
  const loss = render(SetChangePreview, { rpg: { ...rpg, weapon: "sfw_forest" }, candidate: "weapon_1" });
  assert.match(loss, /숲의 수호자 세트 해제/);
  assert.match(loss, /공격 −3% · 방어 −1 · 최대 HP −40/);
});

test("세트에 변화가 없거나 반지가 빠져 있으면 변화 안내를 만들지 않는다", () => {
  const rpg = { weapon: "sfw_forest", armor: "sfa_forest", accessories: ["sfr_forest"] };
  assert.equal(render(SetChangePreview, { rpg, candidate: "sfw_forest" }), "");
  assert.equal(render(SetChangePreview, { rpg: { ...rpg, weapon: "weapon_1", accessories: [] }, candidate: "sfw_forest" }), "");
});
