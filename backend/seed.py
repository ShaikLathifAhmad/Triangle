"""Comprehensive database seeding script for Triangle AI Deal Intelligence Platform."""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Company, Contact, Deal, DealStage,
    Interaction, InteractionType, Meeting, MeetingStatus,
    Memory, SyncStatus, FollowUp, FollowUpStatus
)
from app.services.hindsight_service import hindsight_service
from app.auth import hash_password


def reset_db():
    """Drop and recreate all tables for a clean seed."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")


def create_seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(Deal).count()
    if existing >= 10:
        print(f"Already seeded ({existing} deals). Run with --reset to reseed.")
        db.close()
        return

    print("Seeding Triangle database...")

    now = datetime.now()

    # -------------------------------------------------------------------------
    # User
    # -------------------------------------------------------------------------
    alex = User(
        name="Alex Morgan",
        email="alex.morgan@triangle.ai",
        role="Account Executive",
        password_hash=hash_password("password123"),
    )
    db.add(alex)
    db.commit()
    db.refresh(alex)

    # =========================================================================
    # DEAL 1 — Acme Technologies | NEGOTIATION | $45,000
    # =========================================================================
    print("  [1/10] Acme Technologies...")
    acme = Company(name="Acme Technologies", industry="Enterprise Software",
                   description="Leading provider of enterprise management solutions.")
    db.add(acme)
    db.commit(); db.refresh(acme)

    acme_contact = Contact(company_id=acme.id, name="Sarah Jenkins",
                           email="sarah.j@acmetech.com", job_title="VP of Operations",
                           phone="+1-555-0101")
    db.add(acme_contact)
    db.commit(); db.refresh(acme_contact)

    deal1 = Deal(company_id=acme.id, contact_id=acme_contact.id, owner_id=alex.id,
                 name="Acme Enterprise Reporting", value=45000,
                 stage=DealStage.NEGOTIATION.value,
                 expected_close_date=(now + timedelta(days=14)).date(),
                 description="Implementing automated enterprise reporting solution.")
    db.add(deal1)
    db.commit(); db.refresh(deal1)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal1.id, deal1.name, acme.name)

    i1a = Interaction(
        deal_id=deal1.id, contact_id=acme_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Initial Discovery: Reporting Pain Points",
        transcript="""Sales: Can you describe your current reporting process?
Customer: It's largely manual. We pull data from three systems — Salesforce, NetSuite, and an internal tool — and compile everything in Excel. It takes our team 15 hours per week just to produce the weekly management report.
Sales: What would automated reporting mean for your team?
Customer: It would free up our analysts to do actual analysis instead of data wrangling. Our management team also needs real-time dashboards, not weekly snapshots.""",
        interaction_date=now - timedelta(days=20),
        summary="Customer spends 15 hours/week on manual reporting across 3 systems. Primary need is automated consolidation and real-time dashboards for management.",
        customer_preferences=json.dumps(["Real-time dashboards", "Automated data consolidation", "Reduced manual work"]),
        memory_sync_status=SyncStatus.PENDING.value
    )
    db.add(i1a); db.commit(); db.refresh(i1a)

    i1b = Interaction(
        deal_id=deal1.id, contact_id=acme_contact.id,
        interaction_type=InteractionType.PRODUCT_DEMO.value,
        title="Product Demo: Reporting Features",
        transcript="""Sales: How did the automated reporting demo look to your team?
Customer: The automated reports are exactly what we need. My concern is implementation complexity — we cannot afford a 3-month rollout. We have a Q4 board meeting where we need these reports live.
Sales: Would a phased rollout work? Phase 1 in 4 weeks, full deployment in 8?
Customer: If you can guarantee 4 weeks for the core reporting, we can proceed. We would need that in writing.""",
        interaction_date=now - timedelta(days=13),
        summary="Customer impressed by demo but requires 4-week Phase 1 deployment for Q4 board meeting. Wants written guarantee on timeline.",
        key_concerns=json.dumps(["3-month rollout too long", "Q4 board meeting deadline"]),
        decisions=json.dumps(["Agreed to review phased rollout proposal", "Needs written timeline commitment"]),
        memory_sync_status=SyncStatus.PENDING.value
    )
    db.add(i1b); db.commit(); db.refresh(i1b)

    i1c = Interaction(
        deal_id=deal1.id, contact_id=acme_contact.id,
        interaction_type=InteractionType.PRICING_DISCUSSION.value,
        title="Pricing Negotiation",
        transcript="""Sales: Have you reviewed our phased pricing proposal?
