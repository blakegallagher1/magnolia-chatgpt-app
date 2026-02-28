import React, { useState } from 'react';
import { useToolResult } from '../shared/hooks.js';
import { callTool, sendMessage } from '../shared/bridge.js';
import { theme } from '../shared/theme.js';
import type { ScreeningToolResult, ScreeningLayer } from '../shared/types.js';
import './styles.css';

// ─── Layer Row ────────────────────────────────────────────────────────────────

interface LayerRowProps {
  layer: ScreeningLayer;
  isExpanded: boolean;
  onToggle: () => void;
}

function LayerRow({ layer, isExpanded, onToggle }: LayerRowProps): React.ReactElement {
  const statusColors: Record<string, string> = {
    pass: theme.status.low,
    warn: theme.status.medium,
    fail: theme.status.high,
    pending: theme.status.unknown,
  };
  const color = statusColors[layer.status] ?? theme.status.unknown;

  return (
    <div className="layer-row">
      <button className="layer-header" onClick={onToggle} aria-expanded={isExpanded}>
        <span className="layer-indicator" style={{ background: color }} />
        <span className="layer-name">{layer.name}</span>
        <span className="layer-status" style={{ color }}>{layer.status.toUpperCase()}</span>
        <span className="layer-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>
      {isExpanded && (
        <div className="layer-detail">
          <p className="layer-summary">{layer.summary}</p>
          {layer.details && layer.details.length > 0 && (
            <ul className="layer-items">
              {layer.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overall Score Badge ──────────────────────────────────────────────────────

interface ScoreBadgeProps {
  score: number;
  label: string;
}

function ScoreBadge({ score, label }: ScoreBadgeProps): React.ReactElement {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? theme.status.low : pct >= 40 ? theme.status.medium : theme.status.high;
  return (
    <div className="score-badge" style={{ borderColor: color + '44' }}>
      <div className="score-number" style={{ color }}>{pct}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScreeningResults(): React.ReactElement {
  const toolResult = useToolResult<ScreeningToolResult>();
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);

  const toggleLayer = (name: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!toolResult) {
    return (
      <div className="sr-root sr-empty">
        <div className="sr-empty-icon">🔍</div>
        <div className="sr-empty-text">No screening results</div>
        <div className="sr-empty-sub">Select a parcel and run a screening to see results.</div>
      </div>
    );
  }

  const { parcel_id, address, score, recommendation, layers } = toolResult;

  const handleCreateDeal = async () => {
    setIsCreatingDeal(true);
    try {
      sendMessage(`Create a new deal for parcel ${parcel_id} at ${address}.`);
      await callTool('create_deal', { parcel_id, address });
    } finally {
      setIsCreatingDeal(false);
    }
  };

  const handleDeepDive = () => {
    sendMessage(`Give me a deep-dive analysis on parcel ${parcel_id} at ${address}.`);
  };

  return (
    <div className="sr-root">
      <header className="sr-header">
        <div className="sr-header-left">
          <span className="sr-label">Screening Results</span>
          <span className="sr-address">{address}</span>
          <span className="sr-parcel-id">#{parcel_id}</span>
        </div>
        <ScoreBadge score={score} label={recommendation} />
      </header>

      <div className="sr-layers">
        {layers.map((layer) => (
          <LayerRow
            key={layer.name}
            layer={layer}
            isExpanded={expandedLayers.has(layer.name)}
            onToggle={() => toggleLayer(layer.name)}
          />
        ))}
      </div>

      <footer className="sr-actions">
        <button
          className="sr-btn sr-btn--primary"
          onClick={handleCreateDeal}
          disabled={isCreatingDeal}
        >
          {isCreatingDeal ? 'Creating…' : 'Create Deal'}
        </button>
        <button className="sr-btn sr-btn--ghost" onClick={handleDeepDive}>
          Deep Dive
        </button>
      </footer>
    </div>
  );
}
