const API_BASE_KEY = "TRUUTH_API_BASE_URL";

export function defaultApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
}

export function loadApiBaseUrl(): string {
  return localStorage.getItem(API_BASE_KEY) || defaultApiBaseUrl();
}

export function saveApiBaseUrl(value: string): void {
  localStorage.setItem(API_BASE_KEY, value);
}
