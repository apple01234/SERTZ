import manifest from "../../../public/assets/campaign/drive/manifest.json";
import portraitCrops from "../../../public/assets/npcportrait/_map.json";
import { type ChapterDefinition, type Family } from "./catalog";

/** Original 32px artwork from the user's archive; no recolored replacement sprites. */
export const CAMPAIGN_ASSETS: {
  key: string;
  url: string;
  frameWidth?: number;
  frameHeight?: number;
}[] = Object.entries(manifest.files)
  .map(([name, art]) => ({
    key: `oath-${name}`,
    url: `/assets/campaign/drive/${art.file}`,
  }))
  .concat(
    Object.entries(manifest.projectFiles).map(([name, art]) => ({
      key: `oath-${name}`,
      ...art,
    })),
  );
export function portraitSource(art: string) {
  if (art.startsWith("jobm_")) return `/assets/${art}_idle0.webp`;
  const url = CAMPAIGN_ASSETS.find((a) => a.key === `oath-${art}`)?.url;
  const key = url
    ?.split("/")
    .pop()
    ?.replace(/\.png$/, "");
  // Same exact-source portrait crops as the existing DialogueBox, without legacy speaker names.
  return (
    (portraitCrops as Record<string, { src: string }>)[key ?? ""]?.src ?? url
  );
}
export const FAMILY_ART: Record<Family, string> = {
  warrior: "jobm_guardian",
  ranger: "jobm_sniper",
  mage: "jobm_archmage",
  thief: "jobm_nightblade",
  pirate: "jobm_stormcaptain",
};
export const BODY_FRAMES = [
  "idle",
  "walk",
  "walkside",
  "walkup",
  "atk",
  "atkdown",
  "atkup",
].flatMap((action) => Array.from({ length: 4 }, (_, i) => `${action}${i}`));
export function guideArt(name: string) {
  if (["엘리아", "네메아", "리세아"].includes(name)) return "guardian";
  if (["카르엔", "벨노아"].includes(name)) return "shadow-knight";
  if (["바르델", "이셀", "루엔"].includes(name)) return "captain";
  return ["세리안", "오르시안"].includes(name) ? "sage" : "healer";
}
export const BOSS_PREFIXES = [
  "boss",
  "boss2",
  "boss3",
  "boss_nidhog",
  "boss_surt",
  "boss_fenrir",
  "boss_nagr",
];
const THEME_BOSS: Record<string, string> = {
  garden: "boss",
  forest: "boss",
  castle: "boss2",
  harbor: "boss2",
  ruin: "boss3",
  astral: "boss_nidhog",
  machine: "boss",
  snow: "boss_nagr",
  desert: "boss_fenrir",
  volcano: "boss_surt",
};
export function bossArt(chapter: ChapterDefinition) {
  return THEME_BOSS[chapter.theme] ?? "boss_nidhog";
}
export const BOSS_SHEETS = manifest.bossSheets;
export const ANIMATION_ASSETS = manifest.animationFiles;
export const WORLD_PALETTES = {
  garden: [0x5c8457, 0x739560, 0xe3ca87],
  forest: [0x476b53, 0x59795a, 0xb4c487],
  castle: [0x343b53, 0x424960, 0xcdb27a],
  harbor: [0x39566b, 0x496a77, 0xd4ba89],
  ruin: [0x46445a, 0x555167, 0xbca680],
  astral: [0x333553, 0x414269, 0xcebd88],
  machine: [0x3b4b58, 0x4a5b64, 0xc5ac7b],
  snow: [0x899fa8, 0x9cafb5, 0xd8cba9],
  desert: [0xa98c60, 0xb59a6e, 0xe4c998],
  volcano: [0x59424b, 0x6a4b4b, 0xd9a279],
} as const;
