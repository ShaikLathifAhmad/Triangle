from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Deal, Meeting, Interaction, FollowUp, DealStage

router = APIRouter()

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    active_deals = db.query(Deal).filter(Deal.stage != DealStage.CLOSED_WON.value, Deal.stage != DealStage.CLOSED_LOST.value).count()
    total_pipeline = db.query(func.sum(Deal.value)).filter(Deal.stage != DealStage.CLOSED_WON.value, Deal.stage != DealStage.CLOSED_LOST.value).scalar() or 0
    
    # Meetings this week
    today = datetime.now().date()
    end_of_week = today + timedelta(days=(6 - today.weekday()))
    meetings_this_week = db.query(Meeting).filter(
        func.date(Meeting.scheduled_at) >= today,
        func.date(Meeting.scheduled_at) <= end_of_week
    ).count()
    
    # Follow-ups due
    follow_ups_due = db.query(FollowUp).filter(
        FollowUp.status == "Pending",
        FollowUp.due_date <= end_of_week
    ).count()
    
    return {
        "active_deals": active_deals,
        "total_pipeline": total_pipeline,
        "meetings_this_week": meetings_this_week,
        "follow_ups_due": follow_ups_due
    }

@router.get("/dashboard/pipeline")
def get_pipeline_overview(db: Session = Depends(get_db)):
    stages = db.query(Deal.stage, func.count(Deal.id).label("count"), func.sum(Deal.value).label("value")).group_by(Deal.stage).all()
    return [{"stage": s.stage, "count": s.count, "value": s.value or 0} for s in stages]

@router.get("/dashboard/upcoming-meetings")
def get_upcoming_meetings(db: Session = Depends(get_db)):
    now = datetime.now()
    meetings = db.query(Meeting).filter(Meeting.scheduled_at >= now).order_by(Meeting.scheduled_at).limit(5).all()
    
    result = []
    for m in meetings:
        result.append({
            "id": m.id,
            "title": m.title,
            "scheduled_at": m.scheduled_at,
            "purpose": m.purpose,
            "status": m.status,
            "deal_id": m.deal.id if m.deal else None,
            "deal_name": m.deal.name if m.deal else None,
            "company_name": m.deal.company.name if m.deal and m.deal.company else None,
            "contact_name": m.contact.name if m.contact else None
        })
    return result

@router.get("/dashboard/priority-deals")
def get_priority_deals(db: Session = Depends(get_db)):
    deals = db.query(Deal).filter(
        Deal.stage != DealStage.CLOSED_WON.value, 
        Deal.stage != DealStage.CLOSED_LOST.value
    ).order_by(Deal.expected_close_date).limit(5).all()
    
    result = []
    for d in deals:
        last_interaction = db.query(Interaction).filter(Interaction.deal_id == d.id).order_by(Interaction.interaction_date.desc()).first()
        result.append({
            "id": d.id,
            "name": d.name,
            "company": d.company.name if d.company else None,
            "value": d.value,
            "stage": d.stage,
            "expected_close_date": d.expected_close_date,
            "owner": d.owner.name if d.owner else None,
            "last_interaction": last_interaction.interaction_date if last_interaction else None
        })
    return result
