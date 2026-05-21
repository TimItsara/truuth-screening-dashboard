import type { Candidate } from "../api/types";

interface ReviewQueueProps {
  candidates: Candidate[];
}

export function ReviewQueue({ candidates }: ReviewQueueProps) {
  return (
    <div className="card side-card">
      <div className="panel-header">
        <h3 className="panel-title">Review Queue</h3>
      </div>
      {candidates.length === 0 ? (
        <div className="queue-empty">Seed data to populate candidates.</div>
      ) : (
        candidates.map((candidate) => (
          <button className="queue-row" type="button" key={candidate.id}>
            <span className="row-title">{candidate.identity.full_name}</span>
            <span className="badge">{String(candidate.metadata.expected ?? "DEMO")}</span>
          </button>
        ))
      )}
    </div>
  );
}
