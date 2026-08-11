from sqlalchemy import Column, String, DateTime
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
    name = Column(String, nullable=False, default="")
    institution = Column(String, nullable=False, default="")
    role = Column(String, default="OFFICER")
    created_at = Column(DateTime, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="submitted_by")