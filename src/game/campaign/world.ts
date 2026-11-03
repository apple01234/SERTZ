import { sceneryFor, type Scenery } from "./scenery.ts";
import type { Theme } from "./catalog.ts";
export const TILE_SIZE = 64;
export const MAP_COLS = 16;
export const MAP_ROWS = 10;
export type Point = { x: number; y: number };
export type CampaignMap = {
  ground: string[];
  structures: (string | null)[];
  collision: boolean[];
  objects: Scenery[];
};

/** Own layouts: visual materials and passage flags are independent layers. */
export function buildCampaignMap(
  theme: Theme,
  episode: number,
  arena = false,
): CampaignMap {
  const ground: string[] = [],
    structures: (string | null)[] = [],
    collision: boolean[] = [];
  const outside = ["garden", "forest", "snow", "desert"].includes(theme);
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const variation = (col * 17 + row * 11 + episode) % 3;
      let key = `floor-${theme}${variation ? `-${variation}` : ""}`;
      let blocked =
        col === 0 || col === MAP_COLS - 1 || row <= 1 || row === MAP_ROWS - 1;
      if (outside && (col === 7 || col === 8 || row === 5)) key = "path";
      if (theme === "harbor" && (col < 2 || col > 13)) {
        key = "water";
        blocked = true;
      }
      if (theme === "volcano" && (col < 2 || col > 13)) {
        key = "lava";
        blocked = true;
      }
      const partition =
        !arena &&
        ["castle", "machine", "ruin"].includes(theme) &&
        col === [6, 9, 3][(episode - 1) % 3] &&
        row >= 2 &&
        row <= 6 &&
        row !== 4;
      structures.push(partition ? `wall-${theme}` : null);
      ground.push(key);
      collision.push(blocked || partition);
    }
  }
  return { ground, structures, collision, objects: sceneryFor(theme) };
}
function cellAt(p: Point) {
  const col = Math.floor(p.x / TILE_SIZE),
    row = Math.floor(p.y / TILE_SIZE);
  return col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS
    ? -1
    : row * MAP_COLS + col;
}
export function canWalkAt(map: CampaignMap, p: Point, radius = 13) {
  const foot = { x: p.x, y: p.y + 16 };
  return (
    [-radius, radius].every((dx) =>
      [-radius, radius].every((dy) => {
        const cell = cellAt({ x: foot.x + dx, y: foot.y + dy });
        return cell >= 0 && !map.collision[cell];
      }),
    ) &&
    !map.objects.some(
      ({ solid: r }) =>
        r &&
        foot.x + radius > r.x &&
        foot.x - radius < r.x + r.width &&
        foot.y + radius > r.y &&
        foot.y - radius < r.y + r.height,
    )
  );
}
function clearSegment(map: CampaignMap, from: Point, to: Point) {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 4);
  return Array.from(
    { length: steps + 1 },
    (_, i) => i / Math.max(1, steps),
  ).every((t) =>
    canWalkAt(map, {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    }),
  );
}
/** Fine navigation grid follows object footprints as well as tile walls. */
export function walkingRoute(
  map: CampaignMap,
  from: Point,
  to: Point,
): Point[] {
  if (!canWalkAt(map, from) || !canWalkAt(map, to)) return [];
  const cell = 16,
    cols = 64,
    rows = 40;
  const index = (p: Point) =>
    Math.floor(p.y / cell) * cols + Math.floor(p.x / cell);
  const point = (n: number) => ({
    x: (n % cols) * cell + cell / 2,
    y: Math.floor(n / cols) * cell + cell / 2,
  });
  const start = index(from),
    end = index(to);
  if (start === end) return clearSegment(map, from, to) ? [to] : [];
  const queue = [start],
    previous = new Map<number, number>([[start, -1]]);
  for (let cursor = 0; cursor < queue.length && !previous.has(end); cursor++) {
    const n = queue[cursor],
      x = n % cols,
      y = Math.floor(n / cols);
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      const next = ny * cols + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= cols ||
        ny >= rows ||
        previous.has(next) ||
        !canWalkAt(map, point(next)) ||
        (n === start && !clearSegment(map, from, point(next))) ||
        (next === end && !clearSegment(map, point(next), to))
      )
        continue;
      previous.set(next, n);
      queue.push(next);
    }
  }
  if (!previous.has(end)) return [];
  const route: Point[] = [];
  for (let n = end; n !== start; n = previous.get(n)!) route.push(point(n));
  route.reverse();
  route.push(to);
  return route;
}
