import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Participant
from mailer import build_pokedex_email, send_email

log = logging.getLogger("mailer")
router = APIRouter()

# ══════════════════════════════════════════════════════════════════════════════
# Helper
# ══════════════════════════════════════════════════════════════════════════════

def _send_participant_email(participant: Participant):
    try:
        data = {
            "name": participant.name,
            "email": participant.email,
            "hackerrank_id": participant.hackerrank_id,
            "lab": participant.lab,
            "seat": participant.seat
        }
        msg = build_pokedex_email(data)
        send_email(msg)
        log.info(f"Successfully sent email to {participant.hackerrank_id}")
    except Exception as e:
        log.error(f"Failed to send email to {participant.hackerrank_id}: {str(e)}")

# ══════════════════════════════════════════════════════════════════════════════
# Router Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/send/{hackerrank_id}")
def send_single_email(
    hackerrank_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    participant = db.query(Participant).filter_by(hackerrank_id=hackerrank_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    if not participant.email:
        raise HTTPException(status_code=400, detail="Participant has no email address")

    background_tasks.add_task(_send_participant_email, participant)
    return {"message": f"Email dispatch scheduled for {hackerrank_id}"}


@router.post("/send-all")
def send_all_emails(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    participants = db.query(Participant).filter(Participant.email != None).all()
    if not participants:
        return {"message": "No participants with email found"}

    for p in participants:
        background_tasks.add_task(_send_participant_email, p)
    
    return {"message": f"Dispatch scheduled for {len(participants)} participants"}
