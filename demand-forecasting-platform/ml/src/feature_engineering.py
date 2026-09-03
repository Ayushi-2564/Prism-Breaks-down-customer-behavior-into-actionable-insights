"""
Feature Engineering for Time-Series Demand Forecasting.
Computes lag features, rolling window statistics, and temporal signals without data leakage.
"""

import pandas as pd
import numpy as np

def create_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes lags, rolling statistics, and date signals for each (store, item) pair.
    """
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['store', 'item', 'date']).reset_index(drop=True)
    
    # 1. Calendar Features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['day_of_month'] = df['date'].dt.day
    df['quarter'] = df['date'].dt.quarter
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # 2. Lag Features per (store, item) group
    grouped = df.groupby(['store', 'item'])['sales']
    
    df['lag_1'] = grouped.shift(1)
    df['lag_7'] = grouped.shift(7)
    df['lag_14'] = grouped.shift(14)
    df['lag_30'] = grouped.shift(30)
    
    # 3. Rolling Window Statistics
    df['rolling_mean_7'] = grouped.transform(lambda x: x.shift(1).rolling(window=7, min_periods=1).mean())
    df['rolling_std_7'] = grouped.transform(lambda x: x.shift(1).rolling(window=7, min_periods=1).std()).fillna(0)
    df['rolling_mean_30'] = grouped.transform(lambda x: x.shift(1).rolling(window=30, min_periods=1).mean())
    df['rolling_std_30'] = grouped.transform(lambda x: x.shift(1).rolling(window=30, min_periods=1).std()).fillna(0)
    
    # Fill remaining NaNs from early lag shifts with 0 or group mean
    df = df.fillna(0)
    return df

FEATURE_COLUMNS = [
    'store', 'item', 'day_of_week', 'month', 'day_of_month', 'quarter', 'is_weekend', 'is_promo',
    'lag_1', 'lag_7', 'lag_14', 'lag_30',
    'rolling_mean_7', 'rolling_std_7', 'rolling_mean_30', 'rolling_std_30'
]
TARGET_COLUMN = 'sales'
