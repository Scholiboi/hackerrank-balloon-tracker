from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


# ── Participant ──────────────────────────────────────────────────────────────

class ParticipantCreate(BaseModel):
    hackerrank_id: str
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    lab: Optional[str] = None
    seat: Optional[str] = None


class ParticipantRead(ParticipantCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Question ─────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    challenge_name: str
    balloon_colour: Optional[str] = None


class QuestionRead(QuestionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Submission (received from poller) ────────────────────────────────────────

class SubmissionIn(BaseModel):
    submission_id: str
    hacker_id: str
    hackerrank_id: str
    status: str
    created_at: str
    time_from_start: str
    language: str
    challenge: str


# ── Balloon dashboard row (join result) ──────────────────────────────────────

class BalloonPendingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    submission_id: str
    hackerrank_id: str
    name: str
    lab: Optional[str]
    seat: Optional[str]
    challenge: str
    balloon_colour: Optional[str]
    time_from_start: str


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Attendance ───────────────────────────────────────────────────────────────

class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hackerrank_id: str
    college_check_in_at: Optional[datetime] = None
    lab_check_in_at: Optional[datetime] = None
    # Joined from Participant
    name: Optional[str] = None
    lab: Optional[str] = None
    seat: Optional[str] = None


class AttendanceStats(BaseModel):
    total_participants: int
    checked_in: int
    not_checked_in: int


# ── Portal ───────────────────────────────────────────────────────────────────

class PortalResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    hackerrank_id: str
    name: str
    lab: Optional[str]
    seat: Optional[str]
    checked_in: bool = False
