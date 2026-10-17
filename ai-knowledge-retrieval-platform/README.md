# AI-Based Knowledge Retrieval Platform with Query Resolution System

An enterprise-ready, autonomous **Multi-Agent Retrieval-Augmented Generation (RAG)** platform designed for verified knowledge ingestion, semantic search, grounded answer synthesis, conversational clarification, and real-time knowledge gap detection.

Built from the ground up to fulfill all requirements across **Milestones 1, 2, 3, and 4**.

---

## 🌟 Key Highlights & Architecture

- **Autonomous Multi-Agent Orchestration**:
  1. **Query Understanding Agent**: Analyzes intent, extracts technical entities, and classifies queries into `factual`, `procedural`, `comparative`, or `ambiguous` with confidence routing.
  2. **Retrieval Agent**: Performs dense vector search against indexed chunks, enforces configurable Top-K ranking, and prunes low-relevance candidates.
  3. **Response Generation Agent**: Synthesizes verified answers strictly grounded in retrieved evidence with exact source citations (`[Filename • Page/Section]`), eliminating hallucinations.
  4. **Clarification Agent**: Identifies ambiguous, incomplete, or underspecified queries and generates targeted interactive follow-up questions with 1-click selectable options.
  5. **Conversation Memory Agent**: Maintains multi-turn context across turns, resolves follow-up queries and pronouns, and enforces memory window limits to prevent token overflow.
- **Universal Multi-Format Ingestion**:
  - Ingests **PDF**, **DOCX**, **TXT**, and **CSV** files with boundary-aware sentence chunking and metadata preservation.
- **Persistent Local Vector Store**:
  - Fast, zero-torch-required dense vector space with L2 unit normalization and persistent SQLite metadata index. Runs 100% offline with zero external dependencies.
  - Optional support for OpenAI (`text-embedding-3-small`, `gpt-4o-mini`) and local Ollama (`llama3.2`).
- **Browser Web Speech API Integration**:
  - Microphone speech-to-text recognition with live transcription preview and visual pulse feedback.
  - Text-to-speech (TTS) spoken answer playback with play, pause, resume, and stop controls.
- **Analytics & Knowledge Gap Detection**:
  - Tracks query themes, confidence distributions, and automatically alerts on missing knowledge domains or ungrounded queries.
- **Scientific Retrieval Benchmark**:
  - Automated evaluation engine testing Top-1, Top-3, Top-5 retrieval accuracy, Mean Reciprocal Rank (MRR), and Groundedness across 3 distinct domains.

---

## 🏗️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Lucide Icons | High-performance, reactive UI with glassmorphic design and zero build latency. |
| **Backend** | Python 3.10+, FastAPI, Uvicorn | Async REST API with automatic OpenAPI documentation and Pydantic validation. |
| **Document Parsers** | `pypdf`, `python-docx`, `csv`, `fpdf2` | Native, robust parsing for PDF, DOCX, CSV, and TXT files. |
| **Vector Index & Embeddings** | `scikit-learn`, `numpy`, `sqlite3` | L2-normalized sublinear TF-IDF semantic vector space for instant offline cosine similarity. |
| **Multi-Agent Engine** | Specialized Python Agent Architecture | Clear separation of concerns with millisecond trace timing across 5 specialized agents. |
| **Voice Module** | Web Speech API (`SpeechRecognition`, `SpeechSynthesis`) | Browser-native audio capture and speech playback with zero third-party cloud costs. |
| **Testing** | `pytest` | Automated unit, agent, and end-to-end multi-agent pipeline validation. |

---

## 🚀 Quick Start Guide (Windows / Visual Studio Code)

### Prerequisites
1. **Python 3.10+** (Added to PATH)
2. **Node.js v18+ & npm** (Available in terminal)

### 1-Click Launch (Recommended for Windows)
Simply double-click the included batch script:
```cmd
run_project.bat
```
*Or via PowerShell:*
```powershell
.\run_project.ps1
```
This script automatically installs Python requirements, checks frontend npm packages, launches the FastAPI backend at `http://localhost:8000`, and launches the Vite frontend at `http://localhost:5173`.

---

### Manual Step-by-Step Setup

#### Step 1: Open in Visual Studio Code
Open this folder in VS Code:
```cmd
code .
```

#### Step 2: Set Up Backend
```cmd
# Install Python dependencies
python -m pip install -r backend/requirements.txt

# (Optional) Seed 12 sample documents across Healthcare, Finance, and DevOps
python backend/data/create_sample_data.py

# Start Backend Server
python backend/run_backend.py
```
*The backend API will be available at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

