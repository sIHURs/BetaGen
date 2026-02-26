# Frontend Demo for BetaGen Backend (Bouldering Video Pose Analysis)

You are a senior frontend engineer. Build a minimal but polished frontend demo that works with my existing FastAPI backend for bouldering video pose analysis.

## Context
Backend provides:
- Upload video
- Start processing (async job)
- Poll job status
- List result files
- Download overlay video (with pose skeleton) and keypoints.json

The backend is already implemented; do NOT change backend code. Your job is to implement a frontend that calls these APIs and visualizes results.

## Tech stack requirements
- Use React + Vite + TypeScript
- Use fetch() (no heavy client libraries required)
- Styling: Tailwind (preferred) OR simple CSS modules (keep clean & minimal)
- One-page demo UI is fine
- Provide clear README instructions

## API contract (assume backend runs at http://127.0.0.1:8000)
Use these endpoints (root paths exist in backend):
1) POST /videos/upload
   - multipart/form-data with field name: "file"
   - response includes: video_id

2) POST /videos/{video_id}/process?model=openpose&every_n_frames=1&output_resolution=original&save_intermediate_frames=false
   - returns: job_id, status, video_id

3) GET /jobs/{job_id}
   - returns status: pending/running/done/failed and error message if any

4) GET /videos/{video_id}/results
   - returns list of output files (overlay.mp4, keypoints.json)

5) GET /videos/{video_id}/download?type=overlay
   - returns overlay mp4 (video)

6) GET /videos/{video_id}/download?type=keypoints
   - returns keypoints json

If any endpoint differs, implement a small config file to adapt baseUrl and paths.

## UX requirements (must implement)
### A) Upload + Process
- A file picker (accept video/*)
- A "Upload" button
- After upload success, display video_id
- Controls:
  - model dropdown: openpose | mediapipe
  - every_n_frames (number input; default 1)
  - output_resolution dropdown: original | 720p
  - save_intermediate_frames toggle (default false)
- A "Process" button that starts processing and returns job_id

### B) Job Status
- Poll /jobs/{job_id} every 1s until done/failed
- Display:
  - current status with spinner when running
  - error message if failed
  - elapsed time counter

### C) Results visualization
Once done:
1) Show the overlay video in an HTML5 <video> element.
   - fetch the overlay via the download endpoint and set as src (use object URL).
   - Provide play/pause controls.
2) Download buttons:
   - Download overlay.mp4
   - Download keypoints.json

### D) Keypoints quick view (simple visualization)
- After downloading keypoints.json, parse it in browser.
- Provide a compact visualization:
  - Option 1 (preferred): draw keypoints for a selected frame on a <canvas> (2D)
  - Option 2: plot a single joint trajectory (x/y over time) using lightweight charting or just canvas
- Include:
  - Frame slider (0..N-1) to choose which frame to visualize
  - A dropdown to choose joint index/name (e.g. COCO 0..16)
- Do NOT over-engineer; keep it minimal and robust.

## Architecture requirements
- Create a small API client module:
  - src/lib/api.ts
  - functions: uploadVideo(file), startProcess(videoId, config), getJob(jobId), getResults(videoId), downloadOverlay(videoId), downloadKeypoints(videoId)
- Manage app state cleanly:
  - upload state, processing state, polling state, result state
- Handle errors gracefully:
  - network errors
  - backend returns failed job
  - unsupported file types

## Deliverables
1) A complete Vite React TS project structure with all files.
2) README with:
   - install (npm i)
   - run (npm run dev)
   - expected backend URL and how to change it
   - demo flow steps
3) Code quality:
   - TypeScript types for API responses
   - Keep components small: e.g. UploadPanel, JobStatusPanel, ResultsPanel, KeypointsViewer

## Output format
Return the full code files with paths, like:

- package.json
- vite.config.ts
- src/main.tsx
- src/App.tsx
- src/components/...
- src/lib/api.ts
- src/styles/...

Do not omit important files. The project should run immediately after copy-paste and npm install.