import React, { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import { useToolResult } from '../shared/hooks.js';
import { theme } from '../shared/theme.js';
import type { MarketToolResult, MarketMetric } from '../shared/types.js';
import './styles.css';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

function StatTile({ label, value, delta, trend }: StatTileProps): React.ReactElement {
  const trendClass = trend ? `stat-delta--${trend}` : '';
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className={`stat-delta ${trendClass}`}>{delta}</div>}
    </div>
  );
}

interface MetricRowProps {
  metric: MarketMetric;
}

function MetricRow({ metric }: MetricRowProps): React.ReactElement {
  const barPct = metric.percentile != null ? metric.percentile : 50;
  return (
    <div className="metric-row">
      <div className="metric-row-label">{metric.label}</div>
      <div className="metric-row-bar-track">
        <div
          className="metric-row-bar-fill"
          style={{ width: `${barPct}%`, background: metric.color ?? theme.accent.gold }}
        />
      </div>
      <div className="metric-row-value">{metric.value}</div>
    </div>
  );
}

// ─── Chart Component ──────────────────────────────────────────────────────────

interface TrendChartProps {
  labels: string[];
  datasets: MarketToolResult['chart']['datasets'];
}

function TrendChart({ labels, datasets }: TrendChartProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          ...ds,
          backgroundColor: ds.backgroundColor ?? theme.accent.gold + '99',
          borderColor: ds.borderColor ?? theme.accent.gold,
          borderWidth: 1,
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: datasets.length > 1,
            labels: { color: '#9CA3AF', font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#9CA3AF',
            borderColor: '#374151',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: '#6B7280', font: { size: 10 } },
            grid: { color: '#1F2937' },
          },
          y: {
            ticks: { color: '#6B7280', font: { size: 10 } },
            grid: { color: '#1F2937' },
          },
        },
      },
    };

    if (chartRef.current) {
      chartRef.current.data = config.data;
      chartRef.current.update('active');
    } else {
      chartRef.current = new Chart(canvasRef.current, config);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, datasets]);

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketReport(): React.ReactElement {
  const toolResult = useToolResult<MarketToolResult>();

  if (!toolResult) {
    return (
      <div className="mr-root mr-empty">
        <div className="mr-empty-icon">📊</div>
        <div className="mr-empty-text">No market data loaded</div>
        <div className="mr-empty-sub">Ask for a market report to see analytics.</div>
      </div>
    );
  }

  const { summary, stats, metrics, chart } = toolResult;

  return (
    <div className="mr-root">
      <header className="mr-header">
        <span className="mr-label">Market Report</span>
        <span className="mr-title">{summary.title}</span>
        <span className="mr-subtitle">{summary.subtitle}</span>
      </header>

      {/* Stats row */}
      <section className="mr-stats">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </section>

      {/* Chart */}
      {chart?.labels && chart?.datasets && (
        <TrendChart labels={chart.labels} datasets={chart.datasets} />
      )}

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <section className="mr-metrics">
          {metrics.map((m) => (
            <MetricRow key={m.label} metric={m} />
          ))}
        </section>
      )}
    </div>
  );
}
