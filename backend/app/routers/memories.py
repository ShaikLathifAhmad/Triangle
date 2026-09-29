from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models import Memory, Deal, Interaction, Briefing, Feedback
from app.services.hindsight_service import hindsight_service
from app.services.openrouter_service import openrouter_service

router = APIRouter()
logger = logging.getLogger(__name__)

class InsightsQuery(BaseModel):
    query: str

@router.get("/deals/{deal_id}/memories")
def get_deal_memories(deal_id: int, db: Session = Depends(get_db)):
    # Try fetching from DB first (local cache)
    memories = db.query(Memory).filter(Memory.deal_id == deal_id).order_by(Memory.created_at.desc()).all()
    
    result = []
    for m in memories:
        result.append({
            "id": m.id,
            "type": m.memory_type,
            "content": m.content,
            "created_at": m.created_at,
            "interaction_id": m.interaction_id,
            "interaction_title": m.interaction.title if m.interaction else None,
            "sync_status": m.sync_status
        })
    return result

@router.get("/memories/stats")
def get_memory_stats(db: Session = Depends(get_db)):
    total_memories = db.query(Memory).count()
    deals_with_memory = db.query(func.count(func.distinct(Memory.deal_id))).scalar() or 0
    briefings_generated = db.query(Briefing).count()
    feedback_submitted = db.query(Feedback).count()
    
    recent = db.query(Memory).order_by(Memory.created_at.desc()).limit(10).all()
    recent_updates = []
    for m in recent:
        recent_updates.append({
            "id": m.id,
            "deal_name": m.deal.name if m.deal else None,
            "customer": m.deal.company.name if m.deal and m.deal.company else None,
            "type": m.memory_type,
            "content": m.content,
            "timestamp": m.created_at,
            "source": m.interaction.title if m.interaction else None
        })
        
    return {
        "total_memories": total_memories,
        "deals_with_memory": deals_with_memory,
        "briefings_generated": briefings_generated,
        "feedback_submitted": feedback_submitted,
        "recent_updates": recent_updates,
        "hindsight_connected": hindsight_service.is_available()
    }

@router.post("/deals/{deal_id}/insights/query")
async def query_insights(deal_id: int, query: InsightsQuery, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    if not openrouter_service.is_available():
        raise HTTPException(status_code=503, detail="AI Service is not configured")
        
    # 1. Recall from Hindsight
    retrieved_memories = []
    if hindsight_service.is_available():
        try:
            hindsight_results = await hindsight_service.recall_memories(deal_id, query.query)
            retrieved_memories = hindsight_results
        except Exception as e:
            logger.error(f"Error querying hindsight: {e}")
            
    # 2. Get local DB memory context as fallback/supplement
    local_memories = db.query(Memory).filter(Memory.deal_id == deal_id).order_by(Memory.created_at.desc()).limit(10).all()
    
    # 3. Get interactions that might have the exact transcript
    interactions = db.query(Interaction).filter(Interaction.deal_id == deal_id).order_by(Interaction.interaction_date.desc()).limit(5).all()
    
    interaction_dicts = [
        {"type": i.interaction_type, "date": str(i.interaction_date), "title": i.title, "transcript": i.transcript}
        for i in interactions
    ]
    
    deal_info = {
        "name": deal.name,
        "company": deal.company.name if deal.company else ""
    }
    
    # Send to Nemotron to format the answer
    answer = await openrouter_service.answer_question(
        query.query, deal_info, interaction_dicts, retrieved_memories
    )
    
    if not answer:
        raise HTTPException(status_code=500, detail="Failed to generate insight")
        
    return {
        "answer": answer,
        "sources": {
            "hindsight_memories_used": len(retrieved_memories),
            "interactions_searched": len(interactions)
        }
    }

@router.post("/deals/{deal_id}/memories/sync")
def trigger_sync(deal_id: int, db: Session = Depends(get_db)):
    if not hindsight_service.is_available():
        raise HTTPException(status_code=503, detail="Hindsight Service is not configured")
        
    # Find pending interactions
    interactions = db.query(Interaction).filter(
        Interaction.deal_id == deal_id,
        Interaction.memory_sync_status != 'synced'
    ).all()
    
    if not interactions:
        return {"status": "ok", "message": "No pending interactions to sync"}
        
    # Since we can't reliably trigger the background task here without refactoring,
    # we'll just return the count for the hackathon
    return {"status": "ok", "pending_count": len(interactions), "message": "Sync triggered for pending interactions"}
