"use client";
import { useEffect, useState, type ComponentType } from "react";
import { readSlots } from "@/game/campaign/storage";
import {
  scopedRpgStorage,
  setRpgCampSession,
  isCampStage,
  trainingQuests,
} from "@/game/campaign/rpgSession";
import { EventBus } from "@/components/game/EventBus";

export default function RpgCampRoot() {
  const [Root, setRoot] = useState<ComponentType | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const slots = readSlots();
    const character = slots.characters.find(
      (p) => p.characterId === slots.activeId,
    );
    if (!character) {
      window.location.replace("/");
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    const scoped = scopedRpgStorage(window.localStorage);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => scoped,
    });
    setRpgCampSession(character);
    let disposed = false,
      started = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    const title = () => {
      if (started) {
        window.location.assign("/?resume=1");
        return;
      }
      started = true;
      timer = setTimeout(() => {
        void import("@/game/config").then(({ loadSave }) =>
          EventBus.emit("game:continue", loadSave()!),
        );
      }, 0);
    };
    EventBus.on("ui:title", title);
    void Promise.all([
      import("@/components/game/GameRoot"),
      import("@/game/config"),
      import("@/game/slots"),
      import("@/game/data"),
    ])
      .then(([view, config, originalSlots, data]) => {
        if (disposed) return;
        const store = originalSlots.loadSlots();
        for (const p of slots.characters) {
          const id = p.characterId;
          if (!scoped.getItem(`sertz_char_${id}`))
            scoped.setItem(
              `sertz_char_${id}`,
              JSON.stringify({
                stage: "village",
                lv: 3,
                exp: 0,
                maxHp: 100,
                atk: 12,
                cleared: false,
                playerName: p.name,
                cls: p.family,
                startCls: p.family,
                tutorialDone: true,
                visited: ["village"],
              }),
            );
          store.chars[id] ??= {
            id,
            name: p.name,
            cls: p.family,
            lv: 3,
            stage: "village",
            cleared: false,
            lastSeen: Date.now(),
            createdAt: Date.now(),
            rebirths: 0,
          };
        }
        originalSlots.writeSlots(store);
        originalSlots.setActiveChar(character.characterId);
        const save = config.loadSave()!;
        if (!isCampStage(save.stage)) save.stage = "village";
        save.playerName = character.name;
        save.tutorialDone = true;
        config.writeSave(save);
        // The old biomes are material/experience fields; the removed story stays removed.
        const regions: Record<string, string> = {
          forest: "녹음의 숲",
          kingdom: "왕국 외곽",
          alfheim: "정령 수림",
          muspelheim: "잿불 협곡",
          niflheim: "눈꽃 고원",
          cave: "수정 광산",
          nidavellir: "기계 유적",
          hel: "황혼 황야",
          abyss: "별빛 심연",
        };
        for (const [key, stage] of Object.entries(data.STAGES)) {
          const region = Object.keys(regions).find((name) =>
            key.startsWith(name),
          );
          if (region) {
            stage.quests = trainingQuests(
              key,
              stage.boss
                ? data.BOSS_DEFS[stage.bossKey ?? "guardian"]
                : undefined,
            );
            const next = data.NEXT_STAGE[stage.key];
            if (!next || !isCampStage(next))
              data.NEXT_STAGE[stage.key] = "village";
            stage.name = `${regions[region]} · ${key.match(/\d+$/)?.[0] ?? "거점"}`;
            stage.subtitle = "연합 원정 · 재료 수집과 전투 수련";
            data.STAGE_SHORT[key as keyof typeof data.STAGE_SHORT] = stage.name;
          }
        }
        data.STAGES.village.name = "연합 거점";
        data.STAGES.village.subtitle = "장비 · 전직 · 제작 · 하우징";
        data.STAGES.village.quests = [];
        data.STAGE_SHORT.village = "연합 거점";
        data.DIALOGUES.villager1 = {
          speaker: "연합 보급관",
          lines: [
            "여기는 동료들이 쉬어 가는 연합 거점이야.",
            "상점에서 장비와 재료를 준비하고, 원정지에서 전투를 익혀 봐. 본편은 위쪽 이야기 메뉴에서 이어갈 수 있어.",
          ],
        };
        data.DIALOGUES.villager2 = {
          speaker: "거점 안내자",
          lines: [
            "분수에서 회복하고 여관에서 쉬어 갈 수 있어.",
            "하우징 메뉴에서 집과 광장에 가구를 배치해 봐. 장비와 가구는 이 캐릭터의 거점 기록에 저장돼.",
          ],
        };
        for (const [region, name] of Object.entries(regions)) {
          const residents = data.CHAPTER_VILLAGE_NPC[region];
          if (!residents) continue;
          for (const npc of [residents.npcA, residents.npcB])
            data.DIALOGUES[npc.dlg] = {
              speaker: npc.name,
              lines: [
                `${name} 원정 거점에 온 걸 환영해.`,
                "주변 사냥터에서 재료와 경험치를 모을 수 있어. 본편의 사건은 이야기 메뉴에서 이어가자.",
              ],
            };
        }
        for (const ch of data.CHAPTERS)
          if (regions[ch.key]) ch.title = regions[ch.key];
        setRoot(() => view.default);
      })
      .catch((e: unknown) => {
        if (!disposed)
          setError(e instanceof Error ? e.message : "거점 로딩 실패");
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      EventBus.off("ui:title", title);
      // Child engine cleanup runs synchronously before restoring the host storage.
      queueMicrotask(() => {
        if (window.localStorage === scoped)
          Object.defineProperty(window, "localStorage", descriptor);
        setRpgCampSession(null);
      });
    };
  }, []);
  return (
    <main className="fixed inset-0 bg-slate-950 text-white">
      {Root ? (
        <Root />
      ) : (
        <p role="status" className="p-8">
          {error || "원본 RPG 에셋과 연합 거점을 불러오는 중…"}
        </p>
      )}
      <nav
        aria-label="연합 거점 메뉴"
        className="fixed left-1/2 top-[74px] z-[90] flex max-w-[95vw] -translate-x-1/2 gap-1 overflow-x-auto rounded-lg border border-amber-300/50 bg-slate-950/95 p-1 text-xs sm:top-1"
      >
        <a
          href="/?resume=1"
          onClick={() => EventBus.emit("game:checkpoint")}
          className="shrink-0 rounded bg-amber-200 px-3 py-2 font-bold text-slate-950"
        >
          이야기
        </a>
        {(
          [
            ["가방·장비", "inv"],
            ["전직·스킬", "job"],
            ["능력치", "stat"],
            ["제작·상점", "shop"],
            ["하우징", "home"],
            ["탐험·던전", "content"],
            ["유니온", "union"],
          ] as const
        ).map(([label, panel]) => (
          <button
            className="shrink-0 rounded px-3 py-2 hover:bg-white/10"
            key={panel}
            onClick={() => EventBus.emit("ui:panel", { panel })}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
