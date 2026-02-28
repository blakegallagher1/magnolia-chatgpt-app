import type { RenderOptions } from './registry.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function card(title: string, body: string, opts: RenderOptions, extraClass = ''): string {
  const sizeClass = opts.size === 'compact' ? 'gpc-widget--compact' : opts.size === 'expanded' ? 'gpc-widget--expanded' : '';
  return `<div class="gpc-widget ${extraClass} ${sizeClass}">
  ${title ? `<div class="gpc-widget__header"><h3 class="gpc-widget__title">${title}</h3></div>` : ''}
  <div class="gpc-widget__body">${body}</div>
</div>`;
}

function fmt(val: unknown, decimals = 0): string {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(val: unknown, decimals = 0): string {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(val: unknown, decimals = 1): string {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return `${(n * 100).toFixed(decimals)}%`;
}

function badge(label: string, color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'): string {
  return `<span class="gpc-badge gpc-badge--${color}">${label}</span>`;
}

function statusBadge(status: string): string {
  const map: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    active: 'green',
    closed: 'gray',
    dead: 'red',
    pending: 'yellow',
    under_contract: 'blue',
  };
  return badge(status, map[status] ?? 'gray');
}

function row(label: string, value: string): string {
  return `<div class="gpc-kv"><span class="gpc-kv__label">${label}</span><span class="gpc-kv__value">${value}</span></div>`;
}

function table(headers: string[], rows: string[][]): string {
  const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="gpc-table">${thead}${tbody}</table>`;
}

// ---------------------------------------------------------------------------
// Deal Card
// ---------------------------------------------------------------------------

export function renderDealCard(data: Record<string, unknown>, opts: RenderOptions): string {
  const d = (data.deal ?? data) as Record<string, unknown>;
  const title = opts.title ?? String(d.name ?? 'Deal');
  const body = `
    ${row('Status', statusBadge(String(d.status ?? 'unknown')))}
    ${row('Type', String(d.deal_type ?? '—'))}
    ${row('Ask Price', fmtCurrency(d.ask_price))}
    ${row('Offer Price', fmtCurrency(d.offer_price))}
    ${row('Target Close', String(d.target_close_date ?? '—'))}
    ${row('Assignee', String(d.assignee ?? '—'))}
    ${d.notes ? `<p class="gpc-notes">${String(d.notes)}</p>` : ''}
  `;
  return card(title, body, opts, 'gpc-deal-card');
}

// ---------------------------------------------------------------------------
// Parcel Map (static map tile placeholder)
// ---------------------------------------------------------------------------

export function renderParcelMap(data: Record<string, unknown>, opts: RenderOptions): string {
  const lat = data.lat ?? data.center_lat;
  const lng = data.lng ?? data.center_lng;
  const apn = data.apn ?? data.parcel_id;
  const title = opts.title ?? 'Parcel Map';
  if (!lat || !lng) {
    return card(title, '<p class="gpc-empty">No coordinates available for map.</p>', opts, 'gpc-parcel-map');
  }
  const zoom = opts.size === 'expanded' ? 17 : opts.size === 'compact' ? 14 : 16;
  const w = opts.size === 'compact' ? 300 : opts.size === 'expanded' ? 800 : 500;
  const h = opts.size === 'compact' ? 150 : opts.size === 'expanded' ? 400 : 250;
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&markers=color:red%7C${lat},${lng}&key=STATIC_MAP_KEY`;
  const body = `
    <img src="${mapUrl}" alt="Parcel map" class="gpc-map-img" width="${w}" height="${h}" />
    ${apn ? row('APN', String(apn)) : ''}
    ${row('Coordinates', `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`)}
  `;
  return card(title, body, opts, 'gpc-parcel-map');
}

// ---------------------------------------------------------------------------
// Market Chart (SVG sparkline)
// ---------------------------------------------------------------------------

export function renderMarketChart(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? String(data.metric ?? 'Market Trend');
  const series = Array.isArray(data.series) ? (data.series as number[]) : [];
  const labels = Array.isArray(data.labels) ? (data.labels as string[]) : [];

  if (series.length === 0) {
    return card(title, '<p class="gpc-empty">No series data.</p>', opts, 'gpc-market-chart');
  }

  const w = opts.size === 'compact' ? 280 : opts.size === 'expanded' ? 700 : 480;
  const h = opts.size === 'compact' ? 80 : opts.size === 'expanded' ? 200 : 120;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * (w - 20) + 10;
    const y = h - 10 - ((v - min) / range) * (h - 20);
    return `${x},${y}`;
  });
  const polyline = `<polyline fill="none" stroke="#4f7cff" stroke-width="2" points="${pts.join(' ')}" />`;
  const dots = pts.map((pt, i) =>
    `<circle cx="${pt.split(',')[0]}" cy="${pt.split(',')[1]}" r="3" fill="#4f7cff" title="${labels[i] ?? i}: ${series[i]}" />`,
  ).join('');
  const svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="gpc-sparkline">${polyline}${dots}</svg>`;

  const lastVal = series[series.length - 1];
  const firstVal = series[0];
  const change = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) : 0;
  const changeColor = change >= 0 ? 'green' : 'red';
  const body = `
    ${svg}
    <div class="gpc-chart-meta">
      ${row('Latest', String(lastVal))}
      ${row('Change', badge(`${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%`, changeColor))}
      ${data.market ? row('Market', String(data.market)) : ''}
    </div>
  `;
  return card(title, body, opts, 'gpc-market-chart');
}

// ---------------------------------------------------------------------------
// Comps Table
// ---------------------------------------------------------------------------

export function renderCompsTable(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Comparable Transactions';
  const comps = Array.isArray(data.comps) ? (data.comps as Record<string, unknown>[]) : [];

  if (comps.length === 0) {
    return card(title, '<p class="gpc-empty">No comps found.</p>', opts, 'gpc-comps-table');
  }

  const headers = ['Address', 'Type', 'Date', 'SF', 'Price/SF', 'Total'];
  const rows = comps.map((c) => [
    String(c.address ?? '—'),
    String(c.property_type ?? '—'),
    String(c.date ?? '—'),
    fmt(c.sf),
    fmtCurrency(c.price_per_sf, 2),
    fmtCurrency(c.total_price),
  ]);

  const body = `
    ${table(headers, rows)}
    ${data.median_price_sf ? row('Median $/SF', fmtCurrency(data.median_price_sf, 2)) : ''}
  `;
  return card(title, body, opts, 'gpc-comps-table');
}

// ---------------------------------------------------------------------------
// Underwriting Summary
// ---------------------------------------------------------------------------

export function renderUnderwritingSummary(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Underwriting Summary';
  const body = `
    ${row('IRR', fmtPct(data.irr, 2))}
    ${row('Equity Multiple', data.equity_multiple != null ? `${Number(data.equity_multiple).toFixed(2)}x` : '—')}
    ${row('Cash-on-Cash', fmtPct(data.cash_on_cash, 2))}
    ${row('Hold Period', data.hold_period_years != null ? `${data.hold_period_years} yrs` : '—')}
    ${row('Exit Cap Rate', fmtPct(data.exit_cap_rate, 2))}
    ${row('Net Proceeds', fmtCurrency(data.net_proceeds))}
    ${row('Total Equity', fmtCurrency(data.total_equity))}
  `;
  return card(title, body, opts, 'gpc-underwriting-summary');
}

// ---------------------------------------------------------------------------
// Memo Preview
// ---------------------------------------------------------------------------

export function renderMemoPreview(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? String(data.memo_type ?? 'Investment Memo');
  const markdown = String(data.content ?? data.markdown ?? '');
  // Convert markdown headings to HTML for preview (minimal)
  const html = markdown
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
  return card(title, `<div class="gpc-memo-preview">${html}</div>`, opts, 'gpc-memo-preview');
}

// ---------------------------------------------------------------------------
// Flood Map
// ---------------------------------------------------------------------------

export function renderFloodMap(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Flood Zone';
  const zone = String(data.flood_zone ?? data.zone ?? '—');
  const riskScore = data.risk_score != null ? Number(data.risk_score) : null;
  const zoneColor: 'red' | 'yellow' | 'green' | 'gray' =
    zone.startsWith('A') || zone.startsWith('V') ? 'red' :
    zone === 'X500' ? 'yellow' :
    zone === 'X' ? 'green' : 'gray';

  const body = `
    ${row('FEMA Zone', badge(zone, zoneColor))}
    ${riskScore !== null ? row('Risk Score', `<meter min="0" max="100" value="${riskScore}" low="33" high="66" optimum="10"></meter> ${riskScore}`) : ''}
    ${data.bfe != null ? row('Base Flood Elev.', `${data.bfe} ft`) : ''}
    ${data.annual_premium_estimate != null ? row('Est. Annual Premium', fmtCurrency(data.annual_premium_estimate)) : ''}
  `;
  return card(title, body, opts, 'gpc-flood-map');
}

// ---------------------------------------------------------------------------
// Zoning Badge
// ---------------------------------------------------------------------------

export function renderZoningBadge(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Zoning';
  const zone = String(data.zoning_code ?? data.zone ?? '—');
  const desc = String(data.description ?? '');
  const uses = Array.isArray(data.permitted_uses) ? (data.permitted_uses as string[]) : [];

  const body = `
    <div class="gpc-zoning-code">${badge(zone, 'blue')}</div>
    ${desc ? `<p class="gpc-zoning-desc">${desc}</p>` : ''}
    ${row('Max Height', data.max_height != null ? `${data.max_height} ft` : '—')}
    ${row('Max FAR', data.max_far != null ? String(data.max_far) : '—')}
    ${row('Min Lot Size', data.min_lot_size_sf != null ? `${fmt(data.min_lot_size_sf)} SF` : '—')}
    ${uses.length > 0 ? `<div class="gpc-permitted-uses"><strong>Permitted:</strong> ${uses.join(', ')}</div>` : ''}
  `;
  return card(title, body, opts, 'gpc-zoning-badge');
}

// ---------------------------------------------------------------------------
// Ownership Tree
// ---------------------------------------------------------------------------

export function renderOwnershipTree(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Ownership';
  const owner = String(data.owner_name ?? data.owner ?? '—');
  const entityType = String(data.entity_type ?? '—');
  const transfers = Array.isArray(data.transfer_history)
    ? (data.transfer_history as Record<string, unknown>[])
    : [];

  const transferRows = transfers.slice(0, 5).map((t) => [
    String(t.date ?? '—'),
    String(t.grantor ?? '—'),
    String(t.grantee ?? '—'),
    fmtCurrency(t.sale_price),
  ]);

  const body = `
    ${row('Current Owner', owner)}
    ${row('Entity Type', entityType)}
    ${data.owner_address ? row('Address', String(data.owner_address)) : ''}
    ${transfers.length > 0 ? table(['Date', 'Grantor', 'Grantee', 'Price'], transferRows) : ''}
  `;
  return card(title, body, opts, 'gpc-ownership-tree');
}

// ---------------------------------------------------------------------------
// Demographics Chart
// ---------------------------------------------------------------------------

export function renderDemographicsChart(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Demographics';
  const rings = Array.isArray(data.rings) ? (data.rings as Record<string, unknown>[]) : [];

  if (rings.length === 0) {
    // Flat single-ring display
    const body = `
      ${row('Population', fmt(data.population))}
      ${row('Median HH Income', fmtCurrency(data.median_hh_income))}
      ${row('Median Age', data.median_age != null ? String(data.median_age) : '—')}
      ${row('Avg HH Size', data.avg_hh_size != null ? String(data.avg_hh_size) : '—')}
      ${row('Employment Rate', fmtPct(data.employment_rate))}
    `;
    return card(title, body, opts, 'gpc-demographics-chart');
  }

  // Multi-ring table
  const headers = ['Ring', 'Population', 'Med. Income', 'Med. Age'];
  const rows = rings.map((r) => [
    r.radius_miles != null ? `${r.radius_miles} mi` : '—',
    fmt(r.population),
    fmtCurrency(r.median_hh_income),
    r.median_age != null ? String(r.median_age) : '—',
  ]);
  return card(title, table(headers, rows), opts, 'gpc-demographics-chart');
}

// ---------------------------------------------------------------------------
// Pipeline Kanban
// ---------------------------------------------------------------------------

export function renderPipelineKanban(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Deal Pipeline';
  const deals = Array.isArray(data.deals) ? (data.deals as Record<string, unknown>[]) : [];

  const columns: Record<string, Record<string, unknown>[]> = {
    active: [],
    under_contract: [],
    closed: [],
    dead: [],
  };

  for (const deal of deals) {
    const status = String(deal.status ?? 'active');
    if (columns[status]) {
      columns[status].push(deal);
    } else {
      columns.active.push(deal);
    }
  }

  const colHtml = Object.entries(columns).map(([status, colDeals]) => {
    const cards = colDeals.map((d) =>
      `<div class="gpc-kanban-card">
        <strong>${String(d.name ?? 'Untitled')}</strong>
        <span>${fmtCurrency(d.ask_price)}</span>
      </div>`,
    ).join('');
    return `<div class="gpc-kanban-col">
      <div class="gpc-kanban-col__header">${statusBadge(status)} <span>(${colDeals.length})</span></div>
      ${cards}
    </div>`;
  }).join('');

  return card(title, `<div class="gpc-kanban">${colHtml}</div>`, opts, 'gpc-pipeline-kanban');
}

// ---------------------------------------------------------------------------
// Document List
// ---------------------------------------------------------------------------

export function renderDocumentList(data: Record<string, unknown>, opts: RenderOptions): string {
  const title = opts.title ?? 'Documents';
  const docs = Array.isArray(data.documents) ? (data.documents as Record<string, unknown>[]) : [];

  if (docs.length === 0) {
    return card(title, '<p class="gpc-empty">No documents.</p>', opts, 'gpc-document-list');
  }

  const headers = ['Name', 'Type', 'Date', 'Size'];
  const rows = docs.map((d) => [
    String(d.name ?? '—'),
    String(d.document_type ?? '—'),
    String(d.created_at ?? '—'),
    d.file_size_kb != null ? `${d.file_size_kb} KB` : '—',
  ]);

  return card(title, table(headers, rows), opts, 'gpc-document-list');
}
