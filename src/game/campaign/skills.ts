import type { Family } from "./catalog.ts";
/** Startup → one release → recovery, with dodge cancellation during startup. */
export const SKILLS: Record<
  Family,
  {
    name: string;
    startup: number;
    recovery: number;
    range: number;
    cooldown: number;
  }
> = {
  warrior: {
    name: "서약의 참격",
    startup: 180,
    recovery: 180,
    range: 190,
    cooldown: 4500,
  },
  ranger: {
    name: "별꿰기",
    startup: 220,
    recovery: 160,
    range: 440,
    cooldown: 4500,
  },
  mage: {
    name: "원소 공명",
    startup: 340,
    recovery: 220,
    range: 440,
    cooldown: 4500,
  },
  thief: {
    name: "그림자 절개",
    startup: 120,
    recovery: 140,
    range: 190,
    cooldown: 4500,
  },
  pirate: {
    name: "해류 포격",
    startup: 240,
    recovery: 180,
    range: 440,
    cooldown: 4500,
  },
};
