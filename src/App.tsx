import { useEffect, useMemo, useState } from "react";
import { ApiClient } from "./api/client";
import { loadApiBaseUrl, saveApiBaseUrl } from "./api/storage";
import type {
  Candidate,
  DashboardRun,
  ReviewAction,
  ResumeUploadResponse,
  ScreeningResult,
  TaskRun,
  VendorConfig,
  VendorExecution,
} from "./api/types";
import { ActiveView } from "./components/Views";
import { DemoToolbar } from "./components/DemoToolbar";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { StatusBanner, type StatusTone } from "./components/StatusBanner";
import { DEMO_MODE, defaultView, visibleViews, type AppView } from "./components/viewTypes";

interface StatusState {
  message: string;
  tone: StatusTone;
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(loadApiBaseUrl);
  const [status, setStatus] = useState<StatusState>({
    message: "Ready. Upload a resume or select an existing extraction.",
    tone: "default",
  });
  const [isBusy, setIsBusy] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboard, setDashboard] = useState<DashboardRun | null>(null);
  const [dashboardHistory, setDashboardHistory] = useState<DashboardRun[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);
  const [vendors, setVendors] = useState<VendorConfig[]>([]);
  const [vendorExecutions, setVendorExecutions] = useState<VendorExecution[]>([]);
  const [tasks, setTasks] = useState<TaskRun[]>([]);
  const [resumeExtraction, setResumeExtraction] = useState<ResumeUploadResponse | null>(null);
  const [resumeHistory, setResumeHistory] = useState<ResumeUploadResponse[]>([]);
  const [activeView, setActiveView] = useState<AppView>(defaultView);

  const api = useMemo(() => new ApiClient(apiBaseUrl), [apiBaseUrl]);
  const sessionDashboard = useMemo(
    () => combineDashboards(dashboardHistory, candidates),
    [dashboardHistory, candidates],
  );
  const pageContent = getPageContent(activeView);

  function updateStatus(message: string, tone: StatusTone = "default") {
    setStatus({ message, tone });
  }

  async function runAction(action: () => Promise<void>) {
    setIsBusy(true);
    try {
      await action();
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "Unexpected dashboard error", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshOps() {
    const [vendorConfig, executions, taskRuns] = await Promise.all([
      api.listVendors(),
      api.listVendorExecutions(),
      api.listTasks(),
    ]);
    setVendors(vendorConfig.vendors);
    setVendorExecutions(executions);
    setTasks(taskRuns);
    return { vendors: vendorConfig.vendors, executions, taskRuns };
  }

  async function refreshResumeHistory() {
    const history = await api.listResumeExtractions();
    setResumeHistory(history);
    setCandidates((current) => mergeCandidates(current, history.map((item) => item.candidate)));
    if (!resumeExtraction && history[0]) {
      setResumeExtraction(history[0]);
    }
    return history;
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listResumeExtractions(),
      api.listCandidates().catch(() => []),
      api.listDashboardRuns().catch(() => []),
      api.listVendorExecutions().catch(() => []),
      api.listVendors().catch(() => ({ vendors: [] })),
    ])
      .then(([history, loadedCandidates, dashboards, executions, vendorConfig]) => {
        if (!active) {
          return;
        }
        setResumeHistory(history);
        setCandidates((current) => mergeCandidates(
          current,
          [...loadedCandidates, ...history.map((item) => item.candidate)],
        ));
        setResumeExtraction((current) => current ?? history[0] ?? null);
        setDashboardHistory(dashboards.slice().reverse());
        setDashboard((current) => current ?? dashboards[0] ?? null);
        setSelectedResult((current) => current ?? firstInterestingResult(dashboards[0] ?? null));
        setVendorExecutions(executions);
        setVendors(vendorConfig.vendors);
      })
      .catch(() => {
        if (active) {
          setResumeHistory([]);
        }
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function ensureCandidates(): Promise<Candidate[]> {
    if (candidates.length > 0) {
      return candidates;
    }
    updateStatus("No candidates loaded. Seeding first...");
    const seed = await api.seed();
    setCandidates(seed.candidates);
    return seed.candidates;
  }

  async function completeScreening(candidateIds: string[], label: string) {
    updateStatus(`Running ${label} with configured providers...`);
    const run = await api.runScreening(candidateIds);
    const nextDashboard = await api.getDashboardRun(run.id);
    const firstInteresting =
      nextDashboard.results.find((result) => result.findings.length > 0) ?? nextDashboard.results[0] ?? null;

    setDashboard(nextDashboard);
    setDashboardHistory((current) => mergeDashboards(current, nextDashboard));
    setSelectedResult(firstInteresting);
    await refreshOps();
    updateStatus(`${label} completed with status ${nextDashboard.run.status}.`, "success");
  }

  async function seedData() {
    await runAction(async () => {
      updateStatus("Seeding demo candidates...");
      const seed = await api.seed();
      setCandidates(seed.candidates);
      await refreshOps();
      updateStatus(`Seeded ${seed.candidate_count} candidates.`, "success");
    });
  }

  async function resetDemo() {
    await runAction(async () => {
      updateStatus("Resetting demo data...");
      const seed = await api.resetDemo();
      setCandidates(seed.candidates);
      setDashboard(null);
      setDashboardHistory([]);
      setSelectedResult(null);
      setResumeExtraction(null);
      setResumeHistory([]);
      setVendorExecutions([]);
      setTasks([]);
      await refreshOps();
      updateStatus(`Session reset with ${seed.candidate_count} available candidates.`, "success");
    });
  }

  async function runScreening() {
    await runAction(async () => {
      const subjectCandidates = await ensureCandidates();
      await completeScreening(subjectCandidates.slice(0, 6).map((candidate) => candidate.id), "Screening run");
    });
  }

  async function runSingleTest() {
    await runAction(async () => {
      const subjectCandidates = await ensureCandidates();
      const candidate = subjectCandidates[0];
      if (!candidate) {
        throw new Error("No candidate available for single test.");
      }
      await completeScreening([candidate.id], `Single test for ${candidate.identity.full_name}`);
    });
  }

  async function uploadResume(file: File) {
    await runAction(async () => {
      updateStatus(`Extracting identity from ${file.name}...`);
      const upload = await api.uploadResume(file);
      setResumeExtraction(upload);
      setCandidates((current) => {
        const existing = current.filter((candidate) => candidate.id !== upload.candidate.id);
        return [upload.candidate, ...existing];
      });
      await refreshResumeHistory();
      setActiveView("resume");
      updateStatus(`Extracted ${upload.candidate.identity.full_name}. Candidate is ready for vendor tests.`, "success");
    });
  }

  async function runExtractedCandidate() {
    await runAction(async () => {
      if (!resumeExtraction?.candidate) {
        throw new Error("Upload and extract a resume before running vendor tests.");
      }
      await completeScreening(
        [resumeExtraction.candidate.id],
        `Vendor test for ${resumeExtraction.candidate.identity.full_name}`,
      );
    });
  }

  function selectResumeExtraction(item: ResumeUploadResponse) {
    setResumeExtraction(item);
    setCandidates((current) => {
      const existing = current.filter((candidate) => candidate.id !== item.candidate.id);
      return [item.candidate, ...existing];
    });
    updateStatus(`Selected ${item.candidate.identity.full_name} for vendor testing.`, "success");
  }

  async function triggerSchedule() {
    await runAction(async () => {
      const schedule = await api.createSchedule();
      const trigger = await api.triggerSchedule(schedule.id);
      await refreshOps();
      updateStatus(`Schedule trigger queued task ${trigger.task.id}.`, "success");
    });
  }

  async function simulateWebhook() {
    await runAction(async () => {
      const { executions } = vendorExecutions.length ? { executions: vendorExecutions } : await refreshOps();
      const currentRunExecutions = dashboard
        ? executions.filter((item) => item.run_id === dashboard.run.id)
        : [];
      const execution = currentRunExecutions[0] ?? executions[0];
      if (!execution) {
        throw new Error("No vendor execution available. Run screening first.");
      }
      await api.simulateWebhook(execution);
      await refreshOps();
      updateStatus(`Webhook simulated for ${execution.vendor}.`, "success");
    });
  }

  async function reviewSelectedResult(action: ReviewAction) {
    await runAction(async () => {
      if (!selectedResult) {
        throw new Error("No screening result selected.");
      }
      await api.reviewResult(selectedResult.id, action);
      if (dashboard) {
        const refreshed = await api.getDashboardRun(dashboard.run.id);
        const refreshedSelection =
          refreshed.results.find((result) => result.id === selectedResult.id) ?? selectedResult;
        setDashboard(refreshed);
        setDashboardHistory((current) => mergeDashboards(current, refreshed));
        setSelectedResult(refreshedSelection);
      }
      updateStatus(`Review action '${action}' saved.`, "success");
    });
  }

  function saveApi() {
    saveApiBaseUrl(apiBaseUrl);
    updateStatus("API base URL saved.", "success");
  }

  function changeView(view: AppView) {
    setActiveView(visibleViews.includes(view) ? view : defaultView);
  }

  return (
    <div className="app-shell">
      <Header apiBaseUrl={apiBaseUrl} onApiBaseUrlChange={setApiBaseUrl} onSave={saveApi} />
      <div className="layout">
        <Sidebar activeView={activeView} onViewChange={changeView} />
        <main className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {DEMO_MODE ? pageContent.title : "Adverse Media, PEP & Sanctions Review"}
              </h1>
              <p className="page-copy">
                {DEMO_MODE
                  ? pageContent.copy
                  : "Run a demo screening flow and inspect normalized alerts from Truuth Worker."}
              </p>
            </div>
            <DemoToolbar
              isBusy={isBusy}
              onSeed={seedData}
              onRun={runScreening}
              onRunSingle={runSingleTest}
              onSchedule={triggerSchedule}
              onWebhook={simulateWebhook}
              onReset={resetDemo}
            />
          </div>

          <StatusBanner message={status.message} tone={status.tone} />
          <StatsCards
            subjectsCount={candidates.length}
            dashboard={sessionDashboard}
            activeView={activeView}
            resumeExtraction={resumeExtraction}
            resumeHistoryCount={resumeHistory.length}
            vendors={vendors}
            vendorExecutions={vendorExecutions}
          />
          <ActiveView
            activeView={activeView}
            candidates={candidates}
            dashboard={sessionDashboard}
            selectedResult={selectedResult}
            vendors={vendors}
            vendorExecutions={vendorExecutions}
            tasks={tasks}
            resumeExtraction={resumeExtraction}
            resumeHistory={resumeHistory}
            onSelectResult={setSelectedResult}
            onRunScreening={runScreening}
            onRunSingleTest={runSingleTest}
            onUploadResume={uploadResume}
            onRunExtractedCandidate={runExtractedCandidate}
            onSelectResumeExtraction={selectResumeExtraction}
            onSeed={seedData}
            onSchedule={triggerSchedule}
            onWebhook={simulateWebhook}
            onReviewResult={reviewSelectedResult}
          />
        </main>
      </div>
      <footer className="footer">
        <span>Adverse Media / PEP / Sanctions screening</span>
        <span>Truuth Worker API integration prototype</span>
      </footer>
    </div>
  );
}

function getPageContent(view: AppView): { title: string; copy: string } {
  if (view === "resume") {
    return {
      title: "Resume Intake",
      copy: "Upload a PDF resume, extract a normalized candidate profile, and prepare it for vendor checks.",
    };
  }
  if (view === "review") {
    return {
      title: "Screening Results",
      copy: "Review normalized sanctions, PEP, and adverse media outcomes across the latest stored checks.",
    };
  }
  if (view === "reports") {
    return {
      title: "Vendor Evidence",
      copy: "Inspect archived provider calls, endpoints, HTTP status, and redacted request/response evidence.",
    };
  }
  return {
    title: "Resume Screening",
    copy: "Upload a PDF resume, extract a candidate profile, run vendor checks, and inspect evidence.",
  };
}

function mergeCandidates(current: Candidate[], additions: Candidate[]): Candidate[] {
  const byId = new Map<string, Candidate>();
  for (const candidate of current) {
    byId.set(candidate.id, candidate);
  }
  for (const candidate of additions) {
    byId.set(candidate.id, candidate);
  }
  return Array.from(byId.values());
}

function mergeDashboards(current: DashboardRun[], next: DashboardRun): DashboardRun[] {
  const byId = new Map<string, DashboardRun>();
  for (const dashboard of current) {
    byId.set(dashboard.run.id, dashboard);
  }
  byId.set(next.run.id, next);
  return Array.from(byId.values());
}

function combineDashboards(history: DashboardRun[], candidates: Candidate[]): DashboardRun | null {
  if (history.length === 0) {
    return null;
  }
  const latest = history[history.length - 1];
  const candidateNameById = new Map(candidates.map((candidate) => [candidate.id, candidate.identity.full_name]));
  const latestResultsByCheck = new Map<string, ScreeningResult>();
  let historicalResultCount = 0;
  for (const dashboard of history.slice().reverse()) {
    historicalResultCount += dashboard.results.length;
    for (const result of dashboard.results.slice().sort(compareNewestResult)) {
      const key = `${subjectKey(result, candidateNameById)}:${result.screening_type}`;
      const current = latestResultsByCheck.get(key);
      if (!current || shouldPreferResult(result, current)) {
        latestResultsByCheck.set(key, result);
      }
    }
  }
  const results = Array.from(latestResultsByCheck.values())
    .sort(compareNewestResult);
  const visibleCandidateCount = new Set(results.map((result) => subjectKey(result, candidateNameById))).size;
  const alerts = results.filter((result) => result.match_status === "ALERT" || result.match_status === "MATCH").length;
  const high = results.filter((result) => result.risk_level === "high").length;

  return {
    run: {
      ...latest.run,
      id: "session",
      result_count: results.length,
      metadata: {
        ...latest.run.metadata,
        source_run_count: history.length,
        source_run_ids: history.map((dashboard) => dashboard.run.id),
        historical_result_count: historicalResultCount,
        visible_candidate_count: visibleCandidateCount,
        latest_run_id: latest.run.id,
      },
    },
    summary: {
      total_results: results.length,
      alerts_or_matches: alerts,
      high_risk: high,
      clear: results.length - alerts,
    },
    results,
  };
}

function firstInterestingResult(dashboard: DashboardRun | null): ScreeningResult | null {
  if (!dashboard) {
    return null;
  }
  return dashboard.results.find((result) => result.findings.length > 0) ?? dashboard.results[0] ?? null;
}

function compareNewestResult(a: ScreeningResult, b: ScreeningResult): number {
  return timestampOf(b.completed_at) - timestampOf(a.completed_at);
}

function shouldPreferResult(candidate: ScreeningResult, current: ScreeningResult): boolean {
  if (isMockVendor(current.vendor) && !isMockVendor(candidate.vendor)) {
    return true;
  }
  if (!isMockVendor(current.vendor) && isMockVendor(candidate.vendor)) {
    return false;
  }
  return timestampOf(candidate.completed_at) > timestampOf(current.completed_at);
}

function isMockVendor(vendor: string): boolean {
  return vendor.startsWith("mock_");
}

function subjectKey(result: ScreeningResult, candidateNameById: Map<string, string>): string {
  const name = candidateNameById.get(result.entity_id);
  return name ? name.trim().toLowerCase() : result.entity_id;
}

function timestampOf(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
