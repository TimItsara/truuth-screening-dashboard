import type { DashboardRun } from "../api/types";

interface StatsCardsProps {
  subjectsCount: number;
  dashboard: DashboardRun | null;
}

export function StatsCards({ subjectsCount, dashboard }: StatsCardsProps) {
  const summary = dashboard?.summary;
  return (
    <div className="stats-grid">
      <StatCard label="Subjects" value={subjectsCount} />
      <StatCard label="Alerts / Matches" value={summary?.alerts_or_matches ?? 0} />
      <StatCard label="High Risk" value={summary?.high_risk ?? 0} />
      <StatCard label="Clear Results" value={summary?.clear ?? 0} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card stat-card">
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
