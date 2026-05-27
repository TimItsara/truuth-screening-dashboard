import type {
  Candidate,
  DashboardRun,
  ReviewAction,
  Schedule,
  ScheduleTriggerResponse,
  SeedResponse,
  TaskRun,
  VendorConfigResponse,
  VendorExecution,
} from "./types";

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.url(path), {
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${body}`);
    }

    return response.json() as Promise<T>;
  }

  seed(): Promise<SeedResponse> {
    return this.request<SeedResponse>("/seed", { method: "POST" });
  }

  resetDemo(): Promise<SeedResponse> {
    return this.request<SeedResponse>("/demo/reset?reseed=true", { method: "POST" });
  }

  listCandidates(): Promise<Candidate[]> {
    return this.request<Candidate[]>("/candidates");
  }

  listVendors(): Promise<VendorConfigResponse> {
    return this.request<VendorConfigResponse>("/vendors");
  }

  runScreening(candidateIds: string[]): Promise<{ id: string; batch_id?: string | null; status: string }> {
    return this.request("/screening/runs", {
      method: "POST",
      body: JSON.stringify({
        build_payload: true,
        candidate_ids: candidateIds,
        chunk_size: 2,
      }),
    });
  }

  getDashboardRun(runId: string): Promise<DashboardRun> {
    return this.request<DashboardRun>(`/dashboard/runs/${runId}`);
  }

  listVendorExecutions(): Promise<VendorExecution[]> {
    return this.request<VendorExecution[]>("/vendors/executions");
  }

  listTasks(): Promise<TaskRun[]> {
    return this.request<TaskRun[]>("/tasks");
  }

  createSchedule(): Promise<Schedule> {
    return this.request<Schedule>("/schedules", {
      method: "POST",
      body: JSON.stringify({ name: "Monthly employee re-screening" }),
    });
  }

  triggerSchedule(scheduleId: string): Promise<ScheduleTriggerResponse> {
    return this.request<ScheduleTriggerResponse>(`/schedules/${scheduleId}/trigger`, {
      method: "POST",
    });
  }

  executeTask(taskId: string): Promise<TaskRun> {
    return this.request<TaskRun>(`/tasks/${taskId}/execute`, { method: "POST" });
  }

  simulateWebhook(execution: VendorExecution): Promise<unknown> {
    return this.request(`/webhooks/vendors/${execution.vendor}`, {
      method: "POST",
      body: JSON.stringify({
        event_type: "results_ready",
        external_execution_id: execution.external_execution_id,
      }),
    });
  }

  reviewResult(resultId: string, action: ReviewAction, note?: string): Promise<unknown> {
    return this.request(`/results/${resultId}/review`, {
      method: "POST",
      body: JSON.stringify({
        action,
        reviewer: "demo-analyst",
        note,
      }),
    });
  }
}
