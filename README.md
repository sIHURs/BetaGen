# Boulder Analysis App Skeleton

A runnable full-stack skeleton for Windows 11 development:
- Backend: FastAPI (Python 3.11+)
- Frontend: React + Vite + TypeScript (Node 20+)

## Quick Start (Windows 11)

### 1) Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

### 2) Frontend (new terminal)

```powershell
cd frontend
npm install
npm run dev
```

Frontend:
- http://127.0.0.1:5173

## Project Structure

```txt
backend/   FastAPI API + domain logic skeleton
frontend/  React app (upload + mock analysis UI)
docs/      Architecture and API notes
```
