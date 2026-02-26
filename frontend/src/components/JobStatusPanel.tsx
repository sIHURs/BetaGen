import type { JobStatus } from "../lib/types";

type JobStatusPanelProps = {
  jobId: string | null;
  status: JobStatus | null;
  error: string | null;
  elapsedSeconds: number;
};

export function JobStatusPanel({ jobId, status, error, elapsedSeconds }: JobStatusPanelProps) {
  if (!jobId) {
    return null;
  }

  const running = status === "pending" || status === "running";

  return (
    <section className="panel">
      <h2>Job Status</h2>
      <div className="meta-box">Job ID: {jobId}</div>
      <div className="status-row">
        <span className={`pill ${status ?? "unknown"}`}>{status ?? "unknown"}</span>
        {running ? <span className="spinner" aria-label="running" /> : null}
        <span className="elapsed">elapsed: {elapsedSeconds}s</span>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
