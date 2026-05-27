import { DEMO_MODE } from "./viewTypes";

interface DemoToolbarProps {
  isBusy: boolean;
  onSeed: () => void;
  onRun: () => void;
  onRunSingle: () => void;
  onSchedule: () => void;
  onWebhook: () => void;
  onReset: () => void;
}

export function DemoToolbar({ isBusy, onSeed, onRun, onRunSingle, onSchedule, onWebhook, onReset }: DemoToolbarProps) {
  if (DEMO_MODE) {
    return (
      <div className="toolbar">
        <button className="btn" type="button" onClick={onReset} disabled={isBusy}>
          Reset Session
        </button>
      </div>
    );
  }

  return (
    <div className="toolbar">
      <button className="btn primary" type="button" onClick={onSeed} disabled={isBusy}>
        Seed Data
      </button>
      <button className="btn accent" type="button" onClick={onRun} disabled={isBusy}>
        Run Screening
      </button>
      <button className="btn" type="button" onClick={onRunSingle} disabled={isBusy}>
        Run Single Test
      </button>
      <button className="btn" type="button" onClick={onSchedule} disabled={isBusy}>
        Trigger Schedule
      </button>
      <button className="btn" type="button" onClick={onWebhook} disabled={isBusy}>
        Simulate Webhook
      </button>
      <button className="btn" type="button" onClick={onReset} disabled={isBusy}>
        Reset Demo
      </button>
    </div>
  );
}
