/**
 * Shared design tokens for all Magnolia widgets.
 * Mirrors the Magnolia brand: deep navy background, warm gold accent.
 */
export const theme = {
  bg: {
    primary: '#0A0F1C',
    secondary: '#111827',
    card: '#1F2937',
    border: '#374151',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    muted: '#9CA3AF',
    subtle: '#6B7280',
    faint: '#4B5563',
  },
  accent: {
    gold: '#C8A951',
    goldDim: '#C8A95133',
    goldHover: '#B8993F',
  },
  status: {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
    unknown: '#6B7280',
  },
  zoning: {
    commercial: '#3B82F6',
    industrial: '#F59E0B',
    residential: '#10B981',
    agricultural: '#65A30D',
    mixed: '#7C3AED',
    other: '#6B7280',
  },
} as const;

export type StatusKey = keyof typeof theme.status;

/** CSS variable injection for use in HTML-based contexts */
export function injectCSSVariables(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--color-bg-primary', theme.bg.primary);
  root.style.setProperty('--color-bg-secondary', theme.bg.secondary);
  root.style.setProperty('--color-bg-card', theme.bg.card);
  root.style.setProperty('--color-bg-border', theme.bg.border);
  root.style.setProperty('--color-text-primary', theme.text.primary);
  root.style.setProperty('--color-text-muted', theme.text.muted);
  root.style.setProperty('--color-accent-gold', theme.accent.gold);
  root.style.setProperty('--color-status-high', theme.status.high);
  root.style.setProperty('--color-status-medium', theme.status.medium);
  root.style.setProperty('--color-status-low', theme.status.low);
}
