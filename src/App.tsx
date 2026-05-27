import { useMemo, useState } from "react";
import { ApiClient } from "./api/client";
import { loadApiBaseUrl, saveApiBaseUrl } from "./api/storage";
import type {
  Candidate,
  DashboardRun,
  ReviewAction,
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
import type { AppView } from "./components/viewTypes";

interface StatusState {
  message: string;
  tone: StatusTone;
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(loadApiBaseUrl);
  const [status, setStatus] = useState<StatusState>({
    message: "Ready. Start the FastAPI backend, then seed data.",
    tone: "default",
  });
  const [isBusy, setIsBusy] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboard, setDashboard] = useState<DashboardRun | null>(null);
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);
  const [vendors, setVendors] = useState<VendorConfig[]>([]);
  const [vendorExecutions, setVendorExecutions] = useState<VendorExecution[]>([]);
  const [tasks, setTasks] = useState<TaskRun[]>([]);
  const [activeView, setActiveView] = useState<AppView>("review");

  const api = useMemo(() => new ApiClient(apiBaseUrl), [apiBaseUrl]);

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
      setSelectedResult(null);
      setVendorExecutions([]);
      setTasks([]);
      await refreshOps();
      updateStatus(`Demo reset complete with ${seed.candidate_count} seeded candidates.`, "success");
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
        setSelectedResult(refreshedSelection);
      }
      updateStatus(`Review action '${action}' saved.`, "success");
    });
  }

  function saveApi() {
    saveApiBaseUrl(apiBaseUrl);
    updateStatus("API base URL saved.", "success");
  }

  return (
    <div className="app-shell">
      <div className="top-strip" />
      <Header apiBaseUrl={apiBaseUrl} onApiBaseUrlChange={setApiBaseUrl} onSave={saveApi} />
      <div className="layout">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">Adverse Media, PEP &amp; Sanctions Review</h1>
              <p className="page-copy">Run a demo screening flow and inspect normalized alerts from Truuth Worker.</p>
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
          <StatsCards subjectsCount={candidates.length} dashboard={dashboard} />
          <ActiveView
            activeView={activeView}
            candidates={candidates}
            dashboard={dashboard}
            selectedResult={selectedResult}
            vendors={vendors}
            vendorExecutions={vendorExecutions}
            tasks={tasks}
            onSelectResult={setSelectedResult}
            onRunScreening={runScreening}
            onRunSingleTest={runSingleTest}
            onSeed={seedData}
            onSchedule={triggerSchedule}
            onWebhook={simulateWebhook}
            onReviewResult={reviewSelectedResult}
          />
        </main>
      </div>
      <footer className="footer">
        <span>Adverse Media / PEP / Sanctions dashboard demo</span>
        <span>Truuth Worker API integration prototype</span>
      </footer>
    </div>
  );
}
