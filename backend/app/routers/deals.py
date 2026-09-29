from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.models import Deal, Company, Contact, User

router = APIRouter()

class DealCreate(BaseModel):
    name: str
    company_id: int
    contact_id: int = None
    value: float
    stage: str
    expected_close_date: date = None
    description: str = None
    owner_id: int = 1 # Default owner for hackathon

@router.get("/deals")
def get_deals(db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    return [{
        "id": d.id,
        "name": d.name,
        "company": d.company.name if d.company else None,
        "contact": d.contact.name if d.contact else None,
        "value": d.value,
        "stage": d.stage,
        "expected_close_date": d.expected_close_date,
        "owner": d.owner.name if d.owner else None,
        "description": d.description
    } for d in deals]

@router.get("/deals/{deal_id}")
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {
        "id": deal.id,
        "name": deal.name,
        "company": deal.company.name if deal.company else None,
        "company_id": deal.company_id,
        "contact": deal.contact.name if deal.contact else None,
        "contact_id": deal.contact_id,
        "value": deal.value,
        "stage": deal.stage,
        "expected_close_date": deal.expected_close_date,
        "owner": deal.owner.name if deal.owner else None,
        "owner_id": deal.owner_id,
        "description": deal.description
    }

@router.post("/deals")
def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    db_deal = Deal(
        name=deal.name,
        company_id=deal.company_id,
        contact_id=deal.contact_id,
        value=deal.value,
        stage=deal.stage,
        expected_close_date=deal.expected_close_date,
        description=deal.description,
        owner_id=deal.owner_id
    )
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    
    # Initialize Hindsight memory bank asynchronously or let it be created on first interaction
    from app.services.hindsight_service import hindsight_service
    company = db.query(Company).filter(Company.id == deal.company_id).first()
    if company and hindsight_service.is_available():
        try:
            hindsight_service.create_deal_bank(db_deal.id, db_deal.name, company.name)
        except Exception as e:
            print(f"Error creating bank: {e}")
            
    return {"id": db_deal.id}
