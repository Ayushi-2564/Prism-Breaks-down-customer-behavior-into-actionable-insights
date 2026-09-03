"""
Reproducible Realistic Customer Dataset Generator for Churn & LTV Modeling.

Generates realistic B2B/SaaS customer behavioral, financial, and engagement data.
Includes strict cut-off observation windows to prevent any data leakage.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_customer_dataset(n_samples: int = 3500, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    
    first_names = [
        "Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Ananya", "Rahul", "Sneha",
        "Amit", "Pooja", "Karan", "Neha", "Arjun", "Kavya", "Siddharth", "Divya",
        "Manish", "Rhea", "Nikhil", "Tanvi", "Varun", "Isha", "Deepak", "Meera",
        "Sanjay", "Shreya", "Aditya", "Tara", "Harsh", "Simran", "Rajesh", "Swati"
    ]
    last_names = [
        "Sharma", "Verma", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Chauhan",
        "Gupta", "Singh", "Kumar", "Joshi", "Bose", "Das", "Rao", "Malhotra",
        "Kapoor", "Agarwal", "Bhatia", "Saxena", "Chopra", "Mishra", "Deshmukh", "Pandey"
    ]
    locations = [
        "Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", 
        "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"
    ]
    plans = ["Basic", "Standard", "Premium", "Enterprise"]
    plan_weights = [0.35, 0.35, 0.20, 0.10]
    
    # 1. Base Demographic & Account Information
    customer_ids = [f"CUST-{1000 + i}" for i in range(n_samples)]
    selected_first = np.random.choice(first_names, n_samples)
    selected_last = np.random.choice(last_names, n_samples)
    names = [f"{f} {l}" for f, l in zip(selected_first, selected_last)]
    emails = [f"{f.lower()}.{l.lower()}.{1000 + i}@example.com" for i, (f, l) in enumerate(zip(selected_first, selected_last))]
    ages = np.random.randint(22, 60, n_samples)
    genders = np.random.choice(["Male", "Female", "Other"], n_samples, p=[0.52, 0.46, 0.02])
    locs = np.random.choice(locations, n_samples)
    selected_plans = np.random.choice(plans, n_samples, p=plan_weights)
    
    # Base tenure in months (1 to 48 months)
    tenure_months = np.random.exponential(scale=14, size=n_samples).astype(int) + 1
    tenure_months = np.clip(tenure_months, 1, 48)
    
    # Reference date is current cutoff
    ref_date = datetime(2026, 8, 1)
    signup_dates = [
        (ref_date - timedelta(days=int(t * 30.4) + np.random.randint(0, 25))).strftime("%Y-%m-%d")
        for t in tenure_months
    ]
    
    # 2. Financial Metrics
    plan_base_spend = {
        "Basic": 1499,
        "Standard": 3999,
        "Premium": 8999,
        "Enterprise": 24999
    }
    monthly_spend = np.array([
        plan_base_spend[p] * np.random.uniform(0.9, 1.25)
        for p in selected_plans
    ]).round(2)
    
    # Previous month spend
    previous_month_spend = (monthly_spend * np.random.uniform(0.85, 1.15)).round(2)
    
    # Total spend historically
    total_spend = (monthly_spend * tenure_months * np.random.uniform(0.92, 1.05)).round(2)
    
    # 3. Behavioral & Engagement Features (Observation Window: Past 30-90 days)
    login_frequency_per_week = np.clip(np.random.normal(loc=4.2, scale=2.1, size=n_samples), 0.2, 14.0).round(1)
    sessions_per_week = np.clip(login_frequency_per_week * np.random.uniform(1.1, 2.5), 0.5, 30.0).round(1)
    avg_session_duration_mins = np.clip(np.random.normal(loc=22.0, scale=11.0, size=n_samples), 2.0, 90.0).round(1)
    
    # Days since last login (critical churn indicator)
    days_since_last_login = np.random.exponential(scale=7.5, size=n_samples).astype(int)
    days_since_last_login = np.clip(days_since_last_login, 0, 60)
    
    # Feature usage score (scale 1 to 10 core features adopted)
    feature_usage_score = np.random.randint(1, 11, n_samples)
    
    # Usage change over last 30 days (-80% to +60%)
    usage_change_30d_pct = np.clip(np.random.normal(loc=-2.0, scale=28.0, size=n_samples), -85.0, 75.0).round(1)
    
    # Marketing email engagement (% opened)
    marketing_emails_opened_pct = np.clip(np.random.normal(loc=42.0, scale=24.0, size=n_samples), 0.0, 100.0).round(1)
    
    # 4. Support & Service Quality Features
    support_tickets = np.random.poisson(lam=1.8, size=n_samples)
    complaints = np.array([
        np.random.binomial(n=t, p=0.35) if t > 0 else 0 
        for t in support_tickets
    ])
    avg_resolution_time_hours = np.clip(np.random.normal(loc=16.0, scale=12.0, size=n_samples) + complaints * 8.0, 1.0, 96.0).round(1)
    
    payment_failures_last_3m = np.random.choice([0, 1, 2, 3], n_samples, p=[0.75, 0.16, 0.07, 0.02])
    discount_received = np.random.choice([0, 1], n_samples, p=[0.68, 0.32])
    
    # Customer Satisfaction Score (CSAT 1 to 5)
    csat_base = 4.2 - (complaints * 0.7) - (payment_failures_last_3m * 0.4) + (discount_received * 0.3)
    customer_satisfaction_score = np.clip(np.round(csat_base + np.random.normal(0, 0.6, n_samples)), 1, 5).astype(int)
    
    # 5. Churn Probability Generation (Latent Logit Model with Realistic Business Dynamics)
    # High churn drivers: Inactivity, usage drops, unresolved complaints, low CSAT, payment failures, short tenure
    # Low churn drivers: High feature adoption, long tenure, enterprise plan, high email engagement
    logit = (
        - 1.5                                           # Base intercept
        + 0.075 * days_since_last_login                 # Inactivity penalty
        - 0.035 * usage_change_30d_pct                  # Usage drop increases logit
        + 0.65 * complaints                             # Complaints strongly drive churn
        + 0.45 * payment_failures_last_3m               # Billing friction
        - 0.70 * (customer_satisfaction_score - 3)      # High CSAT reduces churn
        - 0.28 * feature_usage_score                    # Feature adoption stickiness
        - 0.045 * tenure_months                         # Longer tenure loyalty
        - 0.018 * marketing_emails_opened_pct           # Engagement signal
        + np.where(discount_received == 0, 0.35, -0.1)
    )
    # Plan modifiers (Enterprise has lower churn, Basic has higher)
    plan_modifier = {"Basic": 0.30, "Standard": 0.0, "Premium": -0.40, "Enterprise": -0.90}
    logit += np.array([plan_modifier[p] for p in selected_plans])
    
    # Convert logit to probability
    churn_prob = 1.0 / (1.0 + np.exp(-logit))
    # Binary churn outcome (with noise)
    churn = (np.random.uniform(0, 1, n_samples) < churn_prob).astype(int)
    
    # 6. Expected Customer Lifetime Value (LTV) Calculation (in INR)
    # Ground truth future LTV model: estimated months remaining * projected monthly revenue * expansion factor
    expected_future_months = np.maximum(2, (1.0 - churn_prob) * 36 + np.random.normal(0, 3, n_samples))
    expansion_factor = 1.0 + (feature_usage_score / 25.0) + np.where(selected_plans == "Enterprise", 0.15, 0.0)
    actual_ltv = (monthly_spend * expected_future_months * expansion_factor + total_spend * 0.4).round(2)
    actual_ltv = np.clip(actual_ltv, 5000.0, 1200000.0)
    
    # Build DataFrame
    df = pd.DataFrame({
        "customer_id": customer_ids,
        "name": names,
        "email": emails,
        "age": ages,
        "gender": genders,
        "location": locs,
        "subscription_plan": selected_plans,
        "signup_date": signup_dates,
        "tenure_months": tenure_months,
        "monthly_spend": monthly_spend,
        "previous_month_spend": previous_month_spend,
        "total_spend": total_spend,
        "login_frequency_per_week": login_frequency_per_week,
        "sessions_per_week": sessions_per_week,
        "avg_session_duration_mins": avg_session_duration_mins,
        "days_since_last_login": days_since_last_login,
        "feature_usage_score": feature_usage_score,
        "usage_change_30d_pct": usage_change_30d_pct,
        "marketing_emails_opened_pct": marketing_emails_opened_pct,
        "support_tickets": support_tickets,
        "complaints": complaints,
        "avg_resolution_time_hours": avg_resolution_time_hours,
        "payment_failures_last_3m": payment_failures_last_3m,
        "discount_received": discount_received,
        "customer_satisfaction_score": customer_satisfaction_score,
        "churn": churn,
        "actual_ltv": actual_ltv
    })
    
    return df

if __name__ == "__main__":
    import os
    os.makedirs("ml/data", exist_ok=True)
    dataset = generate_customer_dataset(n_samples=3500, random_seed=42)
    output_path = "ml/data/customer_churn_dataset.csv"
    dataset.to_csv(output_path, index=False)
    print(f"Generated {len(dataset)} customer records saved to {output_path}")
    print(f"Overall Churn Rate: {dataset['churn'].mean():.2%}")
    print(f"Average Monthly Spend: ₹{dataset['monthly_spend'].mean():,.2f}")
    print(f"Average LTV: ₹{dataset['actual_ltv'].mean():,.2f}")
