"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Map } from 'maplibre-gl';
import { mapConfig } from "../data/mapConfig";
import Header from "./Header";
import PrototypeBanner from "./PrototypeBanner";
import FilterControls from "./FilterControls";
import LocationButton from "./LocationButton";
import AboutModal from "./AboutModal";
import DonateModal from "./DonateModal";
import SafetyModal from "./SafetyModal";
import TrailInfoPanel, { TrailProperties } from "./TrailInfoPanel";

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

const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

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
  const interactionsBoundRef = useRef(false);

  useEffect(() => {
    // Initialize the map only once
    if (mapRef.current || !mapContainerRef.current) return;

    let cancelled = false;

    const loadGeoJson = async (path: string) => {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.json();
    };

    const initializeMap = async () => {
      try {
        const maplibreModule = await import('maplibre-gl');
        const maplibre = maplibreModule.default ?? maplibreModule;
        if (cancelled || !mapContainerRef.current) return;

        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE_URL,
          center: [mapConfig.center.lng, mapConfig.center.lat],
          zoom: mapConfig.defaultZoom,
          attributionControl: true,
        });
        map.addControl(
          new maplibre.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }),
          "top-right",
        );
        mapRef.current = map;

        map.on('error', (event: any) => {
          console.error('MapLibre runtime error:', event.error);
        });

        map.on('load', async () => {
          map.resize();
          if (dataLoadedRef.current) return;
          dataLoadedRef.current = true;
          try {
            const [trailsData, poiData, junctionData] = await Promise.all([
              loadGeoJson('/data/trails.geojson'),
              loadGeoJson('/data/points-of-interest.geojson'),
              loadGeoJson('/data/junctions.geojson'),
            ]);
            map.addSource('trails', {
              type: 'geojson',
              data: trailsData,
            });
            map.addLayer({
              id: 'trails-line',
              type: 'line',
              source: 'trails',
              paint: {
                'line-color': [
                  'match',
                  ['get', 'type'],
                  'Walking',
                  '#2FB85A',
                  'Walking / Nature',
                  '#2FB85A',
                  'Running',
                  '#D6A21E',
                  'Walking / Running',
                  '#D6A21E',
                  'Cycling',
                  '#2F80B7',
                  'Family',
                  '#8E7CC3',
                  '#2FB85A',
                ],
                'line-width': 4,
                'line-opacity': 0.9,
              },
            });
            map.addSource('pois', {
              type: 'geojson',
              data: poiData,
            });
            map.addLayer({
              id: 'pois-circle',
              type: 'circle',
              source: 'pois',
              paint: {
                'circle-radius': 7,
                'circle-color': [
                  'match',
                  ['get', 'category'],
                  'Landmark',
                  '#0077A7',
                  'Facilities',
                  '#9A6B3F',
                  'Gate',
                  '#145A3A',
                  'Safety',
                  '#B94A3A',
                  '#0077A7',
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              },
            });
            map.addSource('junctions', {
              type: 'geojson',
              data: junctionData,
            });
            map.addLayer({
              id: 'junctions-circle',
              type: 'circle',
              source: 'junctions',
              paint: {
                'circle-radius': 6,
                'circle-color': '#145A3A',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              },
            });
            if (!interactionsBoundRef.current) {
              interactionsBoundRef.current = true;

              map.on('click', 'trails-line', (e: any) => {
                if (!map.getLayer('trails-line')) return;

                const features = map.queryRenderedFeatures(e.point, {
                  layers: ['trails-line'],
                });
                if (!features.length) return;
                const props = features[0].properties as any;
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

              map.on('click', 'pois-circle', (e: any) => {
                if (!map.getLayer('pois-circle')) return;

                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const html = `<strong>${props.name}</strong><br />Category: ${props.category}<br />${props.description}<br /><em>${props.visitor_note}</em><br /><small>${props.status}</small>`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);
              });

              ['trails-line', 'pois-circle'].forEach((layerId) => {
                map.on('mouseenter', layerId, () => {
                  map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', layerId, () => {
                  map.getCanvas().style.cursor = '';
                });
              });
            }
          } catch (err) {
            console.error('Error loading GeoJSON:', err);
          }
        });

        map.on('click', (e: any) => {
          if (!map.getLayer('trails-line')) {
            return;
          }

          const features = map.queryRenderedFeatures(e.point, {
            layers: ['trails-line'],
          });
          if (!features.length) {
            setSelectedTrail(null);
          }
        });
      } catch (err) {
        console.error('Error initializing MapLibre:', err);
      }
    };

    initializeMap();

    const resizeMap = () => {
      mapRef.current?.resize();
    };
    window.addEventListener('resize', resizeMap);
    const resizeTimeout = window.setTimeout(resizeMap, 0);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', resizeMap);
      window.clearTimeout(resizeTimeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      dataLoadedRef.current = false;
      interactionsBoundRef.current = false;
    };
  }, []);

  // Apply category filters when selectedCategory changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoadedRef.current) return;
    if (!map.getLayer('trails-line') || !map.getLayer('pois-circle')) return;
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
    <div className="relative flex min-h-screen flex-col">
      <Header
        onAbout={() => setAboutOpen(true)}
        onDonate={() => setDonateOpen(true)}
        onSafety={() => setSafetyOpen(true)}
      />
      <main className="map-shell relative flex-1 min-h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
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
