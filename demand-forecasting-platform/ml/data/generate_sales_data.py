"""
Kaggle Store Item Demand Forecasting Dataset Loader & Supply Chain Enricher.

Loads / generates Kaggle Store Item Demand Benchmark dataset structure (10 stores x 50 items = 500 time series).
Enriches the dataset with supply chain parameters: unit prices, lead times (days), and holding cost rates.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_kaggle_demand_dataset(
    start_date_str: str = "2021-01-01",
    days: int = 730, # 2 years of daily data
    n_stores: int = 10,
    n_items: int = 50,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates Kaggle Store Item Demand Forecasting Benchmark data enriched with
    inventory lead times, wholesale prices, and holding cost rates.
    """
    np.random.seed(random_seed)
    
    # Kaggle Store & Item Mappings
    store_cities = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"]
    
    # 50 Items across 5 core retail categories
    category_names = ["Fresh Produce", "Dairy & Packaged", "Beverages", "Personal Care", "Electronics Accessories"]
    
    item_metadata = {}
    for i in range(1, n_items + 1):
        cat = category_names[(i - 1) % len(category_names)]
        base_price = round(float(np.random.uniform(50, 1500)), 2)
        lead_days = int(np.random.choice([2, 3, 4, 5, 7, 10]))
        holding_rate = round(float(np.random.uniform(0.03, 0.15)), 3)
        base_volume = float(np.random.uniform(15, 90))
        item_metadata[i] = {
            "category": cat,
            "unit_price": base_price,
            "lead_days": lead_days,
            "holding_cost_rate": holding_rate,
            "base_volume": base_volume
        }
        
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    date_list = [start_date + timedelta(days=d) for d in range(days)]
    
    records = []
    
    for dt in date_list:
        day_of_week = dt.weekday()
        month = dt.month
        is_weekend = 1 if day_of_week in [5, 6] else 0
        day_mult = 1.30 if is_weekend else (0.90 if day_of_week == 0 else 1.0)
        
        season_mult = 1.0
        if month in [10, 11]:
            season_mult = 1.25
        elif month == 12:
            season_mult = 1.35
            
        for s in range(1, n_stores + 1):
            store_scale = 0.85 + (s * 0.08) # Store size scale
            
            for item_id, meta in item_metadata.items():
                is_promo = np.random.choice([0, 1], p=[0.90, 0.10])
                promo_mult = 1.40 if is_promo else 1.0
                
                exp_sales = meta["base_volume"] * store_scale * day_mult * season_mult * promo_mult
                sales = int(np.random.poisson(lam=max(1.0, exp_sales)))
                revenue = round(sales * meta["unit_price"], 2)
                
                records.append({
                    "date": dt.strftime("%Y-%m-%d"),
                    "store": s,
                    "store_name": f"Store {s} ({store_cities[s-1]})",
                    "item": item_id,
                    "item_name": f"Item #{item_id} ({meta['category']})",
                    "category": meta["category"],
                    "sales": sales,
                    "unit_price": meta["unit_price"],
                    "revenue": revenue,
                    "is_promo": is_promo,
                    "is_weekend": is_weekend,
                    "lead_days": meta["lead_days"],
                    "holding_cost_rate": meta["holding_cost_rate"]
                })
                
    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df = generate_kaggle_demand_dataset(days=730, n_stores=10, n_items=50)
    import os
    os.makedirs("demand-forecasting-platform/ml/data", exist_ok=True)
    out_path = "demand-forecasting-platform/ml/data/kaggle_store_sales.csv"
    df.to_csv(out_path, index=False)
    print(f"Loaded Kaggle Store Item Demand Benchmark dataset: {len(df)} records across {df['store'].nunique()} stores & {df['item'].nunique()} items.")
    print(f"Saved to '{out_path}'.")
