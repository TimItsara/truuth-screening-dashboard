export function formatProvider(value: string): string {
  if (value === "sanctions_io") {
    return "sanctions.io";
  }
  if (value === "brandmentions") {
    return "Brandmentions";
  }
  if (value.startsWith("mock_")) {
    return value.replace(/^mock_/, "").split("_").join(" ");
  }
  return value.split("_").join(" ");
}

export function formatScreeningType(value: string): string {
  if (value === "pep_sanctions") {
    return "PEP / sanctions";
  }
  if (value === "adverse_media") {
    return "Adverse media";
  }
  return value.split("_").join(" ");
}

export function formatDecision(value?: string): string {
  if (!value) {
    return "pending review";
  }
  return value.split("_").join(" ");
}

export function formatShortDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
