"use client";
import dynamic from "next/dynamic";
const MapFullscreen = dynamic(
  () => import("@/components/dashboard/MapFullscreen"),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <MapFullscreen />
    </div>
  );
}
