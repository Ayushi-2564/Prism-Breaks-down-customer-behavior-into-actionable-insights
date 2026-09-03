"""
Relational Schema for Inventory & Sales Database.
"""

from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from backend.app.db.session import Base

class StoreItemInventory(Base):
    __tablename__ = "store_item_inventory"

    id = Column(Integer, primary_key=True, index=True)
    store = Column(Integer, index=True)
    store_name = Column(String)
    item = Column(Integer, index=True)
    item_name = Column(String)
    category = Column(String, index=True)
    unit_price = Column(Float)
    lead_days = Column(Integer)
    holding_cost_rate = Column(Float)
    
    # Precomputed Inventory Strategy
    daily_demand_mean = Column(Float)
    daily_demand_std = Column(Float)
    safety_stock_units = Column(Integer)
    reorder_point_units = Column(Integer)
    annual_holding_cost = Column(Float)
    holding_cost_savings = Column(Float)
    stockout_risk_level = Column(String) # HIGH, MEDIUM, LOW
