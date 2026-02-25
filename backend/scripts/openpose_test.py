import os
from pathlib import Path

import cv2
import matplotlib.pyplot as plt


VIDEO = "demo/videos/boudler_test.mp4"
MAX_FRAMES = 200
PREVIEW = True          # 用 matplotlib 预览（推荐：不会触发 xcb）
WRITE_VIDEO = True      # 写出 debug_overlay.mp4
SAVE_JPG_EVERY = 0      # 0=不保存；比如 50 表示每 50 帧存一张 debug_frames/frame_000050.jpg


def safe_fps(cap: cv2.VideoCapture, fallback: float = 30.0) -> float:
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps is None or fps <= 1e-6:
        return fallback
    return float(fps)


def choose_fourcc() -> int:
    """
    mp4v: 最通用，几乎总能写出来（mp4）
    avc1: H.264，体积更小，但依赖系统编码器（可能 writer 打不开）
    """
    return cv2.VideoWriter_fourcc(*"mp4v")


def main():
    video_path = Path(VIDEO)
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path.resolve()}")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = safe_fps(cap, fallback=30.0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if width <= 0 or height <= 0:
        # 极端情况下读不到尺寸：先读一帧推断
        ok, frame = cap.read()
        if not ok:
            raise RuntimeError("Failed to read first frame to infer size.")
        height, width = frame.shape[:2]
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # 回到开头

    # --- VideoWriter (optional) ---
    writer = None
    output_path = Path("debug") / "debug_overlay.mp4"
    if WRITE_VIDEO:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = choose_fourcc()
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
        if not writer.isOpened():
            # 试一下 avc1 作为备选
            fourcc2 = cv2.VideoWriter_fourcc(*"avc1")
            writer = cv2.VideoWriter(str(output_path), fourcc2, fps, (width, height))
            if not writer.isOpened():
                cap.release()
                raise RuntimeError(
                    "VideoWriter failed to open. Try installing ffmpeg/gstreamer codecs "
                    "or switch to .avi with XVID."
                )

    # --- Matplotlib preview (optional) ---
    if PREVIEW:
        plt.ion()
        fig, ax = plt.subplots()
        ax.axis("off")
        im = None

    # --- Optional frame dumps ---
    frames_dir = Path("debug") / "debug_frames"
    if SAVE_JPG_EVERY and SAVE_JPG_EVERY > 0:
        frames_dir.mkdir(parents=True, exist_ok=True)

    i = 0
    while i < MAX_FRAMES:
        ok, frame = cap.read()
        if not ok:
            break

        # 这里你可以插入：pose 检测 / 画骨架 / 画 bbox
        # frame = draw_pose(frame)

        # 写视频（必须保证 frame 尺寸一致）
        if writer is not None:
            if frame.shape[1] != width or frame.shape[0] != height:
                frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
            writer.write(frame)

        # 保存 jpg
        if SAVE_JPG_EVERY and SAVE_JPG_EVERY > 0 and (i % SAVE_JPG_EVERY == 0):
            cv2.imwrite(str(frames_dir / f"frame_{i:06d}.jpg"), frame)

        # matplotlib 预览
        if PREVIEW:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            if im is None:
                im = ax.imshow(frame_rgb)
            else:
                im.set_data(frame_rgb)
            plt.pause(0.001)

        i += 1

    cap.release()
    if writer is not None:
        writer.release()

    if PREVIEW:
        plt.ioff()
        plt.show()

    if writer is not None:
        print(f"Saved overlay video: {output_path.resolve()}")
    if SAVE_JPG_EVERY and SAVE_JPG_EVERY > 0:
        print(f"Saved debug frames to: {frames_dir.resolve()}")


if __name__ == "__main__":
    # 避免某些环境里 Qt 插件干扰（即便我们不使用 cv2.imshow）
    os.environ.setdefault("OPENCV_VIDEOIO_PRIORITY_MSMF", "0")
    main()