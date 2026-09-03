"""
Feature Engineering module for Customer Churn & LTV modeling.
Encapsulates domain-specific ratio and trend features with strict data leakage guards.
"""

import pandas as pd
import numpy as np

def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes behavioral velocity, support load, and engagement ratios.
    Does NOT use future/post-churn observations.
    """
    df = df.copy()
    
    # 1. Support Intensity: Support tickets normalized by customer tenure
    df["tickets_per_tenure_month"] = (df["support_tickets"] / (df["tenure_months"] + 1.0)).round(4)
    
    # 2. Complaint Severity: Ratio of complaints to total support tickets
    df["complaint_ratio"] = (df["complaints"] / (df["support_tickets"] + 1.0)).round(4)
    
    # 3. Spend Velocity: Relative change between recent monthly spend and previous month
    df["spend_velocity"] = ((df["monthly_spend"] - df["previous_month_spend"]) / (df["previous_month_spend"] + 1.0)).round(4)
    
    # 4. Weekly Hours of Active Engagement
    df["weekly_active_hours"] = ((df["sessions_per_week"] * df["avg_session_duration_mins"]) / 60.0).round(2)
    
    # 5. Inactivity Ratio: Fraction of lifetime represented by current inactivity
    df["inactivity_tenure_ratio"] = (df["days_since_last_login"] / (df["tenure_months"] * 30.4 + 1.0)).round(4)
    
    # 6. Feature Adoption Value: Spend per adopted feature
    df["spend_per_adopted_feature"] = (df["monthly_spend"] / (df["feature_usage_score"] + 1.0)).round(2)
    
    # 7. Customer Friction Index: Combined friction score (complaints, payment issues, resolution time)
    df["friction_index"] = (
        df["complaints"] * 2.0 
        + df["payment_failures_last_3m"] * 1.5 
        + (df["avg_resolution_time_hours"] / 24.0)
        - (df["customer_satisfaction_score"] * 0.8)
    ).round(3)
    
    return df

FEATURE_COLUMNS = [
    "tenure_months",
    "monthly_spend",
    "previous_month_spend",
    "total_spend",
    "login_frequency_per_week",
    "sessions_per_week",
    "avg_session_duration_mins",
    "days_since_last_login",
    "feature_usage_score",
    "usage_change_30d_pct",
    "marketing_emails_opened_pct",
    "support_tickets",
    "complaints",
    "avg_resolution_time_hours",
    "payment_failures_last_3m",
    "discount_received",
    "customer_satisfaction_score",
    "subscription_plan",
    "location",
    "age",
    "gender",
    # Engineered features
    "tickets_per_tenure_month",
    "complaint_ratio",
    "spend_velocity",
    "weekly_active_hours",
    "inactivity_tenure_ratio",
    "spend_per_adopted_feature",
    "friction_index"
]
