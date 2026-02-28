// ─── Deal Stage ───────────────────────────────────────────────────────────────

/** Pipeline stages for a commercial real estate deal */
export type DealStage =
  | 'prospect'
  | 'triage'
  | 'loi'
  | 'under_contract'
  | 'due_diligence'
  | 'closing'
  | 'closed'
  | 'dead';

// ─── Deal Financials ──────────────────────────────────────────────────────────

/** Financial metrics for a deal */
export interface DealFinancials {
  /** Agreed purchase price in USD */
  purchase_price: number | null;
  /** Capitalization rate as decimal (e.g. 0.065 = 6.5%) */
  cap_rate: number | null;
  /** Net Operating Income in USD/year */
  noi: number | null;
  /** Internal rate of return as decimal */
  irr: number | null;
  /** Cash-on-cash return as decimal */
  cash_on_cash: number | null;
  /** Debt service coverage ratio */
  dscr: number | null;
  /** Equity multiple (e.g. 2.1x) */
  equity_multiple: number | null;
  /** Projected exit value in USD */
  exit_value: number | null;
  /** Hold period in years */
  hold_period_years: number | null;
  /** Loan-to-value ratio as decimal */
  ltv: number | null;
  /** Equity invested in USD */
  equity_invested: number | null;
}

// ─── Key Dates ────────────────────────────────────────────────────────────────

/** Important milestone dates for a deal */
export interface DealKeyDates {
  /** LOI execution date (ISO 8601) */
  loi_date: string | null;
  /** Purchase agreement date (ISO 8601) */
  contract_date: string | null;
  /** Due diligence expiration (ISO 8601) */
  due_diligence_expiry: string | null;
  /** Financing contingency deadline (ISO 8601) */
  financing_deadline: string | null;
  /** Projected closing date (ISO 8601) */
  closing_date: string | null;
  /** Actual closing date (ISO 8601) */
  closed_date: string | null;
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

/** A GPC commercial real estate deal */
export interface Deal {
  /** Internal UUID */
  id: string;
  /** Deal name (e.g. "3045 Florida Blvd Acquisition") */
  name: string;
  /** Unique SKU (e.g. "GPC-2024-047") */
  sku: string;
  /** Current pipeline stage */
  status: DealStage;
  /** Jurisdiction (e.g. "East Baton Rouge Parish, LA") */
  jurisdiction: string;
  /** Associated parcel IDs */
  parcels: string[];
  /** Key milestone dates */
  key_dates: DealKeyDates;
  /** Financial underwriting */
  financials: DealFinancials;
  /** Property type */
  property_type: string;
  /** Gross square footage */
  gross_sf: number | null;
  /** Net leasable area in SF */
  nla_sf: number | null;
  /** Current occupancy as decimal (0–1) */
  occupancy: number | null;
  /** Deal notes (markdown) */
  notes: string;
  /** Risk score 0–100 */
  risk_score: number | null;
  /** Assigned team member user IDs */
  assignees: string[];
  /** Tags for categorization */
  tags: string[];
  /** When the deal was created (ISO 8601) */
  created_at: string;
  /** When the deal was last updated (ISO 8601) */
  updated_at: string;
}

// ─── Deal Input Types ─────────────────────────────────────────────────────────

/** Input for creating a new deal */
export interface CreateDealInput {
  name: string;
  jurisdiction: string;
  parcels?: string[];
  property_type?: string;
  notes?: string;
  financials?: Partial<DealFinancials>;
  key_dates?: Partial<DealKeyDates>;
  tags?: string[];
}

/** Input for updating a deal */
export interface UpdateDealInput {
  name?: string;
  status?: DealStage;
  jurisdiction?: string;
  parcels?: string[];
  notes?: string;
  financials?: Partial<DealFinancials>;
  key_dates?: Partial<DealKeyDates>;
  tags?: string[];
  risk_score?: number;
}

/** Result of a deal stage transition */
export interface DealStageTransition {
  deal_id: string;
  from_stage: DealStage;
  to_stage: DealStage;
  transitioned_at: string;
  notes: string | null;
}
