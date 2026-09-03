"""
Core configuration settings for Customer Intelligence Platform API.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Customer Intelligence Platform API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Paths
    # config.py is at backend/app/core/config.py -> 4 dirnames up is repo root
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'customer_intelligence.db')}")
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.join(BASE_DIR, "ml", "models"))
    DATASET_PATH: str = os.getenv("DATASET_PATH", os.path.join(BASE_DIR, "ml", "data", "customer_churn_dataset.csv"))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
