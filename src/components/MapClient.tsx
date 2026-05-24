"use client";

import dynamic from "next/dynamic";
import type { PublicPlaceSuggestion } from "../lib/placeSuggestions";
import type { SiteSettings } from "../lib/siteSettings";
import type { PublicTrailSuggestion } from "../lib/trailSuggestions";
import Footer from "./Footer";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

export default function MapClientComponent({
  siteSettings,
  approvedPlaceSuggestions,
  approvedTrailSuggestions,
}: {
  siteSettings: SiteSettings;
  approvedPlaceSuggestions: PublicPlaceSuggestion[];
  approvedTrailSuggestions: PublicTrailSuggestion[];
}) {
  return (
    <>
      <MapView
        siteSettings={siteSettings}
        approvedPlaceSuggestions={approvedPlaceSuggestions}
        approvedTrailSuggestions={approvedTrailSuggestions}
      />
      <Footer contactEmail={siteSettings.contactEmail} />
    </>
  );
}
