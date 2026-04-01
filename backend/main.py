import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from models import Submission
from routers import attendance, auth, participants, portal, questions, submissions

log = logging.getLogger("poller")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "10"))
POLLER_SECRET = os.getenv("POLLER_SECRET", "")


async def _poll_once(client: httpx.AsyncClient) -> None:
    contest_name = os.getenv("HACKERRANK_CONTEST_NAME", "").strip()
    if not contest_name:
        return  # credentials not configured — skip silently

    cookies: dict = json.loads(os.getenv("HACKERRANK_COOKIES", "{}"))
    headers: dict = json.loads(os.getenv("HACKERRANK_HEADERS", "{}"))

    url = f"https://www.hackerrank.com/rest/contests/{contest_name}/judge_submissions"
    resp = await client.get(url, headers=headers, cookies=cookies, params={"limit": 300, "offset": 0})
    resp.raise_for_status()
    models = resp.json().get("models", [])

    new_rows = []
    db = SessionLocal()
    try:
        existing_ids = {row[0] for row in db.query(Submission.submission_id).all()}
        for s in models:
            if s.get("status") != "Accepted":
                continue
            sid = str(s["id"])
            if sid in existing_ids:
                continue
            new_rows.append(
                Submission(
                    submission_id=sid,
                    hacker_id=str(s["hacker_id"]),
                    hackerrank_id=str(s["hacker_username"]),
                    status=str(s["status"]),
                    created_at=str(s["created_at"]),
                    time_from_start=str(s["time_from_start"]),
                    language=str(s["language"]),
                    challenge=str(s["challenge"]["name"]),
                    balloon_given=False,
                )
            )
        if new_rows:
            db.add_all(new_rows)
            db.commit()
    finally:
        db.close()

    if new_rows:
        log.info("Polled %d accepted — inserted %d new", len([s for s in models if s.get("status") == "Accepted"]), len(new_rows))


async def _poller_loop() -> None:
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            try:
                await _poll_once(client)
            except Exception as exc:
                log.warning("Poll error: %s", exc)
            await asyncio.sleep(POLL_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    task = asyncio.create_task(_poller_loop())
    yield
    task.cancel()


# Docs are disabled — backend is only accessible via nginx/admin panel
app = FastAPI(
    title="CodeStars Contest Tracker",
    version="2.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(portal.router, prefix="/api/portal")
app.include_router(participants.router, prefix="/api/participants")
app.include_router(questions.router, prefix="/api/questions")
app.include_router(submissions.router, prefix="/api")
app.include_router(attendance.router, prefix="/api/attendance")


@app.get("/health")
def health():
    return {"status": "ok"}
