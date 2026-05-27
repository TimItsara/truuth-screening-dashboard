import type { Candidate, ScreeningResult } from "../api/types";
import { formatProvider, formatScreeningType, formatShortDateTime } from "./formatters";
import { riskClass } from "./risk";

interface ResultsListProps {
  runId?: string;
  candidates?: Candidate[];
  results: ScreeningResult[];
  selectedResult: ScreeningResult | null;
  onSelect: (result: ScreeningResult) => void;
}

export function ResultsList({ runId, candidates = [], results, selectedResult, onSelect }: ResultsListProps) {
  return (
    <div className="card">
      <div className="panel-header">
        <h3 className="panel-title">Screening Results</h3>
        <span className="muted">{runId ?? ""}</span>
      </div>
      {results.length === 0 ? (
        <div className="result-empty">Run vendor tests from Resume Intake to populate this view.</div>
      ) : (
        results.map((result) => {
          const candidate = candidates.find((item) => item.id === result.entity_id);
          return (
            <button
              className={`result-row ${selectedResult?.id === result.id ? "selected" : ""}`}
              type="button"
              key={result.id}
              onClick={() => onSelect(result)}
            >
              <div>
                <div className="row-title">
                  {candidate?.identity.full_name ?? result.entity_id.slice(0, 8)} · {formatScreeningType(result.screening_type)}
                </div>
                <div className="row-meta">
                  {formatProvider(result.vendor)} · risk score {result.risk_score} · findings {result.findings.length} · last checked{" "}
                  {formatShortDateTime(result.completed_at)}
                </div>
              </div>
              <span className={`badge ${riskClass(result.risk_level)}`}>{result.match_status}</span>
            </button>
          );
        })
      )}
    </div>
  );
}