#### Step 3: Set Up Frontend
Open a second terminal:
```cmd
cd frontend
npm install
npm run dev
```
*The frontend dashboard will be available at: `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

To run the complete automated test suite (13 comprehensive tests):
```cmd
python -m pytest backend/tests -v
```
All tests validate:
- Document extraction and boundary-aware chunking (PDF, DOCX, TXT, CSV).
- Intent classification and entity extraction in `QueryUnderstandingAgent`.
- Ambiguity detection and query refinement in `ClarificationAgent`.
- Semantic search and threshold pruning in `RetrievalAgent`.
- Grounded synthesis, citation formatting, and confidence scoring in `ResponseGenerationAgent`.
- Conversational follow-up query rewriting in `ConversationMemoryAgent`.
- End-to-end sequential pipeline execution in `MultiAgentOrchestrator`.
- Query analytics logging and live Top-1/3/5 retrieval evaluation benchmarks.

---

## 📖 Application User Interface Modules

The application includes 6 core interactive modules accessible via the navigation sidebar:

1. **Overview Dashboard**:
   - Live KPI cards (Indexed Docs, Vector Chunks, Active Agents, Domains Covered).
   - Interactive multi-agent architecture and data pipeline diagram.
   - 1-click domain starter queries for instant demonstration.
2. **AI Query Resolution Interface**:
   - Conversational chat with typing indicator, millisecond execution traces, and confidence level badges.
   - **Interactive Clarification Cards**: Renders quick-choice chips when ambiguity is detected.
   - **Voice Input**: Microphone button with audio pulse visualizer and speech-to-text.
   - **Spoken Responses**: TTS Play, Pause, Resume, and Stop controls.
   - **Response Transparency Panel**: Inspects exact supporting chunks, chunk IDs, page/section details, and similarity scores.
3. **Knowledge Base Management**:
   - Drag-and-drop document upload supporting PDF, DOCX, TXT, and CSV.
   - Configurable chunk size and overlap sliders.
   - Table of indexed documents with Chunk Inspector modal and deletion controls.
4. **Query Analytics & Knowledge Gap Detection**:
   - Real-time statistics, query classification distributions, and confidence trends.
   - Recurring keyword themes.
   - Automated Knowledge Gap alert table flagging unanswered or low-confidence queries with actionable recommendations.
5. **Retrieval Evaluation Benchmark**:
   - 1-click evaluation benchmark testing 12 representative queries across Healthcare, Finance, and DevOps.
   - Reports Top-1, Top-3, Top-5 accuracy, Mean Reciprocal Rank (MRR), and Groundedness scores.
6. **System Configuration**:
   - Switch LLM providers (`local`, `openai`, `ollama`), enter OpenAI API keys, adjust Top-K and similarity thresholds, and inspect storage health.

---

## 🛠️ API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns system status, indexed document and chunk counts, and model settings. |
| `GET` | `/api/documents` | Lists all indexed documents and their chunk counts. |
| `POST` | `/api/documents/upload` | Ingests, chunks, and indexes a PDF, DOCX, TXT, or CSV file. |
| `DELETE`| `/api/documents/{id}` | Deletes a document and rebuilds the vector index. |
| `GET` | `/api/documents/{id}/chunks` | Retrieves all chunks and metadata for a specific document. |
| `POST` | `/api/chat/query` | Executes the complete multi-agent query resolution pipeline. |
| `GET` | `/api/chat/history/{id}` | Fetches conversation memory turns for a session. |
| `DELETE`| `/api/chat/history/{id}` | Clears conversation memory for a session. |
| `GET` | `/api/analytics` | Aggregates query metrics, recurring themes, and detected knowledge gaps. |
| `POST` | `/api/evaluation/run` | Executes the retrieval evaluation benchmark suite across 3 domains. |
| `POST` | `/api/config` | Dynamically updates runtime configuration (LLM provider, Top-K, thresholds). |

---

## 🔒 Configuration & Environment Variables

Create a `.env` file in the project root or configure via the Settings UI:

```env
# LLM Provider: "local" (default zero-cost offline engine), "openai", or "ollama"
LLM_PROVIDER=local

# OpenAI API Settings (Optional: Only if LLM_PROVIDER=openai)
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Ollama Local LLM Settings (Optional: Only if LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Document Ingestion & Chunking Defaults
CHUNK_SIZE=500
CHUNK_OVERLAP=100

# Retrieval Defaults
DEFAULT_TOP_K=4
SIMILARITY_THRESHOLD=0.08
```

---

## ❓ Troubleshooting

1. **Port 8000 or 5173 is already in use**:
   - Change the port in `backend/run_backend.py` or `frontend/vite.config.ts`.
2. **Microphone permission blocked in browser**:
   - Web Speech API requires browser microphone permissions. Click the lock/tune icon in the browser address bar and enable microphone access. For optimal speech recognition accuracy, Google Chrome or Microsoft Edge is recommended.
3. **No module named 'app'**:
   - Ensure `PYTHONPATH=backend` is set when running scripts directly, or execute using `python backend/run_backend.py` from the root directory.
