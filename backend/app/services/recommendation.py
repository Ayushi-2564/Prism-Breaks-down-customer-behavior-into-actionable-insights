"""
Prescriptive Retention Recommendation Engine.
Maps Customer Risk, Predicted LTV, Segment, and SHAP drivers into actionable business workflows.
"""

from typing import Dict, Any, List
from backend.app.schemas.customer import RecommendationResponse, RetentionActionItem

def compute_customer_segment(churn_prob: float, predicted_ltv: float, tenure_months: int, days_since_last_login: int) -> str:
    """Classifies customer into business segment based on behavioral & financial state."""
    is_high_value = predicted_ltv >= 100000 or (tenure_months > 12 and predicted_ltv >= 75000)
    is_high_risk = churn_prob >= 0.55
    is_moderate_risk = 0.30 <= churn_prob < 0.55
    
    if tenure_months <= 2:
        return "New / Onboarding"
    elif is_high_risk and is_high_value:
        return "At-Risk High Value"
    elif is_high_risk and not is_high_value:
        return "At-Risk Standard"
    elif is_moderate_risk and is_high_value:
        return "Nurture Priority"
    elif not is_high_risk and is_high_value:
        return "Champions & VIPs"
    elif days_since_last_login > 25:
        return "Dormant Accounts"
    else:
        return "Loyal Active"

