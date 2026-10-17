import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import Counter
from app.config import settings
from app.models.schemas import AnalyticsSummary, KnowledgeGapItem, QueryType, ConfidenceLevel

class AnalyticsService:
    def __init__(self, db_path: Path = settings.STORAGE_DIR / "analytics.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS query_logs (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    query TEXT NOT NULL,
                    refined_query TEXT,
                    query_type TEXT NOT NULL,
                    resolution_path TEXT NOT NULL,
                    confidence_score REAL NOT NULL,
                    confidence_level TEXT NOT NULL,
                    sources_count INTEGER NOT NULL,
                    top_source_doc TEXT,
                    top_source_score REAL,
                    domain_identified TEXT,
                    was_clarified INTEGER DEFAULT 0,
                    is_unanswered INTEGER DEFAULT 0,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()

    def log_query(
        self,
        session_id: str,
        query: str,
        refined_query: Optional[str],
        query_type: str,
        resolution_path: str,
        confidence_score: float,
        confidence_level: str,
        sources_count: int,
        top_source_doc: Optional[str] = None,
        top_source_score: Optional[float] = None,
        domain_identified: Optional[str] = None,
        was_clarified: bool = False
    ):
        is_unanswered = 1 if confidence_score < 0.20 or sources_count == 0 else 0
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO query_logs (
                    id, session_id, query, refined_query, query_type, resolution_path,
                    confidence_score, confidence_level, sources_count, top_source_doc,
                    top_source_score, domain_identified, was_clarified, is_unanswered, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4())[:12], session_id, query, refined_query, query_type, resolution_path,
                confidence_score, confidence_level, sources_count, top_source_doc,
                top_source_score, domain_identified or "General", 1 if was_clarified else 0,
                is_unanswered, datetime.utcnow().isoformat() + "Z"
            ))
            conn.commit()

    def get_summary(
        self,
        domain_filter: Optional[str] = None,
        query_type_filter: Optional[str] = None,
        confidence_filter: Optional[str] = None
    ) -> AnalyticsSummary:
        query_sql = "SELECT * FROM query_logs WHERE 1=1"
        params = []

        if domain_filter and domain_filter.lower() != "all":
            query_sql += " AND LOWER(domain_identified) = LOWER(?)"
            params.append(domain_filter)

        if query_type_filter and query_type_filter.lower() != "all":
            query_sql += " AND LOWER(query_type) = LOWER(?)"
            params.append(query_type_filter)

        if confidence_filter and confidence_filter.lower() != "all":
            query_sql += " AND LOWER(confidence_level) = LOWER(?)"
            params.append(confidence_filter)

        query_sql += " ORDER BY timestamp DESC"

        with self._get_connection() as conn:
            cursor = conn.execute(query_sql, params)
            rows = [dict(r) for r in cursor.fetchall()]

        total = len(rows)
        if total == 0:
            return AnalyticsSummary(
                total_queries=0,
                factual_count=0,
                procedural_count=0,
                comparative_count=0,
                ambiguous_count=0,
                unanswered_count=0,
                avg_confidence=0.0,
                confidence_distribution={"High": 0, "Medium": 0, "Low": 0, "No Results": 0},
                domain_distribution={},
                recent_queries=[],
                recurring_themes=[],
                detected_gaps=[]
            )

        factual = sum(1 for r in rows if r["query_type"] == "factual")
        procedural = sum(1 for r in rows if r["query_type"] == "procedural")
        comparative = sum(1 for r in rows if r["query_type"] == "comparative")
        ambiguous = sum(1 for r in rows if r["query_type"] == "ambiguous" or r["was_clarified"])
        unanswered = sum(1 for r in rows if r["is_unanswered"] == 1)
        avg_conf = sum(r["confidence_score"] for r in rows) / total

        conf_dist = {"High": 0, "Medium": 0, "Low": 0, "No Results": 0}
        for r in rows:
            lvl = r["confidence_level"]
            conf_dist[lvl] = conf_dist.get(lvl, 0) + 1

        domain_dist = dict(Counter(r["domain_identified"] for r in rows if r["domain_identified"]))

        # Recurring themes (frequent keywords)
        words = []
        for r in rows:
            for w in r["query"].lower().split():
                if len(w) > 3 and w not in ["what", "how", "when", "which", "where", "does", "about", "with", "from"]:
                    words.append(w)
        theme_counts = Counter(words).most_common(6)
        recurring_themes = [{"keyword": kw, "count": count} for kw, count in theme_counts]

        # Detect knowledge gaps (unanswered queries or low-confidence queries)
        unanswered_queries = [r for r in rows if r["is_unanswered"] == 1]
        gap_map: Dict[str, List[Dict[str, Any]]] = {}
        for u in unanswered_queries:
            q_norm = u["query"].strip().lower()
            gap_map.setdefault(q_norm, []).append(u)

        detected_gaps: List[KnowledgeGapItem] = []
        for q_norm, instances in gap_map.items():
            first = instances[0]
            avg_c = sum(i["confidence_score"] for i in instances) / len(instances)
            detected_gaps.append(KnowledgeGapItem(
                gap_id=str(uuid.uuid4())[:8],
                query=first["query"],
                domain=first.get("domain_identified"),
                frequency=len(instances),
                last_queried=first["timestamp"],
                avg_confidence=round(avg_c, 3),
                recommendation=f"Missing documentation for '{first['query']}'. Upload supporting policy or procedure files."
            ))

        return AnalyticsSummary(
            total_queries=total,
            factual_count=factual,
            procedural_count=procedural,
            comparative_count=comparative,
            ambiguous_count=ambiguous,
            unanswered_count=unanswered,
            avg_confidence=round(avg_conf, 3),
            confidence_distribution=conf_dist,
            domain_distribution=domain_dist,
            recent_queries=rows[:10],
            recurring_themes=recurring_themes,
            detected_gaps=detected_gaps[:10]
        )

analytics_service = AnalyticsService()
