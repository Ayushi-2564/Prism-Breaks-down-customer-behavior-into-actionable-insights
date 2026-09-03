"""
Backend API Integration and Endpoint Tests.
Tests health, dashboard KPIs, customer listing/search/filtering, SHAP explanation, and predict simulation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_customers"] > 0
    assert "risk_distribution" in data
    assert "total_revenue_at_risk" in data
    assert "churn_by_plan" in data
    assert "customer_segments" in data

def test_customers_listing_and_filtering():
    # Test pagination
    response = client.get("/api/customers?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["customers"]) == 10
    
    # Test risk level filter
    response_high = client.get("/api/customers?risk_level=HIGH&page_size=5")
    assert response_high.status_code == 200
    data_high = response_high.json()
    for cust in data_high["customers"]:
        assert cust["risk_level"] == "HIGH"
        
    # Test search
    cust_id = data["customers"][0]["customer_id"]
    response_search = client.get(f"/api/customers?search={cust_id}")
    assert response_search.status_code == 200
    data_search = response_search.json()
    assert len(data_search["customers"]) >= 1

def test_customer_detail_and_explanation():
    # Get first customer
    response = client.get("/api/customers?page=1&page_size=1")
    customer = response.json()["customers"][0]
    cid = customer["customer_id"]
    
    # Detail
    detail_resp = client.get(f"/api/customers/{cid}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["customer_id"] == cid
    
    # Explanation (SHAP)
    exp_resp = client.get(f"/api/customers/{cid}/explanation")
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()
    assert "increasing_churn_risk" in exp_data
    assert "reducing_churn_risk" in exp_data
    
    # Recommendation
    rec_resp = client.get(f"/api/customers/{cid}/recommendation")
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert "strategy_tier" in rec_data
    assert "action_plan" in rec_data
    assert len(rec_data["action_plan"]) > 0

def test_model_metrics_endpoint():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "churn_metrics" in data
    assert "ltv_metrics" in data
    assert "global_feature_importance" in data

def test_live_prediction_simulation():
    payload = {
        "name": "Test Simulation Customer",
        "email": "test.sim@example.com",
        "age": 35,
        "gender": "Female",
        "location": "Bengaluru",
        "subscription_plan": "Enterprise",
        "tenure_months": 18,
        "monthly_spend": 24999.0,
        "previous_month_spend": 24999.0,
        "total_spend": 449982.0,
        "login_frequency_per_week": 5.0,
        "sessions_per_week": 8.0,
        "avg_session_duration_mins": 30.0,
        "days_since_last_login": 2,
        "feature_usage_score": 9,
        "usage_change_30d_pct": 15.0,
        "marketing_emails_opened_pct": 70.0,
        "support_tickets": 1,
        "complaints": 0,
        "avg_resolution_time_hours": 8.0,
        "payment_failures_last_3m": 0,
        "discount_received": 0,
        "customer_satisfaction_score": 5
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "churn_probability" in data
    assert "predicted_ltv" in data
    assert "recommendation" in data
    assert "explanation" in data
