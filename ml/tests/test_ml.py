"""
Unit tests for the Machine Learning Pipeline.
Tests data generation, preprocessing, model loading, prediction bounds, and SHAP explainability.
"""

import pytest
import os
import pandas as pd
import numpy as np

from ml.data.generate_dataset import generate_customer_dataset
from ml.src.feature_engineering import add_engineered_features, FEATURE_COLUMNS
from ml.src.predict import CustomerPredictor

def test_dataset_generation():
    df = generate_customer_dataset(n_samples=100, random_seed=123)
    assert len(df) == 100
    assert "churn" in df.columns
    assert "actual_ltv" in df.columns
    assert df["churn"].isin([0, 1]).all()
    assert (df["actual_ltv"] > 0).all()

def test_feature_engineering():
    df = generate_customer_dataset(n_samples=50, random_seed=42)
    df_feat = add_engineered_features(df)
    
    assert "tickets_per_tenure_month" in df_feat.columns
    assert "complaint_ratio" in df_feat.columns
    assert "spend_velocity" in df_feat.columns
    assert "weekly_active_hours" in df_feat.columns
    assert "friction_index" in df_feat.columns
    assert not df_feat[FEATURE_COLUMNS].isnull().any().any()

def test_customer_predictor_and_shap():
    predictor = CustomerPredictor(model_dir="ml/models")
    
    sample_customer = {
        "tenure_months": 12,
        "monthly_spend": 3999,
        "previous_month_spend": 3999,
        "total_spend": 47988,
        "login_frequency_per_week": 4.5,
        "sessions_per_week": 6.0,
        "avg_session_duration_mins": 25.0,
        "days_since_last_login": 3,
        "feature_usage_score": 7,
        "usage_change_30d_pct": 12.0,
        "marketing_emails_opened_pct": 60.0,
        "support_tickets": 1,
        "complaints": 0,
        "avg_resolution_time_hours": 12.0,
        "payment_failures_last_3m": 0,
        "discount_received": 1,
        "customer_satisfaction_score": 5,
        "subscription_plan": "Standard",
        "location": "Bengaluru",
        "age": 29,
        "gender": "Male"
    }
    
    result = predictor.predict_customer(sample_customer)
    
    assert 0.0 <= result["churn_probability"] <= 1.0
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert result["predicted_ltv"] > 0
    assert "explanation" in result
    assert "increasing_churn_risk" in result["explanation"]
    assert "reducing_churn_risk" in result["explanation"]
