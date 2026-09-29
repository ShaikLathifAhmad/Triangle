"""Hindsight Cloud integration service for persistent AI memory."""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class HindsightService:
    """Service for interacting with Hindsight Cloud memory system."""

    def __init__(self):
        self.api_key = os.getenv("HINDSIGHT_API_KEY")
        self.base_url = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
        self.client = None
        self._initialized = False

    def _get_client(self):
        """Lazy initialization of Hindsight client."""
        if not self._initialized:
            if not self.api_key:
                logger.warning("HINDSIGHT_API_KEY not set. Memory features disabled.")
                return None
            try:
                from hindsight_client import Hindsight
                self.client = Hindsight(
                    base_url=self.base_url,
                    api_key=self.api_key,
                    timeout=30.0,
                )
                self._initialized = True
                logger.info("Hindsight client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Hindsight client: {e}")
                self.client = None
        return self.client

    def _bank_id(self, deal_id: int) -> str:
        """Generate a deal-specific memory bank ID for isolation."""
        return f"triangle-deal-{deal_id}"

    def is_available(self) -> bool:
        """Check if Hindsight is configured and available."""
        return self._get_client() is not None

    def create_deal_bank(self, deal_id: int, deal_name: str, company_name: str) -> bool:
        """Create a memory bank for a specific deal."""
        client = self._get_client()
        if not client:
            return False
        try:
            bank_id = self._bank_id(deal_id)
            client.create_bank(
                bank_id=bank_id,
                name=f"{company_name} - {deal_name}",
                mission=(
                    f"You are a sales intelligence memory for the deal '{deal_name}' with {company_name}. "
                    "Track customer preferences, objections, requirements, decisions, and commitments. "
                    "Prioritize actionable sales insights and customer-specific context."
                ),
                disposition={
                    "skepticism": 2,
                    "literalism": 4,
                    "empathy": 4,
                },
            )
            logger.info(f"Created memory bank for deal {deal_id}: {bank_id}")
            return True
        except Exception as e:
            # Bank may already exist
            if "already exists" in str(e).lower() or "conflict" in str(e).lower():
                logger.info(f"Memory bank already exists for deal {deal_id}")
                return True
            logger.error(f"Failed to create memory bank for deal {deal_id}: {e}")
            return False

    def retain_memory(
        self,
        deal_id: int,
        content: str,
        context: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        interaction_id: Optional[int] = None,
        timestamp: Optional[datetime] = None,
    ) -> bool:
        """Store a memory in Hindsight Cloud for a specific deal."""
        client = self._get_client()
        if not client:
            return False
        try:
            bank_id = self._bank_id(deal_id)
            retain_kwargs = {
                "bank_id": bank_id,
                "content": content,
            }
            if context:
                retain_kwargs["context"] = context
            if metadata:
                retain_kwargs["metadata"] = metadata
            if timestamp:
                retain_kwargs["timestamp"] = timestamp
            if interaction_id:
                retain_kwargs["document_id"] = f"interaction-{interaction_id}"

            client.retain(**retain_kwargs)
            logger.info(f"Retained memory for deal {deal_id}: {content[:80]}...")
            return True
        except Exception as e:
            logger.error(f"Failed to retain memory for deal {deal_id}: {e}")
            return False

    def retain_batch(
        self,
        deal_id: int,
        items: List[Dict[str, str]],
        interaction_id: Optional[int] = None,
    ) -> bool:
        """Store multiple memories in batch."""
        client = self._get_client()
        if not client:
            return False
        try:
            bank_id = self._bank_id(deal_id)
            kwargs = {
                "bank_id": bank_id,
                "items": items,
                "retain_async": False,
            }
            if interaction_id:
                kwargs["document_id"] = f"interaction-{interaction_id}"
            client.retain_batch(**kwargs)
            logger.info(f"Retained {len(items)} memories for deal {deal_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to retain batch memories for deal {deal_id}: {e}")
            return False

    async def recall_memories(
        self,
        deal_id: int,
        query: str,
        max_tokens: int = 4096,
        budget: str = "mid",
    ) -> List[Dict[str, Any]]:
        """Recall relevant memories for a deal based on a query."""
        client = self._get_client()
        if not client:
            return []
        try:
            bank_id = self._bank_id(deal_id)
            results = await client.arecall(
                bank_id=bank_id,
                query=query,
                max_tokens=max_tokens,
                budget=budget,
            )
            memories = []
            for r in results.results:
                memories.append({
                    "text": r.text,
                    "type": getattr(r, "type", "unknown"),
                    "score": getattr(r, "score", None),
                    "chunk_id": getattr(r, "chunk_id", None),
                })
            logger.info(f"Recalled {len(memories)} memories for deal {deal_id}, query: {query[:50]}...")
            return memories
        except Exception as e:
            logger.error(f"Failed to recall memories for deal {deal_id}: {e}")
            return []

    def reflect(
        self,
        deal_id: int,
        query: str,
        context: str = "",
        budget: str = "mid",
    ) -> Optional[str]:
        """Use Hindsight's reflect to generate a reasoned answer from memories."""
        client = self._get_client()
        if not client:
            return None
        try:
            bank_id = self._bank_id(deal_id)
            kwargs = {
                "bank_id": bank_id,
                "query": query,
                "budget": budget,
            }
            if context:
                kwargs["context"] = context
            answer = client.reflect(**kwargs)
            return answer.text if answer else None
        except Exception as e:
            logger.error(f"Failed to reflect for deal {deal_id}: {e}")
            return None

    def list_memories(
        self,
        deal_id: int,
        memory_type: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """List stored memories for a deal."""
        client = self._get_client()
        if not client:
            return []
        try:
            bank_id = self._bank_id(deal_id)
            kwargs = {
                "bank_id": bank_id,
                "limit": limit,
            }
            if memory_type:
                kwargs["type"] = memory_type
            if search_query:
                kwargs["search_query"] = search_query

            result = client.list_memories(**kwargs)
            memories = []
            if hasattr(result, 'memories'):
                for m in result.memories:
                    memories.append({
                        "id": getattr(m, "id", None),
                        "text": getattr(m, "text", ""),
                        "type": getattr(m, "type", "unknown"),
                        "created_at": str(getattr(m, "created_at", "")),
                    })
            elif hasattr(result, '__iter__'):
                for m in result:
                    memories.append({
                        "id": getattr(m, "id", None),
                        "text": getattr(m, "text", str(m)),
                        "type": getattr(m, "type", "unknown"),
                    })
            return memories
        except Exception as e:
            logger.error(f"Failed to list memories for deal {deal_id}: {e}")
            return []


# Singleton
hindsight_service = HindsightService()
