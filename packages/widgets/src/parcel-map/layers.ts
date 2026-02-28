import type maplibregl from 'maplibre-gl';

/**
 * MapLibre GL layer definitions for parcel map.
 */

/** Zoning color mapping for the fill layer */
export const ZONING_COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'zoning'],
  // Commercial
  'C-1', '#3B82F6',
  'C-2', '#2563EB',
  'C-3', '#1D4ED8',
  'C-MX', '#7C3AED',
  // Industrial
  'M-1', '#F59E0B',
  'M-2', '#D97706',
  'M-3', '#B45309',
  // Residential
  'R-1A', '#10B981',
  'R-1B', '#059669',
  'R-1C', '#047857',
  'R-2', '#0D9488',
  'R-3', '#0891B2',
  'R-4', '#0284C7',
  // Agricultural
  'A-1', '#65A30D',
  'A-2', '#4D7C0F',
  // Planned Unit Development
  'PUD', '#EC4899',
  // Default
  '#6B7280',
];

/** Parcel fill layer spec */
export function createParcelFillLayer(): maplibregl.LayerSpecification {
  return {
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': ZONING_COLOR_EXPRESSION,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.85,
        0.55,
      ],
    },
  };
}

/** Parcel outline layer spec */
export function createParcelOutlineLayer(): maplibregl.LayerSpecification {
  return {
    id: 'parcels-outline',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#C8A951',
        'rgba(200,169,81,0.4)',
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        2.5,
        0.8,
      ],
    },
  };
}

/** Flood zone fill layer spec (requires 'flood-zones' source to be added) */
export function createFloodFillLayer(): maplibregl.LayerSpecification {
  return {
    id: 'flood-fill',
    type: 'fill',
    source: 'flood-zones',
    paint: {
      'fill-color': [
        'match',
        ['get', 'FLD_ZONE'],
        'AE', 'rgba(59, 130, 246, 0.35)',
        'AH', 'rgba(99, 102, 241, 0.35)',
        'AO', 'rgba(139, 92, 246, 0.35)',
        'A', 'rgba(37, 99, 235, 0.35)',
        'VE', 'rgba(239, 68, 68, 0.35)',
        'rgba(0, 0, 0, 0)',
      ],
    },
    layout: { visibility: 'none' }, // Hidden by default; toggled by user
  };
}

/** Dark map style configuration */
export const DARK_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
    },
  ],
};
