"""OpenRouter / NVIDIA Nemotron AI service for Triangle."""
import os
import json
import logging
import httpx
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_BRIEFING = """You are Triangle AI, a deal intelligence assistant for B2B sales teams.
You generate meeting briefings using ACTUAL customer conversation history and retrieved memories.

RULES:
- Never invent customer statements or commitments.
- Distinguish verified facts from your recommendations.
- Cite the source interaction and date for historical claims.
- If context is insufficient, say so honestly.
- Do NOT treat proposed actions as agreed commitments.
- Distinguish previously expressed objections from possible future concerns.

Generate a structured JSON briefing with these sections:
{
  "meeting_summary": "Concise summary of the deal and customer's position",
  "known_customer_facts": [{"fact": "...", "source": "...", "date": "..."}],
  "key_talking_points": ["..."],
  "potential_objections": [{"objection": "...", "source": "expressed|anticipated", "context": "..."}],
  "suggested_responses": [{"objection": "...", "response": "..."}],
  "recommended_next_steps": ["..."],
  "why_these_insights": "Explanation of which interactions and memories informed this briefing"
}"""

SYSTEM_PROMPT_EXTRACT = """You are a customer intelligence extraction system. Extract structured information from sales conversations.

Return JSON with:
{
  "customer_needs": ["..."],
  "preferences": ["..."],
  "objections": ["..."],
  "decisions": ["..."],
  "commitments": ["..."],
  "follow_ups": ["..."],
  "summary": "Brief summary of key points"
}

Only extract facts actually present in the conversation. Do not infer or invent information."""

SYSTEM_PROMPT_INSIGHTS = """You are Triangle AI, answering questions about a specific deal's history.

RULES:
- Use the provided conversation history and memories to answer.
- When quoting a customer, use their actual words from the transcript.
- Always cite the interaction date and type.
- If the exact conversation is not available, state that clearly.
- Distinguish direct quotes from summaries.
- Never fabricate quotations."""


class OpenRouterService:
    """Service for calling NVIDIA Nemotron via OpenRouter."""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> Optional[str]:
        """Make a call to the OpenRouter API."""
        if not self.api_key:
            logger.error("OPENROUTER_API_KEY not set. AI features disabled.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:5173"),
            "X-Title": "Triangle AI Deal Intelligence",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content
        except httpx.TimeoutException:
            logger.error("OpenRouter request timed out")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error {e.response.status_code}: {e.response.text[:200]}")
            return None
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            return None

    async def generate_briefing(
        self,
        deal_info: Dict[str, Any],
        interactions: List[Dict[str, Any]],
        memories: List[Dict[str, Any]],
        meeting_info: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Generate a meeting briefing using deal context."""
        context_parts = [
            f"## Deal Information\n"
            f"Deal: {deal_info.get('name', 'Unknown')}\n"
            f"Company: {deal_info.get('company', 'Unknown')}\n"
            f"Value: ${deal_info.get('value', 0):,.0f}\n"
            f"Stage: {deal_info.get('stage', 'Unknown')}\n"
            f"Expected Close: {deal_info.get('expected_close_date', 'Unknown')}\n",

            f"\n## Upcoming Meeting\n"
            f"Date: {meeting_info.get('date', 'Unknown')}\n"
            f"Purpose: {meeting_info.get('purpose', 'General meeting')}\n",
        ]

        if interactions:
            context_parts.append("\n## Previous Interactions\n")
            for i in interactions:
                context_parts.append(
                    f"### {i.get('type', 'Meeting')} — {i.get('date', 'Unknown')}\n"
                    f"Title: {i.get('title', '')}\n"
                    f"Transcript:\n{i.get('transcript', 'No transcript available')}\n\n"
                )

        if memories:
            context_parts.append("\n## Retrieved Memories (from Hindsight Cloud)\n")
            for m in memories:
                context_parts.append(f"- {m.get('text', m.get('content', ''))}\n")

        user_prompt = "".join(context_parts) + "\n\nGenerate the meeting briefing based on the above context."

        raw = await self._call_llm(SYSTEM_PROMPT_BRIEFING, user_prompt, temperature=0.5)
        if not raw:
            return None

        # Try to parse as JSON
        try:
            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Return as plain text briefing
            return {
                "meeting_summary": raw,
                "known_customer_facts": [],
                "key_talking_points": [],
                "potential_objections": [],
                "suggested_responses": [],
                "recommended_next_steps": [],
                "why_these_insights": "Generated from available context.",
                "raw_text": raw,
            }

    async def extract_customer_info(self, transcript: str, deal_name: str) -> Optional[Dict[str, Any]]:
        """Extract customer facts from a conversation transcript."""
        user_prompt = (
            f"Deal: {deal_name}\n\n"
            f"Conversation Transcript:\n{transcript}\n\n"
            "Extract all relevant customer information from this conversation."
        )
        raw = await self._call_llm(SYSTEM_PROMPT_EXTRACT, user_prompt, temperature=0.3)
        if not raw:
            return None
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"summary": raw, "customer_needs": [], "preferences": [], "objections": [], "decisions": [], "commitments": [], "follow_ups": []}

    async def answer_question(
        self,
        question: str,
        deal_info: Dict[str, Any],
        interactions: List[Dict[str, Any]],
        memories: List[Dict[str, Any]],
    ) -> Optional[str]:
        """Answer a deal-specific question using context."""
        context_parts = [
            f"## Deal: {deal_info.get('name', 'Unknown')} ({deal_info.get('company', 'Unknown')})\n",
        ]

        if interactions:
            context_parts.append("\n## Conversation History\n")
            for i in interactions:
                context_parts.append(
                    f"### {i.get('type', 'Meeting')} — {i.get('date', 'Unknown')}\n"
                    f"{i.get('transcript', 'No transcript')}\n\n"
                )

        if memories:
            context_parts.append("\n## Retrieved Memories\n")
            for m in memories:
                context_parts.append(f"- {m.get('text', m.get('content', ''))}\n")

        user_prompt = "".join(context_parts) + f"\n\nUser Question: {question}"

        return await self._call_llm(SYSTEM_PROMPT_INSIGHTS, user_prompt, temperature=0.4)


# Singleton
openrouter_service = OpenRouterService()