Customer: Yes. The total cost is fair but the upfront payment for Phase 1 is too high. Can we spread it over the first 3 months?
Sales: We can offer net-60 terms on Phase 1. That means no payment until 60 days after go-live.
Customer: That works for us. Can you also include 6 months of dedicated support? Our IT team is small.
Sales: Absolutely. We will add 6 months of priority support to the contract.""",
        interaction_date=now - timedelta(days=6),
        summary="Agreed on net-60 payment terms for Phase 1. Customer also requested and received 6 months of dedicated priority support.",
        decisions=json.dumps(["Net-60 payment terms agreed", "6 months priority support included"]),
        memory_sync_status=SyncStatus.PENDING.value
    )
    db.add(i1c); db.commit(); db.refresh(i1c)

    # Upcoming meeting this week
    meet1 = Meeting(deal_id=deal1.id, contact_id=acme_contact.id,
                    title="Contract Signing — Final Review",
                    purpose="Review final contract terms and sign. Confirm Phase 1 kickoff date.",
                    scheduled_at=now + timedelta(days=2),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet1)

    # Follow-ups
    db.add(FollowUp(deal_id=deal1.id, title="Send final contract for signature",
                    description="Include net-60 terms and 6-month support SLA.",
                    due_date=(now + timedelta(days=1)).date(), status=FollowUpStatus.PENDING.value))
    db.add(FollowUp(deal_id=deal1.id, title="Prepare Phase 1 project timeline document",
                    description="4-week delivery guarantee for core reporting.",
                    due_date=(now + timedelta(days=3)).date(), status=FollowUpStatus.PENDING.value))

    # Memories
    memories_d1 = [
        ("Customer spends 15 hours/week on manual reporting — primary pain point.", "Customer Need", i1a.id),
        ("Requires 4-week Phase 1 deployment for Q4 board meeting deadline.", "Deadline Constraint", i1b.id),
        ("Net-60 payment terms agreed. 6 months priority support included in deal.", "Decision", i1c.id),
        ("Wants written timeline commitment for the phased rollout.", "Requirement", i1b.id),
    ]
    for content, mtype, iid in memories_d1:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal1.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal1.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))
    for ix in [i1a, i1b, i1c]:
        ix.memory_sync_status = SyncStatus.SYNCED.value

    db.commit()

    # =========================================================================
    # DEAL 2 — Nova Retail | PROPOSAL | $28,000
    # =========================================================================
    print("  [2/10] Nova Retail...")
    nova = Company(name="Nova Retail", industry="Retail Technology",
                   description="National chain of modern retail stores.")
    db.add(nova)
    db.commit(); db.refresh(nova)

    nova_contact = Contact(company_id=nova.id, name="David Chen",
                           email="d.chen@novaretail.com", job_title="Director of IT",
                           phone="+1-555-0102")
    db.add(nova_contact)
    db.commit(); db.refresh(nova_contact)

    deal2 = Deal(company_id=nova.id, contact_id=nova_contact.id, owner_id=alex.id,
                 name="Nova Retail Analytics", value=28000,
                 stage=DealStage.PROPOSAL.value,
                 expected_close_date=(now + timedelta(days=30)).date(),
                 description="Centralized analytics and reporting for 45 retail locations.")
    db.add(deal2)
    db.commit(); db.refresh(deal2)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal2.id, deal2.name, nova.name)

    i2a = Interaction(
        deal_id=deal2.id, contact_id=nova_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Discovery: Retail Analytics Needs",
        transcript="""Sales: What visibility do you currently have into store performance?
Customer: Almost none at the aggregate level. Each store manager tracks their own numbers in spreadsheets and emails them to head office every Monday. By the time we compile everything it is Tuesday afternoon.
Sales: How many locations are we talking about?
Customer: Forty-five stores across six states. The reporting delay is costing us — we are making restocking decisions based on data that is 5 days old.""",
        interaction_date=now - timedelta(days=18),
        summary="45 stores report via manual spreadsheets. Restocking decisions based on 5-day-old data. Needs real-time consolidated view across all locations.",
        customer_preferences=json.dumps(["Real-time store data", "No spreadsheet consolidation", "Easy for non-technical managers"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i2a); db.commit(); db.refresh(i2a)

    i2b = Interaction(
        deal_id=deal2.id, contact_id=nova_contact.id,
        interaction_type=InteractionType.PRODUCT_DEMO.value,
        title="Demo: Store Dashboard",
        transcript="""Sales: Here is the live store performance dashboard — all 45 locations updating every 15 minutes.
