from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    institution = Column(String, nullable=False)
    role = Column(String, default="OFFICER")
    created_at = Column(DateTime, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="submitted_by")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(String, primary_key=True, default=gen_id)
    loan_amount = Column(Float, nullable=False)
    purpose = Column(String, nullable=False)
    county = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submitted_by = relationship("User", back_populates="loans")
    score = relationship("Score", back_populates="loan", uselist=False)


class Score(Base):
    __tablename__ = "scores"

    id = Column(String, primary_key=True, default=gen_id)
    risk_level = Column(String, nullable=False)
    is_green = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(String, nullable=False)
    loan_id = Column(String, ForeignKey("loans.id"), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="score")