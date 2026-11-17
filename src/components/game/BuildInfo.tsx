"use client";

import { familyOf } from "@/game/classes";
import {
  ITEMS, FAMILY_ELEM, ELEMENT_META, ELEM_REACTION_META,
  elemAdvantage, elementReaction, activeSetBonus, type ElemKey, type ItemKey,
} from "@/game/data";
import type { RpgState } from "./EventBus";

export function ElementGuide({ cls }: { cls: string | null }) {
  const family = familyOf(cls);
  const attack = family ? FAMILY_ELEM[family] ?? "none" : "none";
  return (
    <section aria-label="내 공격 원소" className="mb-2 rounded-lg border border-white/15 bg-black/20 p-2.5 text-[11px]">
      <p className="font-black" style={{ color: ELEMENT_META[attack].color }}>내 공격 원소 · {ELEMENT_META[attack].name}</p>
      {attack === "none" ? (
        <p className="mt-1 text-white/65">전직하면 계열에 맞는 공격 원소가 정해집니다. 현재는 원소 상성 보정과 반응이 없습니다.</p>
      ) : (
        <details className="mt-1">
          <summary className="cursor-pointer font-bold text-amber-200">원소 상성과 반응 보기</summary>
          <table className="mt-2 w-full text-left">
            <caption className="sr-only">현재 직업의 공격 원소와 상대 원소별 기본 피해 배율 및 가능한 반응</caption>
            <thead className="text-white/55"><tr><th scope="col">상대 원소</th><th scope="col">기본 상성</th><th scope="col">반응 가능</th></tr></thead>
            <tbody>
              {(Object.keys(ELEMENT_META) as ElemKey[]).filter((element) => element !== "none").map((element) => {
                const multiplier = elemAdvantage(attack, element);
                const reaction = elementReaction(attack, element);
                return (
                  <tr key={element} className="border-t border-white/10">
                    <th scope="row" className="py-1 font-bold" style={{ color: ELEMENT_META[element].color }}>{ELEMENT_META[element].name}</th>
                    <td className={multiplier > 1 ? "text-emerald-200" : multiplier < 1 ? "text-rose-200" : "text-white/65"}>×{multiplier}</td>
                    <td className="text-white/80">{reaction ? ELEM_REACTION_META[reaction].name : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1.5 leading-relaxed text-white/55">기본 상성은 반응·방어력·직업 보정 전의 배율입니다. 반응은 재사용 대기 중에는 발동하지 않으며, 보스는 반응의 기절·둔화·주변 피해에 면역입니다.</p>
        </details>
      )}
    </section>
  );
}

export function SetChangePreview({ rpg, candidate }: {
  rpg: Pick<RpgState, "weapon" | "armor" | "accessories">;
  candidate: string;
}) {
  const item = ITEMS[candidate as ItemKey];
  if (!item || (item.kind !== "weapon" && item.kind !== "armor")) return null;
  const before = activeSetBonus(rpg.weapon, rpg.armor, rpg.accessories);
  const after = activeSetBonus(item.kind === "weapon" ? candidate : rpg.weapon, item.kind === "armor" ? candidate : rpg.armor, rpg.accessories);
  if (before?.ch === after?.ch) return null;
  return (
    <div role="note" aria-label="장착 시 세트 변화" className="mt-1.5 space-y-1 rounded border border-amber-200/25 bg-black/25 p-2 text-[10px] leading-relaxed">
      {[{ set: before, gain: false }, { set: after, gain: true }].map(({ set, gain }) => set && (
        <p key={set.ch} className={gain ? "text-emerald-200" : "text-rose-200"}>
          <strong>장착 시 {set.title} {gain ? "활성" : "해제"}</strong>
          <span className="block">{[
            ["공격", set.bonus.atkPct, "%"], ["방어", set.bonus.defAdd, ""],
            ["최대 HP", set.bonus.maxHp, ""], ["치명", set.bonus.critAdd, "%p"],
          ].filter(([, value]) => Number(value) > 0).map(([label, value, unit]) => `${label} ${gain ? "+" : "−"}${value}${unit}`).join(" · ")}</span>
        </p>
      ))}
    </div>
  );
}
