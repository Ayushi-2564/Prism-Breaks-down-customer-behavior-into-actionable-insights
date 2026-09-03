"""
API Integration Tests for FastAPI Backend.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "system_wape_score" in data
    assert "total_annual_holding_savings" in data
    assert len(data["category_breakdown"]) > 0

def test_inventory_endpoint():
    response = client.get("/api/inventory")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_forecast_endpoint():
    response = client.get("/api/forecast?store=1&item=1")
    assert response.status_code == 200
    data = response.json()
    assert "time_series" in data
    assert len(data["time_series"]["actual_sales"]) > 0

def test_simulate_endpoint():
    payload = {
        "daily_demand_mean": 60.0,
        "daily_demand_std": 12.0,
        "lead_days": 5,
        "unit_price": 350.0,
        "holding_cost_rate": 0.08,
        "service_level": 0.95
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["safety_stock_units"] > 0
    assert data["reorder_point_units"] > 0
