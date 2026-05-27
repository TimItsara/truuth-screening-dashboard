import type { DashboardRun, ResumeUploadResponse, VendorConfig, VendorExecution } from "../api/types";
import type { AppView } from "./viewTypes";

interface StatsCardsProps {
  subjectsCount: number;
  dashboard: DashboardRun | null;
  activeView: AppView;
  resumeExtraction: ResumeUploadResponse | null;
  resumeHistoryCount: number;
  vendors: VendorConfig[];
  vendorExecutions: VendorExecution[];
}

export function StatsCards({
  subjectsCount,
  dashboard,
  activeView,
  resumeExtraction,
  resumeHistoryCount,
  vendors,
  vendorExecutions,
}: StatsCardsProps) {
  const currentRunExecutions = dashboard
    ? vendorExecutions.filter((execution) => execution.run_id === dashboard.run.id)
    : vendorExecutions;

  if (activeView === "resume") {
    const identity = resumeExtraction?.candidate.identity;
    const extractedFieldCount = identity
      ? [
          identity.full_name,
          identity.date_of_birth,
          identity.nationality,
          identity.identifiers.email,
          identity.identifiers.phone,
          identity.locations[0],
        ].filter(Boolean).length
      : 0;
    return (
      <div className="stats-grid">
        <StatCard label="Resume Uploads" value={resumeHistoryCount} note="Stored extraction history" />
        <StatCard label="Extracted Fields" value={extractedFieldCount} note="Normalized identity" />
        <StatCard label="AI Latency" value={resumeExtraction?.extraction.latency_s ? `${resumeExtraction.extraction.latency_s}s` : "-"} note="Latest extraction" />
        <StatCard
          label="Token Usage"
          value={
            resumeExtraction
              ? Number(resumeExtraction.extraction.input_tokens ?? 0) +
                Number(resumeExtraction.extraction.output_tokens ?? 0)
              : "-"
          }
          note="Input + output"
        />
      </div>
    );
  }

  if (activeView === "reports") {
    const runCount = Number(dashboard?.run.metadata.source_run_count ?? 0);
    return (
      <div className="stats-grid">
        <StatCard label="Vendor Calls" value={vendorExecutions.length} note="Stored executions" />
        <StatCard
          label="Completed"
          value={vendorExecutions.filter((execution) => execution.status === "COMPLETED").length}
          note="Finished executions"
        />
        <StatCard
          label="Live Providers"
          value={vendors.filter((vendor) => vendor.mode === "live").length}
          note="Configured now"
        />
        <StatCard label="Archived Runs" value={runCount || "-"} note="Screening history" />
      </div>
    );
  }

  const summary = dashboard?.summary;
  const screenedCandidates = dashboard
    ? Number(dashboard.run.metadata.visible_candidate_count ?? new Set(dashboard.results.map((result) => result.entity_id)).size)
    : subjectsCount;
  return (
    <div className="stats-grid">
      <StatCard
        label="Candidates Screened"
        value={screenedCandidates}
        note={dashboard ? "Unique candidates" : "Loaded profiles"}
      />
      <StatCard label="Alerts / Matches" value={summary?.alerts_or_matches ?? 0} note="Needs review" />
      <StatCard label="High Risk" value={summary?.high_risk ?? 0} note="Priority cases" />
      <StatCard label="Clear Results" value={summary?.clear ?? 0} note="No match outcome" />
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className="card stat-card">
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}
