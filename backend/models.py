from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, func
from database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hackerrank_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String)
    mobile = Column(String)
    lab = Column(String)
    seat = Column(String)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    challenge_name = Column(String, unique=True, nullable=False, index=True)
    balloon_colour = Column(String)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(String, unique=True, nullable=False, index=True)
    hacker_id = Column(String)
    hackerrank_id = Column(String, index=True)
    status = Column(String)
    created_at = Column(String)
    time_from_start = Column(String)
    language = Column(String)
    challenge = Column(String, index=True)
    balloon_given = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_submissions_balloon_time", "balloon_given", "time_from_start"),
    )


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hackerrank_id = Column(String, unique=True, nullable=False, index=True)
    college_check_in_at = Column(DateTime, nullable=True)
    lab_check_in_at = Column(DateTime, nullable=True)
