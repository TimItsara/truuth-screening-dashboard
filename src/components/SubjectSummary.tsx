import type { Candidate, ScreeningResult } from "../api/types";
import { riskClass } from "./risk";

interface SubjectSummaryProps {
  result: ScreeningResult | null;
  candidates: Candidate[];
}

export function SubjectSummary({ result, candidates }: SubjectSummaryProps) {
  const candidate = result ? candidates.find((item) => item.id === result.entity_id) : undefined;

  return (
    <div className="card subject-card">
      <div>
        <div className="eyebrow">Selected Subject</div>
        <h2 className="subject-name">{candidate?.identity.full_name ?? result?.entity_id ?? "No subject selected"}</h2>
        <div className="subject-meta">
          {candidate
            ? `DOB: ${candidate.identity.date_of_birth ?? "-"} | Nationality: ${candidate.identity.nationality ?? "-"}`
            : "Run screening to load results."}
        </div>
      </div>
      <div className={`risk-box ${result ? riskClass(result.risk_level) : ""}`}>
        <div className="eyebrow">Overall Risk</div>
        <strong>{result?.risk_level.toUpperCase() ?? "N/A"}</strong>
      </div>
    </div>
  );
}
