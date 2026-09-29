from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from app.database import get_db
from app.models import Deal, Interaction, Memory, SyncStatus
from app.services.openrouter_service import openrouter_service
from app.services.hindsight_service import hindsight_service

router = APIRouter()

class InteractionCreate(BaseModel):
    interaction_type: str
    title: str
    transcript: str
    interaction_date: datetime
    contact_id: Optional[int] = None

async def process_interaction_background(interaction_id: int, db: Session):
    """Background task to extract insights and sync to Hindsight."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        return
        
    deal = interaction.deal
    
    # 1. Extract customer info using Nemotron
    if openrouter_service.is_available():
        extracted = await openrouter_service.extract_customer_info(interaction.transcript, deal.name)
        if extracted:
            interaction.summary = extracted.get("summary")
            interaction.customer_preferences = json.dumps(extracted.get("preferences", []))
            interaction.key_concerns = json.dumps(extracted.get("objections", []))
            interaction.decisions = json.dumps(extracted.get("decisions", []))
            interaction.next_steps = json.dumps(extracted.get("follow_ups", []))
            db.commit()
            
            # 2. Sync to Hindsight
            if hindsight_service.is_available():
                try:
                    # Make sure bank exists
                    company_name = deal.company.name if deal.company else "Unknown Company"
                    hindsight_service.create_deal_bank(deal.id, deal.name, company_name)
                    
                    # Prepare memories
                    memories_to_store = []
                    if extracted.get("summary"):
                        memories_to_store.append({"content": f"Summary: {extracted['summary']}", "context": "Interaction Summary"})
                    for pref in extracted.get("preferences", []):
                        memories_to_store.append({"content": f"Preference: {pref}", "context": "Customer Preference"})
                    for obj in extracted.get("objections", []):
                        memories_to_store.append({"content": f"Objection/Concern: {obj}", "context": "Customer Concern"})
                    for dec in extracted.get("decisions", []):
                        memories_to_store.append({"content": f"Decision: {dec}", "context": "Decision"})
                        
                    if memories_to_store:
                        success = hindsight_service.retain_batch(deal.id, memories_to_store, interaction.id)
                        if success:
                            interaction.memory_sync_status = SyncStatus.SYNCED.value
                            
                            # Also save memory records to local DB for UI
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
                            interaction.memory_sync_error = "Failed to retain in Hindsight"
                except Exception as e:
                    interaction.memory_sync_status = SyncStatus.FAILED.value
                    interaction.memory_sync_error = str(e)
            else:
                interaction.memory_sync_status = SyncStatus.FAILED.value
                interaction.memory_sync_error = "Hindsight service unavailable"
            
            db.commit()

@router.get("/deals/{deal_id}/interactions")
def get_interactions(deal_id: int, db: Session = Depends(get_db)):
    interactions = db.query(Interaction).filter(Interaction.deal_id == deal_id).order_by(Interaction.interaction_date.desc()).all()
    return interactions

@router.post("/deals/{deal_id}/interactions")
async def add_interaction(deal_id: int, interaction: InteractionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    db_interaction = Interaction(
        deal_id=deal_id,
        contact_id=interaction.contact_id,
        interaction_type=interaction.interaction_type,
        title=interaction.title,
        transcript=interaction.transcript,
        interaction_date=interaction.interaction_date,
        memory_sync_status=SyncStatus.PENDING.value
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    
    # Process asynchronously
    background_tasks.add_task(process_interaction_background, db_interaction.id, db)
    
    return {"id": db_interaction.id, "status": "processing"}

@router.get("/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction
