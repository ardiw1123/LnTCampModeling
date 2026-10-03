import os
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["models"]["classifier"] is True
    assert data["models"]["regressor"] is True

def test_meta_ok():
    response = client.get("/meta")
    assert response.status_code == 200
    assert "categories" in response.json()

def test_predict_regression_success():
    payload = {
        "order_date": "2014-06-15",
        "discount": 0.7,
        "quantity": 3,
        "sales": 300,
        "shipping_cost": 20,
        "sub_category": "Tables",
        "region": "Central",
        "market": "US",
        "segment": "Consumer",
        "ship_mode": "Standard Class",
        "order_priority": "Medium"
    }
    response = client.post("/api/predict/regression", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["model"] == "regression"
    assert "estimated_profit" in data

def test_predict_classification_success():
    payload = {
        "order_date": "2024-01-15",
        "ship_mode": "Standard Class",
        "order_priority": "Medium",
        "segment": "Consumer",
        "region": "Central",
        "market": "US",
        "items": [
            {"quantity": 3, "sales": 500, "discount": 0.1, "shipping_cost": 20, "sub_category": "Binders"},
            {"quantity": 1, "sales": 150, "discount": 0.0, "shipping_cost": 8, "sub_category": "Chairs"}
        ]
    }
    response = client.post("/api/predict/classification", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["model"] == "classification"
    assert "late_probability" in data
    assert "is_late" in data
    assert "limit_days" in data

def test_predict_classification_invalid_category():
    payload = {
        "order_date": "2024-01-15",
        "ship_mode": "Standard Class",
        "order_priority": "Medium",
        "segment": "Consumer",
        "region": "Central",
        "market": "INVALID_MARKET",
        "items": [
            {"quantity": 3, "sales": 500, "discount": 0.1, "shipping_cost": 20, "sub_category": "Binders"}
        ]
    }
    response = client.post("/api/predict/classification", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "unknown_category"

@patch("app.main.clf_art", None)
def test_health_degraded_classifier():
    response = client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["models"]["classifier"] is False
    assert data["models"]["regressor"] is True

@patch("app.main.clf_art", None)
def test_predict_classification_degraded():
    payload = {
        "order_date": "2024-01-15",
        "ship_mode": "Standard Class",
        "order_priority": "Medium",
        "segment": "Consumer",
        "region": "Central",
        "market": "US",
        "items": [
            {"quantity": 3, "sales": 500, "discount": 0.1, "shipping_cost": 20, "sub_category": "Binders"}
        ]
    }
    response = client.post("/api/predict/classification", json=payload)
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "model_unavailable"
