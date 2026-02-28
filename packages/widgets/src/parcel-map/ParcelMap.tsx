import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useToolResult } from '../shared/hooks.js';
import { callTool, sendMessage, updateModelContext } from '../shared/bridge.js';
import { theme } from '../shared/theme.js';
import type { ParcelToolResult, MapViewport } from '../shared/types.js';
import './styles.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const EBR_CENTER: [number, number] = [-91.1871, 30.4515];
const EBR_ZOOM = 11;

const ZONING_COLORS: Record<string, string> = {
  'C-1': '#3B82F6',
  'C-2': '#2563EB',
  'C-3': '#1D4ED8',
  'C-MX': '#7C3AED',
  'M-1': '#F59E0B',
  'M-2': '#D97706',
  'M-3': '#B45309',
  'R-1A': '#10B981',
  'R-1B': '#059669',
  'R-1C': '#047857',
  'R-2': '#0D9488',
  'R-3': '#0891B2',
  'R-4': '#0284C7',
  'A-1': '#65A30D',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ParcelMap(): React.ReactElement {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [parcelCount, setParcelCount] = useState<number | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toolResult = useToolResult<ParcelToolResult>();

  // ── Map initialization ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '© CartoDB © OpenStreetMap',
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
      },
      center: EBR_CENTER,
      zoom: EBR_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    mapRef.current = map;

    map.on('load', () => {
      setupLayers(map);
    });

    // Viewport → model context
    map.on('moveend', () => {
      const bounds = map.getBounds();
      const viewport: MapViewport = {
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        bbox: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      };
      updateModelContext(
        `Map viewport: SW(${viewport.bbox[0].toFixed(4)},${viewport.bbox[1].toFixed(4)}) NE(${viewport.bbox[2].toFixed(4)},${viewport.bbox[3].toFixed(4)}) zoom:${viewport.zoom.toFixed(1)}`,
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Load parcels when tool result arrives ────────────────────────────────
  useEffect(() => {
    if (!toolResult || !mapRef.current) return;

    const map = mapRef.current;
    const geojson = toolResult.geojson as GeoJSON.FeatureCollection | undefined;
    if (!geojson) return;

    setParcelCount(toolResult.total ?? geojson.features?.length ?? null);

    const loadData = () => {
      const src = map.getSource('parcels') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData(geojson as Parameters<typeof src.setData>[0]);
      } else {
        setupLayers(map);
        const newSrc = map.getSource('parcels') as maplibregl.GeoJSONSource | undefined;
        newSrc?.setData(geojson as Parameters<typeof newSrc.setData>[0]);
      }

      // Fit bounds
      if (toolResult.bbox) {
        map.fitBounds(
          toolResult.bbox as maplibregl.LngLatBoundsLike,
          { padding: 40, maxZoom: 16, duration: 800 },
        );
      }
    };

    if (map.loaded()) {
      loadData();
    } else {
      map.once('load', loadData);
    }
  }, [toolResult]);

  // ── Set up parcel layers ─────────────────────────────────────────────────
  const setupLayers = useCallback((map: maplibregl.Map) => {
    if (!map.getSource('parcels')) {
      map.addSource('parcels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.getLayer('parcels-fill')) {
      map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': [
            'match',
            ['get', 'zoning'],
            ...Object.entries(ZONING_COLORS).flatMap(([k, v]) => [k, v]),
            '#6B7280',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.55],
        },
      });
    }

    if (!map.getLayer('parcels-outline')) {
      map.addLayer({
        id: 'parcels-outline',
        type: 'line',
        source: 'parcels',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            theme.accent.gold,
            'rgba(200,169,81,0.5)',
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.8],
        },
      });
    }

    // Click handler
    map.on('click', 'parcels-fill', (e) => {
      if (!e.features?.[0]) return;
      const feature = e.features[0];
      const props = feature.properties as Record<string, unknown>;
      const parcelId = String(props['parcel_id'] ?? '');

      setSelectedParcel(parcelId);

      // Show popup
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        maxWidth: '240px',
        className: 'parcel-popup',
      })
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHTML(props, parcelId))
        .addTo(map);
    });

    map.on('mouseenter', 'parcels-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'parcels-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  }, []);

  const handleScreenParcel = useCallback(async (parcelId: string) => {
    if (popupRef.current) popupRef.current.remove();
    setIsLoading(true);
    try {
      sendMessage(`Run a full 7-layer screening for parcel ${parcelId} and show me the results.`);
      await callTool('screen_property', { parcel_id: parcelId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Expose screen handler to global scope for popup button
  useEffect(() => {
    (window as unknown as Record<string, unknown>)['__screenParcel'] = handleScreenParcel;
    return () => {
      delete (window as unknown as Record<string, unknown>)['__screenParcel'];
    };
  }, [handleScreenParcel]);

  return (
    <div className="parcel-map-root">
      <header className="map-header">
        <span className="map-title">Parcel Map</span>
        {parcelCount != null && (
          <span className="map-badge">{parcelCount.toLocaleString()} parcels</span>
        )}
        {isLoading && <span className="map-loading-indicator">Screening...</span>}
        <span className="map-subtitle">East Baton Rouge Parish, LA</span>
      </header>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────

function buildPopupHTML(props: Record<string, unknown>, parcelId: string): string {
  const address = String(props['address'] ?? 'Unknown address');
  const owner = String(props['owner'] ?? 'Unknown');
  const zoning = String(props['zoning'] ?? 'N/A');
  const acres = props['acres'] != null ? Number(props['acres']).toFixed(2) : 'N/A';
  const assessed = props['assessed_value'] != null
    ? '$' + Number(props['assessed_value']).toLocaleString()
    : 'N/A';

  return `
    <div class="popup-title">${address}</div>
    <div class="popup-row"><span>Owner</span><span>${owner}</span></div>
    <div class="popup-row"><span>Zoning</span><span>${zoning}</span></div>
    <div class="popup-row"><span>Acres</span><span>${acres}</span></div>
    <div class="popup-row"><span>Assessed</span><span>${assessed}</span></div>
    <button class="popup-screen-btn" onclick="window.__screenParcel && window.__screenParcel('${parcelId}')">
      Screen This Parcel
    </button>
  `;
}

// GeoJSON type reference
declare namespace GeoJSON {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
  interface Feature {
    type: 'Feature';
    geometry: Record<string, unknown>;
    properties: Record<string, unknown>;
    id?: string | number;
  }
}
