import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = fs.readFileSync(new URL("../src/game/scenes/WorldScene.ts", import.meta.url), "utf8");
const ast = ts.createSourceFile("world.ts", source, ts.ScriptTarget.Latest, true);
const methods = {};
function visit(n) {
  if (ts.isMethodDeclaration(n) && ["saveSoon", "flushSave"].includes(n.name.getText(ast))) methods[n.name.getText(ast)] = n.getText(ast).replace(/^private\s+/, "");
  ts.forEachChild(n, visit);
}
visit(ast);
const timers = new Map(); let serial = 0, writes = 0;
const context = { result: null, window: { setTimeout(fn) { timers.set(++serial, fn); return serial; }, clearTimeout(id) { timers.delete(id); } } };
vm.runInNewContext(ts.transpile(`result = { ${methods.saveSoon}, ${methods.flushSave} }`), context);
const scene = { ...context.result, saveTimer: null, save() { writes++; } };
for (let i = 0; i < 20; i++) scene.saveSoon();
assert.equal(timers.size, 1, "rapid equipment/stat changes share one pending write");
const [id, callback] = [...timers.entries()][0]; timers.delete(id); callback();
assert.equal(writes, 1, "the timer must write instead of scheduling itself forever");
assert.equal(timers.size, 0);
assert.equal(scene.saveTimer, null);
scene.saveSoon(); scene.flushSave();
assert.equal(writes, 2, "leaving the game flushes the pending write");
assert.equal(timers.size, 0);
console.log("PASS: debounced original RPG writes once; flush cancels the timer and persists immediately");