Customer: This is impressive. Can store managers customize which metrics they see?
Sales: Yes, each manager gets their own view. They can pin their top 5 KPIs.
Customer: Can they export to PDF for their daily huddles?
Sales: One click PDF export. We can also set up auto-send at 8am every day.
Customer: That would eliminate our Monday report process entirely. Please include that in the proposal.""",
        interaction_date=now - timedelta(days=10),
        summary="Strong positive reaction to demo. Customer wants PDF export and automated 8am daily reports included in proposal. Would eliminate Monday manual process.",
        decisions=json.dumps(["Include PDF export in proposal", "Include auto-scheduled daily reports", "Custom KPI view per manager"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i2b); db.commit(); db.refresh(i2b)

    meet2 = Meeting(deal_id=deal2.id, contact_id=nova_contact.id,
                    title="Proposal Walkthrough",
                    purpose="Present full proposal with pricing, timeline, and custom features.",
                    scheduled_at=now + timedelta(days=4),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet2)

    db.add(FollowUp(deal_id=deal2.id, title="Send formal proposal document",
                    description="Include PDF export, auto-daily reports, custom KPI views.",
                    due_date=(now + timedelta(days=2)).date(), status=FollowUpStatus.PENDING.value))

    memories_d2 = [
        ("45 stores report via manual spreadsheets — 5-day data delay is costing business.", "Customer Need", i2a.id),
        ("Wants one-click PDF export and automated 8am daily reports for store managers.", "Feature Requirement", i2b.id),
    ]
    for content, mtype, iid in memories_d2:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal2.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal2.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 3 — Vertex Systems | QUALIFICATION | $62,000
    # =========================================================================
    print("  [3/10] Vertex Systems...")
    vertex = Company(name="Vertex Systems", industry="Enterprise IT",
                     description="Global IT infrastructure provider.")
    db.add(vertex)
    db.commit(); db.refresh(vertex)

    vertex_contact = Contact(company_id=vertex.id, name="Elena Rodriguez",
                             email="erodriguez@vertexsys.com", job_title="CIO",
                             phone="+1-555-0103")
    db.add(vertex_contact)
    db.commit(); db.refresh(vertex_contact)

    deal3 = Deal(company_id=vertex.id, contact_id=vertex_contact.id, owner_id=alex.id,
                 name="Vertex BI Implementation", value=62000,
                 stage=DealStage.QUALIFICATION.value,
                 expected_close_date=(now + timedelta(days=60)).date(),
                 description="Enterprise business intelligence rollout across global offices.")
    db.add(deal3)
    db.commit(); db.refresh(deal3)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal3.id, deal3.name, vertex.name)

    i3a = Interaction(
        deal_id=deal3.id, contact_id=vertex_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Initial Discovery Call",
        transcript="""Sales: What is driving your interest in a BI solution right now?
Customer: Our CEO wants a single source of truth for operational KPIs across our 12 global offices. Right now each region reports differently — APAC uses one set of metrics, EMEA uses another. Board meetings are painful.
Sales: What are your security requirements?
Customer: Strict. We are SOC 2 Type II certified. Any vendor we work with must also be SOC 2. Data residency in the EU for our European offices is non-negotiable due to GDPR.""",
        interaction_date=now - timedelta(days=15),
        summary="CEO wants unified KPI dashboard across 12 global offices. SOC 2 Type II compliance and EU data residency are non-negotiable requirements.",
        customer_preferences=json.dumps(["SOC 2 Type II compliance", "EU data residency for GDPR", "Unified global metrics"]),
        key_concerns=json.dumps(["Each region uses different metrics", "GDPR compliance required"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i3a); db.commit(); db.refresh(i3a)

    meet3 = Meeting(deal_id=deal3.id, contact_id=vertex_contact.id,
                    title="Technical Requirements Deep Dive",
                    purpose="Discuss SOC 2 compliance, EU data residency, and API integration requirements.",
                    scheduled_at=now + timedelta(days=5),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet3)

    db.add(FollowUp(deal_id=deal3.id, title="Send SOC 2 Type II certification documentation",
                    description="Elena specifically requested compliance docs before next meeting.",
                    due_date=(now + timedelta(days=2)).date(), status=FollowUpStatus.PENDING.value))

    memories_d3 = [
        ("Non-negotiable: SOC 2 Type II compliance and EU data residency for GDPR.", "Hard Requirement", i3a.id),
        ("CEO wants single source of truth for operational KPIs across 12 global offices.", "Business Goal", i3a.id),
    ]
    for content, mtype, iid in memories_d3:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal3.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal3.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 4 — Global Finance Corp | PROPOSAL | $125,000
    # =========================================================================
    print("  [4/10] Global Finance Corp...")
    globalfinance = Company(name="Global Finance Corp", industry="Financial Services",
                            description="International banking and financial services provider.")
    db.add(globalfinance)
    db.commit(); db.refresh(globalfinance)

    gf_contact = Contact(company_id=globalfinance.id, name="Jennifer Liu",
                         email="jliu@globalfinance.com", job_title="Chief Data Officer",
                         phone="+1-555-0104")
    db.add(gf_contact)
    db.commit(); db.refresh(gf_contact)

    deal4 = Deal(company_id=globalfinance.id, contact_id=gf_contact.id, owner_id=alex.id,
                 name="Enterprise Data Platform", value=125000,
                 stage=DealStage.PROPOSAL.value,
                 expected_close_date=(now + timedelta(days=35)).date(),
                 description="Comprehensive data analytics and compliance reporting platform.")
    db.add(deal4)
    db.commit(); db.refresh(deal4)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal4.id, deal4.name, globalfinance.name)

    i4a = Interaction(
        deal_id=deal4.id, contact_id=gf_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Discovery: Compliance Reporting Needs",
        transcript="""Sales: What reporting challenges are you trying to solve?
