import art from "../../../public/assets/campaign/drive/manifest.json" with { type: "json" };
import {
  DECOR_BUDGET,
  DECOR_SETS,
  decorFootprint,
  isSolidDecor,
} from "../decorObjects.ts";
import type { Theme } from "./catalog.ts";
export type Rect = { x: number; y: number; width: number; height: number };
export type Scenery = {
  key: string;
  x: number;
  y: number;
  scale: number;
  solid?: Rect;
};
const catalogue = new Map(
  Object.values(DECOR_SETS)
    .flat()
    .map((entry) => [entry.key, entry]),
);
const reserved = [
  { x: 310, y: 330 },
  { x: 700, y: 250 },
  { x: 765, y: 470 },
  { x: 400, y: 510 },
  { x: 512, y: 300 },
  { x: 512, y: 485 },
  { x: 512, y: 240 },
];
/** Same placement data drives rendered objects, walking and authoritative combat. */
export function sceneryFor(theme: Theme): Scenery[] {
  const outdoor = ["garden", "forest", "snow", "desert"].includes(theme);
  const budget =
    DECOR_BUDGET[theme === "harbor" ? "town" : outdoor ? "forest" : "dungeon"];
  const placed = { big: 0, wall: 0, floor: 0, small: 0 };
  const objects: Scenery[] = [];
  const put = (key: string, x: number, y: number, scale = 2) => {
    const file = (
      art.projectFiles as Record<
        string,
        {
          width: number;
          height: number;
          frameWidth?: number;
          frameHeight?: number;
          url: string;
        }
      >
    )[key];
    const width = (file?.frameWidth ?? file?.width ?? 32) * scale;
    const height = (file?.frameHeight ?? file?.height ?? 32) * scale;
    const source = file?.url
      .split("/")
      .pop()
      ?.replace(/\.(png|webp)$/, "");
    const entry = source ? catalogue.get(source) : undefined;
    if (entry && placed[entry.tag] >= budget[entry.tag]) return;
    const footprint = decorFootprint(width, height, source),
      bw = footprint.width,
      bh = footprint.height;
    const bounds = {
      x: x - width / 2 + footprint.offsetX,
      y: y - height / 2 + footprint.offsetY,
      width: bw,
      height: bh,
    };
    const solid = isSolidDecor(source ?? key);
    if (
      solid &&
      reserved.some(
        (p) =>
          p.x > bounds.x - 30 &&
          p.x < bounds.x + bw + 30 &&
          p.y + 16 > bounds.y - 30 &&
          p.y + 16 < bounds.y + bh + 30,
      )
    )
      return;
    if (entry) placed[entry.tag]++;
    objects.push({
      key,
      x,
      y,
      scale,
      ...(solid ? { solid: bounds } : {}),
    });
  };
  if (outdoor) {
    for (let i = 0; i < 18; i++) {
      const x = 36 + i * 58;
      if (i % 2 === 0)
        put(i % 3 ? "garden-tree" : "garden-tree-gold", x, 90, 1.1);
      if ((i < 7 || i > 10) && i % 2) put("garden-tree-gold", x, 585, 1);
    }
    put("fountain", 512, 195, 2.7);
    put("town-house", 220, 170, 1.2);
    put("town-stall", 805, 180, 1.1);
    for (const [x, y] of [
      [130, 280],
      [870, 330],
      [200, 490],
      [900, 505],
    ])
      put("garden-tree", x, y, 1.3);
    for (const x of [365, 655]) put("garden-bush", x, 565, 1.4);
    for (const x of [115, 910]) {
      put("statue", x, 345, 2.5);
      put("tree-gold", x, 455, 2.8);
    }
  } else if (theme === "harbor") {
    put("town-house", 265, 110, 1.3);
    put("town-stall", 790, 125, 1.3);
    for (const x of [195, 825]) {
      put("town-barrel", x, 340, 1.4);
      put("town-barrel", x + 42, 520, 1);
      put("town-bench", x, 220, 1.1);
    }
  } else {
    if (theme === "castle") {
      for (const x of [172, 292, 732, 852]) {
        put("library-shelf", x, 175, 1.6);
        put("library-shelf", x, 535, 1.4);
      }
      for (const x of [190, 835]) {
        put("library-table", x, 365, 1);
        put("book", x - 25, 345, 0.7);
        put("library-candle", x + 22, 342, 0.6);
      }
    }
    for (const x of [100, 920]) {
      put("pillar", x, 200, 2.7);
      put(theme === "ruin" ? "column" : "statue", x, 440, 2.5);
    }
    put("door", 512, 90, 2.4);
    if (theme === "machine")
      for (const x of [180, 840])
        for (const y of [215, 485]) put("armory", x, y, 3);
    else if (theme !== "castle") put("altar", 512, 195, 2.5);
  }
  return objects;
}
