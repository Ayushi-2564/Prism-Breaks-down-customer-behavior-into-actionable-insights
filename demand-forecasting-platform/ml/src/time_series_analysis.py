"""
Time Series Analysis Utilities: Stationarity Tests (ADF) & Seasonal Decomposition.
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.seasonal import seasonal_decompose

def run_adf_test(series: pd.Series) -> dict:
    """
    Performs Augmented Dickey-Fuller (ADF) Test to check stationarity.
    p-value < 0.05 indicates the series is stationary.
    """
    clean_series = series.dropna()
    if len(clean_series) < 20:
        return {"error": "Series too short for ADF test"}
        
    result = adfuller(clean_series, autolag='AIC')
    p_value = float(result[1])
    is_stationary = p_value < 0.05
    
    return {
        "adf_statistic": round(float(result[0]), 4),
        "p_value": round(p_value, 4),
        "is_stationary": is_stationary,
        "critical_values": {k: round(float(v), 4) for k, v in result[4].items()},
        "interpretation": "Series is Stationary (No Unit Root)" if is_stationary else "Series is Non-Stationary (Contains Trend/Unit Root)"
    }

def decompose_time_series(df: pd.DataFrame, store_id: int = 1, item_id: int = 1, period: int = 7) -> dict:
    """
    Decomposes time series into Trend, Seasonality, and Residual components.
    """
    subset = df[(df['store'] == store_id) & (df['item'] == item_id)].sort_values('date')
    if len(subset) < period * 3:
        # Fallback to total sales
        subset = df.groupby('date')['sales'].sum().reset_index().sort_values('date')
        
    sales_series = subset.set_index('date')['sales']
    
    try:
        decomp = seasonal_decompose(sales_series, model='additive', period=period)
        return {
            "dates": sales_series.index.dt.strftime("%Y-%m-%d").tolist()[-90:], # Last 90 days for UI chart
            "actual": sales_series.tolist()[-90:],
            "trend": np.nan_to_num(decomp.trend.tolist())[-90:].round(2).tolist(),
            "seasonal": np.nan_to_num(decomp.seasonal.tolist())[-90:].round(2).tolist(),
            "residual": np.nan_to_num(decomp.resid.tolist())[-90:].round(2).tolist(),
        }
    except Exception as e:
        return {"error": f"Decomposition failed: {str(e)}"}
