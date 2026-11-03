"use client";
import dynamic from "next/dynamic";

const CampaignRoot = dynamic(
  () => import("@/components/campaign/CampaignRoot"),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#171d2d] text-[#dfc38b]"
      >
        <strong className="text-2xl tracking-widest">기억의 서약</strong>
        <span className="text-xs text-[#b5b5c8]">함께한 기억을 펼치는 중…</span>
      </div>
    ),
  },
);
export default function Home() {
  return <CampaignRoot />;
}
