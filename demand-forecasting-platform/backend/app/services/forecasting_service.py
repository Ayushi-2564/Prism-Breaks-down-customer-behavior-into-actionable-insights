"""
Forecasting Service Singleton Loader.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

from backend.app.core.config import settings
from ml.src.feature_engineering import create_time_series_features, FEATURE_COLUMNS
from ml.src.inventory_engine import calculate_inventory_metrics, calculate_wape
from ml.src.time_series_analysis import decompose_time_series, run_adf_test

class ForecastingService:
    _instance = None
    
    def __init__(self):
        self.model_dir = settings.MODEL_DIR
        self.lgbm_model = None
        self.metrics = {}
        self.load_artifacts()
        
    def load_artifacts(self):
        model_path = os.path.join(self.model_dir, "forecaster.joblib")
        metrics_path = os.path.join(self.model_dir, "metrics.json")
        
        if os.path.exists(model_path):
            self.lgbm_model = joblib.load(model_path)
            
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)
                
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

forecasting_service = ForecastingService.get_instance()
