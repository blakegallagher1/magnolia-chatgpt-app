# Magnolia Intelligence Platform — ChatGPT App

A Turborepo monorepo that exposes GPC-CRES (Gallagher Property Company Commercial Real Estate System) as a ChatGPT App via an MCP server on Cloudflare Workers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ChatGPT (OpenAI Apps)                        │
│                    Model Context Protocol client                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ MCP over Streamable HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Cloudflare Workers: magnolia-chatgpt-app               │
│                                                                     │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │   MCP Server    │   │  Widget Assets   │   │  SessionState   │  │
│  │  (mcp-server)   │   │   (widgets/)     │   │ (Durable Object)│  │
│  │                 │   │                  │   │                 │  │
│  │ 30+ MCP Tools   │   │  • ParcelMap     │   │ Conversation    │  │
│  │                 │   │  • DealDashboard │   │ context store   │  │
│  │ MCP Resources   │   │  • MarketReport  │   │                 │  │
│  │ (widget HTML)   │   │  • Screening     │   │                 │  │
│  └────────┬────────┘   └──────────────────┘   └─────────────────┘  │
└───────────┼─────────────────────────────────────────────────────────┘
            │ HTTPS + API Key
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              GPC-CRES Backend (gallagherpropco.com)                 │
│                                                                     │
│  FastAPI Gateway ──► PostGIS (198K EBR parcels)                    │
│                  ──► Qdrant (4 vector collections)                  │
│                  ──► Temporal (DAG workflows)                       │
│                  ──► 16 AI Agents (OpenAI Agents SDK)               │
│                  ──► Supabase (auth + database)                     │
│                  ──► 40+ public APIs (FRED, BLS, Census, HUD...)    │
└─────────────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@magnolia/shared-types` | TypeScript type definitions shared across all packages |
| `@magnolia/gpc-client` | Typed HTTP client for the GPC-CRES FastAPI gateway |
| `@magnolia/mcp-server` | Cloudflare Worker MCP server — registers all tools and resources |
| `@magnolia/widgets` | React widget components built with Vite |

## MCP Tools Reference

### Parcel Intelligence
| Tool | Description |
|------|-------------|
| `search_parcels` | Natural language search across 198K EBR parcels (spatial + attribute) |
| `screen_property` | 7-layer environmental/regulatory screening |
| `check_zoning` | Zoning compliance and use analysis |
| `get_flood_risk` | FEMA flood zone analysis with BFE data |
| `search_ownership` | Ownership history and contact lookups |

### Deal Management
| Tool | Description |
|------|-------------|
| `get_deal_status` | Retrieve deal details by ID or name |
| `create_deal` | Create a new deal in the pipeline |
| `update_deal_status` | Move a deal through pipeline stages |
| `analyze_deal` | AI-powered deal analysis with financial projections |
| `generate_investment_memo` | Generate a full investment memo |

### Market Intelligence
| Tool | Description |
|------|-------------|
| `get_market_data` | FRED/BLS/Census/BEA/HUD economic data |
| `get_demographics` | Census demographic profiles by geography |
| `run_comps` | Sales and lease comp analysis |

### Documents & Knowledge
| Tool | Description |
|------|-------------|
| `search_documents` | Semantic search across deal documents (Qdrant) |
| `search_knowledge` | Search company knowledge base |
| `fetch_knowledge` | Fetch full knowledge base article |

### Workflows
| Tool | Description |
|------|-------------|
| `run_due_diligence` | Trigger full due diligence Temporal workflow |
| `schedule_screening` | Schedule batch property screening |

### Rendering (Widget Output)
| Tool | Description |
|------|-------------|
| `render_parcel_map` | Interactive MapLibre GL parcel map |
| `render_deal_dashboard` | Deal metrics and timeline dashboard |
| `render_market_report` | Market data charts and summaries |
| `render_comp_grid` | Comparable properties grid |
| `render_screening_results` | 7-layer screening results panel |
| `render_portfolio_view` | Portfolio overview across all deals |
| `render_document_viewer` | Document viewer with highlights |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Wrangler CLI** 3.100+ (`pnpm add -g wrangler`)
- A Cloudflare account with Workers enabled

## Setup

```bash
# Clone the repository
git clone https://github.com/gallagherpropco/magnolia-chatgpt-app.git
cd magnolia-chatgpt-app

# Install dependencies
pnpm install

# Configure secrets (do not commit these)
cp .env.example .env.local
# Edit .env.local with your API key

# Set Wrangler secret
wrangler secret put GPC_API_KEY
```

## Development

```bash
# Run all packages in watch mode
pnpm dev

# Run just the worker in local mode
pnpm dev:worker

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

## Build

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter @magnolia/mcp-server build
```

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy

# Deploy with environment
wrangler deploy --env production
```

After deployment, register the MCP server endpoint in your ChatGPT App configuration:
- **MCP Server URL**: `https://magnolia-chatgpt-app.<your-subdomain>.workers.dev/mcp`

## Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `GPC_GATEWAY_URL` | GPC-CRES FastAPI gateway URL | `wrangler.toml` (non-secret) |
| `GPC_API_KEY` | API key for gateway authentication | Wrangler secret |
| `ENVIRONMENT` | `production` or `development` | `wrangler.toml` |

## Developer Mode

This app runs in **Developer Mode** only — single user (Blake Gallagher), no OAuth flow needed. Authentication is handled via API key in the `Authorization: Bearer` header passed from the gateway config.
