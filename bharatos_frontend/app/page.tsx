'use client';

import dynamic from 'next/dynamic';

const CityMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="text-sm font-semibold tracking-wide">Loading BharatOS 3D Digital Twin...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  return <CityMap />;
}