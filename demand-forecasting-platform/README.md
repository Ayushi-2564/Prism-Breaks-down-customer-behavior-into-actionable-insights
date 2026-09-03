# Multi-Store Demand Forecasting & Inventory Optimization Platform

An end-to-end Machine Learning supply chain application that forecasts daily sales across 10 store locations and 50 product categories, evaluates forecast error using WAPE and RMSE, and optimizes inventory holding costs using dynamic Safety Stock and Reorder Point (ROP) thresholds.

---

## Project Motivation & Business Context

Stockouts (running out of inventory) lead to lost sales and poor customer experience, while overstocking ties up working capital and increases holding costs. Traditional inventory systems rely on static safety stock buffers that fail to account for seasonal sales surges or vendor lead-time variations.

This system addresses supply chain risk by combining gradient boosting demand forecasting with automated inventory optimization to answer four operational questions:

1. **What is the expected daily demand per store and category for the upcoming cycle?**
2. **Is the time-series sales signal stationary, seasonal, or trend-driven?**
3. **What is the optimal Reorder Point (ROP) and Safety Stock buffer to guarantee a 95% service level?**
4. **How much annual inventory holding cost can be saved compared to static buffer rules?**

```
  React + Vite          FastAPI Backend        LightGBM Forecaster       SQLite Database
  (Analytics UI)  <-->  (REST API)        <--> (Statsmodels, Lags)   <--> (SQLAlchemy ORM)
```

---

## Key Features

- **Time-Series Demand Forecasting** — Multi-store gradient boosted demand forecaster using 7-day, 14-day, and 30-day sales lags and rolling statistics.
- **WAPE & RMSE Error Metrics** — Evaluated using Weighted Absolute Percentage Error (WAPE) to handle sparse sales without mathematical division explosions.
- **Time-Series Analysis** — Augmented Dickey-Fuller (ADF) stationarity testing and additive seasonal decomposition (Trend, Seasonality, Residuals).
- **Automated Inventory Control Engine** — Computes Lead Time Demand, Safety Stock ($Z \times \sigma_{\text{leadtime}}$), Reorder Points, and Holding Cost Savings.
- **Interactive Scenario Simulator** — What-if sandbox for testing lead-time delays, demand surges, and 90%/95%/99% service levels in real time.
- **Filterable Inventory Hub** — Directory of 500 store-item pairs with reorder alerts and risk categorization.

---

## Tech Stack

### Frontend
- **React 18 + Vite** — Modern component architecture with fast HMR dev server
- **Tailwind CSS** — Clean, dark-slate responsive UI design system
- **Recharts** — Time-series forecast area charts, category bar graphs, and feature importance visualizers
- **Axios** — REST API client communication

### Backend & Database
- **FastAPI** — Asynchronous REST web framework with OpenAPI / Swagger docs
- **SQLAlchemy + SQLite** — Relational ORM storing 500 store-item inventory strategies and precomputed metrics
- **Pydantic v2** — Request and response validation schemas
- **Uvicorn** — Production ASGI web server

### Machine Learning & Time Series
- **LightGBM** — Multi-output gradient boosted decision trees for time-series forecasting
- **Statsmodels** — Augmented Dickey-Fuller (ADF) stationarity testing and seasonal decomposition
- **Scikit-Learn** — Time-series split, MAE, RMSE metrics
- **Pandas & NumPy** — Lag feature generation, rolling window statistics, matrix computations
- **Joblib** — Model serialization

---

## Machine Learning & Supply Chain Pipeline

### 1. Feature Engineering

Features are computed per (store, item) pair strictly from past observations to prevent temporal data leakage:

| Feature | Type | Description |
| :--- | :--- | :--- |
| `lag_1`, `lag_7`, `lag_14`, `lag_30` | Temporal Lags | Historical sales 1, 7, 14, and 30 days prior |
| `rolling_mean_7`, `rolling_std_7` | Moving Statistics | 7-day rolling window sales mean and standard deviation |
| `rolling_mean_30`, `rolling_std_30` | Moving Statistics | 30-day rolling window sales mean and standard deviation |
| `day_of_week`, `month`, `is_weekend` | Calendar Signals | Day of week, month, and weekend promotional indicators |

