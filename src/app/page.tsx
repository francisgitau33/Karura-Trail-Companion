import MapClientComponent from "../components/MapClient";
import { getApprovedPlaceSuggestions } from "../lib/placeSuggestions";
import { getSiteSettings } from "../lib/siteSettings";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [siteSettings, approvedPlaceSuggestions] = await Promise.all([
    getSiteSettings(),
    getApprovedPlaceSuggestions(),
  ]);

  return (
    <MapClientComponent
      siteSettings={siteSettings}
      approvedPlaceSuggestions={approvedPlaceSuggestions}
    />
  );
}
