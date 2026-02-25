# Boulder Analysis App Skeleton

A runnable full-stack skeleton for local development:
- Backend: FastAPI (Python 3.11+)
- Frontend: React + Vite + TypeScript (Node 20+)

## Prerequisites

- Python 3.11 or newer: https://www.python.org/downloads/
- Node.js 20 or newer (includes npm): https://nodejs.org/en/download
- Git (optional but recommended): https://git-scm.com/downloads

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

## Quick Start (Ubuntu)

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

### 2) Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- http://127.0.0.1:5173

## Quick Start (macOS)

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

### 2) Frontend (new terminal)

```bash
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
