import type { ChangeEvent } from "react";
import type { PoseModel, StartProcessConfig } from "../lib/types";

type UploadPanelProps = {
  file: File | null;
  videoId: string | null;
  uploadLoading: boolean;
  processLoading: boolean;
  config: StartProcessConfig;
  onFileChange: (file: File | null) => void;
  onConfigChange: (next: StartProcessConfig) => void;
  onUpload: () => Promise<void>;
  onProcess: () => Promise<void>;
};

export function UploadPanel({
  file,
  videoId,
  uploadLoading,
  processLoading,
  config,
  onFileChange,
  onConfigChange,
  onUpload,
  onProcess,
}: UploadPanelProps) {
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <section className="panel">
      <h2>Upload + Process</h2>
      <div className="field-group">
        <label htmlFor="video-file">Video File</label>
        <input id="video-file" type="file" accept="video/*" onChange={handleFileInput} />
      </div>

      <div className="inline-actions">
        <button type="button" onClick={() => void onUpload()} disabled={!file || uploadLoading}>
          {uploadLoading ? "Uploading..." : "Upload"}
        </button>
        <span className="hint">{file ? file.name : "No file selected"}</span>
      </div>

      <div className="meta-box">Video ID: {videoId ?? "-"}</div>

      <div className="grid-2">
        <div className="field-group">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={config.model}
            onChange={(event) => onConfigChange({ ...config, model: event.target.value as PoseModel })}
          >
            <option value="openpose">openpose</option>
            <option value="mediapipe">mediapipe</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="every_n_frames">every_n_frames</label>
          <input
            id="every_n_frames"
            type="number"
            min={1}
            value={config.every_n_frames}
            onChange={(event) =>
              onConfigChange({ ...config, every_n_frames: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </div>

        <div className="field-group">
          <label htmlFor="output_resolution">output_resolution</label>
          <select
            id="output_resolution"
            value={config.output_resolution}
            onChange={(event) =>
              onConfigChange({
                ...config,
                output_resolution: event.target.value as StartProcessConfig["output_resolution"],
              })
            }
          >
            <option value="original">original</option>
            <option value="1280x720">720p</option>
          </select>
        </div>

        <label className="checkbox-row" htmlFor="save_intermediate_frames">
          <input
            id="save_intermediate_frames"
            type="checkbox"
            checked={config.save_intermediate_frames}
            onChange={(event) =>
              onConfigChange({ ...config, save_intermediate_frames: event.target.checked })
            }
          />
          save_intermediate_frames
        </label>
      </div>

      <button
        type="button"
        className="primary"
        onClick={() => void onProcess()}
        disabled={!videoId || processLoading}
      >
        {processLoading ? "Starting..." : "Process"}
      </button>
    </section>
  );
}
