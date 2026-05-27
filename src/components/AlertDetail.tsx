import type { Candidate, ReviewAction, ScreeningResult } from "../api/types";
import { formatProvider, formatScreeningType, formatShortDateTime } from "./formatters";
import { riskClass } from "./risk";

interface AlertDetailProps {
  candidate?: Candidate | null;
  result: ScreeningResult | null;
  onReview: (action: ReviewAction) => void;
}

export function AlertDetail({ candidate, result }: AlertDetailProps) {
  const finding = result?.findings[0];
  const review = result?.metadata.review;
  const email = candidate?.identity.identifiers.email;
  const providerLabel = result?.vendor ? formatProvider(result.vendor) : "-";
  const screeningLabel = result?.screening_type ? formatScreeningType(result.screening_type) : "-";
  const clearMessage = result ? getClearMessage(result) : "";

  return (
    <div className="card detail-card">
      <div className="detail-head">
        <div>
          <div className="eyebrow">Result Detail</div>
          <h3 className="detail-title">
            {result ? `${providerLabel} · ${screeningLabel}` : "No result selected"}
          </h3>
        </div>
        <span className={`badge ${result ? riskClass(result.risk_level) : ""}`}>
          {result?.risk_level.toUpperCase() ?? "N/A"}
        </span>
      </div>

      {!result ? (
        <div className="muted">Select a screening result to inspect the normalized decision.</div>
      ) : (
        <>
          {candidate ? (
            <div className="detail-grid">
              <DetailItem label="Candidate" value={candidate.identity.full_name} />
              <DetailItem label="Email" value={typeof email === "string" ? email : "-"} />
              <DetailItem label="DOB" value={candidate.identity.date_of_birth ?? "-"} />
              <DetailItem label="Nationality" value={candidate.identity.nationality ?? "-"} />
            </div>
          ) : null}
          <div className="detail-grid">
            <DetailItem label="Provider" value={providerLabel} />
            <DetailItem label="Check Type" value={screeningLabel} />
            <DetailItem label="Match Status" value={result.match_status} />
            <DetailItem label="Risk Score" value={String(result.risk_score)} />
            <DetailItem label="Findings" value={String(result.findings.length)} />
            <DetailItem label="Completed" value={formatShortDateTime(result.completed_at)} />
          </div>
          {finding ? (
            <>
              <div className="section-label">Top Finding</div>
              <div className="detail-grid">
                <DetailItem label="Source" value={finding.source} />
                <DetailItem label="Match Score" value={String(finding.match_score)} />
                <DetailItem label="Matched Name" value={finding.matched_name ?? "-"} />
                <DetailItem label="Severity" value={finding.severity ?? "-"} />
              </div>
              <div className="rationale">{finding.details ?? "No details supplied."}</div>
            </>
          ) : (
            <div className="clear-result">
              <strong>Clear result</strong>
              <span>{clearMessage}</span>
              <span className="evidence-hint">Request and response evidence is archived in Vendor Evidence.</span>
            </div>
          )}
        </>
      )}

      {result && review ? (
        <div className="review-actions">
          <div className="muted">
            Analyst decision: <strong>{review.action.split("_").join(" ")}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getClearMessage(result: ScreeningResult): string {
  if (result.screening_type === "pep_sanctions") {
    return "No sanctions or PEP matches were returned by the configured provider.";
  }
  if (result.screening_type === "adverse_media" && result.vendor === "brandmentions") {
    return "No adverse media mentions were returned by Brandmentions from the configured sources.";
  }
  if (result.screening_type === "adverse_media") {
    return "No adverse media findings were returned for this normalized screening result.";
  }
  return "No vendor findings were returned for this normalized screening result.";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
