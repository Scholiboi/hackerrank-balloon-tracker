import io
import random
import re
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Participant, WifiCredential
from schemas import WifiCredentialRead

router = APIRouter()

REQUIRED_COLUMNS = {"login_id", "password"}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [re.sub(r"\s+", "_", c.strip().lower()) for c in df.columns]
    return df


def _assign_credentials(db: Session) -> int:
    """Randomly assign unassigned credentials to participants that have none.
    Returns the number of new assignments made."""
    participants = db.query(Participant.hackerrank_id).all()
    participant_ids = [p[0] for p in participants]

    already_assigned = {
        row[0]
        for row in db.query(WifiCredential.hackerrank_id)
        .filter(WifiCredential.hackerrank_id.isnot(None))
        .all()
    }
    unassigned_participants = [pid for pid in participant_ids if pid not in already_assigned]
    unassigned_creds = (
        db.query(WifiCredential)
        .filter(WifiCredential.hackerrank_id.is_(None))
        .all()
    )

    random.shuffle(unassigned_participants)
    random.shuffle(unassigned_creds)

    count = 0
    for pid, cred in zip(unassigned_participants, unassigned_creds):
        cred.hackerrank_id = pid
        count += 1

    db.commit()
    return count


@router.get("", response_model=List[WifiCredentialRead])
def list_wifi(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    rows = (
        db.query(WifiCredential, Participant.name)
        .outerjoin(Participant, WifiCredential.hackerrank_id == Participant.hackerrank_id)
        .order_by(WifiCredential.hackerrank_id.is_(None).desc(), WifiCredential.login_id)
        .all()
    )
    return [
        WifiCredentialRead(
            id=cred.id,
            login_id=cred.login_id,
            password=cred.password,
            hackerrank_id=cred.hackerrank_id,
            participant_name=name,
        )
        for cred, name in rows
    ]


@router.post("/upload")
def upload_wifi(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx / .xls files are accepted")

    contents = file.file.read()
    df = pd.read_excel(io.BytesIO(contents))
    df = _normalise_columns(df)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing columns: {', '.join(sorted(missing))}",
        )

    df["login_id"] = df["login_id"].astype(str).str.strip()
    df["password"] = df["password"].astype(str).str.strip()
    df = df[df["login_id"].str.len() > 0]
    rows = df[["login_id", "password"]].to_dict(orient="records")

    db.query(WifiCredential).delete()
    db.bulk_insert_mappings(WifiCredential, rows)
    db.commit()

    assigned = _assign_credentials(db)
    total = len(rows)
    unassigned = total - assigned

    return {
        "inserted": total,
        "assigned": assigned,
        "unassigned": unassigned,
    }


@router.post("/reassign")
def reassign_wifi(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """Clear all assignments and randomly re-assign from scratch."""
    db.query(WifiCredential).update({"hackerrank_id": None})
    db.commit()

    assigned = _assign_credentials(db)
    total = db.query(WifiCredential).count()

    return {
        "assigned": assigned,
        "unassigned": total - assigned,
    }
