from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import os

from services import score_loan, generate_report_pdf, get_rainfall_risk
from database import engine, get_db, Base
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


# schemas
class LoanInput(BaseModel):
    loanAmount: float
    currency: str = "KES"
    purpose: str
    description: Optional[str] = None
    county: str
    sector: str
    userId: Optional[str] = None
    userEmail: Optional[str] = None


class PublicLoanInput(BaseModel):
    loanAmount: float
    currency: str = "KES"
    purpose: str
    description: Optional[str] = None
    county: str
    sector: str


class UserProfileInput(BaseModel):
    userId: str
    email: str
    name: str
    institution: str
    role: str  # "OFFICER" | "AUDITOR" | "ADMIN"


# scoring authenticated

@app.post("/score")
@limiter.limit("5/minute")
def score(request: Request, loan: LoanInput, db: Session = Depends(get_db)):
    result = score_loan(loan.loanAmount, loan.purpose, loan.county, loan.sector, loan.description or "")

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
        currency=loan.currency,
        purpose=loan.purpose,
        description=loan.description,
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

    result["loanId"] = db_loan.id
    return result


# public demo

@app.post("/score/public")
@limiter.limit("5/minute")
def score_public(request: Request, loan: PublicLoanInput, db: Session = Depends(get_db)):
    result = score_loan(loan.loanAmount, loan.purpose, loan.county, loan.sector, loan.description or "")

    db_loan = models.Loan(
        loan_amount=loan.loanAmount,
        currency=loan.currency,
        purpose=loan.purpose,
        description=loan.description,
        county=loan.county,
        sector=loan.sector,
        user_id=None,  # anonymous — no account
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

    result["loanId"] = db_loan.id
    result["isPublic"] = True
    return result


# users

@app.post("/users/profile")
def set_profile(profile: UserProfileInput, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(id=profile.userId).first()
    if not user:
        user = models.User(id=profile.userId, email=profile.email)
        db.add(user)

    user.name = profile.name
    user.institution = profile.institution
    user.role = profile.role
    db.commit()
    db.refresh(user)

    return {"id": user.id, "role": user.role, "name": user.name, "institution": user.institution}


@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "role": user.role, "name": user.name, "institution": user.institution}

# reports

@app.get("/report/{loan_id}")
def get_report(loan_id: str, db: Session = Depends(get_db)):
    db_loan = db.query(models.Loan).filter_by(id=loan_id).first()
    if not db_loan or not db_loan.score:
        raise HTTPException(status_code=404, detail="Loan or score not found")

    
    loan_dict = {
    "loanAmount": db_loan.loan_amount,
    "currency": db_loan.currency,
    "purpose": db_loan.purpose,
    "description": db_loan.description,
    "sector": db_loan.sector,
    "county": db_loan.county,
}
    
    score_dict = {
        "riskLevel": db_loan.score.risk_level,
        "isGreen": db_loan.score.is_green,
        "confidence": db_loan.score.confidence,
        "explanation": db_loan.score.explanation,
    }
    climate_dict = get_rainfall_risk(db_loan.county)

    is_public = db_loan.user_id is None
    pdf_bytes = generate_report_pdf(loan_dict, score_dict, climate_dict, watermark=is_public)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=loan_report_{loan_id[:8]}.pdf"},
    )


#  Loan history

@app.get("/loans")
def list_loans(userId: str, page: int = 1, pageSize: int = 5, db: Session = Depends(get_db)):
    query = db.query(models.Loan).filter_by(user_id=userId).order_by(models.Loan.created_at.desc())

    total = query.count()
    loans = query.offset((page - 1) * pageSize).limit(pageSize).all()

    return {
        "items": [
            {
                "id": loan.id,
                "purpose": loan.purpose,
                "county": loan.county,
                "sector": loan.sector,
                "createdAt": loan.created_at.isoformat(),
                "riskLevel": loan.score.risk_level if loan.score else None,
                "isGreen": loan.score.is_green if loan.score else None,
                "confidence": loan.score.confidence if loan.score else None,
                "loanAmount": loan.loan_amount,
                "currency": loan.currency,
            }
            for loan in loans
        ],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }


@app.get("/loans/all")
def list_all_loans(
    requesterId: str,
    page: int = 1,
    pageSize: int = 10,
    search: Optional[str] = None,
    riskLevel: Optional[str] = None,
    isGreen: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    requester = db.query(models.User).filter_by(id=requesterId).first()
    if not requester or requester.role not in ("AUDITOR", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to view all loans")

    query = db.query(models.Loan).join(models.Score, isouter=True)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.Loan.purpose.ilike(like))
            | (models.Loan.county.ilike(like))
            | (models.Loan.sector.ilike(like))
        )

    if riskLevel:
        query = query.filter(models.Score.risk_level == riskLevel)

    if isGreen is not None:
        query = query.filter(models.Score.is_green == isGreen)

    query = query.order_by(models.Loan.created_at.desc())
    total = query.count()
    loans = query.offset((page - 1) * pageSize).limit(pageSize).all()

    return {
        "items": [
            {
                "id": loan.id,
                "loanAmount": loan.loan_amount,
                "currency": loan.currency,
                "purpose": loan.purpose,
                "county": loan.county,
                "sector": loan.sector,
                "createdAt": loan.created_at.isoformat(),
                "riskLevel": loan.score.risk_level if loan.score else None,
                "isGreen": loan.score.is_green if loan.score else None,
                "submittedBy": loan.submitted_by.email if loan.submitted_by else "unknown",
            }
            for loan in loans
        ],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }

@app.get("/")
def health_check():
    return {"status": "ok"}