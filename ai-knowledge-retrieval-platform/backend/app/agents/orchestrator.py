import time
from datetime import datetime
from typing import List, Optional
from app.models.schemas import (
    QueryRequest, QueryResponse, QueryClassification, QueryType,
    ResolutionPath, ConfidenceLevel, AgentTraceStep, ClarificationPayload
)
from app.agents.query_understanding_agent import query_understanding_agent
from app.agents.clarification_agent import clarification_agent
from app.agents.retrieval_agent import retrieval_agent
from app.agents.response_generation_agent import response_generation_agent
from app.agents.conversation_memory_agent import conversation_memory_agent
from app.services.analytics_service import analytics_service

class MultiAgentOrchestrator:
    """
    Multi-Agent Orchestrator:
    Coordinates sequential execution:
    User Query -> Conversation Memory Context -> Query Understanding ->
    Clarification Check -> Retrieval -> Response Generation -> Memory Update -> Analytics Log.
    """

    def process_query(self, request: QueryRequest) -> QueryResponse:
        session_id = request.session_id or "default_session"
        traces: List[AgentTraceStep] = []
        raw_query = request.query.strip()
        refined_query: Optional[str] = None

        # ----------------------------------------------------
        # Step 1: Conversation Memory Agent (Contextualization)
        # ----------------------------------------------------
        t0 = time.time()
        contextualized_query = conversation_memory_agent.contextualize_query(session_id, raw_query)
        mem_elapsed = round((time.time() - t0) * 1000, 2)
        traces.append(AgentTraceStep(
            agent_name="ConversationMemoryAgent",
            action="Contextual Resolution",
            execution_time_ms=mem_elapsed,
            details={
                "original_query": raw_query,
                "contextualized_query": contextualized_query,
                "active_session": session_id
            }
        ))

        # Check if this request is answering a pending clarification
        if request.clarification_answer:
            t0 = time.time()
            refined_query = clarification_agent.merge_clarification(
                original_query=raw_query,
                user_answer=request.clarification_answer
            )
            clar_elapsed = round((time.time() - t0) * 1000, 2)
            traces.append(AgentTraceStep(
                agent_name="ClarificationAgent",
                action="Clarification Resolution & Query Synthesis",
                execution_time_ms=clar_elapsed,
                details={
                    "user_clarification": request.clarification_answer,
                    "refined_query": refined_query
                }
            ))
            effective_query = refined_query
        else:
            effective_query = contextualized_query

        # ----------------------------------------------------
        # Step 2: Query Understanding Agent (Classification & Routing)
        # ----------------------------------------------------
        t0 = time.time()
        classification: QueryClassification = query_understanding_agent.analyze(effective_query)
        qu_elapsed = round((time.time() - t0) * 1000, 2)
        traces.append(AgentTraceStep(
            agent_name="QueryUnderstandingAgent",
            action="Intent Classification & Entity Extraction",
            execution_time_ms=qu_elapsed,
            details={
                "classified_type": classification.query_type.value,
                "confidence": classification.confidence,
                "routing_path": classification.routing_path.value,
                "entities_detected": classification.entities,
                "reasoning": classification.reasoning
            }
        ))

        # ----------------------------------------------------
        # Step 3: Clarification Check (If ambiguous and not yet answered)
        # ----------------------------------------------------
        if classification.is_ambiguous and not request.clarification_answer:
            t0 = time.time()
            clar_payload = clarification_agent.generate_clarification(
                query=effective_query,
                classification=classification,
                session_id=session_id
            )
            clar_elapsed = round((time.time() - t0) * 1000, 2)
            traces.append(AgentTraceStep(
                agent_name="ClarificationAgent",
                action="Ambiguity Detected & Clarification Formulated",
                execution_time_ms=clar_elapsed,
                details={
                    "clarification_question": clar_payload.question,
                    "suggested_options": clar_payload.options
                }
            ))

            # Log to analytics as clarification requested
            analytics_service.log_query(
                session_id=session_id,
                query=raw_query,
                refined_query=None,
                query_type=classification.query_type.value,
                resolution_path=ResolutionPath.CLARIFICATION_REQUIRED.value,
                confidence_score=classification.confidence,
                confidence_level="Medium",
                sources_count=0,
                domain_identified=request.domain_filter,
                was_clarified=True
            )

            return QueryResponse(
                query=raw_query,
                refined_query=None,
                answer=(
                    f"To provide the most accurate and verified answer, I need a brief clarification:\n\n"
                    f"**{clar_payload.question}**\n\n"
                    f"Please select one of the suggested options below or provide specific details."
                ),
                query_type=classification.query_type,
                confidence_score=classification.confidence,
                confidence_level=ConfidenceLevel.MEDIUM,
                sources=[],
                agent_traces=traces,
                requires_clarification=True,
                clarification_data=clar_payload,
                session_id=session_id,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )

        # ----------------------------------------------------
        # Step 4: Retrieval Agent (Vector Search)
        # ----------------------------------------------------
        t0 = time.time()
        retrieved_chunks = retrieval_agent.retrieve(
            query=effective_query,
            classification=classification,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            domain_filter=request.domain_filter
        )
        ret_elapsed = round((time.time() - t0) * 1000, 2)
        top_doc = retrieved_chunks[0].document_name if retrieved_chunks else None
        top_score = retrieved_chunks[0].similarity_score if retrieved_chunks else 0.0

        traces.append(AgentTraceStep(
            agent_name="RetrievalAgent",
            action="Semantic Vector Search & Threshold Pruning",
            execution_time_ms=ret_elapsed,
            details={
                "chunks_retrieved": len(retrieved_chunks),
                "top_similarity_score": top_score,
                "top_document": top_doc,
                "domain_filter": request.domain_filter or "All"
            }
        ))

        # ----------------------------------------------------
        # Step 5: Response Generation Agent (Synthesis & Grounding)
        # ----------------------------------------------------
        t0 = time.time()
        history_context = conversation_memory_agent.get_formatted_history(session_id, limit=2)
        answer, confidence_score, confidence_level = response_generation_agent.generate(
            query=effective_query,
            query_type=classification.query_type,
            retrieved_chunks=retrieved_chunks,
            conversation_context=history_context
        )
        gen_elapsed = round((time.time() - t0) * 1000, 2)
        traces.append(AgentTraceStep(
            agent_name="ResponseGenerationAgent",
            action="Evidence-Grounded Synthesis & Confidence Scoring",
            execution_time_ms=gen_elapsed,
            details={
                "confidence_score": confidence_score,
                "confidence_level": confidence_level.value,
                "sources_used": len(retrieved_chunks),
                "grounded": True if retrieved_chunks else False
            }
        ))

        # ----------------------------------------------------
        # Step 6: Update Conversation Memory
        # ----------------------------------------------------
        conversation_memory_agent.add_turn(
            session_id=session_id,
            role="user",
            content=effective_query
        )
        conversation_memory_agent.add_turn(
            session_id=session_id,
            role="assistant",
            content=answer,
            query_type=classification.query_type.value,
            confidence_score=confidence_score,
            sources=retrieved_chunks
        )

        # ----------------------------------------------------
        # Step 7: Record Analytics Log
        # ----------------------------------------------------
        analytics_service.log_query(
            session_id=session_id,
            query=raw_query,
            refined_query=refined_query,
            query_type=classification.query_type.value,
            resolution_path=classification.routing_path.value,
            confidence_score=confidence_score,
            confidence_level=confidence_level.value,
            sources_count=len(retrieved_chunks),
            top_source_doc=top_doc,
            top_source_score=top_score,
            domain_identified=retrieved_chunks[0].domain if retrieved_chunks else request.domain_filter,
            was_clarified=bool(request.clarification_answer)
        )

        return QueryResponse(
            query=raw_query,
            refined_query=refined_query,
            answer=answer,
            query_type=classification.query_type,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            sources=retrieved_chunks,
            agent_traces=traces,
            requires_clarification=False,
            clarification_data=None,
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

orchestrator = MultiAgentOrchestrator()
