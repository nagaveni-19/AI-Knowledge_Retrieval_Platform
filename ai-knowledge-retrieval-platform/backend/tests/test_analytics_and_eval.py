import pytest
from app.services.analytics_service import analytics_service
from app.services.evaluation_service import evaluation_service

def test_analytics_logging_and_summary():
    analytics_service.log_query(
        session_id="test_analytics_sess",
        query="What is the CTR threshold?",
        refined_query=None,
        query_type="factual",
        resolution_path="direct_rag",
        confidence_score=0.88,
        confidence_level="High",
        sources_count=2,
        domain_identified="Finance"
    )
    summary = analytics_service.get_summary()
    assert summary.total_queries >= 1
    assert summary.factual_count >= 1

def test_evaluation_benchmark_run():
    report = evaluation_service.run_benchmark()
    assert report.total_queries == 12
    assert report.top_1_accuracy >= 0.70
    assert report.top_3_accuracy >= 0.75
    assert report.top_5_accuracy >= 0.75
    assert report.mean_reciprocal_rank > 0.65
    assert len(report.detailed_results) == 12
