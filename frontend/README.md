# BetaGen Frontend Demo

A one-page React + Vite + TypeScript demo for the BetaGen backend bouldering pose pipeline.

## Features

- Upload video (`.mp4`/`.mov`) to backend
- Start async processing with config:
  - model: `openpose | mediapipe`
  - `every_n_frames`
  - `output_resolution`: `original | 720p`
  - `save_intermediate_frames`
- Poll job status every 1s with elapsed timer
- Show overlay result video in `<video>`
- Download `overlay.mp4` and `keypoints.json`
- Quick keypoints viewer on `<canvas>` with frame slider + joint selector

## Install

```bash
cd frontend
npm i
```

## Run

```bash
npm run dev
```

Default frontend URL: `http://127.0.0.1:5173`

## Backend URL

Default backend URL is:

`http://127.0.0.1:8000`

You can change it by setting env var in frontend shell:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Or define it in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Demo Flow

1. Start backend service first.
2. Open frontend page.
3. Select a video file and click `Upload`.
4. Choose processing config and click `Process`.
5. Wait for status `completed`.
6. Watch overlay video, download files, and inspect keypoints on canvas.

## API Adapter Notes

Frontend uses root endpoints:

- `POST /videos/upload`
- `POST /videos/{video_id}/process`
- `GET /jobs/{job_id}`
- `GET /videos/{video_id}/results`
- `GET /videos/{video_id}/download?type=overlay`
- `GET /videos/{video_id}/download?type=keypoints`

If backend paths change, adjust `src/lib/api.ts` and `src/lib/config.ts`.
