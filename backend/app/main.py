"""
Main FastAPI Application Entrypoint.
Customer Intelligence Platform — Churn & Lifetime Value Prediction.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.db.seed import seed_database
from backend.app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB schema exists & seed with initial data if needed
    Base.metadata.create_all(bind=engine)
    try:
        seed_database(force=False)
    except Exception as e:
        print(f"Warning: Database auto-seed check encountered an issue: {e}")
    yield
    # Shutdown: Clean up connections if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade API for customer churn risk, predictive LTV, SHAP explainability, and prescriptive retention actions.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for Vite / React Frontend (W3C compliant for cross-origin browser requests)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "message": "Customer Intelligence Platform API",
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
