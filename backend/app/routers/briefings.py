from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json

from app.database import get_db
from app.models import Briefing, Deal, Meeting, Interaction, Feedback
from app.services.openrouter_service import openrouter_service
from app.services.hindsight_service import hindsight_service

router = APIRouter()

class BriefingRequest(BaseModel):
    meeting_id: Optional[int] = None

class FeedbackCreate(BaseModel):
    rating: str
    comments: Optional[str] = None

@router.post("/deals/{deal_id}/briefings/generate")
async def generate_briefing(deal_id: int, request: BriefingRequest, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if not openrouter_service.is_available():
        raise HTTPException(status_code=503, detail="AI Service (OpenRouter) is not configured")
        
    meeting = None
    if request.meeting_id:
        meeting = db.query(Meeting).filter(Meeting.id == request.meeting_id).first()
        
    # 1. Gather recent interactions
    interactions = db.query(Interaction).filter(
        Interaction.deal_id == deal_id
    ).order_by(Interaction.interaction_date.desc()).limit(5).all()
    
    interaction_dicts = [
        {"type": i.interaction_type, "date": str(i.interaction_date), "title": i.title, "transcript": i.transcript}
        for i in interactions
    ]
    
    # 2. Retrieve memories from Hindsight
    retrieved_memories = []
    if hindsight_service.is_available():
        query_context = f"Meeting preparation for deal {deal.name}"
        if meeting:
            query_context += f", purpose: {meeting.purpose}"
            
        hindsight_results = await hindsight_service.recall_memories(deal_id, query_context)
        retrieved_memories = hindsight_results
    
    # 3. Generate Briefing via OpenRouter
    deal_info = {
        "name": deal.name,
        "company": deal.company.name if deal.company else "",
        "value": deal.value,
        "stage": deal.stage,
        "expected_close_date": str(deal.expected_close_date) if deal.expected_close_date else ""
    }
    
    meeting_info = {
        "date": str(meeting.scheduled_at) if meeting else "Not scheduled",
        "purpose": meeting.purpose if meeting else "General check-in"
    }
    
    briefing_data = await openrouter_service.generate_briefing(
        deal_info, interaction_dicts, retrieved_memories, meeting_info
    )
    
    if not briefing_data:
        raise HTTPException(status_code=500, detail="Failed to generate AI briefing")
        
    # Save to database
    db_briefing = Briefing(
        deal_id=deal_id,
        meeting_id=request.meeting_id,
        briefing_content=json.dumps(briefing_data),
        model=openrouter_service.model,
        source_interaction_ids=[i.id for i in interactions],
        source_memory_references=[m.get("text") for m in retrieved_memories] if retrieved_memories else []
    )
    db.add(db_briefing)
    db.commit()
    db.refresh(db_briefing)
    
    return {
        "id": db_briefing.id,
        "content": briefing_data,
        "memories_used": len(retrieved_memories)
    }

@router.get("/deals/{deal_id}/briefings")
def get_briefings(deal_id: int, db: Session = Depends(get_db)):
    briefings = db.query(Briefing).filter(Briefing.deal_id == deal_id).order_by(Briefing.generated_at.desc()).all()
    return [{"id": b.id, "generated_at": b.generated_at, "meeting_id": b.meeting_id} for b in briefings]

@router.get("/briefings/{briefing_id}")
def get_briefing(briefing_id: int, db: Session = Depends(get_db)):
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
        
    try:
        content = json.loads(briefing.briefing_content)
    except:
        content = {"raw": briefing.briefing_content}
        
    return {
        "id": briefing.id,
        "deal_id": briefing.deal_id,
        "meeting_id": briefing.meeting_id,
        "content": content,
        "generated_at": briefing.generated_at,
        "memories_used": len(briefing.source_memory_references) if briefing.source_memory_references else 0
    }

@router.post("/briefings/{briefing_id}/feedback")
def add_feedback(briefing_id: int, feedback: FeedbackCreate, db: Session = Depends(get_db)):
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
        
    db_feedback = Feedback(
        briefing_id=briefing_id,
        rating=feedback.rating,
        comments=feedback.comments
    )
    db.add(db_feedback)
    db.commit()
    return {"status": "success"}
