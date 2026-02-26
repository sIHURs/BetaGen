import { API_BASE_URL } from "./config";
import type {
  JobInfoResponse,
  KeypointsPayload,
  ResultsResponse,
  StartProcessConfig,
  StartProcessResponse,
  UploadVideoResponse,
} from "./types";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }
  return `${response.status} ${response.statusText}`;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<T>;
}

export async function uploadVideo(file: File): Promise<UploadVideoResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return request<UploadVideoResponse>(`${API_BASE_URL}/videos/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function startProcess(
  videoId: string,
  config: StartProcessConfig,
): Promise<StartProcessResponse> {
  const query = new URLSearchParams({ model: config.model });

  return request<StartProcessResponse>(`${API_BASE_URL}/videos/${videoId}/process?${query.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      every_n_frames: config.every_n_frames,
      output_resolution: config.output_resolution,
      save_intermediate_frames: config.save_intermediate_frames,
    }),
  });
}

export async function getJob(jobId: string): Promise<JobInfoResponse> {
  return request<JobInfoResponse>(`${API_BASE_URL}/jobs/${jobId}`);
}

export async function getResults(videoId: string): Promise<ResultsResponse> {
  return request<ResultsResponse>(`${API_BASE_URL}/videos/${videoId}/results`);
}

export async function downloadOverlay(videoId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}/download?type=overlay`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.blob();
}

export async function downloadKeypoints(videoId: string): Promise<KeypointsPayload> {
  return request<KeypointsPayload>(`${API_BASE_URL}/videos/${videoId}/download?type=keypoints`);
}
