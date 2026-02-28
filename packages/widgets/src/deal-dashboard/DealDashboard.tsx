import React, { useState } from 'react';
import { useToolResult } from '../shared/hooks.js';
import { callTool, sendMessage } from '../shared/bridge.js';
import { theme, type StatusKey } from '../shared/theme.js';
import { STAGE_CONFIG, type DealToolResult } from '../shared/types.js';
import type { DealStage } from '@magnolia/shared-types';
import './styles.css';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'gold' | 'green' | 'red';
}

function MetricCard({ label, value, variant = 'default' }: MetricCardProps): React.ReactElement {
  const valueClass = variant === 'default' ? '' : `metric-value--${variant}`;
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${valueClass}`}>{value}</div>
    </div>
  );
}

interface RiskGaugeProps {
  score: number; // 0–100
}

function RiskGauge({ score }: RiskGaugeProps): React.ReactElement {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct <= 30 ? theme.status.low : pct <= 60 ? theme.status.medium : theme.status.high;
  return (
    <div className="risk-gauge">
      <div className="risk-label">Risk Score</div>
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="risk-value" style={{ color }}>{pct}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DealDashboard(): React.ReactElement {
  const toolResult = useToolResult<DealToolResult>();
  const [isAdvancing, setIsAdvancing] = useState(false);

  if (!toolResult) {
    return (
      <div className="dd-root dd-empty">
        <div className="dd-empty-icon">📋</div>
        <div className="dd-empty-text">No active deal loaded</div>
        <div className="dd-empty-sub">Ask me to load a deal to see its dashboard.</div>
      </div>
    );
  }

  const { deal, metrics } = toolResult;
  const stageConfig = STAGE_CONFIG[deal.stage as DealStage] ?? STAGE_CONFIG['prospecting'];

  const handleAdvanceStage = async () => {
    setIsAdvancing(true);
    try {
      sendMessage(`Advance deal ${deal.id} to the next stage.`);
      await callTool('update_deal_stage', { deal_id: deal.id, action: 'advance' });
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAddNote = () => {
    sendMessage(`Add a note to deal ${deal.id}: `);
  };

  return (
    <div className="dd-root">
      {/* Header */}
      <header className="dd-header">
        <div className="dd-header-left">
          <span className="dd-label">Deal Dashboard</span>
          <span className="dd-deal-name">{deal.name}</span>
        </div>
        <div className="dd-header-right">
          <span
            className="dd-stage-badge"
            style={{ background: stageConfig.color + '22', color: stageConfig.color, borderColor: stageConfig.color + '44' }}
          >
            {stageConfig.label}
          </span>
        </div>
      </header>

      {/* Metrics grid */}
      <section className="dd-metrics">
        <MetricCard label="Ask Price" value={metrics.ask_price ?? '—'} variant="gold" />
        <MetricCard label="Cap Rate" value={metrics.cap_rate ?? '—'} variant={metrics.cap_rate_variant} />
        <MetricCard label="NOI" value={metrics.noi ?? '—'} />
        <MetricCard label="IRR" value={metrics.irr ?? '—'} variant={metrics.irr_variant} />
        <MetricCard label="Equity Mult" value={metrics.equity_multiple ?? '—'} />
        <MetricCard label="Hold Period" value={metrics.hold_period ?? '—'} />
      </section>

      {/* Risk gauge */}
      {metrics.risk_score != null && <RiskGauge score={metrics.risk_score} />}

      {/* Action buttons */}
      <footer className="dd-actions">
        <button
          className="dd-btn dd-btn--primary"
          onClick={handleAdvanceStage}
          disabled={isAdvancing}
        >
          {isAdvancing ? 'Advancing…' : `Move to ${stageConfig.nextLabel ?? 'Next Stage'}`}
        </button>
        <button className="dd-btn dd-btn--ghost" onClick={handleAddNote}>
          Add Note
        </button>
      </footer>
    </div>
  );
}
