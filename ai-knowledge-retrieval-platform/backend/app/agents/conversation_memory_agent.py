import re
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from app.config import settings
from app.models.schemas import ChatTurn, SessionContext, RetrievalResult

class ConversationMemoryAgent:
    """
    Conversation Memory Agent:
    - Maintains multi-turn dialog history per session.
    - Resolves contextual follow-up queries (anaphora resolution, pronouns like 'it', 'they', 'the policy').
    - Bounds context history to prevent token overflow.
    - Isolates conversation state from permanent vector knowledge base.
    """

    def __init__(self, max_turns: int = settings.MAX_MEMORY_TURNS):
        self.max_turns = max_turns
        self.sessions: Dict[str, SessionContext] = {}

    def get_session(self, session_id: str) -> SessionContext:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionContext(session_id=session_id)
        return self.sessions[session_id]

    def contextualize_query(self, session_id: str, current_query: str) -> str:
        """
        Detects follow-up references (e.g., 'what about that?', 'how do I apply for it?', 'tell me more about the first one')
        and enriches current_query with antecedent context from recent turns.
        """
        session = self.get_session(session_id)
        if not session.history:
            return current_query

        lower = current_query.lower()
        follow_up_cues = [" it", " this", " that", " them", " those", "these", "the same", "how to apply", "what about", "and for"]
        is_follow_up = any(cue in lower for cue in follow_up_cues) or len(lower.split()) < 4

        if is_follow_up and session.history:
            # Find the most recent user query and assistant response
            recent_turns = [t for t in session.history if t.role == "user"]
            if recent_turns:
                last_user_query = recent_turns[-1].content
                # Contextual rewrite
                enriched = f"{current_query} (In context of previous topic: '{last_user_query}')"
                return enriched

        return current_query

    def add_turn(
        self,
        session_id: str,
        role: str,
        content: str,
        query_type: Optional[str] = None,
        confidence_score: Optional[float] = None,
        sources: List[RetrievalResult] = []
    ):
        session = self.get_session(session_id)
        turn = ChatTurn(
            id=str(uuid.uuid4())[:8],
            session_id=session_id,
            role=role,
            content=content,
            query_type=query_type,
            confidence_score=confidence_score,
            sources=sources,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        session.history.append(turn)

        # Track referenced documents
        for s in sources:
            if s.document_name not in session.referenced_documents:
                session.referenced_documents.append(s.document_name)

        # Prune memory window to prevent overflow
        if len(session.history) > (self.max_turns * 2):
            session.history = session.history[-(self.max_turns * 2):]

    def get_formatted_history(self, session_id: str, limit: int = 4) -> str:
        session = self.get_session(session_id)
        turns = session.history[-limit:]
        if not turns:
            return ""

        formatted = []
        for t in turns:
            role_label = "User" if t.role == "user" else "Assistant"
            formatted.append(f"{role_label}: {t.content}")
        return "\n".join(formatted)

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

conversation_memory_agent = ConversationMemoryAgent()
