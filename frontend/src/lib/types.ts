export type PoseModel = "openpose" | "mediapipe";

export type JobStatus = "pending" | "running" | "completed" | "done" | "failed";

export type UploadVideoResponse = {
  video_id: string;
  filename?: string;
};

export type StartProcessConfig = {
  model: PoseModel;
  every_n_frames: number;
  output_resolution: "original" | "1280x720";
  save_intermediate_frames: boolean;
};

export type StartProcessResponse = {
  job_id: string;
  video_id: string;
  status: JobStatus;
};

export type JobInfoResponse = {
  job_id: string;
  video_id: string;
  model: string;
  status: JobStatus;
  error?: string | null;
  outputs?: Record<string, string>;
};

export type ResultsResponse = {
  video_id: string;
  files: Record<string, string>;
};

export type PoseKeypoint = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type FramePoseRecord = {
  frame_index: number;
  keypoints: PoseKeypoint[];
  confidence: number;
  bbox?: number[] | null;
};

export type KeypointsPayload = {
  video_id: string;
  model: string;
  frames: FramePoseRecord[];
  meta?: Record<string, unknown>;
};
