"use client";

import dynamic from 'next/dynamic';

// Dynamically import MapView on the client only
const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function MapClient() {
  return <MapView />;
}
