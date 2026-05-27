import type {
  Candidate,
  DashboardRun,
  ReviewAction,
  ScreeningResult,
  TaskRun,
  VendorConfig,
  VendorExecution,
} from "../api/types";
import { AlertDetail } from "./AlertDetail";
import { OpsPanel } from "./OpsPanel";
import { ResultsList } from "./ResultsList";
import { ReviewQueue } from "./ReviewQueue";
import { SubjectSummary } from "./SubjectSummary";
import type { AppView } from "./viewTypes";

interface ViewProps {
  activeView: AppView;
  candidates: Candidate[];
  dashboard: DashboardRun | null;
  selectedResult: ScreeningResult | null;
  vendors: VendorConfig[];
  vendorExecutions: VendorExecution[];
  tasks: TaskRun[];
  onSelectResult: (result: ScreeningResult) => void;
  onRunScreening: () => void;
  onRunSingleTest: () => void;
  onSeed: () => void;
  onSchedule: () => void;
  onWebhook: () => void;
  onReviewResult: (action: ReviewAction) => void;
}

export function ActiveView(props: ViewProps) {
  const results = props.dashboard?.results ?? [];

  switch (props.activeView) {
    case "home":
      return <HomeView {...props} />;
    case "subjects":
      return <SubjectsView {...props} />;
    case "pep":
      return (
        <ResultsOnlyView
        title="PEP & Sanctions"
        copy="Focused view of normalized PEP and sanctions screening outcomes."
        results={results.filter((result) => result.screening_type === "pep_sanctions")}
        selectedResult={props.selectedResult}
        onSelectResult={props.onSelectResult}
        onReviewResult={props.onReviewResult}
      />
      );
    case "reports":
      return (
        <ReportsView
          dashboard={props.dashboard}
          vendorExecutions={props.vendorExecutions}
          tasks={props.tasks}
          onSchedule={props.onSchedule}
          onWebhook={props.onWebhook}
        />
      );
    case "providers":
      return <ProvidersView vendors={props.vendors} vendorExecutions={props.vendorExecutions} />;
    case "review":
    default:
      return <ReviewView {...props} />;
  }
}

function HomeView({ dashboard, candidates, onSeed, onRunScreening, onRunSingleTest }: ViewProps) {
  return (
    <div className="dashboard-grid">
      <section className="stack">
        <div className="card detail-card">
          <div className="eyebrow">Overview</div>
          <h2 className="detail-title">Screening Demo Control Room</h2>
          <p className="subject-meta">
            Use this app to seed subjects, test one subject against configured providers, and inspect normalized results from Truuth Worker.
          </p>
          <div className="toolbar" style={{ marginTop: 16 }}>
            <button className="btn primary" type="button" onClick={onSeed}>Seed Data</button>
            <button className="btn accent" type="button" onClick={onRunScreening}>Run Screening</button>
            <button className="btn" type="button" onClick={onRunSingleTest}>Run Single Test</button>
          </div>
        </div>
        <div className="card detail-card">
          <div className="eyebrow">Current Run</div>
          <div className="detail-grid">
            <HomeMetric label="Candidates Loaded" value={String(candidates.length)} />
            <HomeMetric label="Run Status" value={dashboard?.run.status ?? "-"} />
            <HomeMetric label="Alerts / Matches" value={String(dashboard?.summary.alerts_or_matches ?? 0)} />
            <HomeMetric label="High Risk" value={String(dashboard?.summary.high_risk ?? 0)} />
          </div>
        </div>
      </section>
      <aside className="stack">
        <ReviewQueue candidates={candidates} />
      </aside>
    </div>
  );
}

function HomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function SubjectsView({ candidates }: ViewProps) {
  return (
    <div className="card">
      <div className="panel-header">
        <h3 className="panel-title">Subject Management</h3>
        <span className="muted">{candidates.length} candidates</span>
      </div>
      {candidates.length === 0 ? (
        <div className="result-empty">No candidates loaded. Use Seed Data first.</div>
      ) : (
        candidates.map((candidate) => (
          <div className="result-row" key={candidate.id}>
            <div>
              <div className="row-title">{candidate.identity.full_name}</div>
              <div className="row-meta">
                DOB {candidate.identity.date_of_birth ?? "-"} · {candidate.identity.nationality ?? "-"} · {candidate.source}
              </div>
            </div>
            <span className="badge">{String(candidate.metadata.expected ?? "DEMO")}</span>
          </div>
        ))
      )}
    </div>
  );
}

