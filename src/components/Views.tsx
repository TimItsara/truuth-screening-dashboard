import type {
  Candidate,
  DashboardRun,
  ReviewAction,
  ResumeExtractionHistoryItem,
  ResumeUploadResponse,
  ScreeningResult,
  TaskRun,
  VendorConfig,
  VendorExecution,
} from "../api/types";
import type { ChangeEvent } from "react";
import { AlertDetail } from "./AlertDetail";
import { OpsPanel } from "./OpsPanel";
import { ResultsList } from "./ResultsList";
import { ReviewQueue } from "./ReviewQueue";
import { SubjectSummary } from "./SubjectSummary";
import { DEMO_MODE, type AppView } from "./viewTypes";

interface ViewProps {
  activeView: AppView;
  candidates: Candidate[];
  dashboard: DashboardRun | null;
  selectedResult: ScreeningResult | null;
  vendors: VendorConfig[];
  vendorExecutions: VendorExecution[];
  tasks: TaskRun[];
  resumeExtraction: ResumeUploadResponse | null;
  resumeHistory: ResumeExtractionHistoryItem[];
  onSelectResult: (result: ScreeningResult) => void;
  onRunScreening: () => void;
  onRunSingleTest: () => void;
  onUploadResume: (file: File) => void;
  onRunExtractedCandidate: () => void;
  onSelectResumeExtraction: (item: ResumeExtractionHistoryItem) => void;
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
    case "resume":
      return <ResumeIntakeView {...props} />;
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

function ResumeIntakeView({
  resumeExtraction,
  resumeHistory,
  onUploadResume,
  onRunExtractedCandidate,
  onSelectResumeExtraction,
}: ViewProps) {
  const candidate = resumeExtraction?.candidate ?? null;
  const extraction = resumeExtraction?.extraction ?? null;
  const identifiers = candidate?.identity.identifiers ?? {};

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) {
      onUploadResume(file);
      event.currentTarget.value = "";
    }
  }

  return (
    <div className="dashboard-grid">
      <section className="stack">
        <div className="card detail-card">
          <div className="eyebrow">Resume Intake</div>
          <h2 className="detail-title">Upload PDF Resume</h2>
          <p className="subject-meta">
            Upload one PDF resume, extract an internal candidate profile, then run configured vendor checks from that profile.
          </p>
          <div className="upload-zone">
            <input id="resume-upload" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
            <label className="btn primary" htmlFor="resume-upload">Choose PDF</label>
            <span className="muted">PDF only · first configured pages · file not retained</span>
          </div>
        </div>

        <div className="card detail-card">
          <div className="panel-header">
            <h3 className="panel-title">Candidate Profile</h3>
            <div className="toolbar compact">
              <button className="btn accent" type="button" onClick={onRunExtractedCandidate} disabled={!candidate}>
                Run Vendor Tests
              </button>
            </div>
          </div>
          {!candidate ? (
            <div className="result-empty">Upload a resume or select a record from history.</div>
          ) : (
            <>
              <div className="candidate-summary-grid">
                <ProfileField label="Full Name" value={candidate.identity.full_name} />
                <ProfileField label="Email" value={String(identifiers.email ?? "-")} />
                <ProfileField label="Phone" value={String(identifiers.phone ?? "-")} />
                <ProfileField label="DOB" value={candidate.identity.date_of_birth ?? "-"} />
                <ProfileField label="Nationality" value={candidate.identity.nationality ?? "-"} />
                <ProfileField label="Location" value={candidate.identity.locations[0] ?? "-"} />
              </div>
              <div className="selected-evidence">
                <ProfileField label="Model" value={String(extraction?.model ?? "-")} />
                <ProfileField label="Latency" value={extraction?.latency_s ? `${extraction.latency_s}s` : "-"} />
                <ProfileField label="Input Tokens" value={String(extraction?.input_tokens ?? "-")} />
                <ProfileField label="Output Tokens" value={String(extraction?.output_tokens ?? "-")} />
              </div>
              {extraction ? (
                <details className="raw-json">
                  <summary>Extraction JSON</summary>
                  <pre>{JSON.stringify(extraction, null, 2)}</pre>
                </details>
              ) : null}
            </>
          )}
        </div>
      </section>

      <aside className="stack">
        <div className="card detail-card">
          <div className="panel-header">
            <h3 className="panel-title">Upload History</h3>
            <span className="muted">{resumeHistory.length} records</span>
          </div>
          {resumeHistory.length === 0 ? (
            <div className="result-empty">No resume uploads yet.</div>
          ) : (
            <div className="history-list">
              {resumeHistory.map((item) => (
                <ResumeHistoryItem
                  item={item}
                  isActive={item.candidate.id === candidate?.id}
                  key={item.candidate.id}
                  onSelect={onSelectResumeExtraction}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ResumeHistoryItem({
  item,
  isActive,
  onSelect,
}: {
  item: ResumeExtractionHistoryItem;
  isActive: boolean;
  onSelect: (item: ResumeExtractionHistoryItem) => void;
}) {
  const candidate = item.candidate;
  const fileName = String(candidate.metadata.file_name ?? item.extraction.source_file ?? "-");
  const createdAt = new Date(candidate.created_at).toLocaleString();

  return (
    <button
      className={`history-item ${isActive ? "active" : ""}`}
      type="button"
      onClick={() => onSelect(item)}
    >
        <span>
          <strong>{candidate.identity.full_name}</strong>
          <small>{fileName}</small>
        </span>
        <span>{createdAt}</span>
    </button>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="profile-value">{value || "-"}</div>
    </div>
  );
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
  onSelectResult,
  onReviewResult,
}: ViewProps) {
  const results = dashboard?.results ?? [];
  const runCount = Number(dashboard?.run.metadata.source_run_count ?? (dashboard ? 1 : 0));
  const historicalResultCount = Number(dashboard?.run.metadata.historical_result_count ?? results.length);
  const resultLabel = dashboard
    ? `${results.length} latest checks${historicalResultCount > results.length ? ` from ${historicalResultCount} results` : ""}${runCount > 1 ? ` across ${runCount} runs` : ""}`
    : undefined;
  const selectedCandidate = selectedResult
    ? candidates.find((candidate) => candidate.id === selectedResult.entity_id) ?? null
    : null;
  return (
    <div className="dashboard-grid">
      <section className="stack">
        <ResultsList
          runId={resultLabel}
          candidates={candidates}
          results={results}
          selectedResult={selectedResult}
          onSelect={onSelectResult}
        />
      </section>
      <aside className="stack">
        <SubjectSummary result={selectedResult} candidates={candidates} />
        <AlertDetail candidate={selectedCandidate} result={selectedResult} onReview={onReviewResult} />
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
    <div className="stack">
        <div className="card detail-card">
          <div className="eyebrow">Vendor Evidence</div>
          <h2 className="detail-title">Execution Evidence</h2>
          <p className="subject-meta">
            Inspect archived provider calls, HTTP status, endpoints, and redacted raw response evidence.
          </p>
          {!DEMO_MODE && (
            <div className="toolbar" style={{ marginTop: 16 }}>
              <button className="btn" type="button" onClick={onSchedule}>Trigger Schedule</button>
              <button className="btn" type="button" onClick={onWebhook}>Simulate Webhook</button>
            </div>
          )}
        </div>
        <OpsPanel dashboard={dashboard} vendorExecutions={vendorExecutions} tasks={tasks} />
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
