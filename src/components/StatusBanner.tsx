export type StatusTone = "default" | "success" | "error";

interface StatusBannerProps {
  message: string;
  tone: StatusTone;
}

export function StatusBanner({ message, tone }: StatusBannerProps) {
  return <div className={`status ${tone === "default" ? "" : tone}`}>{message}</div>;
}