Customer: We are under increased regulatory pressure. Basel III and Dodd-Frank require us to produce risk reports within 24 hours of end-of-day. Right now it takes us 72 hours. We are at risk of regulatory penalties.
Sales: What is the volume of data we are talking about?
Customer: Roughly 2 terabytes of transaction data per day. We need something that can handle that scale without slowing down our core banking systems.""",
        interaction_date=now - timedelta(days=22),
        summary="Regulatory deadline risk: Basel III/Dodd-Frank require 24-hour risk reports but currently takes 72 hours. Needs to handle 2TB/day without impacting core banking.",
        customer_preferences=json.dumps(["Sub-24-hour regulatory reporting", "2TB/day data processing", "Zero impact on core banking"]),
        key_concerns=json.dumps(["Risk of regulatory penalties", "Data volume at scale"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i4a); db.commit(); db.refresh(i4a)

    i4b = Interaction(
        deal_id=deal4.id, contact_id=gf_contact.id,
        interaction_type=InteractionType.PRODUCT_DEMO.value,
        title="Technical Demo: Scale and Compliance",
        transcript="""Sales: Our platform processed 3TB in our benchmark test in under 4 hours.
Customer: That is impressive. What about data lineage? Our auditors need to see exactly where every number in a report came from.
Sales: Full data lineage is built-in. Every figure is traceable back to the raw transaction.
Customer: That alone would save us 2 weeks per audit. What is your pricing model for this scale?
Sales: Enterprise pricing at this data volume starts at $125,000 annually.
Customer: That is within our budget. We need to run a security review first.""",
        interaction_date=now - timedelta(days=8),
        summary="Full data lineage capability will save 2 weeks per audit. Price at $125K fits their budget. Security review is the next gating step.",
        decisions=json.dumps(["Security review to be conducted before contract", "$125K annual price agreed in principle"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i4b); db.commit(); db.refresh(i4b)

    meet4 = Meeting(deal_id=deal4.id, contact_id=gf_contact.id,
                    title="Security Review Presentation",
                    purpose="Present security architecture, certifications, and data lineage to their security team.",
                    scheduled_at=now + timedelta(days=3),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet4)

    db.add(FollowUp(deal_id=deal4.id, title="Prepare security architecture documentation",
                    description="Include SOC 2, data lineage diagrams, encryption specs.",
                    due_date=(now + timedelta(days=1)).date(), status=FollowUpStatus.PENDING.value))

    memories_d4 = [
        ("Regulatory risk: Basel III/Dodd-Frank require 24-hour reports; currently takes 72 hours.", "Compliance Risk", i4a.id),
        ("Data lineage capability will save 2 weeks per audit — highly valued feature.", "Value Driver", i4b.id),
        ("$125K annual price within budget. Security review is the final gate before signing.", "Decision", i4b.id),
    ]
    for content, mtype, iid in memories_d4:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal4.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal4.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 5 — HealthTech Innovations | NEGOTIATION | $52,000
    # =========================================================================
    print("  [5/10] HealthTech Innovations...")
    healthtech = Company(name="HealthTech Innovations", industry="Healthcare Technology",
                         description="Digital health and patient data solutions provider.")
    db.add(healthtech)
    db.commit(); db.refresh(healthtech)

    ht_contact = Contact(company_id=healthtech.id, name="Dr. Amanda Foster",
                         email="afoster@healthtech-innov.com", job_title="VP of Product",
                         phone="+1-555-0105")
    db.add(ht_contact)
    db.commit(); db.refresh(ht_contact)

    deal5 = Deal(company_id=healthtech.id, contact_id=ht_contact.id, owner_id=alex.id,
                 name="Patient Analytics Dashboard", value=52000,
                 stage=DealStage.NEGOTIATION.value,
                 expected_close_date=(now + timedelta(days=18)).date(),
                 description="Real-time patient data analytics and outcomes reporting.")
    db.add(deal5)
    db.commit(); db.refresh(deal5)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal5.id, deal5.name, healthtech.name)

    i5a = Interaction(
        deal_id=deal5.id, contact_id=ht_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Discovery: Patient Outcomes Tracking",
        transcript="""Sales: What patient data challenges are you facing?
