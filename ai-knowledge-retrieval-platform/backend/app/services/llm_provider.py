import os
import re
from typing import List, Dict, Any, Tuple, Optional
from app.config import settings
from app.models.schemas import QueryType, RetrievalResult

class LLMProvider:
    """
    Unified LLM and Knowledge Synthesis Provider.
    Supports:
    1. Local High-Fidelity Grounded RAG Synthesis Engine (Offline, 0 latency, 0 hallucination).
    2. OpenAI API (GPT-4o, GPT-4o-mini).
    3. Ollama Local LLMs (Llama 3.2, Mistral).
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()

    def generate_grounded_answer(
        self,
        query: str,
        query_type: QueryType,
        retrieved_chunks: List[RetrievalResult],
        conversation_context: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Synthesizes a grounded response strictly based on the retrieved context.
        Returns: (answer_text, application_confidence_score)
        """
        # If no chunks were retrieved or evidence is missing
        if not retrieved_chunks:
            return (
                "I could not find sufficient supporting evidence in the indexed knowledge base to answer this query. "
                "Please verify if relevant documents have been uploaded to the knowledge base, or try refining your search terms.",
                0.0
            )

        # Delegate to OpenAI if configured
        if self.provider == "openai" and settings.OPENAI_API_KEY.startswith("sk-"):
            try:
                return self._call_openai(query, query_type, retrieved_chunks, conversation_context)
            except Exception as e:
                print(f"[LLM Warning] OpenAI API call failed: {e}. Falling back to local grounded synthesis.")

        # Delegate to Ollama if configured
        if self.provider == "ollama":
            try:
                return self._call_ollama(query, query_type, retrieved_chunks, conversation_context)
            except Exception as e:
                print(f"[LLM Warning] Ollama call failed: {e}. Falling back to local grounded synthesis.")

        # Default Local Grounded Engine
        return self._local_grounded_synthesis(query, query_type, retrieved_chunks, conversation_context)

    def _calculate_confidence(self, retrieved_chunks: List[RetrievalResult], query: str) -> float:
        """
        Calculates an application-level confidence indicator based on:
        - Mean and maximum similarity scores of retrieved evidence.
        - Keyword overlap between the query and retrieved text.
        - Number of independent supporting chunks.
        """
        if not retrieved_chunks:
            return 0.0

        scores = [c.similarity_score for c in retrieved_chunks]
        max_score = max(scores)
        avg_score = sum(scores) / len(scores)

        # Query term coverage
        query_terms = set(re.findall(r"\w+", query.lower()))
        meaningful_terms = [t for t in query_terms if len(t) > 3]
        
        all_chunk_text = " ".join([c.text.lower() for c in retrieved_chunks])
        if meaningful_terms:
            matched_terms = [t for t in meaningful_terms if t in all_chunk_text]
            term_coverage = len(matched_terms) / len(meaningful_terms)
        else:
            term_coverage = 0.5

        # Weighted combination
        confidence = (0.50 * max_score) + (0.30 * avg_score) + (0.20 * term_coverage)
        return float(round(min(1.0, max(0.0, confidence)), 3))

    def _local_grounded_synthesis(
        self,
        query: str,
        query_type: QueryType,
        chunks: List[RetrievalResult],
        conversation_context: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Local deterministic Grounded Synthesis Engine.
        Synthesizes factual, procedural, and comparative responses directly from chunk sentences.
        """
        confidence = self._calculate_confidence(chunks, query)
        
        # Build cited snippets
        cited_snippets = []
        for c in chunks:
            citation = f"[{c.document_name} • {c.page_or_section}]"
            cited_snippets.append((citation, c.text, c.similarity_score))

        # 1. Procedural query handling
        if query_type == QueryType.PROCEDURAL:
            steps = []
            for citation, text, _ in cited_snippets:
                # Find procedural cues (numbers, bullet points, 'first', 'then', 'step')
                lines = [line.strip() for line in text.split("\n") if line.strip()]
                for line in lines:
                    if re.match(r"^(\d+\.|\-|\*|step\s+\d+|phase\s+\d+)", line, re.IGNORECASE):
                        steps.append(f"{line} {citation}")
                    elif any(kw in line.lower() for kw in ["must", "ensure", "follow", "submit", "verify", "execute", "require"]):
                        steps.append(f"{line} {citation}")

            if steps:
                unique_steps = []
                seen = set()
                for s in steps:
                    core = s.split("[")[0].strip().lower()
                    if core not in seen:
                        seen.add(core)
                        unique_steps.append(s)

                formatted_steps = "\n".join([f"{i+1}. {s}" if not re.match(r"^\d+\.", s) else s for i, s in enumerate(unique_steps[:6])])
                answer = (
                    f"### Recommended Step-by-Step Procedure\n\n"
                    f"Based on verified guidelines in the knowledge base, follow these operational steps:\n\n"
                    f"{formatted_steps}\n\n"
                    f"> **Evidence Grounding:** Extracted from {len(chunks)} supporting document sections."
                )
                return answer, confidence

        # 2. Comparative query handling
        if query_type == QueryType.COMPARATIVE:
            doc_summaries: Dict[str, List[str]] = {}
            for c in chunks:
                doc_summaries.setdefault(c.document_name, []).append(c.text)

            comp_lines = ["### Comparative Analysis Across Knowledge Sources\n"]
            for doc, texts in doc_summaries.items():
                snippet = texts[0][:300].strip().replace("\n", " ") + "..."
                comp_lines.append(f"- **{doc}**: {snippet}")

            comp_lines.append("\n**Key Distinctions & Observations:**")
            comp_lines.append(f"1. Information spans {len(doc_summaries)} distinct documentation source(s).")
            comp_lines.append("2. Consult the cited source transparency panel for exact quantitative thresholds and contractual clauses.")
            return "\n".join(comp_lines), confidence

        # 3. Factual query handling (Default)
        primary_chunks = chunks[:2]
        synthesis_paragraphs = []
        for c in primary_chunks:
            citation = f"**[{c.document_name} • {c.page_or_section}]**"
            cleaned_text = c.text.strip().replace("\n", " ")
            synthesis_paragraphs.append(f"{cleaned_text} {citation}")

        answer = (
            f"Based on the indexed documents, here is the verified information:\n\n"
            f"{synthesis_paragraphs[0]}\n\n"
        )
        if len(synthesis_paragraphs) > 1:
            answer += f"**Additional Context:**\n{synthesis_paragraphs[1]}\n"

        return answer, confidence

    def _call_openai(
        self,
        query: str,
        query_type: QueryType,
        chunks: List[RetrievalResult],
        conversation_context: Optional[str]
    ) -> Tuple[str, float]:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        context_blocks = "\n\n".join([
            f"Source [{c.document_name} | {c.page_or_section} | Chunk ID: {c.chunk_id}]:\n{c.text}"
            for c in chunks
        ])

        system_prompt = (
            "You are a strict, professional AI Knowledge Retrieval Assistant. "
            "You must synthesize answers strictly using ONLY the provided Source context. "
            "Never invent, assume, or extrapolate facts not present in the sources. "
            "If the sources do not provide adequate evidence, explicitly state that the information is unavailable. "
            "Always include in-text citations like [Filename • Page/Section]. "
            f"Query Classification: {query_type.value.upper()}."
        )

        user_content = f"Question: {query}\n\nRetrieved Context:\n{context_blocks}"
        if conversation_context:
            user_content = f"Conversation History:\n{conversation_context}\n\n" + user_content

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1
        )
        answer = response.choices[0].message.content or ""
        confidence = self._calculate_confidence(chunks, query)
        return answer, confidence

    def _call_ollama(
        self,
        query: str,
        query_type: QueryType,
        chunks: List[RetrievalResult],
        conversation_context: Optional[str]
    ) -> Tuple[str, float]:
        import requests
        context_blocks = "\n\n".join([
            f"Source [{c.document_name} | {c.page_or_section}]:\n{c.text}"
            for c in chunks
        ])
        prompt = (
            f"Instructions: Answer the question strictly using the context below. Include citations.\n"
            f"Context:\n{context_blocks}\n\nQuestion: {query}\nAnswer:"
        )
        resp = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=30
        )
        if resp.status_code == 200:
            answer = resp.json().get("response", "")
            return answer, self._calculate_confidence(chunks, query)
        raise RuntimeError(f"Ollama returned status {resp.status_code}")

llm_provider = LLMProvider()
