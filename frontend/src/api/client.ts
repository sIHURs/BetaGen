import type { AnalyzeRequest, AnalyzeResponse } from "./types";

const API_BASE = "http://127.0.0.1:8000/api/v1";

export async function analyzeMock(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analysis/mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<AnalyzeResponse>;
}
