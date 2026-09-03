"""
Pytest Test Suite for Demand Forecasting & Inventory ML Pipeline.
"""

import os
import pytest
import numpy as np
import pandas as pd

from ml.data.generate_sales_data import generate_kaggle_demand_dataset
from ml.src.feature_engineering import create_time_series_features, FEATURE_COLUMNS
from ml.src.inventory_engine import calculate_wape, calculate_inventory_metrics
from ml.src.time_series_analysis import run_adf_test

def test_generate_kaggle_dataset():
    df = generate_kaggle_demand_dataset(days=30, n_stores=2, n_items=5)
    assert len(df) == 30 * 2 * 5
    assert 'sales' in df.columns
    assert 'lead_days' in df.columns
    assert df['sales'].min() >= 0

def test_feature_engineering_lags():
    df_raw = generate_kaggle_demand_dataset(days=40, n_stores=1, n_items=1)
    df_feat = create_time_series_features(df_raw)
    
    for col in FEATURE_COLUMNS:
        assert col in df_feat.columns
    assert not df_feat[FEATURE_COLUMNS].isna().any().any()

def test_wape_calculation():
    y_true = np.array([100, 200, 300])
    y_pred = np.array([110, 190, 300])
    # Total error = 10 + 10 + 0 = 20. Total actual = 600. WAPE = 20 / 600 = 3.33%
    wape = calculate_wape(y_true, y_pred)
    assert pytest.approx(wape, 0.1) == 3.33

def test_inventory_metrics():
    metrics = calculate_inventory_metrics(
        daily_demand_mean=50.0,
        daily_demand_std=10.0,
        lead_days=4,
        unit_price=200.0,
        holding_cost_rate=0.10
    )
    assert metrics["lead_time_demand"] == 200.0
    assert metrics["safety_stock_units"] > 0
    assert metrics["reorder_point_units"] > metrics["lead_time_demand"]
    assert metrics["holding_cost_savings"] > 0

def test_adf_stationarity_test():
    series = pd.Series(np.random.normal(loc=100, scale=5, size=100))
    res = run_adf_test(series)
    assert "p_value" in res
    assert "is_stationary" in res
