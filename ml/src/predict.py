"""
Inference wrapper for Customer Churn and LTV prediction.
Provides unified scoring, probability thresholds, and SHAP explainability.
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Union, List

from ml.src.feature_engineering import add_engineered_features, FEATURE_COLUMNS
from ml.src.explain import ChurnExplainer

class CustomerPredictor:
    def __init__(self, model_dir: str = "ml/models"):
        self.model_dir = model_dir
        self.churn_model = joblib.load(os.path.join(model_dir, "churn_model.joblib"))
        self.tree_churn_model = joblib.load(os.path.join(model_dir, "tree_churn_model.joblib"))
        self.ltv_model = joblib.load(os.path.join(model_dir, "ltv_model.joblib"))
        self.preprocessor = joblib.load(os.path.join(model_dir, "preprocessor.joblib"))
        
        # Extract feature names after transformer
        cat_encoder = self.preprocessor.named_transformers_["cat"].named_steps["onehot"]
        cat_features = list(cat_encoder.get_feature_names_out(["subscription_plan", "location", "gender"]))
        num_features = self.preprocessor.transformers[0][2]
        self.feature_names = list(num_features) + cat_features
        
        # Explainer on tree model
        self.explainer = ChurnExplainer(self.tree_churn_model, self.feature_names)
        
    def predict_customer(self, customer_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
        """
        Runs full inference pipeline on a single customer record or dict.
        Returns churn probability, risk level, predicted LTV, and SHAP factors.
        """
        if isinstance(customer_data, dict):
            df_raw = pd.DataFrame([customer_data])
        else:
            df_raw = customer_data.copy()
            
        df_feat = add_engineered_features(df_raw)
        X = df_feat[FEATURE_COLUMNS]
        X_trans = self.preprocessor.transform(X)
        
        # 1. Churn probability prediction
        churn_prob = float(self.churn_model.predict_proba(X_trans)[0, 1])
        
        # Determine risk level
        if churn_prob >= 0.60:
            risk_level = "HIGH"
        elif churn_prob >= 0.30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        # 2. LTV prediction
        predicted_ltv = float(self.ltv_model.predict(X_trans)[0])
        predicted_ltv = max(5000.0, round(predicted_ltv, 2))
        
        # 3. Revenue at Risk calculation
        # Expected Revenue at Risk = Churn Probability * Predicted LTV (or monthly spend * 12)
        monthly_spend = float(df_raw.get("monthly_spend", [0])[0] if isinstance(df_raw.get("monthly_spend"), (list, pd.Series)) else df_raw.get("monthly_spend", 0))
        revenue_at_risk = round(churn_prob * predicted_ltv, 2)
        
        # 4. SHAP Explanation
        raw_dict = df_raw.iloc[0].to_dict() if isinstance(df_raw, pd.DataFrame) else customer_data
        explanation = self.explainer.explain_instance(X_trans[0], raw_dict, top_k=4)
        
        return {
            "churn_probability": round(churn_prob, 4),
            "churn_percentage": round(churn_prob * 100, 1),
            "risk_level": risk_level,
            "predicted_ltv": predicted_ltv,
            "revenue_at_risk": revenue_at_risk,
            "monthly_spend": monthly_spend,
            "explanation": explanation
        }

if __name__ == "__main__":
    predictor = CustomerPredictor()
    sample_customer = {
        "tenure_months": 3,
        "monthly_spend": 8999,
        "previous_month_spend": 8999,
        "total_spend": 26997,
        "login_frequency_per_week": 1.2,
        "sessions_per_week": 2.0,
        "avg_session_duration_mins": 8.5,
        "days_since_last_login": 24,
        "feature_usage_score": 2,
        "usage_change_30d_pct": -45.0,
        "marketing_emails_opened_pct": 10.0,
        "support_tickets": 4,
        "complaints": 2,
        "avg_resolution_time_hours": 36.0,
        "payment_failures_last_3m": 1,
        "discount_received": 0,
        "customer_satisfaction_score": 2,
        "subscription_plan": "Premium",
        "location": "Bengaluru",
        "age": 34,
        "gender": "Female"
    }
    result = predictor.predict_customer(sample_customer)
    print("Sample Prediction Result:")
    print(f"Risk: {result['risk_level']} ({result['churn_percentage']}%)")
    print(f"Predicted LTV: INR {result['predicted_ltv']:,.2f}")
    print(f"Revenue at Risk: INR {result['revenue_at_risk']:,.2f}")
    print(f"Top Churn Drivers (+): {[item['label'] for item in result['explanation']['increasing_churn_risk']]}")
