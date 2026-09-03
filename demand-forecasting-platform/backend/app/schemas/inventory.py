"""
Pydantic v2 Response & Request Schemas.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, ConfigDict

class InventoryItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    store: int
    store_name: str
    item: int
    item_name: str
    category: str
    unit_price: float
    lead_days: int
    holding_cost_rate: float
    daily_demand_mean: float
    daily_demand_std: float
    safety_stock_units: int
    reorder_point_units: int
    annual_holding_cost: float
    holding_cost_savings: float
    stockout_risk_level: str

class DashboardMetricsSchema(BaseModel):
    total_sales_records: int
    total_stores: int
    total_items: int
    system_wape_score: float
    baseline_wape_score: float
    wape_improvement_pct: float
    total_annual_holding_savings: float
    reorder_alerts_count: int
    category_breakdown: List[Dict[str, Any]]
    store_performance: List[Dict[str, Any]]

class SimulationRequestSchema(BaseModel):
    daily_demand_mean: float
    daily_demand_std: float
    lead_days: int
    unit_price: float
    holding_cost_rate: float
    service_level: float = 0.95

class SimulationResponseSchema(BaseModel):
    daily_demand_mean: float
    daily_demand_std: float
    lead_days: int
    lead_time_demand: float
    safety_stock_units: int
    reorder_point_units: int
    annual_holding_cost: float
    naive_holding_cost: float
    holding_cost_savings: float
