from typing import Tuple, List, Optional
from app.models.schemas import ClarificationPayload, QueryClassification

class ClarificationAgent:
    """
    Clarification Agent:
    - Resolves ambiguity, missing context, and incomplete queries.
    - Generates targeted questions and response suggestions.
    - Combines user clarification responses into an enriched, refined query.
    """

    def generate_clarification(
        self,
        query: str,
        classification: QueryClassification,
        session_id: str
    ) -> ClarificationPayload:
        question = classification.clarification_question or (
            f"Could you specify more context regarding: '{query}'?"
        )
        options = classification.clarification_options or [
            f"Provide general guidelines on {query}",
            f"Step-by-step instructions for {query}",
            f"Compare requirements across categories"
        ]

        return ClarificationPayload(
            original_query=query,
            question=question,
            options=options,
            session_id=session_id
        )

    def merge_clarification(self, original_query: str, user_answer: str) -> str:
        """
        Synthesizes a refined search query combining the original request with user clarification.
        """
        clean_orig = original_query.strip().rstrip("?.")
        clean_ans = user_answer.strip()

        generic_fillers = [
            "tell me more", "what should i do", "help me with this",
            "details", "explain this", "information", "status", "policy"
        ]
        if any(f in clean_orig.lower() for f in generic_fillers) or len(clean_orig.split()) <= 2:
            return clean_ans

        return f"{clean_orig} specifically regarding {clean_ans}"

clarification_agent = ClarificationAgent()
