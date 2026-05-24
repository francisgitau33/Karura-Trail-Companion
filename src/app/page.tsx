import MapClientComponent from "../components/MapClient";
import { getApprovedPlaceSuggestions } from "../lib/placeSuggestions";
import { getSiteSettings } from "../lib/siteSettings";
import { getApprovedTrailSuggestions } from "../lib/trailSuggestions";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const siteSettings = await getSiteSettings();
  const [approvedPlaceSuggestions, approvedTrailSuggestions] = await Promise.all([
    getApprovedPlaceSuggestions(),
    siteSettings.showApprovedTrails ? getApprovedTrailSuggestions() : Promise.resolve([]),
  ]);

  return (
    <MapClientComponent
      siteSettings={siteSettings}
      approvedPlaceSuggestions={approvedPlaceSuggestions}
      approvedTrailSuggestions={approvedTrailSuggestions}
    />
  );
}
