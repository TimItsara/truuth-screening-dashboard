import type { ScreeningResult } from "../api/types";
import { riskClass } from "./risk";

interface ResultsListProps {
  runId?: string;
  results: ScreeningResult[];
  selectedResult: ScreeningResult | null;
  onSelect: (result: ScreeningResult) => void;
}

export function ResultsList({ runId, results, selectedResult, onSelect }: ResultsListProps) {
  return (
    <div className="card">
      <div className="panel-header">
        <h3 className="panel-title">Normalized Screening Results</h3>
        <span className="muted">{runId ?? ""}</span>
      </div>
      {results.length === 0 ? (
        <div className="result-empty">No results yet.</div>
      ) : (
        results.map((result) => (
          <button
            className={`result-row ${selectedResult?.id === result.id ? "selected" : ""}`}
            type="button"
            key={result.id}
            onClick={() => onSelect(result)}
          >
            <div>
              <div className="row-title">
                {result.entity_type}: {result.entity_id.slice(0, 8)} · {result.screening_type}
              </div>
              <div className="row-meta">
                {result.vendor} · score {result.risk_score} · findings {result.findings.length}
              </div>
            </div>
            <span className={`badge ${riskClass(result.risk_level)}`}>{result.match_status}</span>
          </button>
        ))
      )}
    </div>
  );
}
