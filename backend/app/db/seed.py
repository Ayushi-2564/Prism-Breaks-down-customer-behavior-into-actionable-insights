"""
Database Seeding Script.
Populates SQLite / PostgreSQL with realistic customer records and initial ML predictions.
"""

import os
import pandas as pd
from sqlalchemy.orm import Session

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.customer import Customer, Prediction
from backend.app.services.ml_service import ml_service
from backend.app.services.recommendation import compute_customer_segment, generate_retention_recommendation
from backend.app.core.config import settings

def seed_database(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        count = db.query(Customer).count()
        if count > 0 and not force:
            print(f"Database already populated with {count} customer records. Skipping seed.")
            return
            
        if force:
            print("Force flag set. Dropping old tables and re-creating schema...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            
        print(f"Loading dataset from '{settings.DATASET_PATH}'...")
        if not os.path.exists(settings.DATASET_PATH):
            from ml.data.generate_dataset import generate_customer_dataset
            df = generate_customer_dataset(n_samples=3500, random_seed=42)
            df.to_csv(settings.DATASET_PATH, index=False)
        else:
            df = pd.read_csv(settings.DATASET_PATH)
            
        print(f"Processing {len(df)} customer records through ML pipeline...")
        
        # Batch predict with ML service
        from ml.src.feature_engineering import add_engineered_features, FEATURE_COLUMNS
        df_feat = add_engineered_features(df)
        X = df_feat[FEATURE_COLUMNS]
        X_trans = ml_service.predictor.preprocessor.transform(X)
        
        churn_probs = ml_service.predictor.churn_model.predict_proba(X_trans)[:, 1]
        pred_ltvs = ml_service.predictor.ltv_model.predict(X_trans)
        
        customer_objects = []
        prediction_objects = []
        
        for idx, row in df.iterrows():
            cid = row["customer_id"]
            cp = float(churn_probs[idx])
            ltv = max(5000.0, float(pred_ltvs[idx]))
            rev_risk = round(cp * ltv, 2)
            
            risk = "HIGH" if cp >= 0.60 else ("MEDIUM" if cp >= 0.30 else "LOW")
            seg = compute_customer_segment(cp, ltv, int(row["tenure_months"]), int(row["days_since_last_login"]))
            
            rec = generate_retention_recommendation(
                customer_id=cid,
                customer_name=row["name"],
                churn_prob=cp,
                predicted_ltv=ltv,
                revenue_at_risk=rev_risk,
                customer_data=row.to_dict()
            )
            
            c_obj = Customer(
                customer_id=cid,
                name=row["name"],
                email=row["email"],
                age=int(row["age"]),
                gender=row["gender"],
                location=row["location"],
                subscription_plan=row["subscription_plan"],
                signup_date=str(row["signup_date"]),
                tenure_months=int(row["tenure_months"]),
                monthly_spend=float(row["monthly_spend"]),
                previous_month_spend=float(row["previous_month_spend"]),
                total_spend=float(row["total_spend"]),
                login_frequency_per_week=float(row["login_frequency_per_week"]),
                sessions_per_week=float(row["sessions_per_week"]),
                avg_session_duration_mins=float(row["avg_session_duration_mins"]),
                days_since_last_login=int(row["days_since_last_login"]),
                feature_usage_score=int(row["feature_usage_score"]),
                usage_change_30d_pct=float(row["usage_change_30d_pct"]),
                marketing_emails_opened_pct=float(row["marketing_emails_opened_pct"]),
                support_tickets=int(row["support_tickets"]),
                complaints=int(row["complaints"]),
                avg_resolution_time_hours=float(row["avg_resolution_time_hours"]),
                payment_failures_last_3m=int(row["payment_failures_last_3m"]),
                discount_received=int(row["discount_received"]),
                customer_satisfaction_score=int(row["customer_satisfaction_score"]),
                churn=int(row["churn"]),
                actual_ltv=float(row["actual_ltv"])
            )
            
            p_obj = Prediction(
                customer_id=cid,
                churn_probability=round(cp, 4),
                risk_level=risk,
                predicted_ltv=round(ltv, 2),
                revenue_at_risk=rev_risk,
                segment=seg,
                recommended_action_title=rec.recommendation_title,
                recommended_action_tier=rec.strategy_tier
            )
            
            customer_objects.append(c_obj)
            prediction_objects.append(p_obj)
            
        print("Bulk saving records to database...")
        db.bulk_save_objects(customer_objects)
        db.bulk_save_objects(prediction_objects)
        db.commit()
        print(f"Successfully seeded database with {len(customer_objects)} customers and ML predictions!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
