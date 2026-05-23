"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Map } from 'maplibre-gl';
import { mapConfig } from "../data/mapConfig";
import type { SiteSettings } from "../lib/siteSettings";
import Header from "./Header";
import PrototypeBanner from "./PrototypeBanner";
import FilterControls from "./FilterControls";
import LocationButton from "./LocationButton";
import AboutModal from "./AboutModal";
import DonateModal from "./DonateModal";
import NatureAnimations from "./NatureAnimations";
import SafetyModal from "./SafetyModal";
import TrailInfoPanel, { TrailProperties } from "./TrailInfoPanel";

// Define available categories for filters.
const CATEGORY_LIST = [
  'Walk & Jog',
  'Cycling',
  'Family & Facilities',
  'Landmarks & Gates',
];

const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/**
 * Primary map view component. Handles map setup, data loading, user interactions,
 * modals and filters. This component runs only on the client.
 */
export default function MapView({ siteSettings }: { siteSettings: SiteSettings }) {
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
            const [trailsData, poiData, junctionData, gatesData] = await Promise.all([
              loadGeoJson('/data/trails.geojson'),
              loadGeoJson('/data/points-of-interest.geojson'),
              loadGeoJson('/data/junctions.geojson'),
              loadGeoJson('/data/gates.geojson'),
            ]);
            let boundaryData = null;
            if (mapConfig.showBoundary) {
              try {
                boundaryData = await loadGeoJson('/data/karura-boundary.geojson');
              } catch (boundaryError) {
                console.error('Error loading review boundary GeoJSON:', boundaryError);
              }
            }
            if (mapConfig.showBoundary && boundaryData) {
              map.addSource('karura-boundary', {
                type: 'geojson',
                data: boundaryData,
              });
              map.addLayer({
                id: 'karura-boundary-fill',
                type: 'fill',
                source: 'karura-boundary',
                paint: {
                  'fill-color': '#1F4D3A',
                  'fill-opacity': 0.08,
                },
              });
              map.addLayer({
                id: 'karura-boundary-outline',
                type: 'line',
                source: 'karura-boundary',
                paint: {
                  'line-color': '#145A3A',
                  'line-width': 3,
                  'line-opacity': 0.9,
                },
              });
            }
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
              filter: ['!=', ['get', 'category'], 'Gate'],
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
            map.addSource('gates', {
              type: 'geojson',
              data: gatesData,
            });
            map.addLayer({
              id: 'gates-circle',
              type: 'circle',
              source: 'gates',
              paint: {
                'circle-radius': 8,
                'circle-color': '#145A3A',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              },
            });
            map.addLayer({
              id: 'gates-label',
              type: 'symbol',
              source: 'gates',
              minzoom: 14,
              layout: {
                'text-field': ['get', 'short_name'],
                'text-size': 12,
                'text-offset': [0, -1.4],
                'text-anchor': 'bottom',
              },
              paint: {
                'text-color': '#145A3A',
                'text-halo-color': '#FFFDF6',
                'text-halo-width': 1.5,
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

              const showPoiPopup = (e: any) => {
                if (!e.features || !e.features.length) return;

                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const html = `<strong>${props.name}</strong><br />Category: ${props.category}<br />${props.description}<br /><em>${props.visitor_note}</em><br /><small>${props.status}</small>`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);
              };

              map.on('click', 'pois-circle', (e: any) => {
                if (!map.getLayer('pois-circle')) return;
                showPoiPopup(e);
              });

              map.on('click', 'gates-circle', (e: any) => {
                if (!map.getLayer('gates-circle')) return;
                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const html = `<strong>${props.name}</strong><br />Access: ${props.access}<br />${props.description}<br /><em>${props.visitor_note}</em><br /><small>${props.status}</small>`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);
              });

              map.on('click', 'gates-label', (e: any) => {
                if (!map.getLayer('gates-label')) return;
                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const html = `<strong>${props.name}</strong><br />Access: ${props.access}<br />${props.description}<br /><em>${props.visitor_note}</em><br /><small>${props.status}</small>`;
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setHTML(html)
                  .addTo(map);
              });

              if (mapConfig.showBoundary && map.getLayer('karura-boundary-fill')) {
                map.on('click', 'karura-boundary-fill', (e: any) => {
                  if (!map.getLayer('karura-boundary-fill')) return;
                  const feature = e.features && e.features[0];
                  if (!feature) return;
                  const props = feature.properties as any;
                  const html = `<strong>${props.name}</strong><br />Status: ${props.status}<br />Source: ${props.source}<br />Attribution: ${props.attribution}<br /><small>Not official boundary: ${props.not_official_boundary ? 'Yes' : 'No'}</small>`;
                  new maplibre.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
                });
              }

              [
                'trails-line',
                'pois-circle',
                'gates-circle',
                'gates-label',
                ...(mapConfig.showBoundary ? ['karura-boundary-fill'] : []),
              ].forEach((layerId) => {
                if (!map.getLayer(layerId)) return;
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
    if (!map.getLayer('trails-line') || !map.getLayer('pois-circle') || !map.getLayer('gates-circle')) return;
    // Reset filters
    try {
      map.setFilter('trails-line', null);
      map.setFilter('pois-circle', ['!=', ['get', 'category'], 'Gate']);
      map.setFilter('gates-circle', null);
      if (map.getLayer('gates-label')) {
        map.setFilter('gates-label', null);
      }
    } catch (err) {
      // Map not ready
      return;
    }
    if (selectedCategory === 'All') {
      return;
    }

    const trailTypeFilters: Record<string, string[]> = {
      'Walk & Jog': ['Walking', 'Running', 'Walking / Nature', 'Walking / Running'],
      Cycling: ['Cycling'],
      'Family & Facilities': ['Family'],
    };

    const poiCategoryFilters: Record<string, string[]> = {
      'Family & Facilities': ['Facilities'],
      'Landmarks & Gates': ['Landmark'],
    };

    const trailTypes = trailTypeFilters[selectedCategory] ?? [];
    const poiCategories = poiCategoryFilters[selectedCategory] ?? [];
    const showGates = selectedCategory === 'Landmarks & Gates';

    map.setFilter(
      'trails-line',
      trailTypes.length ? ['in', ['get', 'type'], ['literal', trailTypes]] : ['==', ['get', 'type'], '__hidden__'],
    );
    map.setFilter(
      'pois-circle',
      poiCategories.length
        ? ['in', ['get', 'category'], ['literal', poiCategories]]
        : ['==', ['get', 'category'], '__hidden__'],
    );
    map.setFilter('gates-circle', showGates ? null : ['==', ['get', 'category'], '__hidden__']);
    if (map.getLayer('gates-label')) {
      map.setFilter('gates-label', showGates ? null : ['==', ['get', 'category'], '__hidden__']);
    }
  }, [selectedCategory]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header
        appName={siteSettings.appName}
        onAbout={() => setAboutOpen(true)}
        onDonate={() => setDonateOpen(true)}
        onSafety={() => setSafetyOpen(true)}
      />
      <main className="map-shell relative flex-1 min-h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
        {/* Prototype banner */}
        <PrototypeBanner
          show={siteSettings.showPrototypeBanner}
          text={siteSettings.prototypeBannerText}
        />
        {/* Filter controls and location button */}
        <div className="absolute top-16 left-2 z-10 space-y-2">
          <FilterControls
            categories={CATEGORY_LIST}
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
          />
          <LocationButton map={mapRef.current} />
        </div>
        <NatureAnimations />
        {/* Trail information panel */}
        <TrailInfoPanel trail={selectedTrail} onClose={() => setSelectedTrail(null)} />
      </main>
      {/* Modals */}
      <AboutModal
        open={aboutOpen}
        settings={siteSettings}
        onClose={() => setAboutOpen(false)}
        onSupport={() => setDonateOpen(true)}
      />
      <DonateModal open={donateOpen} settings={siteSettings} onClose={() => setDonateOpen(false)} />
      <SafetyModal open={safetyOpen} settings={siteSettings} onClose={() => setSafetyOpen(false)} />
    </div>
  );
}
