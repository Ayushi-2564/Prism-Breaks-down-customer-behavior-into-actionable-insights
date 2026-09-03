"""
LightGBM Demand Forecaster Model Trainer.
Trains time-series gradient boosting model on lag features & evaluates WAPE, MAE, and RMSE.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error

from ml.data.generate_sales_data import generate_kaggle_demand_dataset
from ml.src.feature_engineering import create_time_series_features, FEATURE_COLUMNS, TARGET_COLUMN
from ml.src.inventory_engine import calculate_wape, calculate_inventory_metrics
from ml.src.time_series_analysis import run_adf_test

def train_forecaster_pipeline():
    print("[1/5] Loading & preparing Kaggle Store Item Demand dataset...")
    data_path = "demand-forecasting-platform/ml/data/kaggle_store_sales.csv"
    if not os.path.exists(data_path):
        df_raw = generate_kaggle_demand_dataset(days=730)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df_raw.to_csv(data_path, index=False)
    else:
        df_raw = pd.read_csv(data_path)
        
    print(f"Dataset loaded: {len(df_raw)} records across {df_raw['store'].nunique()} stores and {df_raw['item'].nunique()} items.")
    
    print("[2/5] Engineering time-series lag & rolling features...")
    df_feat = create_time_series_features(df_raw)
    
    # 60-day Holdout Test Split
    max_date = df_feat['date'].max()
    split_date = max_date - pd.Timedelta(days=60)
    
    train_df = df_feat[df_feat['date'] <= split_date]
    test_df = df_feat[df_feat['date'] > split_date]
    
    X_train, y_train = train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN]
    X_test, y_test = test_df[FEATURE_COLUMNS], test_df[TARGET_COLUMN]
    
    print(f"Train split: {len(X_train)} samples | Test split: {len(X_test)} samples")
    
    print("[3/5] Training LightGBM Demand Forecaster...")
    lgbm = LGBMRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        num_leaves=31,
        random_state=42,
        verbosity=-1
    )
    lgbm.fit(X_train, y_train)
    
    print("[4/5] Evaluating performance diagnostics...")
    y_pred = lgbm.predict(X_test)
    y_pred = np.maximum(0, y_pred) # Sales cannot be negative
    
    wape = calculate_wape(y_test.values, y_pred)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 2)
    rmse = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2)
    
    # Naive baseline comparison (Lag 7 as prediction)
    naive_pred = test_df['lag_7'].values
    naive_wape = calculate_wape(y_test.values, naive_pred)
    
    print(f"  -> LightGBM WAPE: {wape}% (Baseline Naive WAPE: {naive_wape}%)")
    print(f"  -> MAE: {mae} units | RMSE: {rmse} units")
    
    # Global Feature Importance
    importance_df = pd.DataFrame({
        'feature': FEATURE_COLUMNS,
        'importance': lgbm.feature_importances_
    }).sort_values('importance', ascending=False)
    
    feature_importance_list = [
        {"feature": row['feature'], "importance": int(row['importance'])}
        for _, row in importance_df.iterrows()
    ]
    
    # Run ADF stationarity test on total daily sales
    total_sales_series = df_raw.groupby('date')['sales'].sum()
    adf_results = run_adf_test(total_sales_series)
    
    metrics_summary = {
        "wape": wape,
        "naive_wape": naive_wape,
        "wape_improvement_pct": round(float(naive_wape - wape), 2),
        "mae": mae,
        "rmse": rmse,
        "total_test_records": len(X_test),
        "feature_importance": feature_importance_list,
        "adf_stationarity_test": adf_results
    }
    
    print("[5/5] Serializing model artifacts to 'demand-forecasting-platform/ml/models'...")
    models_dir = "demand-forecasting-platform/ml/models"
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(lgbm, os.path.join(models_dir, "forecaster.joblib"))
    with open(os.path.join(models_dir, "metrics.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)
        
    print("Forecasting training pipeline completed successfully!")
    return metrics_summary

if __name__ == "__main__":
    train_forecaster_pipeline()
