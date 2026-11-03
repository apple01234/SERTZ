"use client";
import dynamic from "next/dynamic";
const RpgCampRoot = dynamic(() => import("@/components/campaign/RpgCampRoot"), {
  ssr: false,
});
export default function CampPage() {
  return <RpgCampRoot />;
}
