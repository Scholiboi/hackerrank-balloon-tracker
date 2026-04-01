import io
import re
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Participant
from schemas import ParticipantCreate, ParticipantRead

router = APIRouter()

REQUIRED_COLUMNS = {"hackerrank_id", "name"}
OPTIONAL_COLUMNS = {"email", "mobile", "lab", "seat"}


COLUMN_ALIASES = {
    "mobile_number": "mobile",
    "assigned_lab": "lab",
    "seat_no": "seat",
    "hacker_rank_id": "hackerrank_id",
}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [re.sub(r"\s+", "_", c.strip().lower()) for c in df.columns]
    df.rename(columns=COLUMN_ALIASES, inplace=True)
    return df


@router.get("", response_model=List[ParticipantRead])
def list_participants(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    return db.query(Participant).order_by(Participant.lab, Participant.name).all()


@router.get("/labs")
def get_labs(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    labs = db.query(Participant.lab).filter(Participant.lab != None).distinct().order_by(Participant.lab).all()
    return {"labs": [lab[0] for lab in labs]}


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
def create_participant(
    body: ParticipantCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    existing = db.query(Participant).filter_by(hackerrank_id=body.hackerrank_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="HackerRank ID already exists")
    participant = Participant(**body.model_dump())
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    participant = db.query(Participant).filter_by(id=participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    db.delete(participant)
    db.commit()


@router.post("/upload")
def upload_participants(
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

    df["hackerrank_id"] = df["hackerrank_id"].astype(str).str.strip()
    df["name"] = df["name"].astype(str).str.strip()
    for col in ["email", "lab", "seat"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    if "mobile" in df.columns:
        df["mobile"] = df["mobile"].apply(
            lambda x: str(int(x)) if pd.notna(x) and str(x).strip() not in ("", "nan") else None
        )
    df = df.where(pd.notna(df), None)

    present_optional = OPTIONAL_COLUMNS & set(df.columns)
    cols = list(REQUIRED_COLUMNS | present_optional)
    rows = df[cols].to_dict(orient="records")

    db.query(Participant).delete()
    db.bulk_insert_mappings(Participant, rows)
    db.commit()

    return {"inserted": len(rows)}
