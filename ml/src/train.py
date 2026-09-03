"""
Model Training and Comparison Pipeline for Customer Churn & LTV Prediction.
Trains Baseline (Logistic Regression), Random Forest, and XGBoost with full metric logging.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor

from ml.data.generate_dataset import generate_customer_dataset
from ml.src.preprocessing import prepare_data, get_transformed_feature_names
from ml.src.evaluate import evaluate_classification_model, evaluate_regression_model
from ml.src.explain import ChurnExplainer

def run_training_pipeline(dataset_path: str = "ml/data/customer_churn_dataset.csv", output_dir: str = "ml/models"):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("ml/data", exist_ok=True)
    
    print("[1/6] Loading & generating customer dataset...")
    if not os.path.exists(dataset_path):
        df = generate_customer_dataset(n_samples=3500, random_seed=42)
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)
        
    print(f"Dataset loaded: {len(df)} rows, {df['churn'].mean():.2%} base churn rate.")
    
    print("[2/6] Performing feature engineering & train-test split...")
    X_train_raw, X_test_raw, y_c_train, y_c_test, y_l_train, y_l_test, preprocessor = prepare_data(df)
    
    X_train_trans = preprocessor.transform(X_train_raw)
    X_test_trans = preprocessor.transform(X_test_raw)
    feature_names = get_transformed_feature_names(preprocessor)
    
    # Calculate class balance ratio for scale_pos_weight
    neg_count = (y_c_train == 0).sum()
    pos_count = (y_c_train == 1).sum()
    scale_pos_weight = float(neg_count / max(1, pos_count))
    
    print(f"[3/6] Training & comparing Churn Classification Models (Scale pos weight: {scale_pos_weight:.2f})...")
    
    models_churn = {
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=8, class_weight="balanced", random_state=42),
        "XGBoost Classifier": XGBClassifier(
            n_estimators=180,
            max_depth=5,
            learning_rate=0.06,
            scale_pos_weight=scale_pos_weight,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="logloss"
        )
    }
    
    churn_metrics_comparison = {}
    best_churn_model = None
    best_churn_name = None
    best_roc_auc = -1.0
    
    for name, model in models_churn.items():
        print(f"  -> Training {name}...")
        model.fit(X_train_trans, y_c_train)
        metrics = evaluate_classification_model(model, X_test_trans, y_c_test, model_name=name)
        churn_metrics_comparison[name] = metrics
        print(f"     Accuracy: {metrics['accuracy']:.4f} | Recall: {metrics['recall']:.4f} | ROC-AUC: {metrics['roc_auc']:.4f} | F1: {metrics['f1_score']:.4f}")
        
        if metrics["roc_auc"] > best_roc_auc:
            best_roc_auc = metrics["roc_auc"]
            best_churn_model = model
            best_churn_name = name
            
    print(f"  => Best Model Selected: {best_churn_name} with ROC-AUC = {best_roc_auc:.4f}")
    
    print("[4/6] Training Customer Lifetime Value (LTV) Regressor...")
    ltv_model = GradientBoostingRegressor(
        n_estimators=160,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.85,
        random_state=42
    )
    ltv_model.fit(X_train_trans, y_l_train)
    ltv_metrics = evaluate_regression_model(ltv_model, X_test_trans, y_l_test, model_name="Gradient Boosting LTV Regressor")
    print(f"     LTV MAE: INR {ltv_metrics['mae']:,.2f} | RMSE: INR {ltv_metrics['rmse']:,.2f} | R2 Score: {ltv_metrics['r2_score']:.4f}")
    
    print("[5/6] Building SHAP Explainer & Computing Global Feature Importance...")
    # Use the XGBoost model for TreeSHAP explainability
    tree_model_for_shap = models_churn["XGBoost Classifier"]
    explainer = ChurnExplainer(tree_model_for_shap, feature_names)
    global_importance = explainer.get_global_importance(X_test_trans[:300], top_n=15)
    
    print("[6/6] Serializing models, preprocessors, and performance metadata...")
    # Save the selected primary model and the tree model
    joblib.dump(best_churn_model, os.path.join(output_dir, "churn_model.joblib"))
    joblib.dump(tree_model_for_shap, os.path.join(output_dir, "tree_churn_model.joblib"))
    joblib.dump(ltv_model, os.path.join(output_dir, "ltv_model.joblib"))
    joblib.dump(preprocessor, os.path.join(output_dir, "preprocessor.joblib"))
    
    meta = {
        "best_churn_model_name": best_churn_name,
        "feature_names": feature_names,
        "churn_metrics": churn_metrics_comparison[best_churn_name],
        "churn_comparison": churn_metrics_comparison,
        "ltv_metrics": ltv_metrics,
        "global_feature_importance": global_importance,
        "dataset_summary": {
            "total_records": len(df),
            "train_size": len(X_train_raw),
            "test_size": len(X_test_raw),
            "base_churn_rate": round(float(df["churn"].mean()), 4),
            "avg_monthly_spend": round(float(df["monthly_spend"].mean()), 2),
            "avg_actual_ltv": round(float(df["actual_ltv"].mean()), 2)
        }
    }
    
    with open(os.path.join(output_dir, "model_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
        
    print(f"\nTraining pipeline completed successfully! Artifacts saved to '{output_dir}'.")
    return meta

if __name__ == "__main__":
    run_training_pipeline()
