from typing import List, Optional
from app.config import settings
from app.models.schemas import QueryClassification, RetrievalResult
from app.services.vector_store import vector_store

class RetrievalAgent:
    """
    Retrieval Agent:
    - Accepts query and classification.
    - Executes semantic vector search against indexed knowledge chunks.
    - Applies Top-K ranking, similarity thresholds, and low-confidence pruning.
    - Preserves metadata (document, page/section, chunk_id, relevance score).
    """

    def retrieve(
        self,
        query: str,
        classification: Optional[QueryClassification] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        domain_filter: Optional[str] = None
    ) -> List[RetrievalResult]:
        k = top_k or settings.DEFAULT_TOP_K
        threshold = similarity_threshold if similarity_threshold is not None else settings.SIMILARITY_THRESHOLD

        # If comparative query, fetch slightly more chunks (e.g. up to 6) to span multiple documents
        if classification and classification.query_type.value == "comparative":
            k = max(k, 6)

        results = vector_store.search(
            query=query,
            domain_filter=domain_filter,
            top_k=k,
            similarity_threshold=threshold
        )

        return results

retrieval_agent = RetrievalAgent()
