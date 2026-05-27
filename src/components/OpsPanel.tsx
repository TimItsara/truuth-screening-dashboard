import type { DashboardRun, TaskRun, VendorExecution } from "../api/types";

interface OpsPanelProps {
  dashboard: DashboardRun | null;
  vendorExecutions: VendorExecution[];
  tasks: TaskRun[];
}

export function OpsPanel({ dashboard, vendorExecutions, tasks }: OpsPanelProps) {
  const currentRunId = dashboard?.run.id;
  const currentExecutions = currentRunId
    ? vendorExecutions.filter((execution) => execution.run_id === currentRunId)
    : [];
  const executionsForDisplay = currentExecutions.length > 0 ? currentExecutions : vendorExecutions.slice(-4);
  const currentTasks = currentRunId
    ? tasks.filter((task) => task.execution_id === currentRunId || task.payload_snapshot?.run_id === currentRunId)
    : [];
  const tasksForDisplay = currentTasks.length > 0 ? currentTasks : tasks.slice(-4);

  return (
    <>
      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Run Metadata</h3>
          <span className="muted">{currentRunId ? "current run" : "no run selected"}</span>
        </div>
        <dl className="meta-list">
          <Meta label="Run ID" value={dashboard?.run.id ?? "-"} />
          <Meta label="Batch ID" value={dashboard?.run.batch_id ?? "-"} />
          <Meta label="Status" value={dashboard?.run.status ?? "-"} />
          <Meta label="Results" value={String(dashboard?.run.result_count ?? 0)} />
          <Meta
            label="Vendor Failures"
            value={String(dashboard?.run.metadata?.vendor_failure_count ?? 0)}
          />
        </dl>
      </div>

      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Vendor Execution Evidence</h3>
          <span className="muted">
            {currentExecutions.length ? `${currentExecutions.length} for current run` : "latest executions"}
          </span>
        </div>
        {executionsForDisplay.length === 0 ? (
          <div className="result-empty">No vendor executions yet.</div>
        ) : (
          <div className="evidence-table" role="table" aria-label="Vendor execution evidence">
            <div className="evidence-row evidence-head" role="row">
              <span>Provider</span>
              <span>Type</span>
              <span>Status</span>
              <span>HTTP</span>
              <span>Result</span>
            </div>
            {executionsForDisplay.map((execution) => (
              <div className="evidence-row" role="row" key={execution.id}>
                <span>
                  <strong>{execution.vendor}</strong>
                  <small>{execution.external_execution_id ?? "-"}</small>
                </span>
                <span>{execution.screening_type}</span>
                <span>
                  <span className={`badge ${execution.status === "COMPLETED" ? "low" : "high"}`}>
                    {execution.status}
                  </span>
                </span>
                <span>{executionHttpStatus(execution)}</span>
                <span>{executionResultSummary(execution)}</span>
              </div>
            ))}
          </div>
        )}
        <details className="technical-details">
          <summary>Raw current-run execution JSON</summary>
          <pre className="json-box">{JSON.stringify(executionsForDisplay, null, 2)}</pre>
        </details>
      </div>

      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Task Evidence</h3>
          <span className="muted">{tasksForDisplay.length} shown</span>
        </div>
        {tasksForDisplay.length === 0 ? (
          <div className="result-empty">No task records yet.</div>
        ) : (
          tasksForDisplay.map((task) => (
            <div className="result-row" key={task.id}>
              <div>
                <div className="row-title">{task.task_type}</div>
                <div className="row-meta">
                  {task.id.slice(0, 8)} · retries {task.retry_count}/{task.max_retries}
                </div>
              </div>
              <span className="badge">{task.status}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function executionHttpStatus(execution: VendorExecution): string {
  const firstResult = Array.isArray(execution.raw_response?.results)
    ? execution.raw_response.results[0]
    : null;
  const status = firstResult && typeof firstResult === "object" ? firstResult.status_code : null;
  return typeof status === "number" ? String(status) : "-";
}

function executionResultSummary(execution: VendorExecution): string {
  const firstResult = Array.isArray(execution.raw_response?.results)
    ? execution.raw_response.results[0]
    : null;
  if (!firstResult || typeof firstResult !== "object") {
    return "-";
  }
  const response = firstResult.response;
  if (response && typeof response === "object" && "count" in response) {
    return `matches ${String(response.count)}`;
  }
  if ("match" in firstResult) {
    return firstResult.match ? "match" : "clear";
  }
  if ("mentions" in firstResult && Array.isArray(firstResult.mentions)) {
    return `mentions ${firstResult.mentions.length}`;
  }
  return "-";
}
