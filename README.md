# Customer Intelligence Platform — Churn Prediction & Lifetime Value Analytics

An end-to-end Machine Learning web application designed to predict customer churn risk, forecast customer Lifetime Value (LTV), explain individual risk drivers using TreeSHAP, and recommend automated retention action plans for SaaS businesses.

---

##  Project Overview & Motivation

In subscription businesses (SaaS), acquiring a new customer is **4x to 6x more expensive** than retaining an existing one. However, traditional business dashboards only report churn *after* a customer has already canceled.

I built this project to create a proactive, explainable retention system that answers four key questions:
1. **Who is going to churn?** (Probabilistic classification with risk tiers: High >60%, Medium 30-60%, Low <30%)
2. **Why are they at risk?** (Game-theoretic TreeSHAP feature attributions showing exact positive and negative drivers)
3. **How much revenue is at risk?** (Estimated Revenue at Risk = Churn Probability × Predicted Lifetime Value)
4. **What action should customer success teams take?** (Dynamic retention playbooks tailored to risk score and customer value tier)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  React + Vite   │ ◄───► │  FastAPI Server │ ◄───► │ ML & TreeSHAP   │ ◄───► │ SQLite / PostgreSQL DB │
│ Analytics UI    │ REST  │ (Pydantic / DB) │ Joblib│ Inference Engine│ ORM   │ (3,500+ Customers)     │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └────────────────────────┘
```

---

##  Key Features

* **Real-time Churn Classification:** Probabilistic scoring trained with class-weighted Logistic Regression and XGBoost, calibrated for high recall on rare churn events.
* **Customer Lifetime Value (LTV) Regressor:** Gradient Boosting Regressor predicting future customer value ($R^2 = 0.987$, MAE = ₹17,436).
* **Explainable AI (TreeSHAP):** Local waterfall attributions for every customer explaining exact drivers (e.g., login inactivity, complaint spikes, billing friction).
* **Prescriptive Retention Playbooks:** Matrix matching churn risk and customer value to actionable playbooks (automated discounts, dedicated CSM check-in, feature webinars).
* **Interactive Live Sandbox / Simulator:** Allows sales and success teams to simulate hypothetical customer behavior and see instant risk scores and action items.
* **Filterable Customer Intelligence Table:** Searchable, sortable customer risk directory with one-click deep-dive diagnostic modals.

---

##  Tech Stack

### Frontend
* **React 18** + **Vite**: Single-page application with modern component architecture
* **Tailwind CSS**: Clean, responsive slate/dark modern design system
* **Recharts**: Interactive ROC-AUC curves, confusion matrices, and cohort analytics charts
* **Lucide React**: Vector icons
* **Axios**: API communication with backend

### Backend & Database
* **FastAPI**: Asynchronous Python web framework with auto-generated OpenAPI / Swagger docs
* **Uvicorn**: Lightning-fast ASGI production server
* **Pydantic v2**: Strict schema validation for requests and responses
* **SQLAlchemy & SQLite**: Relational ORM handling customer records and precomputed batch predictions

### Machine Learning & Data Science
* **Scikit-Learn**: Data preprocessing pipelines, ColumnTransformer, Scalers, Logistic Regression, Gradient Boosting
* **XGBoost**: Tree-based gradient boosting classifier
* **SHAP (TreeSHAP)**: Fast polynomial-time Shapley value calculations for local and global model explainability
* **Pandas & NumPy**: Feature engineering, behavioral velocity calculations, and matrix operations
* **Joblib**: Model serialization and caching

---

##  Machine Learning Pipeline & Design Decisions

### 1. Preventing Data Leakage
A common pitfall in churn prediction is **Observation Leakage** (using post-churn features like "cancellation reason" or "days inactive after subscription ended"). 
- All features in this pipeline are strictly computed **prior to the observation cutoff date**.
- Behavioral velocity features engineered:
  - `spend_velocity`: `(recent_monthly_spend - prev_month_spend) / prev_month_spend`
  - `tickets_per_tenure_month`: `support_tickets / (tenure_months + 1)`
  - `complaint_ratio`: `complaints / (support_tickets + 1)`
  - `inactivity_tenure_ratio`: `days_since_last_login / (tenure_months * 30.4 + 1)`
  - `friction_index`: Combines unresolved complaints, billing failures, and resolution times penalizing low CSAT.

### 2. Why Optimize for Recall & ROC-AUC?
In customer churn datasets, churn is an imbalanced minority class (~9.4%). 
- A naive model predicting "No Churn" achieves 90%+ accuracy but is useless in production.
- A **False Negative** (missing a customer who cancels) costs thousands in lost LTV.
- A **False Positive** merely triggers a low-cost engagement email or check-in.
- Therefore, the model was tuned with balanced class weights to maximize **Recall (83.3%)** and **ROC-AUC (0.8905)**.

### 3. Model Benchmark Summary

| Model Architecture | Accuracy | Precision | Recall (Churners) | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Class Weighted)** | 81.3% | 31.8% | **83.3%** | **0.456** | **0.8905** | **0.452** |
| **Random Forest Classifier** | 89.4% | 43.1% | 37.9% | 0.403 | 0.8842 | 0.438 |
| **XGBoost Classifier** | 88.6% | 40.5% | 45.5% | 0.429 | 0.8686 | 0.421 |

---

##  Project Structure

```
customer-intelligence-platform/
├── ml/
│   ├── data/
│   │   ├── generate_dataset.py       # Reproducible domain-modeled customer generator (3,500 records)
│   │   └── customer_churn_dataset.csv
│   ├── src/
│   │   ├── feature_engineering.py    # Leakage-free velocity & friction ratios
│   │   ├── preprocessing.py          # ColumnTransformer, Imputation, OneHotEncoder, Scaler
│   │   ├── train.py                  # Model training & cross-comparison
│   │   ├── evaluate.py               # Diagnostics: ROC-AUC, PR-AUC, Confusion Matrix, R², MAE
│   │   ├── explain.py                # TreeSHAP explainer for local waterfall & global importance
│   │   └── predict.py                # Fast inference engine wrapper
│   ├── models/                       # Serialized .joblib artifacts & model_metadata.json
│   └── tests/
│       └── test_ml.py                # Pytest suite for ML transformations & predictions
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # REST endpoints (/dashboard, /customers, /predict, etc.)
│   │   ├── core/
│   │   │   └── config.py             # Application settings, CORS, and paths
│   │   ├── db/
│   │   │   ├── session.py            # SQLAlchemy engine & session factory
│   │   │   └── seed.py               # Database seeder with precomputed batch ML predictions
│   │   ├── models/
│   │   │   └── customer.py           # Database schemas (Customer & Prediction tables)
│   │   ├── schemas/
│   │   │   └── customer.py           # Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── ml_service.py         # Singleton ML model service
│   │   │   └── recommendation.py     # Prescriptive retention decision engine
│   │   └── main.py                   # FastAPI ASGI entrypoint
│   ├── tests/
│   │   └── test_api.py               # API integration test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navigation & system status
│   │   │   ├── MetricCard.jsx        # KPI metric tiles
│   │   │   ├── RiskBadge.jsx         # Status and risk tier badges
│   │   │   └── CustomerModal.jsx     # Detailed customer diagnostic profile & SHAP waterfall
│   │   ├── pages/
│   │   │   ├── Overview.jsx          # Executive Dashboard & analytics charts
│   │   │   ├── Customers.jsx         # Customer Risk Hub table
│   │   │   ├── ModelPerformance.jsx  # Technical ML Evaluation & SHAP summary
│   │   │   └── PredictLive.jsx       # Live Real-time Simulator
│   │   ├── services/
│   │   │   └── api.js                # Axios client
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

##  Quick Start & Installation

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm

### 1. Start Backend Server (Terminal 1)
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server (starts on http://localhost:8000)
python -m backend.app.main
```

### 2. Start Frontend App (Terminal 2)
```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)** to view the platform.

---

##  Running Automated Tests

```bash
# Run all unit and integration tests
python -m pytest
```

---


## 📄 License
This project is licensed under the MIT License - open for academic and professional demonstration.
