import type { ResultsResponse } from "../lib/types";

type ResultsPanelProps = {
  videoId: string;
  overlayUrl: string | null;
  files: ResultsResponse["files"] | null;
  onDownloadOverlay: () => Promise<void>;
  onDownloadKeypoints: () => Promise<void>;
};

export function ResultsPanel({
  videoId,
  overlayUrl,
  files,
  onDownloadOverlay,
  onDownloadKeypoints,
}: ResultsPanelProps) {
  return (
    <section className="panel">
      <h2>Results</h2>
      <div className="meta-box">Video ID: {videoId}</div>

      <div className="inline-actions">
        <button type="button" onClick={() => void onDownloadOverlay()}>
          Download overlay.mp4
        </button>
        <button type="button" onClick={() => void onDownloadKeypoints()}>
          Download keypoints.json
        </button>
      </div>

      {files ? (
        <pre className="code-box">{JSON.stringify(files, null, 2)}</pre>
      ) : (
        <p className="hint">No file index yet.</p>
      )}

      {overlayUrl ? (
        <video className="overlay-video" src={overlayUrl} controls preload="metadata" />
      ) : (
        <p className="hint">Overlay video not loaded yet.</p>
      )}
    </section>
  );
}
