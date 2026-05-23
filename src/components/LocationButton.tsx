"use client";

import React, { useState } from 'react';
import type { Map } from 'maplibre-gl';

interface LocationButtonProps {
  map: Map | null;
}

/**
 * Button that centers the map on the user's current location using the Geolocation API.
 */
export default function LocationButton({ map }: LocationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 16 });
          try {
            const maplibreModule = await import('maplibre-gl');
            const maplibre = maplibreModule.default ?? maplibreModule;
            new maplibre.Marker({ color: '#E12D39' })
              .setLngLat([longitude, latitude])
              .addTo(map);
          } catch (err) {
            console.error('Error adding location marker:', err);
          }
        }
        setLoading(false);
      },
      () => {
        alert('Unable to retrieve your location.');
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="min-h-10 bg-[var(--trail-green)] text-white px-3 py-2 rounded shadow text-xs hover:bg-[var(--trail-green-hover)] focus:outline-none disabled:opacity-50"
      aria-label="Show my location"
    >
      {loading ? 'Locating...' : 'Show My Location'}
    </button>
  );
}
