export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  upload_timestamp: string;
  chunk_count: number;
  domain: string;
  status: string;
  error_message?: string | null;
}

export interface Chunk {
  id: string;
  document_id: string;
  filename: string;
  domain: string;
  chunk_index: number;
  page_or_section: string;
  text: string;
  token_count: number;
}

export interface RetrievalResult {
  chunk_id: string;
  document_name: string;
  domain: string;
  page_or_section: string;
  text: string;
  similarity_score: number;
  rank: number;
}

export interface AgentTraceStep {
  agent_name: string;
  action: string;
  status: string;
  execution_time_ms: number;
  details: Record<string, any>;
}

export interface ClarificationPayload {
  original_query: string;
  question: string;
  options: string[];
  session_id: string;
}

export type QueryType = 'factual' | 'procedural' | 'comparative' | 'ambiguous';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'No Results';

export interface QueryResponse {
  query: string;
  refined_query?: string | null;
  answer: string;
  query_type: QueryType;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  sources: RetrievalResult[];
  agent_traces: AgentTraceStep[];
  requires_clarification: boolean;
  clarification_data?: ClarificationPayload | null;
  session_id: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  query_type?: QueryType;
  confidence_score?: number;
  confidence_level?: ConfidenceLevel;
  sources?: RetrievalResult[];
  agent_traces?: AgentTraceStep[];
  requires_clarification?: boolean;
  clarification_data?: ClarificationPayload | null;
  timestamp: string;
  isVoice?: boolean;
}

export interface SystemHealth {
  status: string;
  llm_provider: string;
  openai_configured: boolean;
  documents_count: number;
  total_chunks_indexed: number;
  vector_dimension: number;
  chunk_size: number;
  chunk_overlap: number;
  default_top_k: number;
  similarity_threshold: number;
}

export interface KnowledgeGapItem {
  gap_id: string;
  query: string;
  domain?: string | null;
  frequency: number;
  last_queried: string;
  avg_confidence: number;
  recommendation: string;
}

export interface AnalyticsSummary {
  total_queries: number;
  factual_count: number;
  procedural_count: number;
  comparative_count: number;
  ambiguous_count: number;
  unanswered_count: number;
  avg_confidence: number;
  confidence_distribution: Record<string, number>;
  domain_distribution: Record<string, number>;
  recent_queries: any[];
  recurring_themes: { keyword: string; count: number }[];
  detected_gaps: KnowledgeGapItem[];
}

export interface RetrievalEvaluationMetric {
  query_id: string;
  query: string;
  domain: string;
  query_type: string;
  top_1_hit: boolean;
  top_3_hit: boolean;
  top_5_hit: boolean;
  mrr: number;
  retrieved_count: number;
  top_relevance_score: number;
  groundedness_score: number;
  is_gap_detected: boolean;
}

export interface BenchmarkReport {
  timestamp: string;
  total_queries: number;
  top_1_accuracy: number;
  top_3_accuracy: number;
  top_5_accuracy: number;
  mean_reciprocal_rank: number;
  average_confidence: number;
  domain_accuracy: Record<string, number>;
  query_type_accuracy: Record<string, number>;
  detailed_results: RetrievalEvaluationMetric[];
}
