# CodeStars Contest Tracker

A full-stack HackerRank contest management system.

- **Public portal** — contestants look up their seat/lab and check-in status
- **Admin panel** — attendance, balloon delivery, participants, and questions
- **HackerRank poller** — background task that ingests accepted submissions automatically

---

## Local Development

No Docker required. Run the backend and frontend directly.

### Prerequisites

- Python 3.12+
- Node.js 20+

### 1. Backend

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

Backend runs at `http://localhost:8000`.  
The SQLite database is created automatically at `backend/data/contest.db` on first run.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies all `/api` requests to the backend automatically.

---

## Environment Variables

### `backend/.env` (local dev)

Copy `backend/.env.example` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | Yes | Password for the admin panel |
| `JWT_SECRET` | Yes | Signs JWTs — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FRONTEND_ORIGIN` | Yes | `http://localhost:5173` for local dev |
| `DATABASE_URL` | Yes | `sqlite:///./data/contest.db` (default, no change needed) |
| `HACKERRANK_CONTEST_NAME` | No | Contest slug — leave blank to disable polling |
| `HACKERRANK_COOKIES` | No | JSON object of HR auth cookies from browser DevTools |

### `.env` (production server only)

Copy `.env.example`. Same variables as above plus:

| Variable | Description |
|----------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username — used by `docker-compose.yml` to resolve image names |
| `FRONTEND_ORIGIN` | Your public domain e.g. `https://example.com` |

---

## Production (Server)

The server has no source code — it only runs pre-built Docker images pulled from Docker Hub.

```bash
# One-time server setup
mkdir -p /opt/codestars
# Copy docker-compose.yml and .env to /opt/codestars manually

cd /opt/codestars
docker compose pull
docker compose up -d
```

After the initial setup, every push to `master` triggers CI/CD which:
1. Builds and pushes new images to Docker Hub
2. SSHes into the server and runs `docker compose pull && docker compose up -d` automatically

---

## CI/CD (GitHub Actions)

On push to `master`, the workflow at `.github/workflows/docker-publish.yml`:

1. Builds `backend` and `frontend` Docker images
2. Pushes them to Docker Hub tagged as `:latest` and `:<git-sha>`
3. Deploys to the server via SSH

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `SERVER_HOST` | Server IP or domain |
| `SERVER_USER` | SSH user |
| `SERVER_SSH_KEY` | Private SSH key (full contents of `~/.ssh/id_ed25519` or `id_rsa`) |
| `SERVER_DEPLOY_PATH` | Directory on server e.g. `/opt/codestars` |

---

## Architecture

```
HackerRank API ──► asyncio background task (inside FastAPI, every POLL_INTERVAL seconds)
                        │  writes directly to SQLite
                        ▼
                  FastAPI backend (SQLite via SQLAlchemy)
                        │  JSON API (/api/*)
                        ▼
               nginx (port 80 — production only)
                        │  serves React SPA + proxies /api → backend
                        ▼
                  React + Vite SPA
```

### Routes

| Path | Description |
|------|-------------|
| `/` | Participant portal (public) — seat, check-in status, wifi credentials |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Balloon queue (JWT-protected) |
| `/admin/attendance` | Attendance — College & Lab check-in (JWT-protected) |
| `/admin/scanner` | QR code scanner (JWT-protected) |
| `/admin/participants` | Participant management (JWT-protected) |
| `/admin/questions` | Question management (JWT-protected) |
| `/admin/emails` | Email dispatch (JWT-protected) |
| `/admin/wifi` | Guest wifi credential management (JWT-protected) |

---

## Excel Upload Formats

All uploads are **replace-all** — existing rows in that table are deleted before inserting. Column names are case-insensitive and spaces are converted to underscores automatically.

### Participants — `/admin/participants` → Import Excel

| Column | Required | Notes |
|--------|----------|-------|
| `hackerrank_id` | Yes | Unique HackerRank username |
| `name` | Yes | Full display name |
| `email` | No | Used for email dispatch |
| `mobile` | No | Contact number |
| `lab` | No | e.g. `Lab 1`, `Lab 2`, `Lab 3`, `Lab 4` |
| `seat` | No | e.g. `A-01` |

Accepted aliases: `hacker_rank_id` → `hackerrank_id`, `assigned_lab` → `lab`, `seat_no` → `seat`, `mobile_number` → `mobile`

### Questions — `/admin/questions` → Import Excel

| Column | Required | Notes |
|--------|----------|-------|
| `challenge_name` | Yes | Exact HackerRank challenge name |
| `balloon_colour` | No | Display label for balloon queue |

### Wifi Credentials — `/admin/wifi` → Import Excel

| Column | Required | Notes |
|--------|----------|-------|
| `login_id` | Yes | Unique guest wifi username |
| `password` | Yes | Wifi password |

After upload, credentials are **randomly assigned** to participants automatically. Surplus credentials (more credentials than participants) remain unassigned and are highlighted in the Wifi admin page. Use the **Re-assign** button to re-randomize at any time.
