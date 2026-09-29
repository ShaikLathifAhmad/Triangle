from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import Meeting, Deal, SyncStatus, Memory, Interaction, InteractionType
from app.services.openrouter_service import openrouter_service
from app.services.hindsight_service import hindsight_service

router = APIRouter()

class MeetingCreate(BaseModel):
    title: str
    purpose: str
    scheduled_at: datetime
    contact_id: Optional[int] = None

class MeetingOutcome(BaseModel):
    outcome: str
    customer_response: Optional[str] = None
    decisions_made: Optional[str] = None
    new_objections: Optional[str] = None
    commitments: Optional[str] = None
    follow_up_actions: Optional[str] = None
    next_meeting_date: Optional[datetime] = None

@router.get("/deals/{deal_id}/meetings")
def get_meetings(deal_id: int, db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(Meeting.deal_id == deal_id).order_by(Meeting.scheduled_at.desc()).all()
    return meetings

@router.post("/deals/{deal_id}/meetings")
def create_meeting(deal_id: int, meeting: MeetingCreate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    db_meeting = Meeting(
        deal_id=deal_id,
        contact_id=meeting.contact_id,
        title=meeting.title,
        purpose=meeting.purpose,
        scheduled_at=meeting.scheduled_at
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

async def process_outcome_background(meeting_id: int, db: Session):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return
        
    deal = meeting.deal
    
    # 1. Create an interaction record for this outcome
    transcript = f"Meeting Purpose: {meeting.purpose}\n\nOutcome:\n{meeting.outcome}\n\nCustomer Response:\n{meeting.customer_response}\n\nDecisions:\n{meeting.decisions_made}\n\nObjections:\n{meeting.new_objections}\n\nCommitments:\n{meeting.commitments}"
    
    interaction = Interaction(
        deal_id=deal.id,
        contact_id=meeting.contact_id,
        interaction_type=InteractionType.MEETING.value,
        title=f"Meeting Outcome: {meeting.title}",
        transcript=transcript,
        interaction_date=datetime.now(),
        summary=meeting.outcome,
        decisions=meeting.decisions_made,
        key_concerns=meeting.new_objections,
        next_steps=meeting.follow_up_actions,
        memory_sync_status=SyncStatus.PENDING.value
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    # 2. Sync to Hindsight
    if hindsight_service.is_available():
        memories_to_store = []
        if meeting.outcome: memories_to_store.append({"content": f"Outcome: {meeting.outcome}", "context": "Meeting Outcome"})
        if meeting.decisions_made: memories_to_store.append({"content": f"Decision: {meeting.decisions_made}", "context": "Decision"})
        if meeting.new_objections: memories_to_store.append({"content": f"Concern: {meeting.new_objections}", "context": "Customer Concern"})
        if meeting.commitments: memories_to_store.append({"content": f"Commitment: {meeting.commitments}", "context": "Commitment"})
        
        if memories_to_store:
            try:
                success = hindsight_service.retain_batch(deal.id, memories_to_store, interaction.id)
                if success:
                    interaction.memory_sync_status = SyncStatus.SYNCED.value
                    for m in memories_to_store:
                        db_memory = Memory(
                            deal_id=deal.id,
                            interaction_id=interaction.id,
                            memory_type=m["context"],
                            content=m["content"],
                            sync_status=SyncStatus.SYNCED.value
                        )
                        db.add(db_memory)
                else:
                    interaction.memory_sync_status = SyncStatus.FAILED.value
            except Exception as e:
                interaction.memory_sync_status = SyncStatus.FAILED.value
                interaction.memory_sync_error = str(e)
            db.commit()

@router.post("/meetings/{meeting_id}/outcome")
async def add_meeting_outcome(meeting_id: int, outcome: MeetingOutcome, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    meeting.status = "Completed"
    meeting.outcome = outcome.outcome
    meeting.customer_response = outcome.customer_response
    meeting.decisions_made = outcome.decisions_made
    meeting.new_objections = outcome.new_objections
    meeting.commitments = outcome.commitments
    meeting.follow_up_actions = outcome.follow_up_actions
    meeting.next_meeting_date = outcome.next_meeting_date
    
    db.commit()
    
    background_tasks.add_task(process_outcome_background, meeting.id, db)
    
    return {"status": "success", "message": "Outcome saved and learning triggered"}
