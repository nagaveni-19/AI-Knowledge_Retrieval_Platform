import re
from typing import List, Tuple
from app.models.schemas import QueryClassification, QueryType, ResolutionPath

class QueryUnderstandingAgent:
    """
    Query Understanding Agent:
    - Analyzes user input.
    - Classifies queries into: Factual, Procedural, Comparative, or Ambiguous.
    - Generates confidence, reasoning, entity extraction, and routing decisions.
    """

    def __init__(self):
        # Keyword patterns for classifications
        self.procedural_patterns = [
            r"\bhow (do|can|to|should)\b",
            r"\bsteps?\b",
            r"\bprocess\b",
            r"\bprocedure\b",
            r"\bguide\b",
            r"\binstructions?\b",
            r"\bdeploy(ment)?\b",
            r"\bsetup\b",
            r"\bworkflow\b",
            r"\bprotocol\b",
            r"\brules? for\b"
        ]

        self.comparative_patterns = [
            r"\bcompare\b",
            r"\bdifference(s)? between\b",
            r"\bversus\b|\bvs\.?\b",
            r"\bwhich is (better|faster|recommended)\b",
            r"\badvantages and disadvantages\b",
            r"\bpros and cons\b",
            r"\bsimilarit(y|ies)\b"
        ]

        self.ambiguous_patterns = [
            r"^tell me more$",
            r"^what should i do\??$",
            r"^help me with this$",
            r"^details\??$",
            r"^explain this$",
            r"^information$",
            r"^why\??$",
            r"^status\??$",
            r"^policy\??$",
            r"^requirement\??$"
        ]

    def analyze(self, query: str) -> QueryClassification:
        cleaned = query.strip()
        lower = cleaned.lower()

        # 1. Check for blatant ambiguity or underspecified short queries
        for pat in self.ambiguous_patterns:
            if re.match(pat, lower):
                return QueryClassification(
                    query_type=QueryType.AMBIGUOUS,
                    confidence=0.95,
                    routing_path=ResolutionPath.CLARIFICATION_REQUIRED,
                    reasoning="Query lacks specific subject matter, context, or actionable objective.",
                    is_ambiguous=True,
                    clarification_question="Your query appears very general. Which domain or topic are you interested in?",
                    clarification_options=[
                        "Healthcare & Clinical Protocols",
                        "Financial Compliance & AML Matrix",
                        "Cloud Infrastructure & DevOps Runbooks",
                        "General Overview of All Policies"
                    ]
                )

        # Incomplete / single-word queries without context
        words = lower.split()
        if len(words) <= 1 and len(lower) < 6 and not any(w in lower for w in ["sla", "aml", "kyc", "triage"]):
            return QueryClassification(
                query_type=QueryType.AMBIGUOUS,
                confidence=0.88,
                routing_path=ResolutionPath.CLARIFICATION_REQUIRED,
                reasoning="Single-word query requires additional context to pinpoint relevant knowledge.",
                is_ambiguous=True,
                clarification_question=f"Could you clarify what you would like to know regarding '{cleaned}'?",
                clarification_options=[
                    f"Requirements and criteria for {cleaned}",
                    f"Step-by-step procedure for {cleaned}",
                    f"Documentation and compliance guidelines"
                ]
            )

        # 2. Check for Comparative Intent
        for pat in self.comparative_patterns:
            if re.search(pat, lower):
                entities = self._extract_entities(cleaned)
                return QueryClassification(
                    query_type=QueryType.COMPARATIVE,
                    confidence=0.89,
                    routing_path=ResolutionPath.COMPARATIVE_SYNTHESIS,
                    reasoning="Query requests comparative distinction or trade-off analysis across multiple items.",
                    entities=entities,
                    is_ambiguous=False
                )

        # 3. Check for Procedural Intent
        for pat in self.procedural_patterns:
            if re.search(pat, lower):
                entities = self._extract_entities(cleaned)
                return QueryClassification(
                    query_type=QueryType.PROCEDURAL,
                    confidence=0.91,
                    routing_path=ResolutionPath.PROCEDURAL_SYNTHESIS,
                    reasoning="Query seeks operational steps, guidelines, implementation sequence, or instructions.",
                    entities=entities,
                    is_ambiguous=False
                )

        # 4. Default to Factual Intent
        entities = self._extract_entities(cleaned)
        return QueryClassification(
            query_type=QueryType.FACTUAL,
            confidence=0.85,
            routing_path=ResolutionPath.DIRECT_RAG,
            reasoning="Query seeks factual definition, rule verification, or specific informational data.",
            entities=entities,
            is_ambiguous=False
        )

    def _extract_entities(self, query: str) -> List[str]:
        """Extract key noun phrases or domain entities."""
        candidates = re.findall(r"\b[A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*\b", query)
        technical_terms = re.findall(r"\b(KYC|AML|SLA|SLO|HIPAA|Kubernetes|Pod|Cluster|Telehealth|Triage|Incident|Runbook)\b", query, re.IGNORECASE)
        combined = list(dict.fromkeys(candidates + technical_terms))
        return combined

query_understanding_agent = QueryUnderstandingAgent()
