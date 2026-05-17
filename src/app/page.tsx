import dynamic from 'next/dynamic';

// Dynamically import MapView with no SSR because it relies on window and navigator
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  return <MapView />;
}