function ReviewView({
  candidates,
  dashboard,
  selectedResult,
  vendorExecutions,
  tasks,
  onSelectResult,
  onReviewResult,
}: ViewProps) {
  const results = dashboard?.results ?? [];
  return (
    <div className="dashboard-grid">
      <section className="stack">
        <SubjectSummary result={selectedResult} candidates={candidates} />
        <ResultsList
          runId={dashboard?.run.id}
          results={results}
          selectedResult={selectedResult}
          onSelect={onSelectResult}
        />
        <AlertDetail result={selectedResult} onReview={onReviewResult} />
      </section>
      <aside className="stack">
        <ReviewQueue candidates={candidates} />
        <OpsPanel dashboard={dashboard} vendorExecutions={vendorExecutions} tasks={tasks} />
      </aside>
    </div>
  );
}

function ResultsOnlyView({
  title,
  copy,
  results,
  selectedResult,
  onSelectResult,
  onReviewResult,
}: {
  title: string;
  copy: string;
  results: ScreeningResult[];
  selectedResult: ScreeningResult | null;
  onSelectResult: (result: ScreeningResult) => void;
  onReviewResult: (action: ReviewAction) => void;
}) {
  return (
    <div className="dashboard-grid">
      <section className="stack">
        <div className="card detail-card">
          <div className="eyebrow">{title}</div>
          <p className="subject-meta">{copy}</p>
        </div>
        <ResultsList results={results} selectedResult={selectedResult} onSelect={onSelectResult} />
      </section>
      <aside className="stack">
        <AlertDetail result={selectedResult} onReview={onReviewResult} />
      </aside>
    </div>
  );
}

function ReportsView({
  dashboard,
  vendorExecutions,
  tasks,
  onSchedule,
  onWebhook,
}: Pick<ViewProps, "dashboard" | "vendorExecutions" | "tasks" | "onSchedule" | "onWebhook">) {
  return (
    <div className="dashboard-grid">
      <section className="stack">
        <div className="card detail-card">
          <div className="eyebrow">Compliance Reports</div>
          <h2 className="detail-title">Execution Evidence</h2>
          <p className="subject-meta">
            Inspect run metadata, vendor executions, task lifecycle state, and webhook behavior for audit discussion.
          </p>
          <div className="toolbar" style={{ marginTop: 16 }}>
            <button className="btn" type="button" onClick={onSchedule}>Trigger Schedule</button>
            <button className="btn" type="button" onClick={onWebhook}>Simulate Webhook</button>
          </div>
        </div>
      </section>
      <aside className="stack">
        <OpsPanel dashboard={dashboard} vendorExecutions={vendorExecutions} tasks={tasks} />
      </aside>
    </div>
  );
}

function ProvidersView({
  vendors,
  vendorExecutions,
}: {
  vendors: VendorConfig[];
  vendorExecutions: VendorExecution[];
}) {
  const configuredVendors =
    vendors.length > 0
      ? vendors
      : [
          { name: "mock_adverse_media", screening_type: "adverse_media", mode: "mock" },
          { name: "mock_pep_sanctions", screening_type: "pep_sanctions", mode: "mock" },
        ];
  return (
    <div className="card">
      <div className="panel-header">
        <h3 className="panel-title">Provider Config</h3>
        <span className="muted">Configured adapters</span>
      </div>
      {configuredVendors.map((vendor) => (
        <div className="result-row" key={vendor.name}>
          <div>
            <div className="row-title">{vendor.name}</div>
            <div className="row-meta">
              {vendor.screening_type} · {vendor.mode === "live" ? "live API" : "mock adapter"}
            </div>
          </div>
          <span className="badge">
            {vendor.mode} · {vendorExecutions.filter((item) => item.vendor === vendor.name).length} executions
          </span>
        </div>
      ))}
    </div>
  );
}
