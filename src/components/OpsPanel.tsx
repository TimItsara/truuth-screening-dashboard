import { useEffect, useMemo, useState } from "react";
import type { DashboardRun, TaskRun, VendorExecution } from "../api/types";
import { formatProvider, formatScreeningType } from "./formatters";

interface OpsPanelProps {
  dashboard: DashboardRun | null;
  vendorExecutions: VendorExecution[];
  tasks: TaskRun[];
}

export function OpsPanel({ dashboard, vendorExecutions, tasks }: OpsPanelProps) {
  const sourceRunIds = Array.isArray(dashboard?.run.metadata.source_run_ids)
    ? dashboard.run.metadata.source_run_ids.filter((id): id is string => typeof id === "string")
    : [];
  const currentExecutions = sourceRunIds.length
    ? vendorExecutions.filter((execution) => sourceRunIds.includes(execution.run_id))
    : vendorExecutions;
  const executionsForDisplay = currentExecutions.slice().sort(compareNewestExecution).slice(0, 12);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const selectedExecution = useMemo(
    () => executionsForDisplay.find((execution) => execution.id === selectedExecutionId) ?? executionsForDisplay[0] ?? null,
    [executionsForDisplay, selectedExecutionId],
  );
  useEffect(() => {
    if (!selectedExecutionId && executionsForDisplay[0]) {
      setSelectedExecutionId(executionsForDisplay[0].id);
    }
  }, [executionsForDisplay, selectedExecutionId]);
  const latestRunId = typeof dashboard?.run.metadata.latest_run_id === "string"
    ? dashboard.run.metadata.latest_run_id
    : dashboard?.run.id;
  const sourceRunCount = Number(dashboard?.run.metadata.source_run_count ?? 0);
  const historicalResultCount = Number(dashboard?.run.metadata.historical_result_count ?? dashboard?.run.result_count ?? 0);

  return (
    <>
      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Evidence Archive Summary</h3>
          <span className="muted">{sourceRunCount ? `${sourceRunCount} runs` : "no runs loaded"}</span>
        </div>
        <dl className="meta-list">
          <Meta label="Latest Run ID" value={latestRunId ?? "-"} />
          <Meta label="Latest Batch ID" value={dashboard?.run.batch_id ?? "-"} />
          <Meta label="Latest Status" value={dashboard?.run.status ?? "-"} />
          <Meta label="Latest Checks" value={String(dashboard?.run.result_count ?? 0)} />
          <Meta label="Archived Results" value={String(historicalResultCount)} />
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
            {currentExecutions.length ? `${currentExecutions.length} archived calls` : "no calls loaded"}
          </span>
        </div>
        {executionsForDisplay.length === 0 ? (
          <div className="result-empty">No vendor executions yet.</div>
        ) : (
          <div className="evidence-table" role="table" aria-label="Vendor execution evidence">
            <div className="evidence-row evidence-head" role="row">
              <span>Provider</span>
              <span>Endpoint</span>
              <span>Type</span>
              <span>Status</span>
              <span>HTTP</span>
              <span>Result</span>
            </div>
            {executionsForDisplay.map((execution) => (
              <button
                className={`evidence-row evidence-button ${selectedExecution?.id === execution.id ? "selected" : ""}`}
                type="button"
                role="row"
                key={execution.id}
                onClick={() => setSelectedExecutionId(execution.id)}
              >
                <span>
                  <strong>{formatProvider(execution.vendor)}</strong>
                  <small>{truncateMiddle(execution.external_execution_id ?? execution.id)}</small>
                </span>
                <span>
                  <strong>{executionEndpoint(execution).method}</strong>
                  <small>{executionEndpoint(execution).endpoint}</small>
                </span>
                <span>{formatScreeningType(execution.screening_type)}</span>
                <span>
                  <span className={`badge ${execution.status === "COMPLETED" ? "low" : "high"}`}>
                    {execution.status}
                  </span>
                </span>
                <span>{executionHttpStatus(execution)}</span>
                <span>{executionResultSummary(execution)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedExecution ? (
        <div className="card detail-card">
          <div className="detail-head">
            <div>
              <div className="eyebrow">Selected Evidence</div>
              <h3 className="detail-title">
                {formatProvider(selectedExecution.vendor)} · {formatScreeningType(selectedExecution.screening_type)}
              </h3>
            </div>
            <span className={`badge ${selectedExecution.status === "COMPLETED" ? "low" : "high"}`}>
              {selectedExecution.status}
            </span>
          </div>
          <div className="detail-grid">
            <Meta label="Method" value={executionEndpoint(selectedExecution).method} />
            <Meta label="HTTP Status" value={executionHttpStatus(selectedExecution)} />
            <Meta label="Result" value={executionResultSummary(selectedExecution)} />
            <Meta label="Created" value={formatDateTime(selectedExecution.created_at)} />
            <Meta label="Endpoint" value={executionEndpoint(selectedExecution).endpoint} />
            <Meta label="Run ID" value={truncateMiddle(selectedExecution.run_id)} />
          </div>
          <details className="technical-details compact">
            <summary>Request Evidence</summary>
            <pre className="json-box">{JSON.stringify(executionRequest(selectedExecution), null, 2)}</pre>
          </details>
          <details className="technical-details compact">
            <summary>Raw Vendor Response</summary>
            <pre className="json-box">{JSON.stringify(selectedExecution.raw_response, null, 2)}</pre>
          </details>
        </div>
      ) : null}
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

function firstExecutionResult(execution: VendorExecution): Record<string, unknown> | null {
  const firstResult = Array.isArray(execution.raw_response?.results)
    ? execution.raw_response.results[0]
    : null;
  return firstResult && typeof firstResult === "object" ? firstResult as Record<string, unknown> : null;
}

function executionEndpoint(execution: VendorExecution): { method: string; endpoint: string } {
  const request = executionRequest(execution);
  if (request) {
    return {
      method: typeof request.method === "string" ? request.method : "-",
      endpoint: typeof request.endpoint === "string" ? request.endpoint : "-",
    };
  }
  return { method: "-", endpoint: "-" };
}

function executionRequest(execution: VendorExecution): Record<string, unknown> | null {
  const firstResult = firstExecutionResult(execution);
  const request = firstResult?.request;
  if (request && typeof request === "object") {
    return request as Record<string, unknown>;
  }
  return null;
}

function executionHttpStatus(execution: VendorExecution): string {
  const firstResult = firstExecutionResult(execution);
  const status = firstResult && typeof firstResult === "object" ? firstResult.status_code : null;
  return typeof status === "number" ? String(status) : "-";
}

function executionResultSummary(execution: VendorExecution): string {
  const firstResult = firstExecutionResult(execution);
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

function compareNewestExecution(a: VendorExecution, b: VendorExecution): number {
  return timestampOf(b.created_at) - timestampOf(a.created_at);
}

function timestampOf(value: unknown): number {
  if (typeof value !== "string") {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function truncateMiddle(value: string): string {
  if (value.length <= 32) {
    return value;
  }
  return `${value.slice(0, 14)}...${value.slice(-10)}`;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
