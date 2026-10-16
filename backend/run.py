import uvicorn
import os
import sys

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from src.config import PORT, HOST

if __name__ == "__main__":
    port = int(os.getenv("PORT", PORT))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting StayPulse Backend on http://{host}:{port}")
    uvicorn.run("src.main:app", host=host, port=port, reload=False)
