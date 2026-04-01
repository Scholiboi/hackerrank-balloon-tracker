"""
HackerRank submission poller.

Reads all configuration from .env (or environment variables).
Polls the HackerRank contest judge submissions endpoint every POLL_INTERVAL
seconds and forwards accepted submissions to the backend.
"""

import json
import logging
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [poller] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

CONTEST_NAME = os.getenv("HACKERRANK_CONTEST_NAME", "")
COOKIES: dict = json.loads(os.getenv("HACKERRANK_COOKIES", "{}"))
HEADERS: dict = json.loads(os.getenv("HACKERRANK_HEADERS", "{}"))
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
POLLER_SECRET = os.getenv("POLLER_SECRET", "")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "10"))

if not CONTEST_NAME:
    log.warning("HACKERRANK_CONTEST_NAME is not set — polling will likely fail.")

HR_URL = f"https://www.hackerrank.com/rest/contests/{CONTEST_NAME}/judge_submissions"
RECEIVE_URL = f"{BACKEND_URL}/api/submissions/receive"

log.info("Poller started. Contest: %s | Backend: %s | Interval: %ds", CONTEST_NAME, BACKEND_URL, POLL_INTERVAL)

while True:
    try:
        response = requests.get(
            HR_URL,
            headers=HEADERS,
            cookies=COOKIES,
            params={"limit": 300, "offset": 0},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

        submissions = data.get("models", [])
        payload = []
        for s in submissions:
            if s.get("status") != "Accepted":
                continue
            payload.append({
                "submission_id": str(s["id"]),
                "hacker_id": str(s["hacker_id"]),
                "hackerrank_id": str(s["hacker_username"]),
                "status": str(s["status"]),
                "created_at": str(s["created_at"]),
                "time_from_start": str(s["time_from_start"]),
                "language": str(s["language"]),
                "challenge": str(s["challenge"]["name"]),
            })

        post_headers = {"Content-Type": "application/json"}
        if POLLER_SECRET:
            post_headers["x-poller-secret"] = POLLER_SECRET

        result = requests.post(RECEIVE_URL, json=payload, headers=post_headers, timeout=10)
        result.raise_for_status()
        body = result.json()
        log.info("Polled %d accepted submissions → inserted: %d, skipped: %d",
                 len(payload), body.get("inserted", 0), body.get("skipped", 0))

    except requests.exceptions.RequestException as exc:
        log.error("Request error: %s", exc)
    except Exception as exc:
        log.error("Unexpected error: %s", exc)

    time.sleep(POLL_INTERVAL)
