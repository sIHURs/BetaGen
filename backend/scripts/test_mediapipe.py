#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys

import cv2


def ensure_repo_on_path() -> None:
    """
    Ensure we can import `app.*` when running from repo root.
    If your backend package layout differs, adjust this.
    """
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)


def main() -> int:
    ensure_repo_on_path()

    # Import after sys.path setup
    from src.app.models.pose.mediapipe_model import MediaPipePoseModel  # noqa: E402

    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to a local input video (.mp4/.mov)")
    parser.add_argument("--out", default="overlay.mp4", help="Path to output overlay video")
    parser.add_argument("--every-n", type=int, default=1, help="Run inference every N frames")
    parser.add_argument("--display", action="store_true", help="Show live window")
    parser.add_argument("--max-frames", type=int, default=0, help="Stop after N frames (0 = all)")
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open video: {args.video}")
        return 2

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Safer codec for mp4 output
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(args.out, fourcc, fps, (width, height))
    if not writer.isOpened():
        print(f"[ERROR] Cannot open VideoWriter: {args.out}")
        return 3

    model = MediaPipePoseModel()
    model.load_model()

    if getattr(model, "_state", None) is None or getattr(model._state, "pose", None) is None:
        print(
            "[WARN] mediapipe import failed or model not loaded. "
            "Will fall back to heuristic pose (your _heuristic_pose)."
        )
    else:
        print("[OK] MediaPipe loaded successfully.")

    frame_idx = 0
    last_pose = None

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame_idx += 1
        if args.max_frames and frame_idx > args.max_frames:
            break

        # infer every N frames, reuse last pose otherwise (keeps overlay smooth)
        if args.every_n <= 1 or (frame_idx % args.every_n == 0):
            last_pose = model.infer(frame)

        if last_pose is None:
            rendered = frame
        else:
            rendered = model.visualize(frame, last_pose)

        writer.write(rendered)

        if args.display:
            cv2.imshow("BetaGen MediaPipe Demo", rendered)
            # ESC to quit
            if cv2.waitKey(1) & 0xFF == 27:
                break

    cap.release()
    writer.release()
    if args.display:
        cv2.destroyAllWindows()

    print(f"[DONE] Wrote overlay video to: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())