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
  const [message, setMessage] = useState('');
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (map) return;

    markerRef.current?.remove();
    markerRef.current = null;
    setEnabled(false);
    setLoading(false);
  }, [map]);

  const hideLocation = () => {
    markerRef.current?.remove();
    markerRef.current = null;
    setEnabled(false);
    setLoading(false);
    setMessage('');
  };

  const getLocationErrorMessage = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission was denied. Please allow location access in your browser settings and try again.';
    }

    if (error.code === error.TIMEOUT) {
      return 'Location request timed out. Please try again.';
    }

    return 'Your location could not be determined. Please check that location services are enabled and try again.';
  };

  const handleClick = async () => {
    if (enabled) {
      hideLocation();
      return;
    }

    if (!map) {
      setMessage('The map is still loading. Please try again in a moment.');
      return;
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setMessage('Geolocation is not supported by this browser.');
      return;
    }

    setMessage('');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const maplibreModule = await import('maplibre-gl');
          const maplibre = maplibreModule.default ?? maplibreModule;
          markerRef.current?.remove();
          markerRef.current = new maplibre.Marker({ color: '#E12D39' })
            .setLngLat([longitude, latitude])
            .addTo(map);
          map.flyTo({ center: [longitude, latitude], zoom: 16 });
          setEnabled(true);
          setMessage('');
        } catch (err) {
          console.error('Error adding location marker:', err);
          setEnabled(false);
          setMessage('Your location was found, but the map could not display it. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setEnabled(false);
        setLoading(false);
        setMessage(getLocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  return (
    <div className="max-w-[10.5rem] space-y-1">
      <button
        onClick={handleClick}
        disabled={loading || !map}
        aria-pressed={enabled}
        className="min-h-9 rounded bg-[var(--trail-green)] px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors hover:bg-[var(--trail-green-hover)] focus:outline-none disabled:opacity-50"
        aria-label={enabled ? 'Hide my location' : 'Show my location'}
      >
        {loading ? 'Locating...' : enabled ? 'Hide My Location' : map ? 'Show My Location' : 'Map Loading...'}
      </button>
      {message ? (
        <p className="rounded bg-[var(--sand-yellow)] px-2 py-1 text-[10px] leading-snug text-[var(--brown-olive)] shadow">
          {message}
        </p>
      ) : null}
    </div>
  );
}
