from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Attendance, Participant
from schemas import AttendanceRead, AttendanceStats

router = APIRouter()


@router.get("", response_model=List[AttendanceRead])
def list_attendance(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    rows = (
        db.query(
            Attendance.id,
            Attendance.hackerrank_id,
            Attendance.college_check_in_at,
            Attendance.lab_check_in_at,
            Participant.name,
            Participant.lab,
            Participant.seat,
        )
        .outerjoin(Participant, Attendance.hackerrank_id == Participant.hackerrank_id)
        .order_by(
            Attendance.college_check_in_at.desc().nullsfirst(),
            Attendance.lab_check_in_at.desc().nullsfirst(),
        )
        .all()
    )
    return [
        AttendanceRead(
            id=r.id,
            hackerrank_id=r.hackerrank_id,
            college_check_in_at=r.college_check_in_at,
            lab_check_in_at=r.lab_check_in_at,
            name=r.name,
            lab=r.lab,
            seat=r.seat,
        )
        for r in rows
    ]


@router.get("/stats", response_model=AttendanceStats)
def attendance_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    total = db.query(Participant).count()
    checked_in = db.query(Attendance).count()
    return AttendanceStats(
        total_participants=total,
        checked_in=checked_in,
        not_checked_in=total - checked_in,
    )


def _do_checkin(hackerrank_id: str, db: Session, check_in_type: str):
    """Shared check-in logic. Returns (AttendanceRead, already_existed)."""
    if check_in_type not in ("college", "lab"):
        raise HTTPException(status_code=400, detail="check_in_type must be 'college' or 'lab'")

    participant = db.query(Participant).filter_by(hackerrank_id=hackerrank_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    existing = db.query(Attendance).filter_by(hackerrank_id=hackerrank_id).first()
    now = datetime.now(timezone.utc)

    if existing:
        # Update the specific check-in time based on type
        if check_in_type == "college":
            existing.college_check_in_at = now
        elif check_in_type == "lab":
            existing.lab_check_in_at = now
        db.commit()
        db.refresh(existing)
        return (
            AttendanceRead(
                id=existing.id,
                hackerrank_id=existing.hackerrank_id,
                college_check_in_at=existing.college_check_in_at,
                lab_check_in_at=existing.lab_check_in_at,
                name=participant.name,
                lab=participant.lab,
                seat=participant.seat,
            ),
            True,
        )

    # Create new record with appropriate timestamp
    kwargs = {"hackerrank_id": hackerrank_id}
    if check_in_type == "college":
        kwargs["college_check_in_at"] = now
    elif check_in_type == "lab":
        kwargs["lab_check_in_at"] = now

    record = Attendance(**kwargs)
    db.add(record)
    db.commit()
    db.refresh(record)

    return (
        AttendanceRead(
            id=record.id,
            hackerrank_id=record.hackerrank_id,
            college_check_in_at=record.college_check_in_at,
            lab_check_in_at=record.lab_check_in_at,
            name=participant.name,
            lab=participant.lab,
            seat=participant.seat,
        ),
        False,
    )


@router.post("/checkin", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
def check_in(
    body: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    hid = (body.get("hackerrank_id") or "").strip()
    check_in_type = (body.get("check_in_type") or "").strip()
    if not hid:
        raise HTTPException(status_code=400, detail="hackerrank_id is required")
    if not check_in_type:
        raise HTTPException(status_code=400, detail="check_in_type is required ('college' or 'lab')")

    record, _ = _do_checkin(hid, db, check_in_type)
    return record


@router.post("/qr-scan")
def qr_scan(
    body: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """
    Process a QR code scan for either lab check-in or seat validation.

    Body fields:
      - scan_type: "lab" | "seat"
      - hackerrank_id: participant's HackerRank ID (required)
      - name, email, mobile, lab, seat: optional fields from QR payload (ignored)
    """
    scan_type = (body.get("scan_type") or "").strip()
    hid = (body.get("hackerrank_id") or "").strip()

    if not hid:
        raise HTTPException(status_code=400, detail="hackerrank_id is required")
    if scan_type not in ("lab", "seat"):
        raise HTTPException(status_code=400, detail="scan_type must be 'lab' or 'seat'")

    participant = db.query(Participant).filter_by(hackerrank_id=hid).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    if scan_type == "lab":
        record, already_in = _do_checkin(hid, db)
        return {
            "action": "already_checked_in" if already_in else "checked_in",
            "hackerrank_id": record.hackerrank_id,
            "name": record.name,
            "lab": record.lab,
            "seat": record.seat,
            "checked_in_at": record.checked_in_at.isoformat(),
        }

    # scan_type == "seat"
    existing = db.query(Attendance).filter_by(hackerrank_id=hid).first()
    return {
        "action": "seat_info",
        "hackerrank_id": participant.hackerrank_id,
        "name": participant.name,
        "lab": participant.lab,
        "seat": participant.seat,
        "checked_in": existing is not None,
    }


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def undo_checkin(
    attendance_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    record = db.query(Attendance).filter_by(id=attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
