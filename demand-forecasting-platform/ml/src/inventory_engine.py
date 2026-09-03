"""
Supply Chain & Inventory Optimization Engine.

Computes Reorder Points (ROP), Safety Stock, Lead Time Demand, Stockout Risk,
and Holding Cost Savings based on demand forecasts.
"""

import numpy as np
import pandas as pd

def calculate_wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Weighted Absolute Percentage Error (WAPE).
    WAPE = sum(|y_true - y_pred|) / sum(y_true)
    """
    denom = np.sum(y_true)
    if denom == 0:
        return 0.0
    return round(float(np.sum(np.abs(y_true - y_pred)) / denom * 100.0), 2)

def calculate_inventory_metrics(
    daily_demand_mean: float,
    daily_demand_std: float,
    lead_days: int,
    unit_price: float,
    holding_cost_rate: float,
    service_level_z: float = 1.65 # 95% service level confidence
) -> dict:
    """
    Computes Safety Stock, Lead Time Demand, Reorder Point, and Holding Cost per year.
    """
    # Lead Time Demand
    lead_time_demand = daily_demand_mean * lead_days
    
    # Safety Stock = Z * sqrt(LeadTime) * DailyStd
    safety_stock = service_level_z * np.sqrt(lead_days) * daily_demand_std
    safety_stock_units = int(np.ceil(safety_stock))
    
    # Reorder Point (ROP)
    reorder_point = int(np.ceil(lead_time_demand + safety_stock_units))
    
    # Annual holding cost per unit = Unit Price * Holding Rate
    unit_annual_holding_cost = unit_price * holding_cost_rate
    annual_safety_holding_cost = round(safety_stock_units * unit_annual_holding_cost, 2)
    
    # Optimized Holding Savings vs Naive 30-day buffer strategy
    naive_buffer_units = int(daily_demand_mean * 30)
    naive_holding_cost = round(naive_buffer_units * unit_annual_holding_cost, 2)
    holding_cost_savings = max(0.0, round(naive_holding_cost - annual_safety_holding_cost, 2))
    
    return {
        "daily_demand_mean": round(daily_demand_mean, 2),
        "daily_demand_std": round(daily_demand_std, 2),
        "lead_days": lead_days,
        "lead_time_demand": round(lead_time_demand, 2),
        "safety_stock_units": safety_stock_units,
        "reorder_point_units": reorder_point,
        "unit_annual_holding_cost": round(unit_annual_holding_cost, 2),
        "annual_holding_cost": annual_safety_holding_cost,
        "naive_holding_cost": naive_holding_cost,
        "holding_cost_savings": holding_cost_savings
    }
