import pytest
from app.models.schemas import QueryType, ConfidenceLevel, RetrievalResult
from app.agents.query_understanding_agent import query_understanding_agent
from app.agents.clarification_agent import clarification_agent
from app.agents.retrieval_agent import retrieval_agent
from app.agents.response_generation_agent import response_generation_agent
from app.agents.conversation_memory_agent import conversation_memory_agent

def test_query_understanding_classification():
    # Procedural
    proc = query_understanding_agent.analyze("How to deploy a kubernetes pod step by step?")
    assert proc.query_type == QueryType.PROCEDURAL
    assert proc.confidence >= 0.80

    # Comparative
    comp = query_understanding_agent.analyze("Compare Tier 1 low risk loans versus Tier 3 high risk loans.")
    assert comp.query_type == QueryType.COMPARATIVE

    # Ambiguous
    amb = query_understanding_agent.analyze("tell me more")
    assert amb.query_type == QueryType.AMBIGUOUS
    assert amb.is_ambiguous is True

    # Factual
    fact = query_understanding_agent.analyze("What is the mandatory threshold for filing a Currency Transaction Report?")
    assert fact.query_type == QueryType.FACTUAL

def test_clarification_merging():
    original = "What are the requirements?"
    user_choice = "Loan tier 1 minimum credit score"
    refined = clarification_agent.merge_clarification(original, user_choice)
    assert "Loan tier 1" in refined

def test_response_generation_grounding():
    fake_chunks = [
        RetrievalResult(
            chunk_id="c1",
            document_name="kyc_aml_compliance_manual.txt",
            domain="Finance",
            page_or_section="Full Document",
            text="Under Bank Secrecy Act directives, institutions must file a Currency Transaction Report for cash transactions exceeding $10,000.",
            similarity_score=0.85,
            rank=1
        )
    ]
    answer, score, level = response_generation_agent.generate(
        query="What is the CTR threshold?",
        query_type=QueryType.FACTUAL,
        retrieved_chunks=fake_chunks
    )
    assert "$10,000" in answer
    assert score > 0.5
    assert level in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]

def test_conversation_memory():
    session_id = "test_sess_01"
    conversation_memory_agent.clear_session(session_id)
    conversation_memory_agent.add_turn(session_id, "user", "Tell me about Currency Transaction Reports")
    conversation_memory_agent.add_turn(session_id, "assistant", "CTR is filed for cash exceeding $10,000.")

    # Contextual follow-up query
    follow_up = "What are the penalties for it?"
    enriched = conversation_memory_agent.contextualize_query(session_id, follow_up)
    assert "Currency Transaction Reports" in enriched
