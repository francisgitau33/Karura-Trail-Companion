"use client";

import { mapConfig } from '../data/mapConfig';

/**
 * Displays a prototype banner at the top of the map when sample data is active.
 */
export default function PrototypeBanner() {
  if (!mapConfig.showPrototypeBanner) return null;
  return (
    <div className="absolute top-0 inset-x-0 bg-yellow-200 text-yellow-800 text-center py-2 text-sm z-20">
      Prototype map: trail and point locations require verification before public launch.
    </div>
  );
}
