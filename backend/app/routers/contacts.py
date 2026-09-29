from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import Contact, Deal, Company

router = APIRouter()

class ContactCreate(BaseModel):
    name: str
    company_id: int
    job_title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    return [{"id": c.id, "name": c.name, "industry": c.industry} for c in companies]

@router.get("/contacts")
def get_contacts(db: Session = Depends(get_db)):
    contacts = db.query(Contact).all()
    result = []
    
    for c in contacts:
        # Get active deals for this contact
        contact_deals = db.query(Deal).filter(Deal.contact_id == c.id).all()
        
        # Calculate total deal value
        total_deal_value = sum(d.value for d in contact_deals) if contact_deals else 0
        
        result.append({
            "id": c.id,
            "name": c.name,
            "company": c.company.name if c.company else None,
            "company_id": c.company_id,
            "job_title": c.job_title,
            "email": c.email,
            "phone": c.phone,
            "deal_count": len(contact_deals),
            "total_deal_value": total_deal_value,
            "has_active_deal": len(contact_deals) > 0
        })
    
    return result

@router.post("/contacts")
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    db_contact = Contact(
        name=contact.name,
        company_id=contact.company_id,
        job_title=contact.job_title,
        email=contact.email,
        phone=contact.phone
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return {"id": db_contact.id, "message": "Contact created successfully"}
