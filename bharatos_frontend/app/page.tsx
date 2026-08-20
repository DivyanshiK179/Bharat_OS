'use client';

import dynamic from 'next/dynamic';

const CityMap = dynamic(() => import('@/components/CampusMap'), { ssr: false });

export default function Home() {
  return <CityMap />;
}