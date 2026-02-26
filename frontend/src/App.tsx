import { useEffect, useMemo, useRef, useState } from "react";
import { JobStatusPanel } from "./components/JobStatusPanel";
import { KeypointsViewer } from "./components/KeypointsViewer";
import { ResultsPanel } from "./components/ResultsPanel";
import { UploadPanel } from "./components/UploadPanel";
import {
  downloadKeypoints,
  downloadOverlay,
  getJob,
  getResults,
  startProcess,
  uploadVideo,
} from "./lib/api";
import type { JobStatus, KeypointsPayload, ResultsResponse, StartProcessConfig } from "./lib/types";
import "./styles.css";

const DEFAULT_PROCESS_CONFIG: StartProcessConfig = {
  model: "openpose",
  every_n_frames: 1,
  output_resolution: "original",
  save_intermediate_frames: false,
};

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function triggerJsonDownload(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  triggerBlobDownload(blob, filename);
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<StartProcessConfig>(DEFAULT_PROCESS_CONFIG);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [keypointsPayload, setKeypointsPayload] = useState<KeypointsPayload | null>(null);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startAtRef = useRef<number | null>(null);
  const loadedResultJobRef = useRef<string | null>(null);

  const isProcessing = jobStatus === "pending" || jobStatus === "running";
  const isFinished = jobStatus === "completed" || jobStatus === "done";

  const normalizedStatusText = useMemo(() => {
    if (!jobStatus) {
      return "-";
    }
    return jobStatus;
  }, [jobStatus]);

  useEffect(() => {
    if (!isProcessing || !startAtRef.current) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startAtRef.current!) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isProcessing]);

  useEffect(() => {
    if (!jobId || !isProcessing) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const job = await getJob(jobId);
        setJobStatus(job.status);
        setJobError(job.error ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to poll job status");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [jobId, isProcessing]);

  useEffect(() => {
    if (!jobId || !videoId || !isFinished) {
      return;
    }
    if (loadedResultJobRef.current === jobId) {
      return;
    }
    loadedResultJobRef.current = jobId;

    void (async () => {
      try {
        const [resultData, overlayBlob, keypoints] = await Promise.all([
          getResults(videoId),
          downloadOverlay(videoId),
          downloadKeypoints(videoId),
        ]);

        setResults(resultData);
        setKeypointsPayload(keypoints);

        if (overlayUrl) {
          URL.revokeObjectURL(overlayUrl);
        }
        setOverlayUrl(URL.createObjectURL(overlayBlob));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch processing outputs");
      }
    })();
  }, [isFinished, jobId, videoId, overlayUrl]);

  useEffect(() => {
    return () => {
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
      }
    };
  }, [overlayUrl]);

  async function handleUpload() {
    if (!file) {
      setError("Please select a video file first.");
      return;
    }

    setUploadLoading(true);
    setError(null);
    setJobError(null);

    try {
      const uploaded = await uploadVideo(file);
      setVideoId(uploaded.video_id);
      setJobId(null);
      setJobStatus(null);
      setResults(null);
      setKeypointsPayload(null);
      loadedResultJobRef.current = null;
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
      }
      setOverlayUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleProcess() {
    if (!videoId) {
      setError("Please upload a video first.");
      return;
    }

    setProcessLoading(true);
    setError(null);
    setJobError(null);
    setResults(null);
    setKeypointsPayload(null);
    loadedResultJobRef.current = null;
    if (overlayUrl) {
      URL.revokeObjectURL(overlayUrl);
      setOverlayUrl(null);
    }

    try {
      const started = await startProcess(videoId, config);
      setJobId(started.job_id);
      setJobStatus(started.status);
      setElapsedSeconds(0);
      startAtRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Process start failed");
    } finally {
      setProcessLoading(false);
    }
  }

  async function handleDownloadOverlay() {
    if (!videoId) {
      return;
    }
    try {
      const blob = await downloadOverlay(videoId);
      triggerBlobDownload(blob, `${videoId}_overlay.mp4`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download overlay");
    }
  }

  async function handleDownloadKeypoints() {
    if (!videoId) {
      return;
    }
    try {
      const payload = await downloadKeypoints(videoId);
      setKeypointsPayload(payload);
      triggerJsonDownload(payload, `${videoId}_keypoints.json`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download keypoints");
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>BetaGen Pose Demo</h1>
        <p>Upload a bouldering video, run async pose analysis, and preview overlay + keypoints.</p>
      </header>

      <UploadPanel
        file={file}
        videoId={videoId}
        uploadLoading={uploadLoading}
        processLoading={processLoading}
        config={config}
        onFileChange={setFile}
        onConfigChange={setConfig}
        onUpload={handleUpload}
        onProcess={handleProcess}
      />

      <JobStatusPanel
        jobId={jobId}
        status={jobStatus}
        error={jobError}
        elapsedSeconds={elapsedSeconds}
      />

      {error ? <p className="error">{error}</p> : null}

      {videoId && isFinished ? (
        <ResultsPanel
          videoId={videoId}
          overlayUrl={overlayUrl}
          files={results?.files ?? null}
          onDownloadOverlay={handleDownloadOverlay}
          onDownloadKeypoints={handleDownloadKeypoints}
        />
      ) : null}

      {isFinished ? <KeypointsViewer payload={keypointsPayload} /> : null}

      <footer className="footnote">Current status: {normalizedStatusText}</footer>
    </main>
  );
}

export default App;
