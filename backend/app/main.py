"""FastAPI service for late classification and profit regression."""

import os
import warnings
from datetime import date
from typing import Any, List, Literal

import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost
from xgboost import XGBClassifier, XGBRegressor

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field


BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# REG_REPO = os.getenv("REG_REPO", "ardiiw/regression_superstore")
# CLF_REPO = os.getenv("CLF_REPO", REG_REPO)


# MODEL LOADING

def get_model_path(filename: str) -> str:
    return os.path.join(BASE, "models", filename)


def load_classifier():
    model_path = get_model_path("xgb_late_classifier.json")
    meta_path = get_model_path("xgb_late_classifier_meta.pkl")
    
    model = XGBClassifier()
    model.load_model(model_path)
    meta = joblib.load(meta_path)
    return {"model": model, **meta}


def load_regressor():
    model_path = get_model_path("xgb_profit_regressor.json")
    meta_path = get_model_path("xgb_profit_regressor_meta.pkl")
    
    model = XGBRegressor()
    model.load_model(model_path)
    meta = joblib.load(meta_path)
    return {"model": model, **meta}


def try_load():
    clf, reg, clf_error, reg_error = None, None, None, None
    try:
        clf = load_classifier()
    except Exception as exc:
        clf_error = f"{type(exc).__name__}: {exc}"
    try:
        reg = load_regressor()
    except Exception as exc:
        reg_error = f"{type(exc).__name__}: {exc}"
    return clf, clf_error, reg, reg_error

clf_art, clf_error, reg_art, reg_error = try_load()


# FASTAPI

ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

app = FastAPI(title="Superstore Model API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"]
)


# REQUEST / RESPONSE SCHEMAS

class RegressionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_date: date
    discount: float = Field(ge=0, le=1)
    quantity: int = Field(gt=0)
    sales: float = Field(ge=0)
    shipping_cost: float = Field(ge=0)
    sub_category: str
    region: str
    market: str
    segment: str
    ship_mode: str
    order_priority: str

class RegressionResponse(BaseModel):
    status: str
    model: str
    estimated_profit: float

class ItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quantity: int = Field(gt=0)
    sales: float = Field(ge=0)
    discount: float = Field(ge=0, le=1)
    shipping_cost: float = Field(ge=0)
    sub_category: str

class ClassificationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_date: date
    ship_mode: str
    order_priority: str
    segment: str
    region: str
    market: str
    items: List[ItemInput] = Field(min_length=1)

class ClassificationResponse(BaseModel):
    status: str
    model: str
    late_probability: float
    is_late: bool
    limit_days: int
    message: str


# ERROR HANDLING

def model_unavailable():
    return HTTPException(status_code=503, detail={"code": "model_unavailable", "message": "Prediction models are not ready"})

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": {"code": "validation_error", "message": "Invalid request", "details": exc.errors()}})

@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "request_error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


# HEALTH & META

@app.get("/health")
def health():
    ready = clf_art is not None and reg_art is not None
    result = {
        "status": "ok" if ready else "degraded",
        "models": {"classifier": clf_art is not None, "regressor": reg_art is not None}
    }
    if not ready and os.getenv("EXPOSE_MODEL_ERRORS", "false").lower() == "true":
        result["errors"] = {"classifier": clf_error, "regressor": reg_error}
    if not ready:
        return JSONResponse(status_code=503, content=result)
    return result

@app.get("/meta")
def meta():
    if clf_art is None:
        raise model_unavailable()
    enc = clf_art["encoder"]
    cats = {c: list(map(str, v)) for c, v in zip(clf_art["cat_cols"], enc.categories_)}
    return {
        "categories": cats,
        "target": clf_art.get("target"),
        "threshold_default": clf_art.get("threshold", 0.5)
    }


# PREDICTION

@app.post("/api/predict/regression", response_model=RegressionResponse)
def predict_regression(req: RegressionInput):
    if reg_art is None:
        raise model_unavailable()
        
    df = pd.DataFrame([req.model_dump()])
    df["order_date"] = pd.to_datetime(df["order_date"])
    df["discount_x_quantity"] = df["discount"] * df["quantity"]
    df["sales_per_unit"] = df["sales"] / df["quantity"]
    df["order_month"] = df["order_date"].dt.month
    df["order_quarter"] = df["order_date"].dt.quarter
    df["order_dayofweek"] = df["order_date"].dt.dayofweek
    
    ohe = reg_art["preprocessor"].named_transformers_["cat"]
    for col, known in zip(ohe.feature_names_in_, ohe.categories_):
        unknown = set(df[col]) - set(known)
        if unknown:
            raise HTTPException(status_code=422, detail={
                "code": "unknown_category",
                "message": f"Unknown value(s) for '{col}'",
                "field": col,
                "values": sorted(map(str, unknown))
            })

    try:
        X_reg = reg_art["preprocessor"].transform(df[reg_art["feature_cols"]])
    except Exception as e:
        raise HTTPException(status_code=422, detail={"code": "processing_error", "message": str(e)})

    profit = reg_art["model"].predict(X_reg)[0]
    
    return RegressionResponse(
        status="success",
        model="regression",
        estimated_profit=round(float(profit), 2)
    )


@app.post("/api/predict/classification", response_model=ClassificationResponse)
def predict_classification(req: ClassificationInput):
    if clf_art is None:
        raise model_unavailable()
        
    df_items = pd.DataFrame([item.model_dump() for item in req.items])
    order_date = pd.to_datetime(req.order_date)
    
    df_new = pd.DataFrame([{
        "ship_mode": req.ship_mode,
        "order_priority": req.order_priority,
        "segment": req.segment,
        "region": req.region,
        "market": req.market,
        "n_items": len(df_items),
        "total_quantity": df_items["quantity"].sum(),
        "total_sales": df_items["sales"].sum(),
        "avg_discount": df_items["discount"].mean(),
        "total_shipping_cost": df_items["shipping_cost"].sum(),
        "n_sub_categories": df_items["sub_category"].nunique(),
        "order_month": order_date.month,
        "order_quarter": order_date.quarter,
        "order_dayofweek": order_date.dayofweek,
    }])
    
    enc = clf_art["encoder"]
    for col, known in zip(clf_art["cat_cols"], enc.categories_):
        unknown = set(df_new[col]) - set(known)
        if unknown:
            raise HTTPException(status_code=422, detail={
                "code": "unknown_category",
                "message": f"Unknown value(s) for '{col}'",
                "field": col,
                "values": sorted(map(str, unknown))
            })
            
    X_clf = np.hstack([
        enc.transform(df_new[clf_art["cat_cols"]]),
        df_new[clf_art["num_cols"]].values
    ])
    
    proba_late = clf_art["model"].predict_proba(X_clf)[:, 1][0]
    threshold = clf_art.get("threshold", 0.5)
    
    late_days_limit = clf_art.get("late_days_limit", {})
    batas = late_days_limit.get(req.ship_mode, 0)
    
    is_late = bool(proba_late >= threshold)
    msg = "WARNING: This order is predicted to be LATE. Consider a faster ship_mode or prioritize its processing." if is_late else "SAFE STATUS: This order is predicted to be ON TIME."
    
    return ClassificationResponse(
        status="success",
        model="classification",
        late_probability=round(float(proba_late), 4),
        is_late=is_late,
        limit_days=int(batas),
        message=msg
    )
