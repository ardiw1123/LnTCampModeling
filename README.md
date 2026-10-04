# Superstore Analytics & Prediction

A capstone project for LnT Camp that turns the Global Superstore dataset into an interactive dashboard and two practical prediction tools. The dashboard helps reviewers explore sales, profit, customers, geography, and fulfillment patterns; the prediction view estimates profit for a prospective item and the risk that an order will ship late.

**Live dashboard:** https://lntcampmodeling.vercel.app/  
**Model API:** https://backend-superstore.kubeletto.app/  
**Model API documentation:** https://backend-superstore.kubeletto.app/docs

## The problem

A transaction dataset can tell a retailer what happened, but answering day-to-day questions still takes work: Which markets contribute profit? How do discounts and product categories affect margins? Where are orders concentrated? Which shipping choices may put an order at risk of being late?

Looking at rows in isolation also separates historical analysis from decisions about a new order. This project brings both into one interface. Historical data provides context, while trained models let a user test a prospective order before making a decision. The predictions are estimates, not guarantees or a replacement for operational judgment.

## What the project does

- **Business overview.** KPI cards summarize orders, sales, profit, and margin alongside customer segments, order priorities, and shipping modes.
- **Exploration.** Browse and search paginated orders, products, customers, and locations. Date and country filters carry through the dashboard.
- **Geographic analysis.** Explore country-level activity on an interactive map and inspect location-specific statistics.
- **Trends and breakdowns.** Compare monthly performance, category sales, market profit, top subcategories, and regional results.
- **Profit estimation.** Enter a proposed item's order date, discount, quantity, sales, shipping cost, product subcategory, and business/shipping context to estimate its profit.
- **Late-shipment risk.** Enter an order and its items to receive a late-delivery probability, a risk classification, and the shipping-mode day limit used for interpretation.

The profit model works at the item level; the late-shipment model works at the order level and aggregates item information such as total sales, quantity, average discount, and shipping cost. Both models use XGBoost. The latter applies a stored classification threshold to its probability; it does not predict an exact delivery date.

## How it works

```text
Global Superstore data (SQLite)
          |
          v
Read-only analytics API (FastAPI) ───> Next.js dashboard on Vercel
                                          |
User-entered order/item details ───────> Prediction view
                                          |
                                          v
                              External FastAPI model service
                                          |
                              XGBoost classifier + regressor
```

The analytics service queries a bundled, read-only SQLite database and returns filtered aggregates and exploration records. The Next.js application renders these results as cards, charts, tables, and an interactive map. Its prediction view calls a separate FastAPI service, which validates inputs, reconstructs the training-time features, loads the saved model artifacts, and returns inference results. Keeping the analytics and inference services separate makes their responsibilities clear: one serves historical data; the other scores new scenarios.

The dataset is used as part of the LnT Camp capstone project. The repository contains the SQLite database used by the analytics service and a modeling notebook under `Notebook/`; the prediction service loads committed model and preprocessing artifacts from `backend/models/`. This README does not claim a dataset license or model performance figures that have not been supplied for the project.

## Technology

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, and Lucide icons.
- **Analytics API:** Python, FastAPI, and SQLite in read-only mode.
- **Prediction API:** Python, FastAPI, Pydantic, pandas, NumPy, scikit-learn, joblib, and XGBoost 3.0.2.
- **Modeling:** Jupyter notebook with XGBoost regression and classification workflows.
- **Deployment:** Vercel hosts the Next.js frontend and analytics service; the model inference API is hosted separately at the URL above. The repository includes a Dockerfile for the model service.

## Deployment and service boundaries

The repository's `vercel.json` maps the frontend and analytics service into the Vercel deployment. Dashboard requests to `/analytics-api/*` reach the analytics API, backed by `analytics/data/superstore.sqlite`. The source database also lives in `data/`, and `analytics/build_data.py` copies it into the analytics service for deployment.

The model service is **not** part of that Vercel service configuration. It runs at `https://backend-superstore.kubeletto.app/`; the frontend's prediction client uses `/prediction-api/*` when a proxy route is configured and can fall back to a configured `NEXT_PUBLIC_PREDICTION_API_URL` (or `NEXT_PUBLIC_API_URL`). A working dashboard therefore does not, by itself, prove that model inference is available: the separate model service must also be reachable and correctly connected to the frontend.

Useful service paths:

- Analytics through the deployed site: [`/analytics-api/date-bounds`](https://lntcampmodeling.vercel.app/analytics-api/date-bounds) and [`/analytics-api/dashboard-summary`](https://lntcampmodeling.vercel.app/analytics-api/dashboard-summary).
- Model service: [`/health`](https://backend-superstore.kubeletto.app/health), [`/meta`](https://backend-superstore.kubeletto.app/meta), and the two prediction endpoints `POST /api/predict/regression` and `POST /api/predict/classification`.

## Repository layout

```text
.
├── Notebook/          # Exploratory modeling and training notebook
├── analytics/         # Read-only FastAPI analytics service and packaged SQLite data
├── backend/           # FastAPI inference service, saved models, and Dockerfile
├── data/              # Source SQLite database used by analytics
├── frontend/          # Next.js dashboard and prediction interface
└── vercel.json        # Frontend/analytics routing for Vercel
```

## Scope and interpretation

This is a capstone decision-support application built around the supplied Superstore dataset. Dashboard figures describe the data in the SQLite snapshot, not live retail transactions. Prediction results depend on the trained models, their categorical inputs, and the scenario supplied by the user. Treat a high late-risk probability or a low estimated profit as a signal to investigate an order, not as a certain outcome.
