export type RiskLevel = "low" | "medium" | "high";

export interface NormalizedIdentity {
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  aliases: string[];
  organizations: string[];
  locations: string[];
  keywords: string[];
  identifiers: Record<string, unknown>;
}

export interface Candidate {
  id: string;
  identity: NormalizedIdentity;
  source: string;
  status: string;
  promoted_employee_id?: string | null;
  metadata: Record<string, unknown>;
}

export interface Finding {
  source: string;
  title: string;
  url?: string | null;
  matched_name?: string | null;
  match_score: number;
  severity?: string | null;
  details?: string | null;
}

export interface ScreeningResult {
  id: string;
  run_id: string;
  payload_entry_id: string;
  entity_id: string;
  entity_type: string;
  vendor: string;
  screening_type: "adverse_media" | "pep_sanctions";
  match_status: string;
  risk_score: number;
  risk_level: RiskLevel;
  findings: Finding[];
  completed_at?: string | null;
  metadata: {
    review?: {
      action: ReviewAction;
      reviewer: string;
      note?: string | null;
    };
    [key: string]: unknown;
  };
}

export type ReviewAction = "accept" | "request_verification" | "dismiss";

export interface ScreeningRun {
  id: string;
  payload_run_id: string;
  batch_id?: string | null;
  status: string;
  result_count: number;
  metadata: Record<string, unknown>;
}

export interface DashboardRun {
  run: ScreeningRun;
  summary: {
    total_results: number;
    alerts_or_matches: number;
    high_risk: number;
    clear: number;
  };
  results: ScreeningResult[];
}

export interface SeedResponse {
  candidate_count: number;
  candidates: Candidate[];
}

export interface VendorExecution {
  id: string;
  run_id: string;
  payload_run_id: string;
  vendor: string;
  screening_type: string;
  status: string;
  external_execution_id?: string | null;
  raw_response: Record<string, unknown>;
}

export interface TaskRun {
  id: string;
  task_type: string;
  status: string;
  execution_id?: string | null;
  idempotency_key?: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string | null;
  last_failure_reason?: string | null;
  payload_snapshot: Record<string, unknown>;
}

export interface Schedule {
  id: string;
  name: string;
  frequency: string;
}

export interface ScheduleTriggerResponse {
  message: string;
  task: TaskRun;
}
