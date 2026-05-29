"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { Map, Marker } from 'maplibre-gl';
import { mapConfig } from "../data/mapConfig";
import type { PublicPlaceSuggestion } from "../lib/placeSuggestions";
import type { SiteSettings } from "../lib/siteSettings";
import type { PublicTrailSuggestion } from "../lib/trailSuggestions";
import {
  MAX_LOCATION_ACCURACY_METERS,
  isPointWithinForestBoundaryTolerance,
} from "../lib/karuraBoundary";
import Header from "./Header";
import PrototypeBanner from "./PrototypeBanner";
import FilterControls from "./FilterControls";
import LocationButton from "./LocationButton";
import AboutModal from "./AboutModal";
import BoundaryInfoModal from "./BoundaryInfoModal";
import DonateModal from "./DonateModal";
import NatureAnimations from "./NatureAnimations";
import SafetyModal from "./SafetyModal";
import SuggestPlaceModal from "./SuggestPlaceModal";
import RecordTrailModal from "./RecordTrailModal";
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
export default function MapView({
  siteSettings,
  approvedPlaceSuggestions,
  approvedTrailSuggestions,
}: {
  siteSettings: SiteSettings;
  approvedPlaceSuggestions: PublicPlaceSuggestion[];
  approvedTrailSuggestions: PublicTrailSuggestion[];
}) {
  // Modal state
  const [aboutOpen, setAboutOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [boundaryInfoOpen, setBoundaryInfoOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [recordTrailOpen, setRecordTrailOpen] = useState(false);
  const [contributionCheckMessage, setContributionCheckMessage] = useState('');
  const [checkingContributionLocation, setCheckingContributionLocation] = useState(false);
  const [recordingTrailPoints, setRecordingTrailPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [choosingSuggestionLocation, setChoosingSuggestionLocation] = useState(false);
  const [suggestionCoordinates, setSuggestionCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Selected trail details
  const [selectedTrail, setSelectedTrail] = useState<TrailProperties | null>(null);
  // Selected filter category
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Map container and map instance refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const suggestionModeRef = useRef(false);
  const suggestionMarkerRef = useRef<Marker | null>(null);
  // Keep track of loaded data to avoid re-fetching
  const dataLoadedRef = useRef(false);
  const interactionsBoundRef = useRef(false);

  const geolocationGateErrorMessage = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location access is required for this feature so that map contributions are made from within the forest.';
    }
    if (error.code === error.TIMEOUT) {
      return 'We could not confirm your location. Please check that location services are enabled and try again.';
    }
    return 'We could not confirm your location. Please check that location services are enabled and try again.';
  };

  const confirmContributionLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setContributionCheckMessage('Geolocation is not supported by this browser.');
      return false;
    }

    setCheckingContributionLocation(true);
    setContributionCheckMessage('Checking your location...');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        });
      });

      if (position.coords.accuracy > MAX_LOCATION_ACCURACY_METERS) {
        setContributionCheckMessage(
          `Your location accuracy is currently about ${Math.round(position.coords.accuracy)} metres. Please wait a moment or move to a more open area, then try again.`,
        );
        return false;
      }

      if (!isPointWithinForestBoundaryTolerance(position.coords.latitude, position.coords.longitude)) {
        setContributionCheckMessage(
          'This feature is available only inside Karura Forest and Sigiria Forest. Your current location appears to be outside the forest boundary.',
        );
        return false;
      }

      setContributionCheckMessage('');
      return true;
    } catch (error) {
      const geolocationError =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as GeolocationPositionError)
          : null;
      setContributionCheckMessage(
        geolocationError
          ? geolocationGateErrorMessage(geolocationError)
          : 'We could not confirm your location. Please check that location services are enabled and try again.',
      );
      return false;
    } finally {
      setCheckingContributionLocation(false);
    }
  };

  const openSuggestPlace = async () => {
    const allowed = await confirmContributionLocation();
    if (allowed) {
      setSuggestOpen(true);
    }
  };

  const openRecordTrail = async () => {
    const allowed = await confirmContributionLocation();
    if (allowed) {
      setRecordTrailOpen(true);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoadedRef.current || !map.getSource('recording-trail-preview')) return;
    const source = map.getSource('recording-trail-preview') as any;
    source.setData({
      type: 'FeatureCollection',
      features: recordingTrailPoints.length > 1
        ? [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: recordingTrailPoints.map((point) => [point.longitude, point.latitude]),
              },
              properties: {},
            },
          ]
        : [],
    });
  }, [recordingTrailPoints]);

  useEffect(() => {
    suggestionModeRef.current = choosingSuggestionLocation;
  }, [choosingSuggestionLocation]);

  useEffect(() => {
    if (!mapInstance || !suggestionCoordinates) return;

    let cancelled = false;
    const updateMarker = async () => {
      const maplibreModule = await import('maplibre-gl');
      if (cancelled) return;
      const maplibre = maplibreModule.default ?? maplibreModule;
      suggestionMarkerRef.current?.remove();
      suggestionMarkerRef.current = new maplibre.Marker({ color: '#D89B45' })
        .setLngLat([suggestionCoordinates.longitude, suggestionCoordinates.latitude])
        .addTo(mapInstance);
    };

    updateMarker().catch((error) => {
      console.error('Error adding suggestion marker:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [mapInstance, suggestionCoordinates]);

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
        setMapInstance(map);

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
            map.addSource('approved-place-suggestions', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: approvedPlaceSuggestions.map((suggestion) => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [suggestion.longitude, suggestion.latitude],
                  },
                  properties: {
                    id: suggestion.id,
                    type: suggestion.type,
                    category: suggestion.type === 'facility' ? 'Facilities' : 'Landmark',
                    popupCategory: suggestion.type === 'facility' ? 'Facility' : 'Landmark',
                    name: suggestion.name,
                    description: suggestion.description,
                    status: 'Approved community suggestion',
                  },
                })),
              } as any,
            });
            map.addLayer({
              id: 'approved-suggestions-circle',
              type: 'circle',
              source: 'approved-place-suggestions',
              paint: {
                'circle-radius': 7,
                'circle-color': [
                  'match',
                  ['get', 'type'],
                  'facility',
                  '#9A6B3F',
                  '#0077A7',
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              },
            });
            map.addSource('approved-trail-suggestions', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: approvedTrailSuggestions.map((trail) => ({
                  type: 'Feature',
                  geometry: trail.pathGeojson,
                  properties: {
                    id: trail.id,
                    type: trail.type,
                    category:
                      trail.type === 'cycling'
                        ? 'Cycling'
                        : trail.type === 'family_walk'
                          ? 'Family Walk'
                          : 'Walk & Jog',
                    name: trail.name,
                    description: trail.description,
                    distanceMeters: trail.distanceMeters,
                    durationSeconds: trail.durationSeconds,
                    status: 'Approved community trail',
                  },
                })),
              } as any,
            });
            map.addLayer({
              id: 'approved-trails-line',
              type: 'line',
              source: 'approved-trail-suggestions',
              paint: {
                'line-color': [
                  'match',
                  ['get', 'type'],
                  'cycling',
                  '#2F80B7',
                  'family_walk',
                  '#8E7CC3',
                  '#2FB85A',
                ],
                'line-width': 4,
                'line-opacity': 0.9,
              },
            });
            map.addSource('recording-trail-preview', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            });
            map.addLayer({
              id: 'recording-trail-preview-line',
              type: 'line',
              source: 'recording-trail-preview',
              paint: {
                'line-color': '#D89B45',
                'line-width': 4,
                'line-opacity': 0.9,
                'line-dasharray': [1, 1],
              },
            });
            if (map.getLayer('approved-suggestions-circle')) {
              map.moveLayer('approved-suggestions-circle');
            }
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


              const createSafeDOMNode = (title: string, lines: Array<{type?: string, text?: string}>) => {
                const container = document.createElement('div');
                
                const titleEl = document.createElement('strong');
                titleEl.textContent = title;
                container.appendChild(titleEl);
                
                for (const line of lines) {
                  container.appendChild(document.createElement('br'));
                  if (line.type === 'small') {
                    const el = document.createElement('small');
                    el.textContent = line.text || '';
                    container.appendChild(el);
                  } else if (line.type === 'em') {
                    const el = document.createElement('em');
                    el.textContent = line.text || '';
                    container.appendChild(el);
                  } else if (line.text) {
                    container.appendChild(document.createTextNode(line.text || ''));
                  }
                }
                return container;
              };

              const showPoiPopup = (e: any) => {
                if (!e.features || !e.features.length) return;

                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const category = props.popupCategory || props.category;
                const domNode = createSafeDOMNode(props.name, [
                  { text: `Category: ${category}` },
                  { text: props.description },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);
              };

              map.on('click', 'pois-circle', (e: any) => {
                if (!map.getLayer('pois-circle')) return;
                showPoiPopup(e);
              });

              map.on('click', 'approved-suggestions-circle', (e: any) => {
                if (!map.getLayer('approved-suggestions-circle')) return;
                showPoiPopup(e);
              });

              map.on('click', 'approved-trails-line', (e: any) => {
                if (!map.getLayer('approved-trails-line')) return;
                const feature = e.features && e.features[0];
                if (!feature) return;
                const props = feature.properties as any;
                const distanceKm = props.distanceMeters ? (Number(props.distanceMeters) / 1000).toFixed(2) : '0.00';
                const durationMin = props.durationSeconds ? Math.round(Number(props.durationSeconds) / 60) : 0;
                const domNode = createSafeDOMNode(props.name, [
                  { text: `Category: ${props.category}` },
                  { text: `Distance: ${distanceKm} km` },
                  { text: `Duration: ${durationMin} min` },
                  { text: props.description },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(e.lngLat)
                  .setDOMContent(domNode)
                  .addTo(map);
              });

              map.on('click', 'gates-circle', (e: any) => {
                if (!map.getLayer('gates-circle')) return;
                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const domNode = createSafeDOMNode(props.name, [
                  { text: `Access: ${props.access}` },
                  { text: props.description },
                  { type: 'em', text: props.visitor_note },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);
              });

              map.on('click', 'gates-label', (e: any) => {
                if (!map.getLayer('gates-label')) return;
                const feature = e.features && e.features[0];
                if (!feature) return;
                const coords = feature.geometry.coordinates.slice();
                const props = feature.properties as any;
                const domNode = createSafeDOMNode(props.name, [
                  { text: `Access: ${props.access}` },
                  { text: props.description },
                  { type: 'em', text: props.visitor_note },
                  { type: 'small', text: props.status }
                ]);
                new maplibre.Popup()
                  .setLngLat(coords)
                  .setDOMContent(domNode)
                  .addTo(map);
              });

              [
                'trails-line',
                'approved-trails-line',
                'pois-circle',
                'approved-suggestions-circle',
                'gates-circle',
                'gates-label',
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
          if (suggestionModeRef.current) {
            if (!isPointWithinForestBoundaryTolerance(e.lngLat.lat, e.lngLat.lng)) {
              setSuggestionCoordinates(null);
              setContributionCheckMessage('Please choose a location inside Karura Forest or Sigiria Forest.');
              setChoosingSuggestionLocation(false);
              setSuggestOpen(true);
              return;
            }

            setSuggestionCoordinates({
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng,
            });
            setChoosingSuggestionLocation(false);
            setSuggestOpen(true);
            return;
          }

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
      suggestionMarkerRef.current?.remove();
      suggestionMarkerRef.current = null;
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
    if (
      !map.getLayer('trails-line') ||
      !map.getLayer('approved-trails-line') ||
      !map.getLayer('pois-circle') ||
      !map.getLayer('approved-suggestions-circle') ||
      !map.getLayer('gates-circle')
    ) return;
    // Reset filters
    try {
      map.setFilter('trails-line', null);
      map.setFilter('approved-trails-line', null);
      map.setFilter('pois-circle', ['!=', ['get', 'category'], 'Gate']);
      map.setFilter('approved-suggestions-circle', null);
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
      (trailTypes.length
        ? ['in', ['get', 'type'], ['literal', trailTypes]]
        : ['==', ['get', 'type'], '__hidden__']) as any,
    );
    map.setFilter(
      'approved-trails-line',
      (trailTypes.length || selectedCategory === 'Family & Facilities'
        ? [
            'in',
            ['get', 'type'],
            [
              'literal',
              selectedCategory === 'Family & Facilities'
                ? ['family_walk']
                : selectedCategory === 'Cycling'
                  ? ['cycling']
                  : selectedCategory === 'Walk & Jog'
                    ? ['walk_jog']
                    : [],
            ],
          ]
        : ['==', ['get', 'type'], '__hidden__']) as any,
    );
    map.setFilter(
      'pois-circle',
      (poiCategories.length
        ? ['in', ['get', 'category'], ['literal', poiCategories]]
        : ['==', ['get', 'category'], '__hidden__']) as any,
    );
    map.setFilter(
      'approved-suggestions-circle',
      (poiCategories.length
        ? ['in', ['get', 'category'], ['literal', poiCategories]]
        : ['==', ['get', 'category'], '__hidden__']) as any,
    );
    map.setFilter('gates-circle', showGates ? null : (['==', ['get', 'category'], '__hidden__'] as any));
    if (map.getLayer('gates-label')) {
      map.setFilter('gates-label', showGates ? null : (['==', ['get', 'category'], '__hidden__'] as any));
    }
  }, [selectedCategory]);

  return (
    <div className="map-view-page relative flex min-h-screen flex-col">
      <Header
        appName={siteSettings.appName}
        onAbout={() => setAboutOpen(true)}
        onDonate={() => setDonateOpen(true)}
        onSafety={() => setSafetyOpen(true)}
        onBoundary={mapConfig.showBoundary ? () => setBoundaryInfoOpen(true) : undefined}
      />
      <main className="map-shell relative flex-1 min-h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
        {/* Prototype banner */}
        <PrototypeBanner
          show={siteSettings.showPrototypeBanner}
          text={siteSettings.prototypeBannerText}
        />
        {/* Filter controls and map action buttons */}
        <div
          className={`map-control-panel absolute left-1 z-10 max-w-[calc(100vw-0.5rem)] rounded-md border border-[var(--sage-border)] bg-[var(--card-bg)]/80 p-1.5 shadow backdrop-blur-sm ${
            siteSettings.showPrototypeBanner ? 'top-11' : 'top-1'
          }`}
        >
          <FilterControls
            categories={CATEGORY_LIST}
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
          />
          <div className="mt-1.5 flex flex-wrap items-start gap-1.5">
            <LocationButton map={mapInstance} />
            {siteSettings.enablePlaceSuggestions ? (
              <button
                type="button"
                onClick={openSuggestPlace}
                disabled={checkingContributionLocation}
                className="min-h-9 rounded bg-[var(--donate-amber)] px-3 py-1.5 text-xs font-semibold text-white shadow"
              >
                {checkingContributionLocation ? 'Checking...' : 'Suggest Place'}
              </button>
            ) : null}
            {siteSettings.enablePublicTrailRecording ? (
              <button
                type="button"
                onClick={openRecordTrail}
                disabled={checkingContributionLocation}
                className="min-h-9 rounded bg-[var(--forest-header)] px-3 py-1.5 text-xs font-semibold text-[var(--warm-ivory)] shadow"
              >
                {checkingContributionLocation ? 'Checking...' : 'Record Trail'}
              </button>
            ) : null}
          </div>
          {contributionCheckMessage ? (
            <p className="mt-1.5 max-w-[14rem] rounded bg-[var(--sand-yellow)] px-2 py-1 text-[10px] leading-snug text-[var(--brown-olive)] shadow">
              {contributionCheckMessage}
            </p>
          ) : null}
          {choosingSuggestionLocation ? (
            <p className="mt-1.5 max-w-[10.5rem] rounded bg-[var(--sand-yellow)] px-2 py-1 text-[10px] leading-snug text-[var(--brown-olive)] shadow">
              Tap or click the map to choose the location.
            </p>
          ) : null}
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
      <BoundaryInfoModal open={boundaryInfoOpen} onClose={() => setBoundaryInfoOpen(false)} />
      <RecordTrailModal
        open={recordTrailOpen}
        onClose={() => {
          setRecordTrailOpen(false);
          setRecordingTrailPoints([]);
        }}
        onPointsChange={setRecordingTrailPoints}
      />
      <SuggestPlaceModal
        open={suggestOpen}
        coordinates={suggestionCoordinates}
        onClose={() => {
          setSuggestOpen(false);
          setChoosingSuggestionLocation(false);
          setContributionCheckMessage('');
          suggestionMarkerRef.current?.remove();
          suggestionMarkerRef.current = null;
          setSuggestionCoordinates(null);
        }}
        accessMessage={contributionCheckMessage}
        onStartChoosingLocation={() => {
          setChoosingSuggestionLocation(true);
          setSuggestOpen(false);
          setContributionCheckMessage('');
        }}
        onSubmitted={() => {
          suggestionMarkerRef.current?.remove();
          suggestionMarkerRef.current = null;
          setSuggestionCoordinates(null);
          setChoosingSuggestionLocation(false);
        }}
      />
    </div>
  );
}
