import uvicorn
import sys
from pathlib import Path

# Ensure backend directory is in python search path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("=================================================================")
    print(" Starting AI Knowledge Retrieval Platform Backend (FastAPI)")
    print(" API Documentation: http://localhost:8000/docs")
    print(" Health Endpoint:   http://localhost:8000/api/health")
    print("=================================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
