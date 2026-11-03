import type { CampaignProgress } from "./progress.ts";
import type { QuestDef } from "../stages.ts";
let session: CampaignProgress | null = null;
export function rpgCampSession() {
  return session;
}
export function setRpgCampSession(value: CampaignProgress | null) {
  session = value;
}
export const RPG_PREFIX = "sertz:memory-oath-v1:rpg:";
/** Keep the original boss spawn/portal chain without restoring its old narrative. */
export function trainingQuests(
  stage: string,
  boss?: { name: string },
): QuestDef[] {
  return boss
    ? [
        {
          id: `training-${stage}`,
          type: "boss",
          title: "원정 수련 · 수호자 격파",
          desc: "공격 예고를 피하고 장비와 스킬을 시험하자.",
          targetLabel: boss.name,
        },
        {
          id: `training-${stage}-return`,
          type: "reach",
          title: "다음 원정지로",
          desc: "열린 차원문으로 이동하거나 귀환하자.",
          targetLabel: "차원문",
        },
      ]
    : [];
}
/** Original systems retain their schemas while all writes stay outside legacy saves. */
export function scopedRpgStorage(base: Storage): Storage {
  const keys = () =>
    Array.from({ length: base.length }, (_, i) => base.key(i)).filter(
      (key): key is string => !!key?.startsWith(RPG_PREFIX),
    );
  return {
    get length() {
      return keys().length;
    },
    key(index) {
      return keys()[index]?.slice(RPG_PREFIX.length) ?? null;
    },
    getItem(key) {
      return base.getItem(RPG_PREFIX + key);
    },
    setItem(key, value) {
      base.setItem(RPG_PREFIX + key, value);
    },
    removeItem(key) {
      base.removeItem(RPG_PREFIX + key);
    },
    clear() {
      for (const key of keys()) base.removeItem(key);
    },
  };
}
export function isCampStage(stage: string) {
  return (
    /^(village|interior_(home|inn)|dojang|gate|closet|tower|park|praid|r\d+)$/.test(
      stage,
    ) ||
    /^(forest|kingdom|alfheim|muspelheim|niflheim|cave|nidavellir|hel|abyss)(v|\d+)$/.test(
      stage,
    )
  );
}
