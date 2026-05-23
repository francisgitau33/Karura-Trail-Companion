"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Map, Marker } from 'maplibre-gl';

interface LocationButtonProps {
  map: Map | null;
}

/**
 * Button that centers the map on the user's current location using the Geolocation API.
 */
export default function LocationButton({ map }: LocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  const hideLocation = () => {
    markerRef.current?.remove();
    markerRef.current = null;
    setEnabled(false);
    setLoading(false);
  };

  const handleClick = async () => {
    if (enabled) {
      hideLocation();
      return;
    }

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
            markerRef.current?.remove();
            markerRef.current = new maplibre.Marker({ color: '#E12D39' })
              .setLngLat([longitude, latitude])
              .addTo(map);
            setEnabled(true);
          } catch (err) {
            console.error('Error adding location marker:', err);
          }
        }
        setLoading(false);
      },
      () => {
        alert('Unable to retrieve your location. Check browser permissions and try again.');
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="max-w-[15rem] space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-pressed={enabled}
        className="min-h-10 rounded bg-[var(--trail-green)] px-3 py-2 text-xs text-white shadow transition-colors hover:bg-[var(--trail-green-hover)] focus:outline-none disabled:opacity-50"
        aria-label={enabled ? 'Hide my location' : 'Show my location'}
      >
        {loading ? 'Locating...' : enabled ? 'Hide My Location' : 'Show My Location'}
      </button>
      <p className="rounded bg-[var(--card-bg)]/90 px-2 py-1 text-[10px] leading-snug text-[var(--charcoal-green)] shadow">
        Location is used only in your browser and is not stored.
      </p>
    </div>
  );
}
