from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Attendance, Participant, WifiCredential
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

    attendance_rows = (
        db.query(
            Attendance.hackerrank_id,
            Attendance.college_check_in_at,
            Attendance.lab_check_in_at,
        )
        .filter(Attendance.hackerrank_id.in_(ids))
        .all()
    )
    attendance_map = {row[0]: row for row in attendance_rows}

    wifi_rows = (
        db.query(WifiCredential.hackerrank_id, WifiCredential.login_id, WifiCredential.password)
        .filter(WifiCredential.hackerrank_id.in_(ids))
        .all()
    )
    wifi_map = {row[0]: row for row in wifi_rows}

    return [
        PortalResult(
            hackerrank_id=p.hackerrank_id,
            name=p.name,
            lab=p.lab,
            seat=p.seat,
            college_checked_in=bool(
                attendance_map.get(p.hackerrank_id)
                and attendance_map[p.hackerrank_id][1] is not None
            ),
            lab_checked_in=bool(
                attendance_map.get(p.hackerrank_id)
                and attendance_map[p.hackerrank_id][2] is not None
            ),
            wifi_login_id=wifi_map[p.hackerrank_id][1] if p.hackerrank_id in wifi_map else None,
            wifi_password=wifi_map[p.hackerrank_id][2] if p.hackerrank_id in wifi_map else None,
        )
        for p in participants
    ]
