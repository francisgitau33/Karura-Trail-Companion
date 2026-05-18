"use client";

import dynamic from "next/dynamic";

// Dynamically import MapView with no SSR because it relies on browser APIs like `window` and `navigator`.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

export default function MapClientComponent() {
  return <MapView />;
}
