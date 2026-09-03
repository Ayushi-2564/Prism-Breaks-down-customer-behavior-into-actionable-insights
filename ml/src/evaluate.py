"""
Evaluation metrics module for Churn classification and LTV regression models.
Generates comprehensive production diagnostics (ROC curves, PR curves, Confusion Matrix, R2).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

def evaluate_classification_model(model, X_test, y_test, model_name: str = "Model") -> Dict[str, Any]:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
    
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    fpr, tpr, roc_thresholds = roc_curve(y_test, y_proba)
    precision_pts, recall_pts, pr_thresholds = precision_recall_curve(y_test, y_proba)
    
    # Subsample curve points for compact JSON storage
    step_roc = max(1, len(fpr) // 50)
    step_pr = max(1, len(precision_pts) // 50)
    
    roc_data = [
        {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)}
        for i in range(0, len(fpr), step_roc)
    ]
    if roc_data[-1] != {"fpr": 1.0, "tpr": 1.0}:
        roc_data.append({"fpr": 1.0, "tpr": 1.0})
        
    pr_data = [
        {"recall": round(float(recall_pts[i]), 4), "precision": round(float(precision_pts[i]), 4)}
        for i in range(0, len(precision_pts), step_pr)
    ]
    
    metrics = {
        "model_name": model_name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
        "pr_auc": round(float(average_precision_score(y_test, y_proba)), 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
            "total": int(len(y_test))
        },
        "roc_curve": roc_data,
        "pr_curve": pr_data
    }
    return metrics

def evaluate_regression_model(model, X_test, y_test, model_name: str = "LTV Model") -> Dict[str, Any]:
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    metrics = {
        "model_name": model_name,
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2_score": round(float(r2), 4),
        "mean_actual_ltv": round(float(np.mean(y_test)), 2),
        "mean_predicted_ltv": round(float(np.mean(y_pred)), 2)
    }
    return metrics