Customer: We track outcomes for over 50,000 patients across 8 care programs. Our clinical teams are drowning in spreadsheets. We cannot quickly identify which programs are underperforming.
Sales: Is HIPAA compliance a requirement?
Customer: Absolutely non-negotiable. Any platform we use must be HIPAA-compliant and sign a BAA with us. No exceptions.""",
        interaction_date=now - timedelta(days=25),
        summary="Tracks 50K+ patients across 8 programs. HIPAA compliance and BAA signing are non-negotiable. Needs fast program performance identification.",
        customer_preferences=json.dumps(["HIPAA compliance mandatory", "BAA required", "Program performance visibility"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i5a); db.commit(); db.refresh(i5a)

    i5b = Interaction(
        deal_id=deal5.id, contact_id=ht_contact.id,
        interaction_type=InteractionType.PRICING_DISCUSSION.value,
        title="Pricing and Contract Discussion",
        transcript="""Sales: Our proposal is $52,000 for the full platform with HIPAA BAA included.
Customer: The price is acceptable but we need to negotiate the contract term. Our board prefers monthly contracts for new software — they are risk-averse after a bad experience with a 3-year locked-in deal.
Sales: We can offer month-to-month with a 30-day notice period. The annual price would increase by 15% for monthly billing.
Customer: We will take the monthly option for the first 6 months, then convert to annual if the platform performs.""",
        interaction_date=now - timedelta(days=5),
        summary="Price accepted at $52K. Board requires monthly billing initially due to past bad 3-year contract experience. Will convert to annual after 6-month performance review.",
        key_concerns=json.dumps(["Board risk-averse after bad 3-year lock-in", "Needs flexibility to exit if underperforms"]),
        decisions=json.dumps(["Month-to-month billing for first 6 months", "Convert to annual after performance review"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i5b); db.commit(); db.refresh(i5b)

    meet5 = Meeting(deal_id=deal5.id, contact_id=ht_contact.id,
                    title="Contract Finalization",
                    purpose="Review month-to-month contract terms and sign BAA. Confirm go-live date.",
                    scheduled_at=now + timedelta(days=6),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet5)

    db.add(FollowUp(deal_id=deal5.id, title="Prepare HIPAA BAA for signature",
                    description="Include month-to-month pricing option with 30-day notice clause.",
                    due_date=(now + timedelta(days=2)).date(), status=FollowUpStatus.PENDING.value))

    memories_d5 = [
        ("HIPAA compliance and BAA signing are non-negotiable. Board will not proceed without it.", "Hard Requirement", i5a.id),
        ("Board risk-averse after past 3-year contract. Needs month-to-month option initially.", "Stakeholder Constraint", i5b.id),
        ("Will convert to annual pricing after 6-month performance review.", "Decision", i5b.id),
    ]
    for content, mtype, iid in memories_d5:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal5.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal5.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 6 — CloudFirst Technologies | PROPOSAL | $95,000
    # =========================================================================
    print("  [6/10] CloudFirst Technologies...")
    cloudfirst = Company(name="CloudFirst Technologies", industry="Cloud Services",
                         description="Cloud infrastructure and migration services provider.")
    db.add(cloudfirst)
    db.commit(); db.refresh(cloudfirst)

    cf_contact = Contact(company_id=cloudfirst.id, name="David Park",
                         email="dpark@cloudfirst.tech", job_title="CTO",
                         phone="+1-555-0106")
    db.add(cf_contact)
    db.commit(); db.refresh(cf_contact)

    deal6 = Deal(company_id=cloudfirst.id, contact_id=cf_contact.id, owner_id=alex.id,
                 name="Multi-Cloud Analytics Suite", value=95000,
                 stage=DealStage.PROPOSAL.value,
                 expected_close_date=(now + timedelta(days=40)).date(),
                 description="Unified analytics across AWS, Azure, and GCP environments.")
    db.add(deal6)
    db.commit(); db.refresh(deal6)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal6.id, deal6.name, cloudfirst.name)

    i6a = Interaction(
        deal_id=deal6.id, contact_id=cf_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Discovery: Multi-Cloud Observability",
        transcript="""Sales: What are your current cloud monitoring challenges?
