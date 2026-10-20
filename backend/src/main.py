from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from src.config import PORT, HOST
from src.seed import seed_database
from src.routes.hotels import router as hotels_router, rooms_router
from src.routes.reservations import router as reservations_router
from src.routes.payments import router as payments_router
from src.routes.admin import router as admin_router
from src.routes.auth import router as auth_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("staypulse")

app = FastAPI(
    title="StayPulse Hotels API",
    description="Standalone Hotel Directory, Slot Reservation & Guest Registration Platform for TinyFish Crawling and TripSaathi Testing",
    version="1.0.0"
)

# CORS setup for production (Vercel/Render frontend) and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://stay-pulse.vercel.app",
        "https://web-production-8f61a.up.railway.app",
    ],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$|^https:\/\/.*\.up\.railway\.app$|^https:\/\/.*\.onrender\.com$|^https?:\/\/localhost:\d+$|^https?:\/\/127\.0\.0\.1:\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes under /api
app.include_router(hotels_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(reservations_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    logger.info("StayPulse API starting up...")
    try:
        seed_database(force=False)
    except Exception as e:
        logger.error(f"Error during startup seed: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "StayPulse Hotels API",
        "version": "1.0.0",
        "port": PORT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=True)
