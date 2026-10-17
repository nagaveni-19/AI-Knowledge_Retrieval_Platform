import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    DocumentMetadata, Chunk, QueryRequest, QueryResponse,
    AnalyticsSummary, BenchmarkReport, SessionContext
)
from app.services.ingestion import ingestion_service
from app.services.vector_store import vector_store
from app.agents.orchestrator import orchestrator
from app.agents.conversation_memory_agent import conversation_memory_agent
from app.services.analytics_service import analytics_service
from app.services.evaluation_service import evaluation_service

app = FastAPI(
    title="AI-Based Knowledge Retrieval Platform with Query Resolution System",
    description="Multi-Agent RAG platform with Query Understanding, Retrieval, Response Generation, Clarification, Memory, Voice, and Analytics.",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# System Health & Configuration Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def get_health():
    docs = vector_store.get_all_documents()
    total_chunks = len(vector_store.chunk_ids)
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "openai_configured": bool(settings.OPENAI_API_KEY.startswith("sk-")),
        "documents_count": len(docs),
        "total_chunks_indexed": total_chunks,
        "vector_dimension": getattr(vector_store.embeddings_matrix, "shape", [0, 0])[1] if vector_store.embeddings_matrix is not None else 0,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "default_top_k": settings.DEFAULT_TOP_K,
        "similarity_threshold": settings.SIMILARITY_THRESHOLD
    }

class ConfigUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    default_top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None

@app.post("/api/config")
def update_config(req: ConfigUpdateRequest):
    if req.llm_provider:
        settings.LLM_PROVIDER = req.llm_provider
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.chunk_size:
        settings.CHUNK_SIZE = req.chunk_size
    if req.chunk_overlap:
        settings.CHUNK_OVERLAP = req.chunk_overlap
    if req.default_top_k:
        settings.DEFAULT_TOP_K = req.default_top_k
    if req.similarity_threshold is not None:
        settings.SIMILARITY_THRESHOLD = req.similarity_threshold
    return {"message": "Configuration updated successfully", "current_settings": get_health()}

# -------------------------------------------------------------
# Knowledge Base & Document Ingestion Endpoints
# -------------------------------------------------------------
@app.get("/api/documents", response_model=List[DocumentMetadata])
def list_documents():
    return vector_store.get_all_documents()

@app.get("/api/documents/{doc_id}/chunks", response_model=List[Chunk])
def get_document_chunks(doc_id: str):
    chunks = vector_store.get_document_chunks(doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document chunks not found")
    return chunks

@app.post("/api/documents/upload", response_model=DocumentMetadata)
async def upload_document(
    file: UploadFile = File(...),
    domain: str = Form("General"),
    chunk_size: Optional[int] = Form(None),
    chunk_overlap: Optional[int] = Form(None)
):
    try:
        file_bytes = await file.read()
        metadata, chunks = ingestion_service.process_file(
            filename=file.filename,
            file_bytes=file_bytes,
            domain=domain,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        # Store raw file for persistence
        save_path = settings.UPLOAD_DIR / f"{metadata.id}_{file.filename}"
        with open(save_path, "wb") as f:
            f.write(file_bytes)

        # Index in vector store
        vector_store.add_document(metadata, chunks)
        return metadata
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    success = vector_store.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": f"Document {doc_id} deleted and index rebuilt"}

# -------------------------------------------------------------
# Multi-Agent Query Resolution & Chat Endpoints
# -------------------------------------------------------------
@app.post("/api/chat/query", response_model=QueryResponse)
def handle_query(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        response = orchestrator.process_query(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query resolution pipeline error: {str(e)}")

@app.get("/api/chat/history/{session_id}", response_model=SessionContext)
def get_chat_history(session_id: str):
    return conversation_memory_agent.get_session(session_id)

@app.delete("/api/chat/history/{session_id}")
def clear_chat_history(session_id: str):
    conversation_memory_agent.clear_session(session_id)
    return {"message": f"Session memory cleared for {session_id}"}

# -------------------------------------------------------------
# Analytics & Knowledge Gap Detection Endpoints
# -------------------------------------------------------------
@app.get("/api/analytics", response_model=AnalyticsSummary)
def get_analytics(
    domain: Optional[str] = Query(None),
    query_type: Optional[str] = Query(None),
    confidence: Optional[str] = Query(None)
):
    return analytics_service.get_summary(
        domain_filter=domain,
        query_type_filter=query_type,
        confidence_filter=confidence
    )

# -------------------------------------------------------------
# Evaluation & Benchmark Endpoints
# -------------------------------------------------------------
@app.post("/api/evaluation/run", response_model=BenchmarkReport)
def run_evaluation_benchmark():
    return evaluation_service.run_benchmark()

@app.get("/api/evaluation/latest", response_model=BenchmarkReport)
def get_latest_benchmark():
    return evaluation_service.run_benchmark()

# -------------------------------------------------------------
# Static Frontend Serving (Optional standalone production mode)
# -------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = settings.BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
