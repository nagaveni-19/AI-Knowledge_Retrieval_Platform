from typing import List, Tuple, Optional
from app.config import settings
from app.models.schemas import QueryType, ConfidenceLevel, RetrievalResult
from app.services.llm_provider import llm_provider

class ResponseGenerationAgent:
    """
    Response Generation Agent:
    - Generates grounded, hallucination-free answers using retrieved evidence.
    - Tailors answers for factual, procedural, and comparative queries.
    - Computes calibrated application-level confidence score.
    - Preserves source metadata and citations.
    """

    def generate(
        self,
        query: str,
        query_type: QueryType,
        retrieved_chunks: List[RetrievalResult],
        conversation_context: Optional[str] = None
    ) -> Tuple[str, float, ConfidenceLevel]:
        if not retrieved_chunks:
            return (
                "No sufficiently relevant documents were found in the knowledge base to answer this query. "
                "Please verify that appropriate documents are indexed or adjust your search terms.",
                0.0,
                ConfidenceLevel.NONE
            )

        answer, confidence_score = llm_provider.generate_grounded_answer(
            query=query,
            query_type=query_type,
            retrieved_chunks=retrieved_chunks,
            conversation_context=conversation_context
        )

        # Categorize confidence level
        if confidence_score >= settings.CONFIDENCE_HIGH_THRESHOLD:
            level = ConfidenceLevel.HIGH
        elif confidence_score >= settings.CONFIDENCE_MEDIUM_THRESHOLD:
            level = ConfidenceLevel.MEDIUM
        elif confidence_score > 0.0:
            level = ConfidenceLevel.LOW
        else:
            level = ConfidenceLevel.NONE

        return answer, confidence_score, level

response_generation_agent = ResponseGenerationAgent()
