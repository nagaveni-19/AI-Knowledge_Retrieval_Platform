from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QueryType(str, Enum):
    FACTUAL = "factual"
    PROCEDURAL = "procedural"
    COMPARATIVE = "comparative"
    AMBIGUOUS = "ambiguous"

class ResolutionPath(str, Enum):
    DIRECT_RAG = "direct_rag"
    PROCEDURAL_SYNTHESIS = "procedural_synthesis"
    COMPARATIVE_SYNTHESIS = "comparative_synthesis"
    CLARIFICATION_REQUIRED = "clarification_required"
    NO_EVIDENCE_FALLBACK = "no_evidence_fallback"

class ConfidenceLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    NONE = "No Results"

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    upload_timestamp: str
    chunk_count: int
    domain: str
    status: str = "indexed"
    error_message: Optional[str] = None

class Chunk(BaseModel):
    id: str
    document_id: str
    filename: str
    domain: str
    chunk_index: int
    page_or_section: str
    text: str
    token_count: int

class RetrievalResult(BaseModel):
    chunk_id: str
    document_name: str
    domain: str
    page_or_section: str
    text: str
    similarity_score: float
    rank: int

class QueryClassification(BaseModel):
    query_type: QueryType
    confidence: float
    routing_path: ResolutionPath
    domain_identified: Optional[str] = None
    entities: List[str] = []
    reasoning: str
    is_ambiguous: bool = False
    clarification_question: Optional[str] = None
    clarification_options: List[str] = []

class AgentTraceStep(BaseModel):
    agent_name: str
    action: str
    status: str = "completed"
    execution_time_ms: float
    details: Dict[str, Any] = {}

class ClarificationPayload(BaseModel):
    original_query: str
    question: str
    options: List[str]
    session_id: str

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default_session"
    domain_filter: Optional[str] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None
    clarification_answer: Optional[str] = None
    voice_input: bool = False

class QueryResponse(BaseModel):
    query: str
    refined_query: Optional[str] = None
    answer: str
    query_type: QueryType
    confidence_score: float
    confidence_level: ConfidenceLevel
    sources: List[RetrievalResult] = []
    agent_traces: List[AgentTraceStep] = []
    requires_clarification: bool = False
    clarification_data: Optional[ClarificationPayload] = None
    session_id: str
    timestamp: str

class ChatTurn(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    query_type: Optional[str] = None
    confidence_score: Optional[float] = None
    sources: List[RetrievalResult] = []
    timestamp: str

class SessionContext(BaseModel):
    session_id: str
    history: List[ChatTurn] = []
    referenced_documents: List[str] = []
    referenced_entities: List[str] = []
    last_domain: Optional[str] = None

class EvaluationQueryItem(BaseModel):
    id: str
    query: str
    expected_domain: str
    expected_type: str
    expected_relevant_doc: str
    expected_keywords: List[str]

class RetrievalEvaluationMetric(BaseModel):
    query_id: str
    query: str
    domain: str
    query_type: str
    top_1_hit: bool
    top_3_hit: bool
    top_5_hit: bool
    mrr: float
    retrieved_count: int
    top_relevance_score: float
    groundedness_score: float
    is_gap_detected: bool

class BenchmarkReport(BaseModel):
    timestamp: str
    total_queries: int
    top_1_accuracy: float
    top_3_accuracy: float
    top_5_accuracy: float
    mean_reciprocal_rank: float
    average_confidence: float
    domain_accuracy: Dict[str, float]
    query_type_accuracy: Dict[str, float]
    detailed_results: List[RetrievalEvaluationMetric]

class KnowledgeGapItem(BaseModel):
    gap_id: str
    query: str
    domain: Optional[str]
    frequency: int
    last_queried: str
    avg_confidence: float
    recommendation: str

class AnalyticsSummary(BaseModel):
    total_queries: int
    factual_count: int
    procedural_count: int
    comparative_count: int
    ambiguous_count: int
    unanswered_count: int
    avg_confidence: float
    confidence_distribution: Dict[str, int]
    domain_distribution: Dict[str, int]
    recent_queries: List[Dict[str, Any]]
    recurring_themes: List[Dict[str, Any]]
    detected_gaps: List[KnowledgeGapItem]
