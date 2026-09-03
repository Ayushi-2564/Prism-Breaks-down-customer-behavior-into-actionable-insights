"""
Database Seeder for Multi-Store Inventory Platform.
"""

import os
import pandas as pd
from sqlalchemy.orm import Session

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.inventory import StoreItemInventory
from backend.app.core.config import settings
from ml.src.inventory_engine import calculate_inventory_metrics

def seed_inventory_database(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        count = db.query(StoreItemInventory).count()
        if count > 0 and not force:
            print(f"Database already populated with {count} store-item inventory records. Skipping seed.")
            return
            
        if force:
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            
        print(f"Loading sales dataset from '{settings.DATASET_PATH}'...")
        if not os.path.exists(settings.DATASET_PATH):
            from ml.data.generate_sales_data import generate_kaggle_demand_dataset
            df = generate_kaggle_demand_dataset(days=730, n_stores=10, n_items=50)
            os.makedirs(os.path.dirname(settings.DATASET_PATH), exist_ok=True)
            df.to_csv(settings.DATASET_PATH, index=False)
        else:
            df = pd.read_csv(settings.DATASET_PATH)
            
        print("Computing store-item inventory strategies & reorder points...")
        
        # Group by store and item
        grouped = df.groupby(['store', 'item'])
        inventory_records = []
        
        for (store_id, item_id), group in grouped:
            first_row = group.iloc[0]
            daily_mean = float(group['sales'].mean())
            daily_std = float(group['sales'].std())
            lead_days = int(first_row['lead_days'])
            unit_price = float(first_row['unit_price'])
            holding_rate = float(first_row['holding_cost_rate'])
            
            inv_metrics = calculate_inventory_metrics(
                daily_demand_mean=daily_mean,
                daily_demand_std=daily_std,
                lead_days=lead_days,
                unit_price=unit_price,
                holding_cost_rate=holding_rate,
                service_level_z=1.65 # 95% service level
            )
            
            # Stockout risk tier
            stockout_risk = "HIGH" if inv_metrics["safety_stock_units"] > 40 else ("MEDIUM" if inv_metrics["safety_stock_units"] > 20 else "LOW")
            
            record = StoreItemInventory(
                store=int(store_id),
                store_name=str(first_row['store_name']),
                item=int(item_id),
                item_name=str(first_row['item_name']),
                category=str(first_row['category']),
                unit_price=unit_price,
                lead_days=lead_days,
                holding_cost_rate=holding_rate,
                daily_demand_mean=inv_metrics["daily_demand_mean"],
                daily_demand_std=inv_metrics["daily_demand_std"],
                safety_stock_units=inv_metrics["safety_stock_units"],
                reorder_point_units=inv_metrics["reorder_point_units"],
                annual_holding_cost=inv_metrics["annual_holding_cost"],
                holding_cost_savings=inv_metrics["holding_cost_savings"],
                stockout_risk_level=stockout_risk
            )
            inventory_records.append(record)
            
        db.bulk_save_objects(inventory_records)
        db.commit()
        print(f"Successfully seeded database with {len(inventory_records)} store-item inventory records.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_inventory_database(force=True)
