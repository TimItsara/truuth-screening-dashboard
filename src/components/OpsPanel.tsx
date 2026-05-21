import type { DashboardRun, TaskRun, VendorExecution } from "../api/types";

interface OpsPanelProps {
  dashboard: DashboardRun | null;
  vendorExecutions: VendorExecution[];
  tasks: TaskRun[];
}

export function OpsPanel({ dashboard, vendorExecutions, tasks }: OpsPanelProps) {
  return (
    <>
      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Run Metadata</h3>
        </div>
        <dl className="meta-list">
          <Meta label="Run ID" value={dashboard?.run.id ?? "-"} />
          <Meta label="Batch ID" value={dashboard?.run.batch_id ?? "-"} />
          <Meta label="Status" value={dashboard?.run.status ?? "-"} />
        </dl>
      </div>

      <div className="card">
        <div className="panel-header">
          <h3 className="panel-title">Operational Hooks</h3>
        </div>
        <div style={{ padding: 16 }}>
          <div className="row-title">Vendor Executions</div>
          <pre className="json-box">{JSON.stringify(vendorExecutions, null, 2)}</pre>
          <div className="row-title" style={{ marginTop: 14 }}>Tasks</div>
          <pre className="json-box">{JSON.stringify(tasks, null, 2)}</pre>
        </div>
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
