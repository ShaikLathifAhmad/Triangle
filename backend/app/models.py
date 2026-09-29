"""SQLAlchemy models for Triangle."""
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, Date,
    ForeignKey, Enum, JSON, Boolean
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DealStage(str, enum.Enum):
    QUALIFICATION = "Qualification"
    DISCOVERY = "Discovery"
    PROPOSAL = "Proposal"
    NEGOTIATION = "Negotiation"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"


class InteractionType(str, enum.Enum):
    DISCOVERY_CALL = "Discovery Call"
    PRODUCT_DEMO = "Product Demo"
    PRICING_DISCUSSION = "Pricing Discussion"
    MEETING = "Meeting"
    EMAIL = "Email"
    OTHER = "Other"


class SyncStatus(str, enum.Enum):
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"
    RETRY = "retry"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    RESCHEDULED = "Rescheduled"


class FollowUpStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"


class FeedbackRating(str, enum.Enum):
    HELPFUL = "Helpful"
    PARTIALLY_HELPFUL = "Partially Helpful"
    NOT_HELPFUL = "Not Helpful"


# ---- Models ----

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(100), default="Sales Representative")
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deals = relationship("Deal", back_populates="owner")


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    industry = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", back_populates="company")
    deals = relationship("Deal", back_populates="company")


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    job_title = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="contacts")
    deals = relationship("Deal", back_populates="contact")
    interactions = relationship("Interaction", back_populates="contact")
    meetings = relationship("Meeting", back_populates="contact")


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    value = Column(Float, default=0)
    stage = Column(String(50), default=DealStage.QUALIFICATION.value)
    expected_close_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="deals")
    contact = relationship("Contact", back_populates="deals")
    owner = relationship("User", back_populates="deals")
    interactions = relationship("Interaction", back_populates="deal", order_by="Interaction.interaction_date.desc()")
    meetings = relationship("Meeting", back_populates="deal", order_by="Meeting.scheduled_at.desc()")
    briefings = relationship("Briefing", back_populates="deal", order_by="Briefing.generated_at.desc()")
    memories = relationship("Memory", back_populates="deal", order_by="Memory.created_at.desc()")
    follow_ups = relationship("FollowUp", back_populates="deal", order_by="FollowUp.due_date")


class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    interaction_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    transcript = Column(Text, nullable=False)
    summary = Column(Text)
    key_concerns = Column(Text)
    customer_preferences = Column(Text)
    decisions = Column(Text)
    next_steps = Column(Text)
    interaction_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    memory_sync_status = Column(String(20), default=SyncStatus.PENDING.value)
    memory_sync_error = Column(Text)

    deal = relationship("Deal", back_populates="interactions")
    contact = relationship("Contact", back_populates="interactions")
    memories = relationship("Memory", back_populates="interaction")


class Memory(Base):
    __tablename__ = "memories"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    interaction_id = Column(Integer, ForeignKey("interactions.id"))
    memory_type = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    hindsight_reference = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_status = Column(String(20), default=SyncStatus.PENDING.value)
    sync_error = Column(Text)

    deal = relationship("Deal", back_populates="memories")
    interaction = relationship("Interaction", back_populates="memories")


class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    title = Column(String(255), nullable=False)
    purpose = Column(Text)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String(50), default=MeetingStatus.SCHEDULED.value)
    outcome = Column(Text)
    customer_response = Column(Text)
    decisions_made = Column(Text)
    new_objections = Column(Text)
    commitments = Column(Text)
    follow_up_actions = Column(Text)
    next_meeting_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="meetings")
    contact = relationship("Contact", back_populates="meetings")
    briefings = relationship("Briefing", back_populates="meeting")


class Briefing(Base):
    __tablename__ = "briefings"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    briefing_content = Column(Text, nullable=False)
    model = Column(String(100))
    generated_at = Column(DateTime, default=datetime.utcnow)
    source_interaction_ids = Column(JSON)
    source_memory_references = Column(JSON)
    context_used = Column(Text)

    deal = relationship("Deal", back_populates="briefings")
    meeting = relationship("Meeting", back_populates="briefings")
    feedback = relationship("Feedback", back_populates="briefing")


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    briefing_id = Column(Integer, ForeignKey("briefings.id"), nullable=False)
    rating = Column(String(50), nullable=False)
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    briefing = relationship("Briefing", back_populates="feedback")


class FollowUp(Base):
    __tablename__ = "follow_ups"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    due_date = Column(Date, nullable=False)
    status = Column(String(50), default=FollowUpStatus.PENDING.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="follow_ups")
