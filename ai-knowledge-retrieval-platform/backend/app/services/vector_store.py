import sqlite3
import pickle
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from app.config import settings
from app.models.schemas import DocumentMetadata, Chunk, RetrievalResult
from app.services.embeddings import embedding_engine

class PersistentVectorStore:
    def __init__(self, db_path: Path = settings.DB_PATH, index_path: Path = settings.VECTOR_INDEX_PATH):
        self.db_path = db_path
        self.index_path = index_path
        self.chunk_ids: List[str] = []
        self.embeddings_matrix: Optional[np.ndarray] = None
        self._init_db()
        self._load_index()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_size_bytes INTEGER NOT NULL,
                    upload_timestamp TEXT NOT NULL,
                    chunk_count INTEGER NOT NULL,
                    domain TEXT NOT NULL,
                    status TEXT NOT NULL,
                    error_message TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS chunks (
                    id TEXT PRIMARY KEY,
                    document_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    page_or_section TEXT NOT NULL,
                    text TEXT NOT NULL,
                    token_count INTEGER NOT NULL,
                    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
                )
            """)
            conn.commit()

    def _load_index(self):
        """Load cached vector embeddings and vectorizer from disk if available, or rebuild from chunks."""
        if self.index_path.exists():
            try:
                with open(self.index_path, "rb") as f:
                    data = pickle.load(f)
                    self.chunk_ids = data.get("chunk_ids", [])
                    self.embeddings_matrix = data.get("embeddings", None)
                    if "vectorizer" in data:
                        embedding_engine.vectorizer = data["vectorizer"]
                        embedding_engine.is_fitted = data.get("is_fitted", True)
                    return
            except Exception as e:
                print(f"[VectorStore Warning] Could not load vector index: {e}, will rebuild.")

        self.rebuild_index()

    def _save_index(self):
        """Save vector embeddings and fitted vectorizer state to disk."""
        try:
            with open(self.index_path, "wb") as f:
                pickle.dump({
                    "chunk_ids": self.chunk_ids,
                    "embeddings": self.embeddings_matrix,
                    "vectorizer": embedding_engine.vectorizer,
                    "is_fitted": embedding_engine.is_fitted
                }, f)
        except Exception as e:
            print(f"[VectorStore Error] Failed to persist index: {e}")

    def rebuild_index(self):
        """Re-computes vector embeddings for all existing chunks in DB."""
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT id, text FROM chunks ORDER BY chunk_index ASC")
            rows = cursor.fetchall()

        if not rows:
            self.chunk_ids = []
            self.embeddings_matrix = None
            self._save_index()
            return

        self.chunk_ids = [row["id"] for row in rows]
        texts = [row["text"] for row in rows]
        
        # Fit embedding engine on all corpus texts
        embedding_engine.fit(texts)
        self.embeddings_matrix = embedding_engine.get_embeddings(texts)
        self._save_index()

    def add_document(self, metadata: DocumentMetadata, chunks: List[Chunk]):
        """Persist document metadata and chunks, and update the vector index."""
        with self._get_connection() as conn:
            # Upsert document
            conn.execute("""
                INSERT OR REPLACE INTO documents 
                (id, filename, file_type, file_size_bytes, upload_timestamp, chunk_count, domain, status, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metadata.id, metadata.filename, metadata.file_type, metadata.file_size_bytes,
                metadata.upload_timestamp, metadata.chunk_count, metadata.domain, metadata.status,
                metadata.error_message
            ))

            # Remove existing chunks for this document if any
            conn.execute("DELETE FROM chunks WHERE document_id = ?", (metadata.id,))

            # Insert chunks
            for c in chunks:
                conn.execute("""
                    INSERT INTO chunks 
                    (id, document_id, filename, domain, chunk_index, page_or_section, text, token_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c.id, c.document_id, c.filename, c.domain, c.chunk_index,
                    c.page_or_section, c.text, c.token_count
                ))
            conn.commit()

        # Rebuild unified vector index across all corpus chunks
        self.rebuild_index()

    def delete_document(self, document_id: str) -> bool:
        """Remove a document and its chunks, then rebuild the index."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
            cursor = conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
            conn.commit()
            deleted = cursor.rowcount > 0

        if deleted:
            self.rebuild_index()
        return deleted

    def get_all_documents(self) -> List[DocumentMetadata]:
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM documents ORDER BY upload_timestamp DESC")
            rows = cursor.fetchall()
            return [DocumentMetadata(**dict(row)) for row in rows]

    def get_document_chunks(self, document_id: str) -> List[Chunk]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC",
                (document_id,)
            )
            rows = cursor.fetchall()
            return [Chunk(**dict(row)) for row in rows]

    def search(
        self,
        query: str,
        domain_filter: Optional[str] = None,
        top_k: int = 4,
        similarity_threshold: float = 0.20
    ) -> List[RetrievalResult]:
        """
        Semantic vector search using cosine similarity.
        Applies domain filtering, Top-K ranking, and threshold pruning.
        """
        if not self.chunk_ids or self.embeddings_matrix is None or len(self.chunk_ids) == 0:
            return []

        # Generate query vector
        query_vec = embedding_engine.get_embedding(query)
        if query_vec.ndim == 1:
            query_vec = query_vec.reshape(1, -1)

        # Dot product with normalized chunk vectors gives cosine similarity
        similarities = np.dot(self.embeddings_matrix, query_vec.T).flatten()

        # Fetch chunk details from DB
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT id, filename, domain, page_or_section, text FROM chunks")
            chunk_lookup = {row["id"]: dict(row) for row in cursor.fetchall()}

        scored_results = []
        for cid, score in zip(self.chunk_ids, similarities):
            if cid not in chunk_lookup:
                continue
            chunk_info = chunk_lookup[cid]

            # Domain filtering if specified
            if domain_filter and domain_filter.lower() != "all":
                if chunk_info["domain"].lower() != domain_filter.lower():
                    continue

            # Similarity threshold check
            score_float = float(round(float(score), 4))
            if score_float >= similarity_threshold:
                scored_results.append((score_float, chunk_info))

        # Sort by similarity descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        top_items = scored_results[:top_k]

        results: List[RetrievalResult] = []
        for rank, (score, info) in enumerate(top_items, start=1):
            results.append(RetrievalResult(
                chunk_id=info["id"],
                document_name=info["filename"],
                domain=info["domain"],
                page_or_section=info["page_or_section"],
                text=info["text"],
                similarity_score=score,
                rank=rank
            ))

        return results

vector_store = PersistentVectorStore()
