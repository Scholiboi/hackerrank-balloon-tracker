import io
import re
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Question
from schemas import QuestionCreate, QuestionRead

router = APIRouter()

REQUIRED_COLUMNS = {"challenge_name", "balloon_colour"}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [re.sub(r"\s+", "_", c.strip().lower()) for c in df.columns]
    return df


@router.get("", response_model=List[QuestionRead])
def list_questions(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    return db.query(Question).order_by(Question.challenge_name).all()


@router.post("", response_model=QuestionRead, status_code=status.HTTP_201_CREATED)
def create_question(
    body: QuestionCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    existing = db.query(Question).filter_by(challenge_name=body.challenge_name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Challenge already exists")
    question = Question(**body.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    question = db.query(Question).filter_by(id=question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()


@router.post("/upload")
def upload_questions(
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

    # Strip whitespace from challenge_name to avoid join mismatches
    df["challenge_name"] = df["challenge_name"].astype(str).str.strip()
    df = df.where(pd.notna(df), None)

    rows = df[list(REQUIRED_COLUMNS)].to_dict(orient="records")

    db.query(Question).delete()
    db.bulk_insert_mappings(Question, rows)
    db.commit()

    return {"inserted": len(rows)}
