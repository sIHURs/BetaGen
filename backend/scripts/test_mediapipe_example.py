import argparse
from dataclasses import dataclass
from typing import Optional, List, Tuple

import cv2
import mediapipe as mp
import numpy as np


@dataclass
class EMASmoother:
    """Exponential moving average smoother for 33 pose landmarks (x,y,vis)."""
    alpha: float = 0.7  # closer to 1 => smoother but more lag
    state: Optional[np.ndarray] = None  # shape (33, 3): x,y,vis in pixels/conf

    def update(self, pts: np.ndarray) -> np.ndarray:
        """
        pts: (33, 3) float32, where [:,0:2] are pixel coords, [:,2] is visibility/conf (0..1)
        """
        if self.state is None:
            self.state = pts.copy()
            return pts
        self.state = self.alpha * self.state + (1.0 - self.alpha) * pts
        return self.state


def extract_landmarks_px(
    results,
    w: int,
    h: int,
) -> Optional[np.ndarray]:
    """Return (33,3) [x_px, y_px, visibility] or None if no landmarks."""
    if not results.pose_landmarks:
        return None
    pts = np.zeros((33, 3), dtype=np.float32)
    for i, lm in enumerate(results.pose_landmarks.landmark):
        pts[i, 0] = lm.x * w
        pts[i, 1] = lm.y * h
        pts[i, 2] = float(np.clip(lm.visibility, 0.0, 1.0))
    return pts


def draw_landmarks_from_px(
    image_bgr: np.ndarray,
    pts: np.ndarray,
    edges: List[Tuple[int, int]],
    min_vis: float = 0.2,
) -> None:
    """Draw circles + skeleton lines using smoothed pixel landmarks."""
    # points
    for i in range(33):
        x, y, vis = pts[i]
        if vis >= min_vis:
            cv2.circle(image_bgr, (int(x), int(y)), 3, (0, 255, 0), -1)

    # edges
    for s, e in edges:
        sx, sy, sv = pts[s]
        ex, ey, ev = pts[e]
        if min(sv, ev) < min_vis:
            continue
        cv2.line(image_bgr, (int(sx), int(sy)), (int(ex), int(ey)), (255, 140, 0), 2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="in_path", required=True, help="Input video path")
    parser.add_argument("--out", dest="out_path", required=True, help="Output overlay video path")
    parser.add_argument("--display", action="store_true", help="Show preview window")
    parser.add_argument("--alpha", type=float, default=0.7, help="EMA smoothing alpha (0..1). Higher = smoother")
    parser.add_argument("--every-n", type=int, default=1, help="Infer every N frames; reuse last prediction otherwise")
    parser.add_argument("--model-complexity", type=int, default=1, choices=[0, 1, 2])
    parser.add_argument("--min-det", type=float, default=0.5)
    parser.add_argument("--min-track", type=float, default=0.5)
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.in_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open input video: {args.in_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(args.out_path, fourcc, fps, (w, h))
    if not writer.isOpened():
        raise RuntimeError(f"Cannot open output writer: {args.out_path}")

    try:
        mp_pose = mp.solutions.pose  # type: ignore[attr-defined]
    except AttributeError:
        from mediapipe.solutions import pose as mp_pose  # type: ignore

    # 用 mediapipe 自带的连接也行，但你说“输出更平”，我建议用 pose connections
    # 这里直接用 mp_pose.POSE_CONNECTIONS
    # 如果你想更干净，就自己定义 edges 子集。
    edges = [(a, b) for a, b in mp_pose.POSE_CONNECTIONS]

    smoother = EMASmoother(alpha=args.alpha)
    last_pts: Optional[np.ndarray] = None

    frame_idx = 0
    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=args.model_complexity,
        enable_segmentation=False,
        min_detection_confidence=args.min_det,
        min_tracking_confidence=args.min_track,
    ) as pose:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break
            frame_idx += 1

            # 推理：每 N 帧跑一次，其他帧复用上一帧结果（更快也更平）
            do_infer = (args.every_n <= 1) or (frame_idx % args.every_n == 0)

            if do_infer:
                rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False
                results = pose.process(rgb)
                pts = extract_landmarks_px(results, w=w, h=h)
                if pts is not None:
                    last_pts = pts
            # 如果当前帧没检测到，就沿用 last_pts
            if last_pts is not None:
                smoothed = smoother.update(last_pts)
                draw_landmarks_from_px(frame_bgr, smoothed, edges, min_vis=0.2)

            writer.write(frame_bgr)

            if args.display:
                cv2.imshow("MediaPipe Pose (Smoothed)", frame_bgr)
                if cv2.waitKey(1) & 0xFF == 27:
                    break

    cap.release()
    writer.release()
    if args.display:
        cv2.destroyAllWindows()

    print(f"[DONE] wrote: {args.out_path}")


if __name__ == "__main__":
    main()