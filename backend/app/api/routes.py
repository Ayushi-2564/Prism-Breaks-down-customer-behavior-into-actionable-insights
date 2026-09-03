"""
FastAPI REST API routes for Customer Intelligence Platform.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import Optional, List, Dict, Any

from backend.app.db.session import get_db
from backend.app.models.customer import Customer, Prediction
from backend.app.schemas.customer import (
    CustomerResponse,
    CustomerDetailResponse,
    PaginatedCustomersResponse,
    DashboardKPIs,
    ShapExplanationResponse,
    RecommendationResponse,
    PredictRequest,
    PredictResponse
)
from backend.app.services.ml_service import ml_service
from backend.app.services.recommendation import generate_retention_recommendation, compute_customer_segment

router = APIRouter()

@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Customer Intelligence Platform API",
        "model_loaded": ml_service.predictor is not None
    }

@router.get("/dashboard", response_model=DashboardKPIs, tags=["Analytics"])
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Computes executive overview KPIs, risk distributions, revenue at risk,
    churn rate breakdowns by plan/tenure, and customer segment matrices.
    """
    total_customers = db.query(Customer).count()
    if total_customers == 0:
        raise HTTPException(status_code=404, detail="No customer data found. Please seed the database.")
        
    # High / Medium / Low Risk counts
    risk_counts = (
        db.query(Prediction.risk_level, func.count(Prediction.id))
        .group_by(Prediction.risk_level)
        .all()
    )
    risk_dict = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for r_level, count in risk_counts:
        risk_dict[r_level] = count
        
    customers_at_risk = risk_dict["HIGH"] + risk_dict["MEDIUM"]
    high_risk_customers = risk_dict["HIGH"]
    
    # Revenue at Risk
    total_revenue_at_risk = db.query(func.sum(Prediction.revenue_at_risk)).scalar() or 0.0
    
    # Revenue by Risk Level
    rev_by_risk_query = (
        db.query(Prediction.risk_level, func.sum(Prediction.revenue_at_risk))
        .group_by(Prediction.risk_level)
        .all()
    )
    rev_by_risk = {"LOW": 0.0, "MEDIUM": 0.0, "HIGH": 0.0}
    for r_level, total_rev in rev_by_risk_query:
        rev_by_risk[r_level] = round(float(total_rev or 0.0), 2)
        
    # Average Customer LTV & Predicted LTV
    avg_actual_ltv = db.query(func.avg(Customer.actual_ltv)).scalar() or 0.0
    avg_predicted_ltv = db.query(func.avg(Prediction.predicted_ltv)).scalar() or 0.0
    
    # Overall Average Churn Probability
    avg_churn_prob = db.query(func.avg(Prediction.churn_probability)).scalar() or 0.0
    
    # Retention Opportunity: 40% estimated recoverable revenue from active retention
    retention_opportunity = round(rev_by_risk["HIGH"] * 0.45 + rev_by_risk["MEDIUM"] * 0.25, 2)
    
    # Churn by Subscription Plan
    churn_by_plan_query = (
        db.query(
            Customer.subscription_plan,
            func.count(Customer.id).label("count"),
            func.avg(Prediction.churn_probability).label("avg_churn"),
            func.sum(Prediction.revenue_at_risk).label("rev_at_risk"),
            func.avg(Prediction.predicted_ltv).label("avg_ltv")
        )
        .join(Prediction, Customer.customer_id == Prediction.customer_id)
        .group_by(Customer.subscription_plan)
        .all()
    )
    churn_by_plan = [
        {
            "plan": row.subscription_plan,
            "customer_count": row.count,
            "avg_churn_rate": round(float(row.avg_churn) * 100, 1),
            "revenue_at_risk": round(float(row.rev_at_risk or 0.0), 2),
            "avg_ltv": round(float(row.avg_ltv or 0.0), 2)
        }
        for row in churn_by_plan_query
    ]
    
    # Churn by Tenure Cohorts
    tenure_cohorts = [
        ("0-3 Months", 0, 3),
        ("4-6 Months", 4, 6),
        ("7-12 Months", 7, 12),
        ("13-24 Months", 13, 24),
        ("24+ Months", 25, 100)
    ]
    churn_by_tenure = []
    for label, min_t, max_t in tenure_cohorts:
        c_query = (
            db.query(
                func.count(Customer.id),
                func.avg(Prediction.churn_probability),
                func.sum(Prediction.revenue_at_risk)
            )
            .join(Prediction, Customer.customer_id == Prediction.customer_id)
            .filter(Customer.tenure_months >= min_t, Customer.tenure_months <= max_t)
            .first()
        )
        count, avg_churn, rev_risk = c_query
        churn_by_tenure.append({
            "cohort": label,
            "customer_count": count or 0,
            "avg_churn_rate": round(float(avg_churn or 0.0) * 100, 1),
            "revenue_at_risk": round(float(rev_risk or 0.0), 2)
        })
        
    # Segment breakdown
    segment_query = (
        db.query(
            Prediction.segment,
            func.count(Prediction.id).label("count"),
            func.avg(Prediction.churn_probability).label("avg_churn"),
            func.avg(Prediction.predicted_ltv).label("avg_ltv"),
            func.sum(Prediction.revenue_at_risk).label("rev_at_risk")
        )
        .group_by(Prediction.segment)
        .all()
    )
    customer_segments = [
        {
            "segment": row.segment,
            "count": row.count,
            "avg_churn_rate": round(float(row.avg_churn) * 100, 1),
            "avg_ltv": round(float(row.avg_ltv or 0.0), 2),
            "revenue_at_risk": round(float(row.rev_at_risk or 0.0), 2)
        }
        for row in segment_query
    ]
    
    return DashboardKPIs(
        total_customers=total_customers,
        customers_at_risk=customers_at_risk,
        high_risk_customers=high_risk_customers,
        overall_churn_rate=round(float(avg_churn_prob) * 100, 1),
        total_revenue_at_risk=round(float(total_revenue_at_risk), 2),
        avg_customer_ltv=round(float(avg_actual_ltv), 2),
        avg_predicted_ltv=round(float(avg_predicted_ltv), 2),
        retention_opportunity_amount=retention_opportunity,
        risk_distribution=risk_dict,
        revenue_by_risk=rev_by_risk,
        churn_by_plan=churn_by_plan,
        churn_by_tenure=churn_by_tenure,
        customer_segments=customer_segments
    )

