"""
Pydantic Schemas for Request Validation and API Responses.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

class CustomerBase(BaseModel):
    name: str
    email: str
    age: int = 30
    gender: str = "Female"
    location: str = "Bengaluru"
    subscription_plan: str = "Standard"
    tenure_months: int = 12
    monthly_spend: float = 3999.0
    previous_month_spend: float = 3999.0
    total_spend: float = 47988.0
    login_frequency_per_week: float = 4.0
    sessions_per_week: float = 6.0
    avg_session_duration_mins: float = 20.0
    days_since_last_login: int = 3
    feature_usage_score: int = 6
    usage_change_30d_pct: float = 0.0
    marketing_emails_opened_pct: float = 45.0
    support_tickets: int = 1
    complaints: int = 0
    avg_resolution_time_hours: float = 12.0
    payment_failures_last_3m: int = 0
    discount_received: int = 0
    customer_satisfaction_score: int = 4

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: str
    signup_date: Optional[str] = None
    churn_probability: float
    churn_percentage: float
    risk_level: str
    predicted_ltv: float
    revenue_at_risk: float
    segment: str
    recommended_action: str

class CustomerDetailResponse(CustomerResponse):
    pass

class PaginatedCustomersResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    customers: List[CustomerResponse]

class DashboardKPIs(BaseModel):
    total_customers: int
    customers_at_risk: int
    high_risk_customers: int
    overall_churn_rate: float
    total_revenue_at_risk: float
    avg_customer_ltv: float
    avg_predicted_ltv: float
    retention_opportunity_amount: float
    risk_distribution: Dict[str, int]
    revenue_by_risk: Dict[str, float]
    churn_by_plan: List[Dict[str, Any]]
    churn_by_tenure: List[Dict[str, Any]]
    customer_segments: List[Dict[str, Any]]

class ShapFactor(BaseModel):
    feature: str
    label: str
    impact: float
    description: str
    raw_value: Any

class ShapExplanationResponse(BaseModel):
    customer_id: str
    churn_probability: float
    risk_level: str
    base_value: float
    increasing_churn_risk: List[ShapFactor]
    reducing_churn_risk: List[ShapFactor]

class RetentionActionItem(BaseModel):
    action: str
    channel: str
    timeline: str
    impact: str

class RecommendationResponse(BaseModel):
    customer_id: str
    customer_name: str
    segment: str
    risk_level: str
    churn_probability: float
    predicted_ltv: float
    revenue_at_risk: float
    strategy_tier: str
    recommendation_title: str
    recommendation_summary: str
    rationale: List[str]
    action_plan: List[RetentionActionItem]

class PredictRequest(CustomerBase):
    pass

class PredictResponse(BaseModel):
    churn_probability: float
    churn_percentage: float
    risk_level: str
    predicted_ltv: float
    revenue_at_risk: float
    segment: str
    recommendation: RecommendationResponse
    explanation: ShapExplanationResponse
