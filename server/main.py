from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from scoring import score_loan
from database import engine, get_db, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoanInput(BaseModel):
    loanAmount: float
    purpose: str
    county: str
    sector: str
    userId: Optional[str] = None
    userEmail: Optional[str] = None


@app.post("/score")
def score(loan: LoanInput, db: Session = Depends(get_db)):
    result = score_loan(loan.loanAmount, loan.purpose, loan.county, loan.sector)

    # ensure user exists in our DB (Clerk owns auth, we just mirror the id)
    user = None
    if loan.userId:
        user = db.query(models.User).filter_by(id=loan.userId).first()
        if not user:
            user = models.User(
                id=loan.userId,
                email=loan.userEmail or "unknown@example.com",
                name="",
                institution="",
            )
            db.add(user)
            db.commit()

    db_loan = models.Loan(
        loan_amount=loan.loanAmount,
        purpose=loan.purpose,
        county=loan.county,
        sector=loan.sector,
        user_id=user.id if user else None,
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)

    db_score = models.Score(
        risk_level=result["riskLevel"],
        is_green=result["isGreen"],
        confidence=result["confidence"],
        explanation=result["explanation"],
        loan_id=db_loan.id,
    )
    db.add(db_score)
    db.commit()

    return result