@router.get("/customers", response_model=PaginatedCustomersResponse, tags=["Customers"])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    segment: Optional[str] = None,
    subscription_plan: Optional[str] = None,
    min_ltv: Optional[float] = None,
    max_ltv: Optional[float] = None,
    min_churn: Optional[float] = None,
    max_churn: Optional[float] = None,
    sort_by: Optional[str] = Query("churn_probability"),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    """
    Searchable, filterable, and paginated customer risk table.
    Supports multi-field filtering and dynamic sorting by risk, LTV, revenue at risk, and activity.
    """
    query = db.query(Customer, Prediction).join(Prediction, Customer.customer_id == Prediction.customer_id)
    
    # Search filter
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.customer_id.ilike(s)) | (Customer.email.ilike(s)))
        
    # Filters
    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(Prediction.risk_level == risk_level.upper())
    if segment and segment != "ALL":
        query = query.filter(Prediction.segment == segment)
    if subscription_plan and subscription_plan != "ALL":
        query = query.filter(Customer.subscription_plan == subscription_plan)
    if min_ltv is not None:
        query = query.filter(Prediction.predicted_ltv >= min_ltv)
    if max_ltv is not None:
        query = query.filter(Prediction.predicted_ltv <= max_ltv)
    if min_churn is not None:
        query = query.filter(Prediction.churn_probability >= min_churn)
    if max_churn is not None:
        query = query.filter(Prediction.churn_probability <= max_churn)
        
    # Sorting
    sort_column_map = {
        "churn_probability": Prediction.churn_probability,
        "predicted_ltv": Prediction.predicted_ltv,
        "revenue_at_risk": Prediction.revenue_at_risk,
        "tenure_months": Customer.tenure_months,
        "monthly_spend": Customer.monthly_spend,
        "days_since_last_login": Customer.days_since_last_login,
        "support_tickets": Customer.support_tickets
    }
    
    col = sort_column_map.get(sort_by, Prediction.churn_probability)
    query = query.order_by(desc(col) if sort_order.lower() == "desc" else asc(col))
    
    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()
    
    customer_list = []
    for c, p in results:
        customer_list.append(CustomerResponse(
            id=c.id,
            customer_id=c.customer_id,
            name=c.name,
            email=c.email,
            age=c.age,
            gender=c.gender,
            location=c.location,
            subscription_plan=c.subscription_plan,
            signup_date=c.signup_date,
            tenure_months=c.tenure_months,
            monthly_spend=c.monthly_spend,
            previous_month_spend=c.previous_month_spend or c.monthly_spend,
            total_spend=c.total_spend or (c.monthly_spend * c.tenure_months),
            login_frequency_per_week=c.login_frequency_per_week,
            sessions_per_week=c.sessions_per_week,
            avg_session_duration_mins=c.avg_session_duration_mins,
            days_since_last_login=c.days_since_last_login,
            feature_usage_score=c.feature_usage_score,
            usage_change_30d_pct=c.usage_change_30d_pct,
            marketing_emails_opened_pct=c.marketing_emails_opened_pct,
            support_tickets=c.support_tickets,
            complaints=c.complaints,
            avg_resolution_time_hours=c.avg_resolution_time_hours,
            payment_failures_last_3m=c.payment_failures_last_3m,
            discount_received=c.discount_received,
            customer_satisfaction_score=c.customer_satisfaction_score,
            churn_probability=p.churn_probability,
            churn_percentage=round(p.churn_probability * 100, 1),
            risk_level=p.risk_level,
            predicted_ltv=p.predicted_ltv,
            revenue_at_risk=p.revenue_at_risk,
            segment=p.segment,
            recommended_action=p.recommended_action_title or "Standard Engagement"
        ))
        
    return PaginatedCustomersResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        customers=customer_list
    )

