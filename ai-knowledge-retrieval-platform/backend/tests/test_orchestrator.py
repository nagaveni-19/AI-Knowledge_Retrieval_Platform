import pytest
from app.models.schemas import QueryRequest, QueryType
from app.agents.orchestrator import orchestrator

def test_orchestrator_factual_resolution():
    req = QueryRequest(
        query="What are the vital sign criteria for emergency telemedicine escalation?",
        session_id="test_orch_session_1",
        top_k=3
    )
    resp = orchestrator.process_query(req)
    assert resp.query_type == QueryType.FACTUAL
    assert len(resp.sources) > 0
    assert len(resp.agent_traces) >= 4
    assert resp.confidence_score > 0.0

def test_orchestrator_ambiguous_flow():
    req = QueryRequest(
        query="tell me more",
        session_id="test_orch_session_2"
    )
    resp = orchestrator.process_query(req)
    assert resp.requires_clarification is True
    assert resp.clarification_data is not None
    assert len(resp.clarification_data.options) > 0

    # Answer clarification
    req_answered = QueryRequest(
        query="tell me more",
        session_id="test_orch_session_2",
        clarification_answer=resp.clarification_data.options[0]
    )
    resp_answered = orchestrator.process_query(req_answered)
    assert resp_answered.requires_clarification is False
    assert len(resp_answered.sources) > 0
