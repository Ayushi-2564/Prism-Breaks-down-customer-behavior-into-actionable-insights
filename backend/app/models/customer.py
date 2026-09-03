"""
SQLAlchemy database models for Customers and Predictions.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    location = Column(String, index=True)
    subscription_plan = Column(String, index=True)
    signup_date = Column(String)
    
    # Financials
    tenure_months = Column(Integer, index=True)
    monthly_spend = Column(Float, nullable=False)
    previous_month_spend = Column(Float)
    total_spend = Column(Float)
    
    # Behavioral
    login_frequency_per_week = Column(Float)
    sessions_per_week = Column(Float)
    avg_session_duration_mins = Column(Float)
    days_since_last_login = Column(Integer, index=True)
    feature_usage_score = Column(Integer)
    usage_change_30d_pct = Column(Float)
    marketing_emails_opened_pct = Column(Float)
    
    # Support & Experience
    support_tickets = Column(Integer)
    complaints = Column(Integer)
    avg_resolution_time_hours = Column(Float)
    payment_failures_last_3m = Column(Integer)
    discount_received = Column(Integer)
    customer_satisfaction_score = Column(Integer)
    
    # Churn ground truth (historical)
    churn = Column(Integer, default=0)
    actual_ltv = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to latest ML Prediction
    prediction = relationship("Prediction", back_populates="customer", uselist=False, cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), unique=True, nullable=False)
    
    churn_probability = Column(Float, index=True, nullable=False)
    risk_level = Column(String, index=True, nullable=False)  # LOW, MEDIUM, HIGH
    predicted_ltv = Column(Float, index=True, nullable=False)
    revenue_at_risk = Column(Float, index=True, nullable=False)
    segment = Column(String, index=True, nullable=False)
    recommended_action_title = Column(String)
    recommended_action_tier = Column(String)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="prediction")

# Database indexes for fast querying and multi-attribute filtering
Index("idx_customer_search", Customer.name, Customer.customer_id)
Index("idx_prediction_filter", Prediction.risk_level, Prediction.segment, Prediction.churn_probability)