Customer: We run workloads on AWS, Azure, and GCP. Each has its own monitoring console. Our DevOps team spends 30% of their time just correlating data across the three platforms. We are missing critical cross-cloud performance patterns.
Sales: Are you looking for a unified dashboard?
Customer: Yes, but it needs to have API access too. Our engineering teams want to pull the data into their own tools.""",
        interaction_date=now - timedelta(days=16),
        summary="Devops team wastes 30% of time correlating data across AWS/Azure/GCP. Needs unified dashboard with API access for engineering team integration.",
        customer_preferences=json.dumps(["Unified multi-cloud dashboard", "REST API access", "Cross-cloud performance correlation"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i6a); db.commit(); db.refresh(i6a)

    meet6 = Meeting(deal_id=deal6.id, contact_id=cf_contact.id,
                    title="Technical API Demo",
                    purpose="Demonstrate REST API capabilities and multi-cloud connector setup.",
                    scheduled_at=now + timedelta(days=7),
                    status=MeetingStatus.SCHEDULED.value)
    db.add(meet6)

    memories_d6 = [
        ("DevOps team wastes 30% of time on cross-cloud data correlation — key pain point.", "Customer Need", i6a.id),
        ("Engineering team needs REST API access to pull analytics into internal tools.", "Technical Requirement", i6a.id),
    ]
    for content, mtype, iid in memories_d6:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal6.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal6.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 7 — TechStart Solutions | DISCOVERY | $18,500
    # =========================================================================
    print("  [7/10] TechStart Solutions...")
    techstart = Company(name="TechStart Solutions", industry="SaaS",
                        description="Fast-growing startup in project management space.")
    db.add(techstart)
    db.commit(); db.refresh(techstart)

    ts_contact = Contact(company_id=techstart.id, name="Michael Torres",
                         email="m.torres@techstart.io", job_title="CEO",
                         phone="+1-555-0107")
    db.add(ts_contact)
    db.commit(); db.refresh(ts_contact)

    deal7 = Deal(company_id=techstart.id, contact_id=ts_contact.id, owner_id=alex.id,
                 name="TechStart Analytics Package", value=18500,
                 stage=DealStage.DISCOVERY.value,
                 expected_close_date=(now + timedelta(days=55)).date(),
                 description="Analytics and growth reporting for their SaaS customer base.")
    db.add(deal7)
    db.commit(); db.refresh(deal7)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal7.id, deal7.name, techstart.name)

    i7a = Interaction(
        deal_id=deal7.id, contact_id=ts_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Intro Call with CEO",
        transcript="""Sales: Tell me about your analytics needs.
Customer: We have 800 customers and we track churn manually in a spreadsheet. We do not even know which features drive retention versus which ones are noise. We are guessing.
Sales: What is your timeline for implementing a solution?
Customer: We just closed a Series A. The board wants analytics in place before we hit 1,000 customers. We have maybe 3 months.""",
        interaction_date=now - timedelta(days=7),
        summary="800 customers tracked manually. Needs feature-level retention analytics before hitting 1,000 customers. Series A just closed — 3-month board-driven deadline.",
        customer_preferences=json.dumps(["Feature-level churn analytics", "Retention driver identification", "Fast implementation"]),
        key_concerns=json.dumps(["3-month deadline from board", "Currently guessing on feature value"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i7a); db.commit(); db.refresh(i7a)

    db.add(FollowUp(deal_id=deal7.id, title="Send product capabilities one-pager to Michael",
                    description="Focus on churn analytics and feature retention metrics.",
                    due_date=(now + timedelta(days=3)).date(), status=FollowUpStatus.PENDING.value))

    memories_d7 = [
        ("800 customers, tracking churn in spreadsheets. No visibility on which features drive retention.", "Customer Need", i7a.id),
        ("Series A just closed. Board wants analytics before 1,000 customers — 3-month deadline.", "Timeline Pressure", i7a.id),
    ]
    for content, mtype, iid in memories_d7:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal7.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal7.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 8 — Retail Solutions Group | NEGOTIATION | $68,000
    # =========================================================================
    print("  [8/10] Retail Solutions Group...")
    retailgrp = Company(name="Retail Solutions Group", industry="Retail",
                        description="Multi-brand retail chain management company.")
    db.add(retailgrp)
    db.commit(); db.refresh(retailgrp)

    rsg_contact = Contact(company_id=retailgrp.id, name="Emma Thompson",
                          email="ethompson@retailsolutions.com", job_title="VP of Technology",
                          phone="+1-555-0108")
    db.add(rsg_contact)
    db.commit(); db.refresh(rsg_contact)

    deal8 = Deal(company_id=retailgrp.id, contact_id=rsg_contact.id, owner_id=alex.id,
                 name="Omnichannel Reporting Platform", value=68000,
                 stage=DealStage.NEGOTIATION.value,
                 expected_close_date=(now + timedelta(days=21)).date(),
                 description="Integrated reporting across online and physical retail channels.")
    db.add(deal8)
    db.commit(); db.refresh(deal8)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal8.id, deal8.name, retailgrp.name)

    i8a = Interaction(
        deal_id=deal8.id, contact_id=rsg_contact.id,
        interaction_type=InteractionType.PRICING_DISCUSSION.value,
        title="Pricing Negotiation",
        transcript="""Sales: We have the final pricing at $68,000 annually.
