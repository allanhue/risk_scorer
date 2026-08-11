from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user import gen_id
from database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(String, primary_key=True, default=gen_id)
    loan_amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="KES")
    purpose = Column(String, nullable=False)
    description = Column(String, nullable=True)
    county = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submitted_by = relationship("User", back_populates="loans")
    score = relationship("Score", back_populates="loan", uselist=False)