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
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 16 });
          // Add marker at user location
          // Avoid duplicate markers by creating one-off marker; multiple clicks will add new markers
          // Optionally, we could track the marker in state and remove previous.
          // eslint-disable-next-line no-new
          new (require('maplibre-gl').Marker)({ color: '#E12D39' })
            .setLngLat([longitude, latitude])
            .addTo(map);
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
      className="bg-green-600 text-white py-1 px-2 rounded shadow text-xs disabled:opacity-50"
      aria-label="Show my location"
    >
      {loading ? 'Locating…' : 'Show My Location'}
    </button>
  );
}
