"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Map, Popup, MapEventType } from 'maplibre-gl';
import { mapConfig } from '../data/mapConfig';
import Header from './Header';
import PrototypeBanner from './PrototypeBanner';
import FilterControls from './FilterControls';
import LocationButton from './LocationButton';
import AboutModal from './AboutModal';
import DonateModal from './DonateModal';
import SafetyModal from './SafetyModal';
import TrailInfoPanel, { TrailProperties } from './TrailInfoPanel';

// Define available categories for filters.
const CATEGORY_LIST = [
  'All',
  'Walking',
  'Running',
  'Cycling',
  'Family',
  'Landmarks',
  'Facilities',
  'Safety',
  'Gates',
];

/**
 * Primary map view component. Handles map setup, data loading, user interactions,
 * modals and filters. This component runs only on the client.
 */
export default function MapView() {
  // Modal state
  const [aboutOpen, setAboutOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  // Selected trail details
  const [selectedTrail, setSelectedTrail] = useState<TrailProperties | null>(null);
  // Selected filter category
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Map container and map instance refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  // Keep track of loaded data to avoid re-fetching
  const dataLoadedRef = useRef(false);
  // Hold a reference to the dynamically imported MapLibre module so it can be
  // reused by event handlers. MapLibre is imported lazily to ensure no
  // server-side code tries to access browser APIs during SSR. The value
  // assigned to this ref will be the module itself (or its `.default` export
  // depending on how the library is bundled).
  const maplibreRef = useRef<any>(null);

  useEffect(() => {
    // Initialize the map only once
    if (mapRef.current || !mapContainerRef.current) return;
    // Import MapLibre asynchronously. Wrapping the import and map setup in an
    // async IIFE ensures we do not return a promise from useEffect while
    // still keeping the import out of the server-rendered path.
    (async () => {
      const module = await import('maplibre-gl');
      const maplibre: any = (module as any).default ?? module;
      maplibreRef.current = maplibre;
      const mapInstance = new maplibre.Map({
        container: mapContainerRef.current!,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [mapConfig.center.lng, mapConfig.center.lat],
        zoom: mapConfig.defaultZoom,
        attributionControl: true,
      });
      mapRef.current = mapInstance;

      // Load data once the map has loaded
      mapInstance.on('load', async () => {
        if (dataLoadedRef.current) return;
        dataLoadedRef.current = true;
        try {
          const [trailsData, poiData, junctionData] = await Promise.all([
            fetch('/data/trails.geojson').then((res) => res.json()),
            fetch('/data/points-of-interest.geojson').then((res) => res.json()),
            fetch('/data/junctions.geojson').then((res) => res.json()),
          ]);
          // Add trails source and layer
          mapInstance.addSource('trails', {
            type: 'geojson',
            data: trailsData,
          });
          mapInstance.addLayer({
            id: 'trails-line',
            type: 'line',
            source: 'trails',
            paint: {
              'line-color': ['get', 'colour'],
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });
          // Points of interest
          mapInstance.addSource('pois', {
            type: 'geojson',
            data: poiData,
          });
          mapInstance.addLayer({
            id: 'pois-circle',
            type: 'circle',
            source: 'pois',
            paint: {
              'circle-radius': 6,
              'circle-color': '#007cbf',
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff',
            },
          });
          // Junctions
          mapInstance.addSource('junctions', {
            type: 'geojson',
            data: junctionData,
          });
          mapInstance.addLayer({
            id: 'junctions-circle',
            type: 'circle',
            source: 'junctions',
            paint: {
              'circle-radius': 4,
              'circle-color': '#FF69B4',
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff',
            },
          });
        } catch (err) {
          console.error('Error loading GeoJSON:', err);
        }
      });

      // Click handler for trails
      mapInstance.on('click', 'trails-line', (e: any) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['trails-line'],
        });
        if (!features.length) return;
        const props = features[0].properties as any;
        // Convert properties to typed TrailProperties
        const trail: TrailProperties = {
          id: props.id,
          name: props.name,
          distance_km: props.distance_km ? Number(props.distance_km) : undefined,
          estimated_time: props.estimated_time,
          difficulty: props.difficulty,
          type: props.type,
          surface: props.surface,
          starts_from: props.starts_from,
          description: props.description,
          status: props.status,
        };
        setSelectedTrail(trail);
      });
      // Click anywhere else hides trail info
      mapInstance.on('click', (e: any) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['trails-line'],
        });
        if (!features.length) {
          setSelectedTrail(null);
        }
      });
      // Click handler for POIs
      mapInstance.on('click', 'pois-circle', (e: any) => {
        const feature = e.features && e.features[0];
        if (!feature) return;
        const coords = feature.geometry.coordinates.slice();
        const props = feature.properties as any;
        const html = `<strong>${props.name}</strong><br />Category: ${props.category}<br />${props.description}<br /><em>${props.visitor_note}</em><br /><small>${props.status}</small>`;
        const ml = maplibreRef.current;
        if (!ml) return;
        // Create popup
        new ml.Popup()
          .setLngLat(coords)
          .setHTML(html)
          .addTo(mapInstance);
      });
      // Change cursor style on hover
      ['trails-line', 'pois-circle'].forEach((layerId) => {
        mapInstance.on('mouseenter', layerId, () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });
        mapInstance.on('mouseleave', layerId, () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      });
    })();

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Apply category filters when selectedCategory changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoadedRef.current) return;
    // Reset filters
    try {
      map.setFilter('trails-line', null);
      map.setFilter('pois-circle', null);
    } catch (err) {
      // Map not ready
      return;
    }
    if (selectedCategory === 'All') {
      return;
    }
    // Mapping of UI categories to POI category field values
    const categoryMap: Record<string, string> = {
      Landmarks: 'Landmark',
      Facilities: 'Facilities',
      Gates: 'Gate',
      Safety: 'Safety',
    };
    const mapped = categoryMap[selectedCategory];
    if (mapped) {
      map.setFilter('pois-circle', ['==', ['get', 'category'], mapped]);
    } else {
      // For Walking, Running, Cycling, Family: we could filter trail types if implemented.
      // Future implementation can filter trails by type or difficulty.
    }
  }, [selectedCategory]);

  return (
    <div className="relative flex-1 flex flex-col h-full">
      <Header
        onAbout={() => setAboutOpen(true)}
        onDonate={() => setDonateOpen(true)}
        onSafety={() => setSafetyOpen(true)}
      />
      <main className="relative flex-1">
        <div ref={mapContainerRef} className="w-full h-full" />
        {/* Prototype banner */}
        <PrototypeBanner />
        {/* Filter controls and location button */}
        <div className="absolute top-16 left-2 z-10 space-y-2">
          <FilterControls
            categories={CATEGORY_LIST}
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat)}
          />
          <LocationButton map={mapRef.current} />
        </div>
        {/* Trail information panel */}
        <TrailInfoPanel trail={selectedTrail} onClose={() => setSelectedTrail(null)} />
      </main>
      {/* Modals */}
      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onSupport={() => setDonateOpen(true)}
      />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
      <SafetyModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </div>
  );
}