from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import FollowUp, Deal, FollowUpStatus

router = APIRouter()

class FollowUpCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    meeting_id: Optional[int] = None

class FollowUpUpdate(BaseModel):
    status: str

@router.get("/deals/{deal_id}/follow-ups")
def get_follow_ups(deal_id: int, db: Session = Depends(get_db)):
    follow_ups = db.query(FollowUp).filter(FollowUp.deal_id == deal_id).order_by(FollowUp.due_date).all()
    return follow_ups

@router.post("/deals/{deal_id}/follow-ups")
def create_follow_up(deal_id: int, follow_up: FollowUpCreate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    db_follow_up = FollowUp(
        deal_id=deal_id,
        meeting_id=follow_up.meeting_id,
        title=follow_up.title,
        description=follow_up.description,
        due_date=follow_up.due_date
    )
    db.add(db_follow_up)
    db.commit()
    db.refresh(db_follow_up)
    return db_follow_up

@router.patch("/follow-ups/{follow_up_id}")
def update_follow_up(follow_up_id: int, follow_up: FollowUpUpdate, db: Session = Depends(get_db)):
    db_follow_up = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not db_follow_up:
        raise HTTPException(status_code=404, detail="Follow-up not found")
        
    db_follow_up.status = follow_up.status
    db.commit()
    db.refresh(db_follow_up)
    return db_follow_up
