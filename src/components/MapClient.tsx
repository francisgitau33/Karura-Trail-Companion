"use client";

import dynamic from "next/dynamic";
import type { PublicPlaceSuggestion } from "../lib/placeSuggestions";
import type { SiteSettings } from "../lib/siteSettings";
import Footer from "./Footer";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

export default function MapClientComponent({
  siteSettings,
  approvedPlaceSuggestions,
}: {
  siteSettings: SiteSettings;
  approvedPlaceSuggestions: PublicPlaceSuggestion[];
}) {
  return (
    <>
      <MapView
        siteSettings={siteSettings}
        approvedPlaceSuggestions={approvedPlaceSuggestions}
      />
      <Footer contactEmail={siteSettings.contactEmail} />
    </>
  );
}
