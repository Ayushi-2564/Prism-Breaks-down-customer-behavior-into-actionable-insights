"""
Preprocessing and pipeline management for Churn and LTV models.
Ensures identical transformations between training and live inference.
"""

import os
import joblib
import pandas as pd
from typing import Tuple
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from ml.src.feature_engineering import add_engineered_features, FEATURE_COLUMNS

NUMERICAL_FEATURES = [
    "tenure_months", "monthly_spend", "previous_month_spend", "total_spend",
    "login_frequency_per_week", "sessions_per_week", "avg_session_duration_mins",
    "days_since_last_login", "feature_usage_score", "usage_change_30d_pct",
    "marketing_emails_opened_pct", "support_tickets", "complaints",
    "avg_resolution_time_hours", "payment_failures_last_3m", "discount_received",
    "customer_satisfaction_score", "age",
    "tickets_per_tenure_month", "complaint_ratio", "spend_velocity",
    "weekly_active_hours", "inactivity_tenure_ratio", "spend_per_adopted_feature",
    "friction_index"
]

CATEGORICAL_FEATURES = ["subscription_plan", "location", "gender"]

def build_preprocessor() -> ColumnTransformer:
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def prepare_data(
    df: pd.DataFrame, 
    test_size: float = 0.2, 
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series, ColumnTransformer]:
    """
    Applies feature engineering, splits data, fits preprocessor on train set only.
    Returns: X_train_raw, X_test_raw, y_churn_train, y_churn_test, y_ltv_train, y_ltv_test, preprocessor
    """
    df_feat = add_engineered_features(df)
    
    X = df_feat[FEATURE_COLUMNS]
    y_churn = df_feat["churn"]
    y_ltv = df_feat["actual_ltv"]
    
    X_train, X_test, y_c_train, y_c_test, y_l_train, y_l_test = train_test_split(
        X, y_churn, y_ltv, test_size=test_size, random_state=random_state, stratify=y_churn
    )
    
    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)
    
    return X_train, X_test, y_c_train, y_c_test, y_l_train, y_l_test, preprocessor

def get_transformed_feature_names(preprocessor: ColumnTransformer) -> list:
    """Extracts output column names after ColumnTransformer for SHAP interpretability."""
    output_features = list(NUMERICAL_FEATURES)
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    cat_features = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    output_features.extend(cat_features)
    return output_features
