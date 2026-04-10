# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CodeStars Contest Tracker** — a full-stack HackerRank contest management system with:
- A **public participant portal** where contestants look up their seat/lab, check-in status, and guest wifi credentials
- An **admin panel** (password-protected) for attendance, balloon delivery, participants, questions, emails, and wifi management
- A **HackerRank submission poller** embedded in the backend as an async background task

---

## Running the Project

### Local Development (standard workflow)

**Backend** (Python 3.12+):
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --env-file .env
```

**Frontend** (Node 20+, separate terminal):
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173, proxies /api → localhost:8000
```

`backend/.env` already exists and is configured for local dev. The SQLite database is created automatically at `backend/data/contest.db` on first run.

The HackerRank poller runs automatically inside the backend process. If `HACKERRANK_CONTEST_NAME` is not set, it skips polling silently — the rest of the app works normally.

### Production (server)

The server has no source code. It only pulls pre-built Docker images from Docker Hub:

```bash
cd /opt/codestars          # or wherever docker-compose.yml + .env live
docker compose pull
docker compose up -d
```

CI/CD handles this automatically on every push to `master`.

---

## CI/CD

`.github/workflows/docker-publish.yml` runs on every push to `master`:
1. Builds `backend` and `frontend` Docker images
2. Pushes to Docker Hub as `:latest` and `:<git-sha>`
3. SSHes into the production server and runs `docker compose pull && docker compose up -d`

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_DEPLOY_PATH`.

---

## Architecture

### Data Flow
```
HackerRank API ──► asyncio background task (inside FastAPI, every POLL_INTERVAL seconds)
                        │  writes directly to SQLite
                        ▼
                  FastAPI backend (SQLite via SQLAlchemy)  ← internal only, no public port
                        │  JSON API (/api/*)
                        ▼
               nginx (port 80 — only public entry point, production only)
                        │  serves React SPA + proxies /api → backend
                        ▼
                  React + Vite SPA
                    /                  → Participant Portal (public)
                    /admin/login       → Admin Login
                    /admin/dashboard   → Balloon Queue (JWT-protected)
                    /admin/attendance  → Attendance (JWT-protected)
                    /admin/scanner     → QR Scanner (JWT-protected)
                    /admin/participants→ Participant Management (JWT-protected)
                    /admin/questions   → Question Management (JWT-protected)
                    /admin/emails      → Email Dispatch (JWT-protected)
                    /admin/wifi        → Guest Wifi Management (JWT-protected)
```

### Backend (`backend/`)
| File | Purpose |
|------|---------|
| `main.py` | FastAPI app; embedded async poller (`_poller_loop`); docs disabled (`docs_url=None`) |
| `database.py` | SQLAlchemy engine (SQLite + WAL), `get_db()` dependency |
| `models.py` | ORM: `Participant`, `Question`, `Submission`, `Attendance`, `WifiCredential` |
| `schemas.py` | Pydantic v2 schemas for all routes |
| `auth.py` | JWT (HS256), `get_current_admin` dependency, `check_admin_password` |
| `mailer.py` | Pokédex-themed email builder (MIME + QR code + lab images) |
| `routers/auth.py` | `POST /api/auth/login` |
| `routers/portal.py` | `GET /api/portal/lookup?q=` — public; returns seat + check-in + wifi info |
| `routers/participants.py` | CRUD + Excel upload (admin-only) |
| `routers/questions.py` | CRUD + Excel upload (admin-only) |
| `routers/submissions.py` | `POST /api/submissions/receive` (internal); balloon pending/tick (admin) |
| `routers/attendance.py` | College/Lab check-in, undo, list, stats (admin-only); QR scan endpoint |
| `routers/mailer.py` | `POST /api/mailer/send/:id` and `/send-all` (admin-only) |
| `routers/wifi.py` | Excel upload, random assignment, reassign, list (admin-only) |

### Frontend (`frontend/src/`)
| File | Purpose |
|------|---------|
| `api.js` | Axios instance with JWT interceptors; all API functions |
| `App.jsx` | React Router v6 routes + `ProtectedRoute` |
| `pages/Portal.jsx` | Public seat lookup — shows college/lab check-in badges + wifi credentials |
| `pages/Login.jsx` | Admin login → stores JWT in `localStorage` |
| `pages/Dashboard.jsx` | Live balloon queue, auto-refreshes every 5s, lab filter |
| `pages/Attendance.jsx` | Express College/Lab check-in form + attendance table with stats |
| `pages/Scanner.jsx` | QR code scanner — College Check-in or Lab Verify modes |
| `pages/Participants.jsx` | Participant table, add/delete rows, Excel upload |
| `pages/Questions.jsx` | Questions table, add/delete rows, Excel upload |
| `pages/EmailManager.jsx` | Send Pokédex emails to individual or all participants |
| `pages/Wifi.jsx` | Guest wifi credentials table; Excel upload; re-assign button; highlights unassigned |
| `components/Navbar.jsx` | Admin nav: Queue, Manual, Scanner, Participants, Questions, Emails, Wifi, Logout |
| `components/DataTable.jsx` | Generic table for Participants/Questions pages |
| `components/BalloonRow.jsx` | Dashboard row with balloon colour badge + deliver button |

### Database Models
- **Participant**: `hackerrank_id` (unique), `name`, `email`, `mobile`, `lab`, `seat`
- **Question**: `challenge_name` (unique), `balloon_colour`
- **Submission**: `submission_id` (HR's ID, unique), `hackerrank_id`, `challenge`, `time_from_start` (TEXT seconds), `balloon_given` (bool)
- **Attendance**: `hackerrank_id` (unique), `college_check_in_at` (DateTime), `lab_check_in_at` (DateTime)
- **WifiCredential**: `login_id` (unique), `password`, `hackerrank_id` (nullable, unique — assigned participant)

### Excel Upload Column Requirements

All column names are normalised (stripped, lowercased, spaces → underscores) before validation. **Uploads replace all existing rows** in that table.

#### Participants — `POST /api/participants/upload`
| Column | Required | Notes |
|--------|----------|-------|
| `hackerrank_id` | Yes | Unique HackerRank username |
| `name` | Yes | Full display name |
| `email` | No | For email dispatch |
| `mobile` | No | Contact number |
| `lab` | No | e.g. `Lab 1`, `Lab 2` — must match GYM_MAP keys in `mailer.py` for themed emails |
| `seat` | No | e.g. `A-01` |

Aliases accepted: `hacker_rank_id` → `hackerrank_id`, `assigned_lab` → `lab`, `seat_no` → `seat`, `mobile_number` → `mobile`

#### Questions — `POST /api/questions/upload`
| Column | Required | Notes |
|--------|----------|-------|
| `challenge_name` | Yes | Exact HackerRank challenge slug/name |
| `balloon_colour` | No | Display colour for balloon queue |

#### Wifi Credentials — `POST /api/wifi/upload`
| Column | Required | Notes |
|--------|----------|-------|
| `login_id` | Yes | Unique guest wifi username |
| `password` | Yes | Wifi password |

After upload, credentials are randomly assigned to participants. Any surplus credentials (more credentials than participants) remain unassigned and are highlighted in the admin Wifi page.

---

## Attendance Check-in Model

Two separate timestamps per participant:
- **College Check-in** (`college_check_in_at`): recorded at the main building entrance (gate). Portal "Checked In" badge reflects this.
- **Lab Check-in** (`lab_check_in_at`): recorded inside the lab at their seat.

QR Scanner modes:
- `scan_type = "lab"` → College Check-in (saves `college_check_in_at`)
- `scan_type = "seat"` → Lab Verify (read-only, returns seat info + whether college check-in done)

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ADMIN_PASSWORD` | `backend/.env` | Admin panel password |
| `JWT_SECRET` | `backend/.env` | Signs JWTs — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_ORIGIN` | `backend/.env` | `http://localhost:5173` locally; public domain in production |
| `DATABASE_URL` | `backend/.env` | SQLite path — `sqlite:///./data/contest.db` (no change needed) |
| `HACKERRANK_CONTEST_NAME` | `backend/.env` | Contest slug — leave blank to disable polling |
| `HACKERRANK_COOKIES` | `backend/.env` | JSON object of HR auth cookies |
| `EMAIL` | `backend/.env` | Gmail address for email dispatch |
| `PASSWORD` | `backend/.env` | Gmail App Password (not account password — requires 2FA) |
| `SMTP_HOST` | `backend/.env` | Default: `smtp.gmail.com` |
| `SMTP_PORT` | `backend/.env` | Default: `587` |
| `DOCKERHUB_USERNAME` | `.env` (server only) | Docker Hub username — used by docker-compose to resolve image names |

---

## Key Design Decisions

- **Poller is inside the backend**: runs as an `asyncio.create_task` in the lifespan. No separate service needed. Polling is skipped silently if `HACKERRANK_CONTEST_NAME` is not set.
- **Backend not publicly accessible**: only `expose: 8000` in Docker (not `ports`). All traffic goes through nginx on port 80. FastAPI docs are disabled (`docs_url=None`, `redoc_url=None`, `openapi_url=None`).
- **No source code on server**: production server only holds `docker-compose.yml` and `.env`. Images are built by CI and pulled from Docker Hub.
- **Attendance has two checkpoints**: `college_check_in_at` (gate) and `lab_check_in_at` (seat). Each is set independently and idempotently.
- **Wifi assignment is random**: on upload, credentials are shuffled and assigned to participants. Re-assign clears all assignments and randomises again. Surplus credentials remain unassigned (highlighted yellow in admin).
- **SQLite + WAL mode**: single-file database, concurrent read/write supported. Volume-mounted in Docker for persistence.
- **Excel upload = replace-all**: safer than upsert. Attendance and wifi assignment state are in separate tables, unaffected by participant/question uploads. Wifi upload DOES reset assignments (fresh re-assign after upload).
- **`time_from_start` as TEXT**: HackerRank returns integer seconds. Sorted with `CAST(time_from_start AS INTEGER)` for fair balloon delivery order.
- **QR codes use `hr_id` key**: email-sent QR payloads use `{"hr_id": ..., "name": ..., "lab": ..., "seat": ...}`. The scanner normalises `hr_id` → `hackerrank_id` before sending to the backend.
