import MapClientComponent from "../components/MapClient";
import { getSiteSettings } from "../lib/siteSettings";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const siteSettings = await getSiteSettings();

  return <MapClientComponent siteSettings={siteSettings} />;
}