@router.get("/customers/{customer_id}", response_model=CustomerDetailResponse, tags=["Customers"])
def get_customer_details(customer_id: str, db: Session = Depends(get_db)):
    """Retrieves deep customer profile and diagnostic metrics."""
    record = (
        db.query(Customer, Prediction)
        .join(Prediction, Customer.customer_id == Prediction.customer_id)
        .filter(Customer.customer_id == customer_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found")
        
    c, p = record
    return CustomerDetailResponse(
        id=c.id,
        customer_id=c.customer_id,
        name=c.name,
        email=c.email,
        age=c.age,
        gender=c.gender,
        location=c.location,
        subscription_plan=c.subscription_plan,
        signup_date=c.signup_date,
        tenure_months=c.tenure_months,
        monthly_spend=c.monthly_spend,
        previous_month_spend=c.previous_month_spend or c.monthly_spend,
        total_spend=c.total_spend or (c.monthly_spend * c.tenure_months),
        login_frequency_per_week=c.login_frequency_per_week,
        sessions_per_week=c.sessions_per_week,
        avg_session_duration_mins=c.avg_session_duration_mins,
        days_since_last_login=c.days_since_last_login,
        feature_usage_score=c.feature_usage_score,
        usage_change_30d_pct=c.usage_change_30d_pct,
        marketing_emails_opened_pct=c.marketing_emails_opened_pct,
        support_tickets=c.support_tickets,
        complaints=c.complaints,
        avg_resolution_time_hours=c.avg_resolution_time_hours,
        payment_failures_last_3m=c.payment_failures_last_3m,
        discount_received=c.discount_received,
        customer_satisfaction_score=c.customer_satisfaction_score,
        churn_probability=p.churn_probability,
        churn_percentage=round(p.churn_probability * 100, 1),
        risk_level=p.risk_level,
        predicted_ltv=p.predicted_ltv,
        revenue_at_risk=p.revenue_at_risk,
        segment=p.segment,
        recommended_action=p.recommended_action_title or "Standard Engagement"
    )

@router.get("/customers/{customer_id}/churn", tags=["Predictions"])
def get_customer_churn(customer_id: str, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    c_dict = {col.name: getattr(c, col.name) for col in Customer.__table__.columns}
    pred = ml_service.predict(c_dict)
    return {
        "customer_id": customer_id,
        "churn_probability": pred["churn_probability"],
        "churn_percentage": pred["churn_percentage"],
        "risk_level": pred["risk_level"]
    }

@router.get("/customers/{customer_id}/ltv", tags=["Predictions"])
def get_customer_ltv(customer_id: str, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    c_dict = {col.name: getattr(c, col.name) for col in Customer.__table__.columns}
    pred = ml_service.predict(c_dict)
    return {
        "customer_id": customer_id,
        "predicted_ltv": pred["predicted_ltv"],
        "revenue_at_risk": pred["revenue_at_risk"],
        "monthly_spend": pred["monthly_spend"]
    }

@router.get("/customers/{customer_id}/explanation", response_model=ShapExplanationResponse, tags=["Explainability"])
def get_customer_explanation(customer_id: str, db: Session = Depends(get_db)):
    """Computes exact TreeSHAP attribution and positive/negative risk drivers."""
    c = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    c_dict = {col.name: getattr(c, col.name) for col in Customer.__table__.columns}
    pred = ml_service.predict(c_dict)
    
    exp = pred["explanation"]
    return ShapExplanationResponse(
        customer_id=customer_id,
        churn_probability=pred["churn_probability"],
        risk_level=pred["risk_level"],
        base_value=exp["base_value"],
        increasing_churn_risk=exp["increasing_churn_risk"],
        reducing_churn_risk=exp["reducing_churn_risk"]
    )

@router.get("/customers/{customer_id}/recommendation", response_model=RecommendationResponse, tags=["Recommendations"])
def get_customer_recommendation(customer_id: str, db: Session = Depends(get_db)):
    """Generates prescriptive retention actions based on customer behavior and ML predictions."""
    record = (
        db.query(Customer, Prediction)
        .join(Prediction, Customer.customer_id == Prediction.customer_id)
        .filter(Customer.customer_id == customer_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    c, p = record
    c_dict = {col.name: getattr(c, col.name) for col in Customer.__table__.columns}
    
    rec = generate_retention_recommendation(
        customer_id=c.customer_id,
        customer_name=c.name,
        churn_prob=p.churn_probability,
        predicted_ltv=p.predicted_ltv,
        revenue_at_risk=p.revenue_at_risk,
        customer_data=c_dict
    )
    return rec

@router.get("/model/metrics", tags=["Model Performance"])
def get_model_metrics():
    """Returns classification and regression evaluation metrics, curves, and feature importance."""
    meta = ml_service.get_model_metrics()
    if not meta:
        raise HTTPException(status_code=503, detail="Model metadata is unavailable. Please run training pipeline.")
    return meta

@router.get("/model/features", tags=["Model Performance"])
def get_model_features():
    return {
        "features": ml_service.get_feature_names()
    }

@router.post("/predict", response_model=PredictResponse, tags=["Predictions"])
def predict_custom_customer(req: PredictRequest):
    """
    Real-time interactive scoring endpoint.
    Accepts arbitrary customer parameters and returns Churn Probability, LTV, SHAP explanation, and Retention Plan.
    """
    c_dict = req.model_dump()
    pred = ml_service.predict(c_dict)
    
    cp = pred["churn_probability"]
    ltv = pred["predicted_ltv"]
    rev_risk = pred["revenue_at_risk"]
    
    seg = compute_customer_segment(cp, ltv, req.tenure_months, req.days_since_last_login)
    
    rec = generate_retention_recommendation(
        customer_id="SIM-USER",
        customer_name=req.name,
        churn_prob=cp,
        predicted_ltv=ltv,
        revenue_at_risk=rev_risk,
        customer_data=c_dict
    )
    
    exp = pred["explanation"]
    shap_resp = ShapExplanationResponse(
        customer_id="SIM-USER",
        churn_probability=cp,
        risk_level=pred["risk_level"],
        base_value=exp["base_value"],
        increasing_churn_risk=exp["increasing_churn_risk"],
        reducing_churn_risk=exp["reducing_churn_risk"]
    )
    
    return PredictResponse(
        churn_probability=cp,
        churn_percentage=pred["churn_percentage"],
        risk_level=pred["risk_level"],
        predicted_ltv=ltv,
        revenue_at_risk=rev_risk,
        segment=seg,
        recommendation=rec,
        explanation=shap_resp
    )
