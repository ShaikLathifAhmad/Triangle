"""
TRIANGLE - AI Deal Intelligence Platform
Backend Application Entry Point
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, get_db
from app.routers import deals, interactions, meetings, briefings, memories, dashboard, follow_ups, contacts
from app.routers import auth as auth_router

# Validate critical environment variables
def validate_env():
    warnings = []
    if not os.getenv("HINDSIGHT_API_KEY"):
        warnings.append("HINDSIGHT_API_KEY is not set. Memory features will be unavailable.")
    if not os.getenv("OPENROUTER_API_KEY"):
        warnings.append("OPENROUTER_API_KEY is not set. AI briefing features will be unavailable.")
    for w in warnings:
        print(f"⚠️  WARNING: {w}")
    return warnings

startup_warnings = validate_env()

app = FastAPI(
    title="TRIANGLE API",
    description="AI-powered Deal Intelligence Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:8443",  # Figma Make frontend port
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router.router, prefix="/api", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(deals.router, prefix="/api", tags=["Deals"])
app.include_router(contacts.router, prefix="/api", tags=["Contacts"])
app.include_router(interactions.router, prefix="/api", tags=["Interactions"])
app.include_router(meetings.router, prefix="/api", tags=["Meetings"])
app.include_router(briefings.router, prefix="/api", tags=["Briefings"])
app.include_router(memories.router, prefix="/api", tags=["Memory"])
app.include_router(follow_ups.router, prefix="/api", tags=["Follow-ups"])


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "warnings": startup_warnings,
        "integrations": {
            "hindsight": bool(os.getenv("HINDSIGHT_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