Customer: We were hoping for $60,000. Our procurement team has a strict $65K ceiling for new software this fiscal year.
Sales: We can do $65,000 if you commit to a 2-year contract. That brings the annual cost within your ceiling.
Customer: A 2-year term is acceptable. Can we also get quarterly business reviews included?
Sales: Yes, QBRs are included at the enterprise tier.""",
        interaction_date=now - timedelta(days=4),
        summary="Agreed $65K/year on 2-year contract (procurement ceiling $65K). Quarterly business reviews included. Deal structurally agreed, awaiting legal review.",
        decisions=json.dumps(["$65K/year on 2-year term", "QBRs included", "Awaiting legal review"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i8a); db.commit(); db.refresh(i8a)

    db.add(FollowUp(deal_id=deal8.id, title="Send revised contract at $65K/year 2-year term",
                    description="Include QBR schedule. Flag for legal review.",
                    due_date=(now + timedelta(days=1)).date(), status=FollowUpStatus.PENDING.value))

    memories_d8 = [
        ("Procurement ceiling is $65K/year. Agreed on 2-year term at $65K to meet budget.", "Decision", i8a.id),
        ("Quarterly business reviews included as part of the enterprise tier agreement.", "Commitment", i8a.id),
    ]
    for content, mtype, iid in memories_d8:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal8.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal8.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # DEAL 9 — EduLearn Platform | CLOSED WON | $32,000
    # =========================================================================
    print("  [9/10] EduLearn Platform (Closed Won)...")
    edulearn = Company(name="EduLearn Platform", industry="EdTech",
                       description="Online learning and education technology platform.")
    db.add(edulearn)
    db.commit(); db.refresh(edulearn)

    edu_contact = Contact(company_id=edulearn.id, name="Robert Kim",
                          email="rkim@edulearn.io", job_title="Director of Operations",
                          phone="+1-555-0109")
    db.add(edu_contact)
    db.commit(); db.refresh(edu_contact)

    deal9 = Deal(company_id=edulearn.id, contact_id=edu_contact.id, owner_id=alex.id,
                 name="Student Performance Analytics", value=32000,
                 stage=DealStage.CLOSED_WON.value,
                 expected_close_date=(now - timedelta(days=8)).date(),
                 description="Analytics platform to track student engagement and performance.")
    db.add(deal9)
    db.commit(); db.refresh(deal9)

    # =========================================================================
    # DEAL 10 — Manufacturing Pro | DISCOVERY | $78,000
    # =========================================================================
    print("  [10/10] Manufacturing Pro Inc...")
    mfgpro = Company(name="Manufacturing Pro Inc", industry="Manufacturing",
                     description="Industrial manufacturing and supply chain company.")
    db.add(mfgpro)
    db.commit(); db.refresh(mfgpro)

    mfg_contact = Contact(company_id=mfgpro.id, name="Lisa Martinez",
                          email="lmartinez@mfgpro.com", job_title="Operations Manager",
                          phone="+1-555-0110")
    db.add(mfg_contact)
    db.commit(); db.refresh(mfg_contact)

    deal10 = Deal(company_id=mfgpro.id, contact_id=mfg_contact.id, owner_id=alex.id,
                  name="Supply Chain Intelligence", value=78000,
                  stage=DealStage.DISCOVERY.value,
                  expected_close_date=(now + timedelta(days=75)).date(),
                  description="Real-time supply chain monitoring and optimization system.")
    db.add(deal10)
    db.commit(); db.refresh(deal10)

    if hindsight_service.is_available():
        hindsight_service.create_deal_bank(deal10.id, deal10.name, mfgpro.name)

    i10a = Interaction(
        deal_id=deal10.id, contact_id=mfg_contact.id,
        interaction_type=InteractionType.DISCOVERY_CALL.value,
        title="Initial Supply Chain Discovery",
        transcript="""Sales: What supply chain visibility challenges are you facing?
