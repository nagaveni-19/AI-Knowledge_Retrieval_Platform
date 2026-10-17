from typing import List, Dict, Any
from datetime import datetime
from app.models.schemas import BenchmarkReport, RetrievalEvaluationMetric, EvaluationQueryItem
from app.services.vector_store import vector_store

class EvaluationService:
    """
    RAG & Multi-Agent Retrieval Evaluation Benchmark Suite.
    Evaluates:
    - Top-1, Top-3, Top-5 Retrieval Hit Rates
    - Mean Reciprocal Rank (MRR)
    - Groundedness Score
    - Gap Detection
    Across 3 distinct domains: Healthcare, Financial Compliance, and Cloud DevOps.
    """

    def __init__(self):
        # 12 representative test queries spanning 3 domains and 4 query categories
        self.benchmark_dataset: List[EvaluationQueryItem] = [
            # Domain 1: Healthcare & Telemedicine
            EvaluationQueryItem(
                id="hc-01",
                query="What are the vital sign criteria for emergency telemedicine escalation?",
                expected_domain="Healthcare",
                expected_type="factual",
                expected_relevant_doc="telehealth_clinical_protocol",
                expected_keywords=["vital", "emergency", "telemedicine", "escalation", "heart rate"]
            ),
            EvaluationQueryItem(
                id="hc-02",
                query="How should a clinician conduct a remote patient triage session step by step?",
                expected_domain="Healthcare",
                expected_type="procedural",
                expected_relevant_doc="telehealth_clinical_protocol",
                expected_keywords=["triage", "clinician", "step", "intake", "assessment"]
            ),
            EvaluationQueryItem(
                id="hc-03",
                query="Compare the triage priority levels between urgent telehealth vs routine consultation.",
                expected_domain="Healthcare",
                expected_type="comparative",
                expected_relevant_doc="medical_triage_matrix",
                expected_keywords=["urgent", "routine", "priority", "consultation"]
            ),
            EvaluationQueryItem(
                id="hc-04",
                query="What are the neurosurgery protocol guidelines for pediatric anesthesia?",
                expected_domain="Healthcare",
                expected_type="factual",
                expected_relevant_doc="NONE_GAP",
                expected_keywords=["neurosurgery", "pediatric", "anesthesia"]
            ),

            # Domain 2: Financial Compliance & Banking
            EvaluationQueryItem(
                id="fin-01",
                query="What is the mandatory threshold for filing a Currency Transaction Report?",
                expected_domain="Finance",
                expected_type="factual",
                expected_relevant_doc="kyc_aml_compliance_manual",
                expected_keywords=["ctr", "currency", "threshold", "10,000", "cash"]
            ),
            EvaluationQueryItem(
                id="fin-02",
                query="What are the steps for conducting enhanced due diligence on high risk entities?",
                expected_domain="Finance",
                expected_type="procedural",
                expected_relevant_doc="kyc_aml_compliance_manual",
                expected_keywords=["edd", "enhanced due diligence", "high risk", "beneficial"]
            ),
            EvaluationQueryItem(
                id="fin-03",
                query="Compare tier 1 low risk loan criteria versus tier 3 high risk commercial loans.",
                expected_domain="Finance",
                expected_type="comparative",
                expected_relevant_doc="loan_approval_matrix",
                expected_keywords=["tier 1", "tier 3", "credit score", "ltv", "debt"]
            ),
            EvaluationQueryItem(
                id="fin-04",
                query="What are the quantum cryptographic mining token regulations in Luxembourg?",
                expected_domain="Finance",
                expected_type="factual",
                expected_relevant_doc="NONE_GAP",
                expected_keywords=["quantum", "mining", "luxembourg"]
            ),

            # Domain 3: Cloud Infrastructure & DevOps Reliability
            EvaluationQueryItem(
                id="ops-01",
                query="What is the target SLO availability percentage for Tier-1 production microservices?",
                expected_domain="CloudDevOps",
                expected_type="factual",
                expected_relevant_doc="sla_slo_thresholds",
                expected_keywords=["99.99", "slo", "tier-1", "availability", "latency"]
            ),
            EvaluationQueryItem(
                id="ops-02",
                query="How should an SRE team execute a Kubernetes pod crash recovery sequence?",
                expected_domain="CloudDevOps",
                expected_type="procedural",
                expected_relevant_doc="sre_incident_management",
                expected_keywords=["kubernetes", "crashloopbackoff", "pod", "drain", "restart"]
            ),
            EvaluationQueryItem(
                id="ops-03",
                query="Compare Severity 1 critical incidents versus Severity 3 minor degradations in response times.",
                expected_domain="CloudDevOps",
                expected_type="comparative",
                expected_relevant_doc="sre_incident_management",
                expected_keywords=["severity 1", "severity 3", "sev1", "sev3", "ack", "time"]
            ),
            EvaluationQueryItem(
                id="ops-04",
                query="How do I configure AS400 mainframe punchcard batch jobs on AWS Lambda?",
                expected_domain="CloudDevOps",
                expected_type="procedural",
                expected_relevant_doc="NONE_GAP",
                expected_keywords=["as400", "punchcard", "lambda"]
            ),
        ]

    def run_benchmark(self) -> BenchmarkReport:
        detailed_results: List[RetrievalEvaluationMetric] = []
        top_1_hits = 0
        top_3_hits = 0
        top_5_hits = 0
        mrr_sum = 0.0
        conf_sum = 0.0

        domain_correct: Dict[str, int] = {}
        domain_total: Dict[str, int] = {}
        type_correct: Dict[str, int] = {}
        type_total: Dict[str, int] = {}

        for item in self.benchmark_dataset:
            domain_total[item.expected_domain] = domain_total.get(item.expected_domain, 0) + 1
            type_total[item.expected_type] = type_total.get(item.expected_type, 0) + 1

            # Execute retrieval
            chunks = vector_store.search(
                query=item.query,
                domain_filter=None,
                top_k=5,
                similarity_threshold=0.08
            )

            is_gap = (item.expected_relevant_doc == "NONE_GAP")

            if is_gap:
                # For deliberate knowledge gap test queries:
                # Correct behavior is low similarity (<0.35) or 0 retrieved chunks above strict threshold
                max_score = chunks[0].similarity_score if chunks else 0.0
                is_correct_rejection = (max_score < 0.35)
                hit_1 = is_correct_rejection
                hit_3 = is_correct_rejection
                hit_5 = is_correct_rejection
                reciprocal_rank = 1.0 if is_correct_rejection else 0.0
                groundedness = 1.0 if is_correct_rejection else 0.2
            else:
                # Check ranks for relevant keywords or doc name match
                hit_1 = False
                hit_3 = False
                hit_5 = False
                reciprocal_rank = 0.0
                groundedness = 0.0

                for idx, c in enumerate(chunks):
                    # Check if chunk text contains expected keywords or matches expected doc
                    text_lower = c.text.lower()
                    doc_match = item.expected_relevant_doc.lower() in c.document_name.lower()
                    keyword_matches = sum(1 for kw in item.expected_keywords if kw.lower() in text_lower)
                    is_hit = doc_match or (keyword_matches >= 2)

                    if is_hit:
                        if idx == 0:
                            hit_1 = True
                        if idx < 3:
                            hit_3 = True
                        if idx < 5:
                            hit_5 = True
                        if reciprocal_rank == 0.0:
                            reciprocal_rank = 1.0 / (idx + 1)
                            groundedness = min(1.0, 0.4 + (keyword_matches * 0.2))
                        break

            if hit_1:
                top_1_hits += 1
                domain_correct[item.expected_domain] = domain_correct.get(item.expected_domain, 0) + 1
                type_correct[item.expected_type] = type_correct.get(item.expected_type, 0) + 1
            if hit_3:
                top_3_hits += 1
            if hit_5:
                top_5_hits += 1

            mrr_sum += reciprocal_rank
            top_score = chunks[0].similarity_score if chunks else 0.0
            conf_sum += top_score

            detailed_results.append(RetrievalEvaluationMetric(
                query_id=item.id,
                query=item.query,
                domain=item.expected_domain,
                query_type=item.expected_type,
                top_1_hit=hit_1,
                top_3_hit=hit_3,
                top_5_hit=hit_5,
                mrr=round(reciprocal_rank, 3),
                retrieved_count=len(chunks),
                top_relevance_score=top_score,
                groundedness_score=round(groundedness, 3),
                is_gap_detected=is_gap
            ))

        n = len(self.benchmark_dataset)
        top_1_acc = round(top_1_hits / n, 3)
        top_3_acc = round(top_3_hits / n, 3)
        top_5_acc = round(top_5_hits / n, 3)
        mrr_avg = round(mrr_sum / n, 3)
        avg_conf = round(conf_sum / n, 3)

        domain_acc = {d: round(domain_correct.get(d, 0) / domain_total[d], 3) for d in domain_total}
        type_acc = {t: round(type_correct.get(t, 0) / type_total[t], 3) for t in type_total}

        return BenchmarkReport(
            timestamp=datetime.utcnow().isoformat() + "Z",
            total_queries=n,
            top_1_accuracy=top_1_acc,
            top_3_accuracy=top_3_acc,
            top_5_accuracy=top_5_acc,
            mean_reciprocal_rank=mrr_avg,
            average_confidence=avg_conf,
            domain_accuracy=domain_acc,
            query_type_accuracy=type_acc,
            detailed_results=detailed_results
        )

evaluation_service = EvaluationService()
