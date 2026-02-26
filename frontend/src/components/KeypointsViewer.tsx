import { useEffect, useMemo, useRef, useState } from "react";
import type { KeypointsPayload } from "../lib/types";

type KeypointsViewerProps = {
  payload: KeypointsPayload | null;
};

function numericOrStringSort(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }
  return a.localeCompare(b);
}

function parseResolution(meta: Record<string, unknown> | undefined): { width: number; height: number } {
  const text = typeof meta?.output_resolution === "string" ? meta.output_resolution : "";
  const match = text.match(/^(\d+)x(\d+)$/);
  if (!match) {
    return { width: 640, height: 360 };
  }
  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

export function KeypointsViewer({ payload }: KeypointsViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [jointName, setJointName] = useState("0");

  const frames = payload?.frames ?? [];
  const maxFrame = Math.max(0, frames.length - 1);

  const jointNames = useMemo(() => {
    const names = new Set<string>();
    for (const frame of frames) {
      for (const point of frame.keypoints) {
        names.add(point.name);
      }
    }
    return [...names].sort(numericOrStringSort);
  }, [frames]);

  useEffect(() => {
    if (frameIndex > maxFrame) {
      setFrameIndex(maxFrame);
    }
  }, [frameIndex, maxFrame]);

  useEffect(() => {
    if (!jointNames.length) {
      setJointName("0");
      return;
    }
    if (!jointNames.includes(jointName)) {
      setJointName(jointNames[0]);
    }
  }, [jointNames, jointName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const { width, height } = parseResolution(payload?.meta);
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#0c1320";
    ctx.fillRect(0, 0, width, height);

    if (!payload || !frames.length) {
      ctx.fillStyle = "#d3e5ff";
      ctx.font = "16px ui-sans-serif, system-ui";
      ctx.fillText("No keypoints loaded", 16, 30);
      return;
    }

    const frame = frames[frameIndex] ?? frames[0];
    const trajectory = frames
      .map((f) => f.keypoints.find((point) => point.name === jointName))
      .filter((point): point is NonNullable<typeof point> => Boolean(point));

    if (trajectory.length > 1) {
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      trajectory.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }

    for (const point of frame.keypoints) {
      if (point.confidence < 0.2) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.name === jointName ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = point.name === jointName ? "#f97316" : "#22c55e";
      ctx.fill();
    }

    const selected = frame.keypoints.find((point) => point.name === jointName);
    ctx.fillStyle = "#d3e5ff";
    ctx.font = "14px ui-sans-serif, system-ui";
    ctx.fillText(`Frame: ${frame.frame_index}`, 16, 24);
    ctx.fillText(`Joint: ${jointName}`, 16, 44);
    if (selected) {
      ctx.fillText(
        `x=${selected.x.toFixed(1)} y=${selected.y.toFixed(1)} conf=${selected.confidence.toFixed(2)}`,
        16,
        64,
      );
    }
  }, [payload, frames, frameIndex, jointName]);

  return (
    <section className="panel">
      <h2>Keypoints Quick View</h2>

      <div className="grid-2">
        <div className="field-group">
          <label htmlFor="frame-slider">Frame</label>
          <input
            id="frame-slider"
            type="range"
            min={0}
            max={maxFrame}
            value={frameIndex}
            onChange={(event) => setFrameIndex(Number(event.target.value))}
            disabled={!frames.length}
          />
          <span className="hint">{frameIndex}/{maxFrame}</span>
        </div>

        <div className="field-group">
          <label htmlFor="joint-select">Joint</label>
          <select
            id="joint-select"
            value={jointName}
            onChange={(event) => setJointName(event.target.value)}
            disabled={!jointNames.length}
          >
            {jointNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <canvas ref={canvasRef} className="keypoint-canvas" />
    </section>
  );
}
