"""
Main FastAPI Application Entrypoint.
Multi-Store Demand Forecasting & Inventory Optimization API.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.db.seed import seed_inventory_database
from backend.app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB schema & seed database if needed
    Base.metadata.create_all(bind=engine)
    try:
        seed_inventory_database(force=False)
    except Exception as e:
        print(f"Warning: Database auto-seed check: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Grade API for Multi-Store Demand Forecasting, WAPE Metrics, and Inventory Optimization.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# W3C Compliant CORS for cross-origin browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "message": "Multi-Store Demand Forecasting & Inventory API",
        "status": "online",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