def generate_retention_recommendation(
    customer_id: str,
    customer_name: str,
    churn_prob: float,
    predicted_ltv: float,
    revenue_at_risk: float,
    customer_data: Dict[str, Any],
    top_risk_drivers: List[Dict[str, Any]] = None
) -> RecommendationResponse:
    """
    Generates tailored, prescriptive retention action plans with specific timelines, channels, and rationale.
    """
    tenure = customer_data.get("tenure_months", 12)
    days_inactive = customer_data.get("days_since_last_login", 0)
    complaints = customer_data.get("complaints", 0)
    csat = customer_data.get("customer_satisfaction_score", 4)
    plan = customer_data.get("subscription_plan", "Standard")
    payment_failures = customer_data.get("payment_failures_last_3m", 0)
    
    segment = compute_customer_segment(churn_prob, predicted_ltv, tenure, days_inactive)
    
    # 1. High Risk + High LTV (Priority 1: Urgent Human Intervention)
    if churn_prob >= 0.50 and predicted_ltv >= 80000:
        tier = "Priority Retention"
        title = "Executive & Dedicated Success Intervention"
        summary = f"Customer represents INR {revenue_at_risk:,.2f} in revenue at risk. High churn probability ({churn_prob*100:.1f}%) requires immediate high-touch relationship rescue."
        
        rationale = [
            f"High enterprise revenue exposure with predicted LTV of INR {predicted_ltv:,.2f}.",
            f"Customer exhibits elevated churn risk ({churn_prob*100:.1f}%) requiring direct relationship intervention.",
            f"Account health indicates operational friction (CSAT: {csat}/5, Inactive: {days_inactive} days)."
        ]
        
        action_plan = [
            RetentionActionItem(
                action="Assign Senior Customer Success Manager for 1-on-1 discovery call",
                channel="Phone / Direct Video Call",
                timeline="Within 24 Hours",
                impact="High Touch — Prevents immediate contract cancellation"
            ),
            RetentionActionItem(
                action="Review open support tickets & issue priority SLA resolution concession",
                channel="Support Portal / Email",
                timeline="Within 48 Hours",
                impact="Restores service confidence and addresses product roadblocks"
            ),
            RetentionActionItem(
                action="Offer customized annual renewal package with 15% incentive credit",
                channel="Account Review Meeting",
                timeline="Within 7 Days",
                impact="Secures long-term contract lock-in and reduces churn probability"
            )
        ]
        
    # 2. High Risk + Low/Mid LTV (Automated Scaling Retention)
    elif churn_prob >= 0.50:
        tier = "Automated Retention"
        title = "Automated Win-Back & Product Education Drip"
        summary = f"Customer churn probability is {churn_prob*100:.1f}%. Apply scalable automated email and in-app incentives to reignite product engagement."
        
        rationale = [
            f"Elevated churn likelihood with estimated LTV of INR {predicted_ltv:,.2f}.",
            f"Inactivity of {days_inactive} days and recent engagement decline require re-activation nudges."
        ]
        
        action_plan = [
            RetentionActionItem(
                action="Trigger personalized 'We Miss You' email flow with quick-start tutorial",
                channel="Automated Email Drip",
                timeline="Immediate (Day 1)",
                impact="Re-engages inactive users and highlights unused features"
            ),
            RetentionActionItem(
                action="Deliver 25% renewal discount code valid for 14 days",
                channel="In-App Modal / Push Notification",
                timeline="Day 3",
                impact="Reduces price sensitivity barrier"
            ),
            RetentionActionItem(
                action="Provide interactive product walkthrough and feature adoption guide",
                channel="In-App Guided Tour",
                timeline="Upon Next Login",
                impact="Boosts stickiness across core workflow modules"
            )
        ]
        
    # 3. Low Risk + High LTV (Account Expansion & Upsell)
    elif churn_prob < 0.30 and predicted_ltv >= 100000:
        tier = "Relationship Expansion"
        title = "VIP Account Nurturing & Expansion Campaign"
        summary = f"Healthy, highly engaged customer with INR {predicted_ltv:,.2f} predicted LTV. Excellent candidate for annual contract upsell and advocacy."
        
        rationale = [
            f"Stable low churn probability ({churn_prob*100:.1f}%) and strong account tenure ({tenure} months).",
            "High satisfaction and consistent usage indicate readiness for upgraded enterprise capabilities."
        ]
        
        action_plan = [
            RetentionActionItem(
                action="Invite to Executive Advisory Board & Early Feature Beta Access",
                channel="Personal Email from Product Lead",
                timeline="This Quarter",
                impact="Deepens loyalty and product co-creation engagement"
            ),
            RetentionActionItem(
                action="Present Enterprise Add-on Tier / Multi-seat upgrade proposal",
                channel="Quarterly Business Review (QBR)",
                timeline="Next Month",
                impact="Increases Net Revenue Retention (NRR) by 20-35%"
            )
        ]
        
    # 4. Standard / Moderate (Ongoing Engagement)
    else:
        tier = "Standard Engagement"
        title = "Continuous Engagement & Feature Adoption Cycle"
        summary = f"Stable customer account with {churn_prob*100:.1f}% churn risk. Maintain routine value delivery and proactive check-ins."
        
        rationale = [
            f"Moderate risk baseline with INR {predicted_ltv:,.2f} expected value.",
            "Proactive feature adoption campaigns sustain healthy usage habits."
        ]
        
        action_plan = [
            RetentionActionItem(
                action="Deliver monthly product digest featuring newly released tools",
                channel="Product Newsletter",
                timeline="Bi-weekly",
                impact="Maintains steady product awareness and feature discovery"
            ),
            RetentionActionItem(
                action="Send CSAT pulse check survey after ticket resolution",
                channel="In-App Feedback Widget",
                timeline="Post-Interaction",
                impact="Catches emerging friction before it escalates to churn"
            )
        ]
        
    # Contextual add-on if payment issues exist
    if payment_failures > 0:
        action_plan.insert(0, RetentionActionItem(
            action=f"Urgent: Resolve {payment_failures} failed billing attempt(s) via automated dunning flow",
            channel="SMS & Billing Alert",
            timeline="Immediate",
            impact="Prevents involuntary churn caused by expired card/failed invoice"
        ))
        
    # Contextual add-on if complaints are open
    if complaints > 0 and tier != "Priority Retention":
        action_plan.insert(0, RetentionActionItem(
            action=f"Prioritize resolution of {complaints} unresolved customer complaint(s)",
            channel="Support Desk Ticket",
            timeline="Within 24 Hours",
            impact="Directly lowers churn friction"
        ))

    return RecommendationResponse(
        customer_id=customer_id,
        customer_name=customer_name,
        segment=segment,
        risk_level="HIGH" if churn_prob >= 0.55 else ("MEDIUM" if churn_prob >= 0.30 else "LOW"),
        churn_probability=round(churn_prob, 4),
        predicted_ltv=round(predicted_ltv, 2),
        revenue_at_risk=round(revenue_at_risk, 2),
        strategy_tier=tier,
        recommendation_title=title,
        recommendation_summary=summary,
        rationale=rationale,
        action_plan=action_plan
    )
