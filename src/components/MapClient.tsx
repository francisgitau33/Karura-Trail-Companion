"use client";

import dynamic from "next/dynamic";
import type { SiteSettings } from "../lib/siteSettings";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

export default function MapClientComponent({ siteSettings }: { siteSettings: SiteSettings }) {
  return <MapView siteSettings={siteSettings} />;
}
