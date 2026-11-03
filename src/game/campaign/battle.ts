/** Pure fixed-step combat, shared by Phaser and the authoritative Socket.IO service. */
import { CHAPTER_BY_ID, type Family } from "./catalog.ts";
import { buildCampaignMap, canWalkAt, type CampaignMap } from "./world.ts";
import { SKILLS } from "./skills.ts";
const battleMaps = new Map<string, CampaignMap>();
function terrain(chapterId: string) {
  let map = battleMaps.get(chapterId);
  if (!map) {
    const c = CHAPTER_BY_ID[chapterId];
    map = buildCampaignMap(c?.theme ?? "castle", c?.episode ?? 1, true);
    battleMaps.set(chapterId, map);
  }
  return map;
}
export type Vec = { x: number; y: number };
export type BattleInput = {
  x: number;
  y: number;
  attack?: boolean;
  skill?: boolean;
  dodge?: boolean;
  revive?: boolean;
};
export type Fighter = Vec & {
  id: string;
  name: string;
  family: Family;
  hp: number;
  maxHp: number;
  invulnerable: number;
  attackAt: number;
  skillAt: number;
  castAt: number;
  recoveryUntil: number;
  skillReleasedAt: number;
  skillConnected: boolean;
  dodgeAt: number;
  reviveProgress: number;
  deaths: number;
  lastHit: number;
};
export type Hazard = Vec & {
  id: number;
  kind: "circle" | "cross" | "ring" | "seals";
  radius: number;
  at: number;
  until: number;
  hit: string[];
};
export type Battle = {
  id: string;
  chapterId: string;
  mode: "story" | "solo" | "coop";
  time: number;
  status: "fighting" | "won" | "lost";
  players: Fighter[];
  boss: Vec & {
    hp: number;
    maxHp: number;
    phase: number;
    weakFrom: number;
    casts: number;
    weakUntil: number;
    nextAttack: number;
    pattern: "tide" | "cross" | "ring" | "storm";
  };
  hazards: Hazard[];
  serial: number;
};
export const ARENA = { width: 1024, height: 640 };
export const STEP = 1000 / 30;
export function createBattle(
  id: string,
  chapterId: string,
  mode: Battle["mode"],
  members: { id: string; name: string; family: Family }[],
  pattern: Battle["boss"]["pattern"] = "ring",
): Battle {
  const hp = mode === "story" ? 390 : mode === "solo" ? 750 : 1600;
  return {
    id,
    chapterId,
    mode,
    time: 0,
    status: "fighting",
    serial: 0,
    hazards: [],
    players: members.map((p, i) => ({
      ...p,
      x: 380 + i * 130,
      y: 470,
      hp: 100,
      maxHp: 100,
      invulnerable: 0,
      attackAt: 0,
      skillAt: 0,
      castAt: 0,
      recoveryUntil: 0,
      skillReleasedAt: 0,
      skillConnected: false,
      dodgeAt: 0,
      reviveProgress: 0,
      deaths: 0,
      lastHit: -1000,
    })),
    boss: {
      x: 512,
      y: 230,
      hp,
      maxHp: hp,
      phase: 1,
      weakUntil: 0,
      weakFrom: 0,
      casts: 0,
      nextAttack: 1400,
      pattern,
    },
  };
}
export function hazardContains(h: Hazard, p: Vec) {
  const dx = p.x - h.x,
    dy = p.y - h.y,
    d = Math.hypot(dx, dy);
  return h.kind === "cross"
    ? Math.abs(dx) < 42 || Math.abs(dy) < 42
    : h.kind === "ring"
      ? d > h.radius - 45 && d < h.radius + 45
      : d < h.radius;
}
export function stepBattle(
  b: Battle,
  inputs: Record<string, BattleInput>,
  dt = STEP,
): Battle {
  if (b.status !== "fighting") return b;
  dt = Math.min(50, Math.max(0, dt));
  b.time += dt;
  const boss = b.boss;
  boss.phase =
    boss.hp / boss.maxHp < 0.3 ? 3 : boss.hp / boss.maxHp < 0.65 ? 2 : 1;
  for (const p of b.players) {
    const v = inputs[p.id] ?? { x: 0, y: 0 };
    if (p.hp <= 0) continue;
    let x = Number.isFinite(v.x) ? Math.max(-1, Math.min(1, v.x)) : 0,
      y = Number.isFinite(v.y) ? Math.max(-1, Math.min(1, v.y)) : 0;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    if (v.dodge && b.time >= p.dodgeAt) {
      p.dodgeAt = b.time + 1350;
      p.invulnerable = b.time + 420;
      p.castAt = 0;
    }
    const speed = b.time < p.invulnerable ? 430 : p.castAt > b.time ? 110 : 195;
    const map = terrain(b.chapterId);
    const nextX = p.x + (x * speed * dt) / 1000,
      nextY = p.y + (y * speed * dt) / 1000;
    if (canWalkAt(map, { x: nextX, y: p.y })) p.x = nextX;
    if (canWalkAt(map, { x: p.x, y: nextY })) p.y = nextY;
    const distance = Math.hypot(p.x - boss.x, p.y - boss.y),
      ranged = ["ranger", "mage", "pirate"].includes(p.family),
      range = ranged ? 380 : 130;
    const skill = SKILLS[p.family];
    if (p.castAt > 0 && b.time >= p.castAt) {
      p.castAt = 0;
      p.recoveryUntil = b.time + skill.recovery;
      p.skillReleasedAt = b.time;
      p.skillConnected = distance < skill.range;
      if (p.skillConnected) {
        boss.hp = Math.max(
          0,
          boss.hp -
            (b.time >= boss.weakFrom && b.time < boss.weakUntil ? 65 : 34),
        );
        p.lastHit = b.time;
      }
    }
    if (
      v.skill &&
      !v.dodge &&
      b.time >= p.skillAt &&
      p.castAt === 0 &&
      b.time >= p.recoveryUntil
    ) {
      p.skillAt = b.time + skill.cooldown;
      p.castAt = b.time + skill.startup;
    }
    if (
      v.attack &&
      b.time >= p.attackAt &&
      p.castAt === 0 &&
      b.time >= p.recoveryUntil
    ) {
      p.attackAt = b.time + (p.family === "thief" ? 240 : 350);
      if (distance < range) {
        boss.hp = Math.max(
          0,
          boss.hp -
            (b.time >= boss.weakFrom && b.time < boss.weakUntil ? 15 : 8),
        );
        p.lastHit = b.time;
      }
    }
    if (v.revive && b.mode === "coop")
      for (const ally of b.players) {
        if (ally.hp <= 0 && Math.hypot(ally.x - p.x, ally.y - p.y) < 85) {
          ally.reviveProgress += dt;
          if (ally.reviveProgress >= 2000) {
            ally.hp = 45;
            ally.reviveProgress = 0;
            ally.invulnerable = b.time + 1500;
          }
        }
      }
  }
  if (boss.hp <= 0) {
    b.status = "won";
    return b;
  }
  if (b.time >= boss.nextAttack) {
    boss.casts++;
    const alive = b.players.filter((p) => p.hp > 0),
      target = alive[b.serial % Math.max(1, alive.length)] ?? {
        x: 512,
        y: 430,
      };
    const warning = b.mode === "story" ? 1000 : boss.phase === 3 ? 650 : 850;
    const kind =
      boss.pattern === "cross"
        ? "cross"
        : boss.pattern === "ring"
          ? "ring"
          : b.serial % 3 === 2
            ? "cross"
            : "circle";
    b.hazards.push({
      id: ++b.serial,
      kind,
      x: kind === "circle" ? target.x : boss.x,
      y: kind === "circle" ? target.y : boss.y,
      radius: kind === "ring" ? 195 : 110,
      at: b.time + warning,
      until: b.time + warning + 220,
      hit: [],
    });
    if (boss.phase >= 2 && boss.casts % 2 === 0)
      b.hazards.push({
        id: ++b.serial,
        kind: "circle",
        x: target.x,
        y: target.y,
        radius: 95,
        at: b.time + warning,
        until: b.time + warning + 220,
        hit: [],
      });
    if (boss.pattern === "storm" || boss.phase === 3)
      b.hazards.push({
        id: ++b.serial,
        kind: "circle",
        x: 1024 - target.x,
        y: 640 - target.y,
        radius: 90,
        at: b.time + warning + 300,
        until: b.time + warning + 520,
        hit: [],
      });
    if (b.mode === "coop" && boss.casts % 3 === 0)
      b.hazards.push({
        id: ++b.serial,
        kind: "seals",
        x: 512,
        y: 350,
        radius: 0,
        at: b.time + 2600,
        until: b.time + 2800,
        hit: [],
      });
    boss.weakFrom = b.time + warning + 220;
    boss.weakUntil = b.time + warning + 1250;
    boss.nextAttack =
      b.time + (b.mode === "story" ? 3100 : boss.phase === 3 ? 1850 : 2500);
  }
  for (const h of b.hazards) {
    if (b.time < h.at || b.time > h.until) continue;
    const seals = [
      { x: 280, y: 420 },
      { x: 512, y: 485 },
      { x: 744, y: 420 },
    ];
    const sealed =
      h.kind === "seals" &&
      seals.every((s) =>
        b.players.some(
          (p) => p.hp > 0 && Math.hypot(s.x - p.x, s.y - p.y) < 65,
        ),
      );
    for (const p of b.players) {
      if (p.hp <= 0 || h.hit.includes(p.id) || p.invulnerable > b.time)
        continue;
      const hit = h.kind === "seals" ? !sealed : hazardContains(h, p);
      if (!hit) continue;
      h.hit.push(p.id);
      p.hp = Math.max(
        0,
        p.hp - (b.mode === "story" ? 23 : h.kind === "seals" ? 55 : 35),
      );
      p.invulnerable = b.time + 500;
      if (p.hp === 0) {
        p.deaths++;
        p.castAt = 0;
      }
    }
  }
  b.hazards = b.hazards.filter((h) => h.until > b.time);
  if (b.players.every((p) => p.hp <= 0) || b.time > 12 * 60 * 1000)
    b.status = "lost";
  return b;
}
export function resetBattle(b: Battle) {
  return createBattle(b.id, b.chapterId, b.mode, b.players, b.boss.pattern);
}
