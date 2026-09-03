"""
SHAP Explainability Engine for Churn Prediction.
Provides exact mathematical local explanations (TreeSHAP) and global feature importance.
"""

import numpy as np
import pandas as pd
import shap
from typing import Dict, List, Any

# Domain-specific human-readable templates for SHAP features
FEATURE_EXPLANATIONS = {
    "days_since_last_login": {
        "pos": "Customer has been inactive for {val:.0f} days.",
        "neg": "Customer was recently active within {val:.0f} days."
    },
    "usage_change_30d_pct": {
        "pos": "Product usage dropped by {val:.1f}% over the last 30 days.",
        "neg": "Product usage grew by +{val:.1f}% over the last 30 days."
    },
    "complaints": {
        "pos": "Customer submitted {val:.0f} unresolved complaint(s).",
        "neg": "Zero customer complaints recorded."
    },
    "payment_failures_last_3m": {
        "pos": "Experienced {val:.0f} billing/payment failure(s) recently.",
        "neg": "Smooth billing history with zero payment failures."
    },
    "customer_satisfaction_score": {
        "pos": "Low customer satisfaction rating ({val:.0f}/5).",
        "neg": "High customer satisfaction rating ({val:.0f}/5)."
    },
    "feature_usage_score": {
        "pos": "Low platform adoption (only {val:.0f}/10 features used).",
        "neg": "High feature adoption ({val:.0f}/10 core modules used)."
    },
    "tenure_months": {
        "pos": "New customer account ({val:.0f} months tenure).",
        "neg": "Established loyal account ({val:.0f} months tenure)."
    },
    "marketing_emails_opened_pct": {
        "pos": "Low email responsiveness ({val:.0f}% open rate).",
        "neg": "High engagement with product updates ({val:.0f}% open rate)."
    },
    "monthly_spend": {
        "pos": "Subscription tier spend at ₹{val:,.0f}/mo.",
        "neg": "High recurring commitment (₹{val:,.0f}/mo)."
    },
    "tickets_per_tenure_month": {
        "pos": "High frequency of support issues ({val:.2f} tickets/month).",
        "neg": "Low support friction ({val:.2f} tickets/month)."
    },
    "friction_index": {
        "pos": "Elevated customer friction score ({val:.2f}).",
        "neg": "Low friction account experience ({val:.2f})."
    }
}

class ChurnExplainer:
    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        # Initialize TreeExplainer for tree models (XGBoost / Random Forest)
        self.explainer = shap.TreeExplainer(model)
        
    def explain_instance(self, X_transformed: np.ndarray, raw_features_dict: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        """
        Computes TreeSHAP attribution for a single customer sample.
        Returns positive contributors (increasing risk) and negative contributors (reducing risk).
        """
        if X_transformed.ndim == 1:
            X_transformed = X_transformed.reshape(1, -1)
            
        shap_values = self.explainer.shap_values(X_transformed)
        
        # In multi-output or binary classification TreeSHAP
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif shap_values.ndim == 3:
            sv = shap_values[0, :, 1] if shap_values.shape[2] > 1 else shap_values[0, :, 0]
        else:
            sv = shap_values[0]
            
        expected_val = float(self.explainer.expected_value[1] if isinstance(self.explainer.expected_value, (list, np.ndarray)) else self.explainer.expected_value)
        
        impacts = []
        for name, val in zip(self.feature_names, sv):
            impacts.append({
                "feature": name,
                "shap_value": round(float(val), 4),
                "abs_shap": abs(float(val))
            })
            
        # Sort by absolute SHAP impact
        impacts.sort(key=lambda x: x["abs_shap"], reverse=True)
        
        # Categorize into increasing churn risk (+) vs reducing churn risk (-)
        increasing_risk = []
        reducing_risk = []
        
        for item in impacts:
            feat = item["feature"]
            shap_val = item["shap_value"]
            # Extract raw feature value if exists for clean description
            raw_val = raw_features_dict.get(feat, 0)
            
            desc = ""
            clean_name = feat.replace("_", " ").title()
            if feat in FEATURE_EXPLANATIONS:
                template = FEATURE_EXPLANATIONS[feat]["pos" if shap_val > 0 else "neg"]
                try:
                    desc = template.format(val=raw_val)
                except Exception:
                    desc = f"{clean_name} effect: {shap_val:+.2f}"
            else:
                desc = f"{clean_name}: {raw_val}"
                
            entry = {
                "feature": feat,
                "label": clean_name,
                "impact": shap_val,
                "description": desc,
                "raw_value": raw_val
            }
            
            if shap_val > 0:
                if len(increasing_risk) < top_k:
                    increasing_risk.append(entry)
            elif shap_val < 0:
                if len(reducing_risk) < top_k:
                    reducing_risk.append(entry)
                    
        return {
            "base_value": round(expected_val, 4),
            "increasing_churn_risk": increasing_risk,
            "reducing_churn_risk": reducing_risk,
            "all_impacts": impacts[:15]
        }
        
    def get_global_importance(self, X_transformed: np.ndarray, top_n: int = 15) -> List[Dict[str, Any]]:
        """Computes global mean |SHAP| value across a sample dataset."""
        shap_values = self.explainer.shap_values(X_transformed)
        if isinstance(shap_values, list):
            sv = np.abs(shap_values[1]).mean(axis=0)
        elif shap_values.ndim == 3:
            sv = np.abs(shap_values[:, :, 1]).mean(axis=0)
        else:
            sv = np.abs(shap_values).mean(axis=0)
            
        feature_importance = [
            {"feature": name, "label": name.replace("_", " ").title(), "importance": round(float(val), 4)}
            for name, val in zip(self.feature_names, sv)
        ]
        feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        return feature_importance[:top_n]