Customer: We have 340 suppliers across 18 countries. When there is a disruption — a port strike, a weather event — we find out 2 to 3 days late. By then the damage is done.
Sales: Are you looking for real-time supplier tracking?
Customer: Real-time with predictive alerts. If a supplier in Taiwan starts missing delivery windows, I want to know before it becomes my problem.""",
        interaction_date=now - timedelta(days=3),
        summary="340 suppliers across 18 countries. Finds out about disruptions 2-3 days late. Wants real-time tracking with predictive alerts for early warning.",
        customer_preferences=json.dumps(["Real-time supplier tracking", "Predictive disruption alerts", "Multi-country coverage"]),
        memory_sync_status=SyncStatus.SYNCED.value
    )
    db.add(i10a); db.commit(); db.refresh(i10a)

    memories_d10 = [
        ("340 suppliers across 18 countries. Learns about disruptions 2-3 days late.", "Customer Need", i10a.id),
        ("Wants predictive alerts for supplier delivery pattern changes — not just reactive tracking.", "Feature Requirement", i10a.id),
    ]
    for content, mtype, iid in memories_d10:
        if hindsight_service.is_available():
            hindsight_service.retain_memory(deal10.id, content, mtype, interaction_id=iid)
        db.add(Memory(deal_id=deal10.id, interaction_id=iid, memory_type=mtype,
                      content=content, sync_status=SyncStatus.SYNCED.value))

    db.commit()

    # =========================================================================
    # PROSPECT CONTACTS (no deals)
    # =========================================================================
    print("  Adding prospect contacts...")
    prospects = [
        {"company": "DataCore Systems",       "industry": "Data Management",    "name": "Patricia Hayes",    "title": "CEO",              "email": "phayes@datacore.io"},
        {"company": "NextGen Logistics",      "industry": "Supply Chain",       "name": "Maria Gonzalez",   "title": "Operations Director","email": "mgonzalez@nextgenlog.com"},
        {"company": "Phoenix Insurance Group","industry": "Insurance",          "name": "Robert Chen",       "title": "Chief Digital Officer","email": "rchen@phoenixins.com"},
        {"company": "BrightPath Education",   "industry": "Education",          "name": "Daniel Park",       "title": "Technology Director", "email": "dpark@brightpath.edu"},
        {"company": "Summit Medical Group",   "industry": "Healthcare",         "name": "Dr. Lisa Anderson", "title": "CMIO",              "email": "landerson@summitmed.com"},
        {"company": "GreenLeaf Energy",       "industry": "Renewable Energy",   "name": "Sophie Turner",     "title": "VP of Technology",  "email": "sturner@greenleaf.energy"},
        {"company": "Urban Properties Inc",   "industry": "Real Estate",        "name": "Michael Roberts",   "title": "Director of Ops",   "email": "mroberts@urbanprop.com"},
        {"company": "TechBridge Consulting",  "industry": "Consulting",         "name": "Andrew Miller",     "title": "Managing Partner",  "email": "amiller@techbridge.co"},
        {"company": "Coastal Bank & Trust",   "industry": "Banking",            "name": "Victoria Brown",    "title": "SVP Technology",    "email": "vbrown@coastalbank.com"},
        {"company": "FoodFirst Distribution", "industry": "Food & Beverage",    "name": "Samantha Davis",    "title": "VP Supply Chain",   "email": "sdavis@foodfirst.com"},
    ]
    for p in prospects:
        co = Company(name=p["company"], industry=p["industry"])
        db.add(co)
        db.commit(); db.refresh(co)
        db.add(Contact(company_id=co.id, name=p["name"], job_title=p["title"], email=p["email"]))

    db.commit()

    # =========================================================================
    # SUMMARY
    # =========================================================================
    total_deals     = db.query(Deal).count()
    total_contacts  = db.query(Contact).count()
    total_memories  = db.query(Memory).count()
    total_meetings  = db.query(Meeting).count()
    total_followups = db.query(FollowUp).count()

    print("\nSeeding complete!")
    print(f"  Deals       : {total_deals}")
    print(f"  Contacts    : {total_contacts}")
    print(f"  Memories    : {total_memories}")
    print(f"  Meetings    : {total_meetings}")
    print(f"  Follow-ups  : {total_followups}")
    hindsight_connected = "connected" if hindsight_service.is_available() else "not configured"
    print(f"  Hindsight   : {hindsight_connected}")
    db.close()


if __name__ == "__main__":
    import sys
    if "--reset" in sys.argv:
        reset_db()
    create_seed_data()
