from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user import gen_id
from database import Base


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