import os
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import cast, Integer, func
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Participant, Question, Submission
from schemas import BalloonPendingRead, SubmissionIn

router = APIRouter()

POLLER_SECRET = os.getenv("POLLER_SECRET", "")


# ── Internal: called by poller ────────────────────────────────────────────────

@router.post("/submissions/receive")
def receive_submissions(
    submissions: List[SubmissionIn],
    x_poller_secret: str = Header(default=""),
    db: Session = Depends(get_db),
):
    if POLLER_SECRET and x_poller_secret != POLLER_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    existing_ids = {
        row[0]
        for row in db.query(Submission.submission_id).all()
    }
    # One balloon per participant per challenge — ignore any later ACs
    existing_pairs = {
        (row[0], row[1])
        for row in db.query(Submission.hackerrank_id, Submission.challenge).all()
    }

    new_rows = []
    seen_pairs: set = set()
    for s in submissions:
        if s.status != "Accepted":
            continue
        if s.submission_id in existing_ids:
            continue
        pair = (s.hackerrank_id, s.challenge)
        if pair in existing_pairs or pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        new_rows.append(
            Submission(
                submission_id=s.submission_id,
                hacker_id=s.hacker_id,
                hackerrank_id=s.hackerrank_id,
                status=s.status,
                created_at=s.created_at,
                time_from_start=s.time_from_start,
                language=s.language,
                challenge=s.challenge,
                balloon_given=False,
            )
        )

    if new_rows:
        db.add_all(new_rows)
        db.commit()

    return {"inserted": len(new_rows), "skipped": len(submissions) - len(new_rows)}


# ── Admin: balloon dashboard ──────────────────────────────────────────────────

def _first_ac_subquery(db: Session, only_pending: bool):
    """Return a subquery yielding the min(id) — i.e. earliest AC — per (hackerrank_id, challenge)."""
    q = db.query(func.min(Submission.id).label("min_id"))
    if only_pending:
        q = q.filter(Submission.balloon_given == False)  # noqa: E712
    return q.group_by(Submission.hackerrank_id, Submission.challenge).subquery()


@router.get("/balloons/pending", response_model=List[BalloonPendingRead])
def pending_balloons(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    first_ac = _first_ac_subquery(db, only_pending=True)
    rows = (
        db.query(
            Submission.submission_id,
            Submission.hackerrank_id,
            Submission.challenge,
            Submission.time_from_start,
            Participant.name,
            Participant.lab,
            Participant.seat,
            Question.balloon_colour,
        )
        .join(first_ac, Submission.id == first_ac.c.min_id)
        .join(Participant, Submission.hackerrank_id == Participant.hackerrank_id)
        .join(Question, Submission.challenge == Question.challenge_name)
        .order_by(cast(Submission.time_from_start, Integer).asc())
        .all()
    )

    return [
        BalloonPendingRead(
            submission_id=r.submission_id,
            hackerrank_id=r.hackerrank_id,
            challenge=r.challenge,
            time_from_start=r.time_from_start,
            name=r.name,
            lab=r.lab,
            seat=r.seat,
            balloon_colour=r.balloon_colour,
        )
        for r in rows
    ]


@router.get("/balloons/recent", response_model=List[BalloonPendingRead])
def recent_balloons(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    first_ac = _first_ac_subquery(db, only_pending=False)
    rows = (
        db.query(
            Submission.submission_id,
            Submission.hackerrank_id,
            Submission.challenge,
            Submission.time_from_start,
            Participant.name,
            Participant.lab,
            Participant.seat,
            Question.balloon_colour,
        )
        .join(first_ac, Submission.id == first_ac.c.min_id)
        .join(Participant, Submission.hackerrank_id == Participant.hackerrank_id)
        .join(Question, Submission.challenge == Question.challenge_name)
        .order_by(cast(Submission.time_from_start, Integer).desc())
        .limit(limit)
        .all()
    )

    return [
        BalloonPendingRead(
            submission_id=r.submission_id,
            hackerrank_id=r.hackerrank_id,
            challenge=r.challenge,
            time_from_start=r.time_from_start,
            name=r.name,
            lab=r.lab,
            seat=r.seat,
            balloon_colour=r.balloon_colour,
        )
        for r in rows
    ]


@router.post("/balloons/tick")
def tick_balloon(
    body: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    submission_id = body.get("submission_id")
    if not submission_id:
        raise HTTPException(status_code=400, detail="submission_id is required")

    submission = db.query(Submission).filter_by(submission_id=str(submission_id)).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.balloon_given = True
    db.commit()
    return {"message": "Balloon marked as delivered"}
