"""
ML Service singleton providing model prediction, explanations, and model metadata.
"""

import os
import json
import pandas as pd
from typing import Dict, Any, List

from ml.src.predict import CustomerPredictor
from backend.app.core.config import settings

class MLService:
    _instance = None
    
    def __init__(self):
        self.predictor = CustomerPredictor(model_dir=settings.MODEL_DIR)
        self.metadata_path = os.path.join(settings.MODEL_DIR, "model_metadata.json")
        self.metadata = self._load_metadata()
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def _load_metadata(self) -> Dict[str, Any]:
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r") as f:
                return json.load(f)
        return {}
        
    def predict(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.predictor.predict_customer(customer_data)
        
    def get_model_metrics(self) -> Dict[str, Any]:
        return self.metadata
        
    def get_feature_names(self) -> List[str]:
        return self.predictor.feature_names

ml_service = MLService.get_instance()
