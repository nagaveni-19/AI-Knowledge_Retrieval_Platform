import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "data" / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    SAMPLE_DOCS_DIR: Path = BASE_DIR / "data" / "sample_documents"
    DB_PATH: Path = STORAGE_DIR / "knowledge_base.db"
    VECTOR_INDEX_PATH: Path = STORAGE_DIR / "vector_index.pkl"

    # AI & Model Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "local")  # "local", "openai", "ollama"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")

    # Ingestion & Chunking Defaults
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))

    # Retrieval Defaults
    DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "4"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.08"))
    CONFIDENCE_HIGH_THRESHOLD: float = 0.70
    CONFIDENCE_MEDIUM_THRESHOLD: float = 0.40

    # Conversation Memory
    MAX_MEMORY_TURNS: int = 8

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
