import type { ReviewAction, ScreeningResult } from "../api/types";
import { riskClass } from "./risk";

interface AlertDetailProps {
  result: ScreeningResult | null;
  onReview: (action: ReviewAction) => void;
}

export function AlertDetail({ result, onReview }: AlertDetailProps) {
  const finding = result?.findings[0];
  const review = result?.metadata.review;

  return (
    <div className="card detail-card">
      <div className="detail-head">
        <div>
          <div className="eyebrow">Selected Alert Detail</div>
          <h3 className="detail-title">{finding?.title ?? result?.screening_type ?? "No alert selected"}</h3>
        </div>
        <span className={`badge ${result ? riskClass(result.risk_level) : ""}`}>
          {result?.risk_level.toUpperCase() ?? "N/A"}
        </span>
      </div>

      {!result ? (
        <div className="muted">Select a result with findings to inspect the normalized detail.</div>
      ) : !finding ? (
        <div className="muted">No findings for this normalized result.</div>
      ) : (
        <>
          <div className="detail-grid">
            <DetailItem label="Source" value={finding.source} />
            <DetailItem label="Match Score" value={String(finding.match_score)} />
            <DetailItem label="Matched Name" value={finding.matched_name ?? "-"} />
            <DetailItem label="Severity" value={finding.severity ?? "-"} />
          </div>
          <div className="rationale">{finding.details ?? "No details supplied."}</div>
        </>
      )}

      {result && (
        <div className="review-actions">
          <div className="muted">
            Review status: <strong>{review?.action ?? "pending"}</strong>
          </div>
          <div className="toolbar">
            <button className="btn success" type="button" onClick={() => onReview("accept")}>
              Accept
            </button>
            <button className="btn warning" type="button" onClick={() => onReview("request_verification")}>
              Request verification
            </button>
            <button className="btn" type="button" onClick={() => onReview("dismiss")}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