### 2. Why LightGBM with Lags Beats Classic ARIMA for Multi-Store Systems

Traditional ARIMA models require fitting a separate model for every store-item combination (500 separate models), which does not scale. Training a single unified LightGBM model with categorical encodings (`store`, `item`) and engineered lag features allows the model to learn global sales patterns across all locations simultaneously.

### 3. Model Benchmark Performance (Kaggle Store Item Demand Benchmark)

| Model | WAPE | MAE | RMSE | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **LightGBM Regressor (Lag Features)** | **8.26%** | **8.26 units** | **10.76 units** | Optimized multi-store forecast |
| **Naive Baseline (Lag-7 Repeat)** | 15.81% | 15.81 units | 19.42 units | Baseline benchmark |

*LightGBM achieved a **7.55% WAPE error reduction** compared to the naive baseline.*

---

## Inventory Mathematics & Formulas

1. **Lead Time Demand:**
   $$\text{LTD} = \text{Daily Demand Mean} \times \text{Lead Days}$$

2. **Safety Stock Buffer:**
   $$\text{Safety Stock} = Z \times \sqrt{\text{Lead Days}} \times \sigma_{\text{demand}}$$
   *(where $Z = 1.65$ for 95% service level confidence)*

3. **Reorder Point (ROP):**
   $$\text{ROP} = \text{Lead Time Demand} + \text{Safety Stock}$$

4. **Weighted Absolute Percentage Error (WAPE):**
   $$\text{WAPE} = \frac{\sum |\text{Actual} - \text{Predicted}|}{\sum \text{Actual}} \times 100$$

---

## Project Structure

```
demand-forecasting-platform/
├── ml/
│   ├── data/
│   │   ├── generate_sales_data.py   # Kaggle benchmark loader & supply chain enricher
│   │   └── kaggle_store_sales.csv   # 365,000 daily sales records across 10 stores & 50 items
│   ├── src/
│   │   ├── feature_engineering.py   # Lags, rolling window statistics
│   │   ├── time_series_analysis.py  # ADF stationarity test, seasonal decomposition
│   │   ├── train_forecaster.py      # LightGBM training & WAPE evaluation
│   │   └── inventory_engine.py      # Safety stock, ROP, WAPE math
│   ├── models/                      # Serialized .joblib model artifact & metrics.json
│   └── tests/
│       └── test_forecasting.py      # Pytest suite for ML transformation & inventory math
├── backend/
│   ├── app/
│   │   ├── api/routes.py            # REST endpoints (/dashboard, /forecast, /inventory, /simulate)
│   │   ├── core/config.py           # Configuration settings and paths
│   │   ├── db/
│   │   │   ├── session.py           # SQLAlchemy session factory
│   │   │   └── seed.py              # Precomputes store-item inventory metrics
│   │   ├── models/inventory.py      # Relational schema
│   │   ├── schemas/inventory.py     # Pydantic v2 schemas
│   │   ├── services/
│   │   │   └── forecasting_service.py # Model loader
│   │   └── main.py                  # FastAPI entrypoint
│   ├── tests/
│   │   └── test_api.py              # Integration test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, MetricCard
│   │   ├── pages/                   # Overview, InventoryPlanner, Analytics, Simulator
│   │   ├── services/api.js          # Axios API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

## Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend & ML Pipeline (Terminal 1)

```bash
cd demand-forecasting-platform

# Install Python requirements
python -m pip install -r backend/requirements.txt

# Run ML training pipeline
python -m ml.src.train_forecaster

# Seed SQLite database
python -m backend.app.db.seed

# Start FastAPI backend server
python -m backend.app.main
# Server available at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

### 2. Frontend Application (Terminal 2)

```bash
cd demand-forecasting-platform/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# Frontend available at http://localhost:5173
```

---

## Running Tests

```bash
cd demand-forecasting-platform
python -m pytest
```

10 unit and integration tests covering the ML pipeline, inventory safety stock calculations, and FastAPI REST endpoints.

---

## License

MIT License
