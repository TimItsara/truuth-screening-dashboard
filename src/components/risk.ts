import type { RiskLevel } from "../api/types";

export function riskClass(level: RiskLevel): string {
  if (level === "high") return "risk-high";
  if (level === "medium") return "risk-medium";
  return "risk-low";
}
