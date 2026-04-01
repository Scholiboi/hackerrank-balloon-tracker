from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Attendance, Participant
from schemas import PortalResult

router = APIRouter()


@router.get("/lookup", response_model=List[PortalResult])
def lookup(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"
    participants = (
        db.query(Participant)
        .filter(
            Participant.hackerrank_id.ilike(term)
            | Participant.name.ilike(term)
        )
        .limit(10)
        .all()
    )

    ids = {p.hackerrank_id for p in participants}
    checked_in = {
        row[0]
        for row in db.query(Attendance.hackerrank_id)
        .filter(Attendance.hackerrank_id.in_(ids))
        .all()
    }

    return [
        PortalResult(
            hackerrank_id=p.hackerrank_id,
            name=p.name,
            lab=p.lab,
            seat=p.seat,
            checked_in=p.hackerrank_id in checked_in,
        )
        for p in participants
    ]
