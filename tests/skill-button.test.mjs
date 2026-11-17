import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SKILL_BUFFER_MS } from "../src/game/scenes/input/skillBuffer.ts";

const require = createRequire(import.meta.url);
const module = { exports: {} };
const source = fs.readFileSync(new URL("../src/components/game/SkillButton.tsx", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  module, exports: module.exports,
  require: (id) => id === "@/game/scenes/input/skillBuffer" ? { SKILL_BUFFER_MS } : require(id),
});
const { SkillButton } = module.exports;
const render = (props) => renderToStaticMarkup(createElement(SkillButton, {
  label: "돌진", ready: false, mp: 20, currentMp: 60, cdMax: 6000, onDown() {}, ...props,
}));

test("쿨다운 마지막 300ms만 터치 입력을 받고 남은 소수 초를 표시한다", () => {
  assert.match(render({ cdPct: 6 }), /disabled=""/);
  const boundary = render({ cdPct: 5 });
  assert.doesNotMatch(boundary, /disabled=""/);
  assert.match(boundary, /재사용 대기 0\.3초 · 입력 예약 가능/);
  assert.match(render({ cdPct: 2 }), /재사용 대기 0\.2초/);
  assert.doesNotMatch(render({ ready: true, cdPct: 0 }), /disabled=""/);
});

test("MP가 부족하면 예약도 차단하고 부족 상태를 설명한다", () => {
  for (const cdPct of [0, 2, 5, 50]) {
    const html = render({ currentMp: 19, cdPct });
    assert.match(html, /disabled=""/);
    assert.match(html, /aria-label="돌진 · MP 부족"/);
    assert.match(html, />MP 부족<\/span>/);
  }
});
