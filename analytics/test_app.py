"""Automated tests for the Superstore Analytics API.

Run: pytest analytics/test_app.py -v
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from analytics.app import app

client = TestClient(app)


# ── Health ───────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_check(self):
        r = client.get("/")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"


# ── Meta / Filters ──────────────────────────────────────────────────────

class TestDateBounds:
    def test_returns_valid_range(self):
        r = client.get("/api/date-bounds")
        assert r.status_code == 200
        body = r.json()
        assert body["min_date"] == "2011-01-01"
        assert body["max_date"] == "2014-12-31"


class TestCountries:
    def test_returns_countries_with_counts(self):
        r = client.get("/api/countries")
        assert r.status_code == 200
        countries = r.json()
        assert len(countries) == 147
        # Spot-check: sorted alphabetically
        assert countries[0]["country"] == "Afghanistan"
        assert countries[-1]["country"] == "Zimbabwe"
        # Each has order_count > 0
        for c in countries:
            assert c["order_count"] > 0


# ── KPIs ────────────────────────────────────────────────────────────────

class TestKPI:
    def test_unfiltered_kpi(self):
        r = client.get("/api/kpi")
        assert r.status_code == 200
        kpi = r.json()
        assert kpi["total_orders"] == 25753
        assert kpi["total_items"] == 51290
        assert kpi["total_revenue"] == 12642905.0
        assert kpi["total_profit"] == 1467457.29
        assert kpi["profit_margin_pct"] > 0
        assert kpi["avg_order_value"] > 0
        assert kpi["avg_items_per_order"] > 0

    def test_filtered_by_date(self):
        r = client.get("/api/kpi", params={"date_start": "2014-01-01", "date_end": "2014-12-31"})
        assert r.status_code == 200
        kpi = r.json()
        assert 0 < kpi["total_orders"] < 25753

    def test_filtered_by_country(self):
        r = client.get("/api/kpi", params={"country": "United States"})
        assert r.status_code == 200
        kpi = r.json()
        assert 0 < kpi["total_orders"] < 25753

    def test_filtered_combined(self):
        r = client.get("/api/kpi", params={
            "date_start": "2013-01-01",
            "date_end": "2013-12-31",
            "country": ["United States", "Australia"],
        })
        assert r.status_code == 200
        kpi = r.json()
        assert kpi["total_orders"] > 0

    def test_invalid_date_range(self):
        r = client.get("/api/kpi", params={"date_start": "2014-01-01", "date_end": "2013-01-01"})
        assert r.status_code == 400
        assert "date_start" in r.json()["detail"]

    def test_invalid_date_format(self):
        r = client.get("/api/kpi", params={"date_start": "not-a-date"})
        assert r.status_code == 400

    def test_empty_result(self):
        r = client.get("/api/kpi", params={"country": "Nonexistent Country"})
        assert r.status_code == 200
        kpi = r.json()
        assert kpi["total_orders"] == 0
        assert kpi["total_revenue"] == 0


# ── Breakdowns ──────────────────────────────────────────────────────────

class TestRevenueByYear:
    def test_unfiltered(self):
        r = client.get("/api/revenue-by-year")
        assert r.status_code == 200
        data = r.json()
        years = [d["year"] for d in data]
        assert years == [2011, 2012, 2013, 2014]
        for d in data:
            assert d["revenue"] > 0

    def test_filtered(self):
        r = client.get("/api/revenue-by-year", params={"country": "France"})
        assert r.status_code == 200


class TestSalesByCategory:
    def test_returns_three_categories(self):
        r = client.get("/api/sales-by-category")
        assert r.status_code == 200
        cats = {d["category"] for d in r.json()}
        assert cats == {"Furniture", "Office Supplies", "Technology"}


class TestProfitByMarket:
    def test_returns_markets(self):
        r = client.get("/api/profit-by-market")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 5  # US, EU, APAC, LATAM, etc.


class TestTopSubcategory:
    def test_default_limit_10(self):
        r = client.get("/api/top-subcategory")
        assert r.status_code == 200
        assert len(r.json()) == 10

    def test_custom_limit(self):
        r = client.get("/api/top-subcategory", params={"limit": 5})
        assert r.status_code == 200
        assert len(r.json()) == 5


class TestOrdersByShipmode:
    def test_returns_four_modes(self):
        r = client.get("/api/orders-by-shipmode")
        assert r.status_code == 200
        modes = {d["ship_mode"] for d in r.json()}
        assert modes == {"Standard Class", "Second Class", "First Class", "Same Day"}


class TestOrdersByPriority:
    def test_returns_priorities(self):
        r = client.get("/api/orders-by-priority")
        assert r.status_code == 200
        priorities = {d["order_priority"] for d in r.json()}
        assert priorities == {"Critical", "High", "Medium", "Low"}


class TestSegmentStats:
    def test_returns_three_segments(self):
        r = client.get("/api/segment-stats")
        assert r.status_code == 200
        segs = {d["segment"] for d in r.json()}
        assert segs == {"Consumer", "Corporate", "Home Office"}


class TestRegionStats:
    def test_returns_regions(self):
        r = client.get("/api/region-stats")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 13  # 13 distinct regions


class TestMonthlyTrend:
    def test_returns_monthly_data(self):
        r = client.get("/api/monthly-trend")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 48  # 4 years × 12 months
        assert all(1 <= d["month"] <= 12 for d in data)


class TestCountryStats:
    def test_default_returns_20(self):
        r = client.get("/api/country-stats")
        assert r.status_code == 200
        assert len(r.json()) == 20

    def test_filtered_country(self):
        r = client.get("/api/country-stats", params={"country": "Japan"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["country"] == "Japan"


# ── Region Drilldown ────────────────────────────────────────────────────

class TestRegionDrilldown:
    def test_valid_region(self):
        r = client.get("/api/region-drilldown", params={"region": "West"})
        assert r.status_code == 200
        body = r.json()
        assert body["region"] == "West"
        assert len(body["top_subcategories"]) > 0
        assert len(body["segments"]) > 0
        assert len(body["trend"]) > 0
        assert len(body["top_countries"]) > 0

    def test_invalid_region(self):
        r = client.get("/api/region-drilldown", params={"region": "Atlantis"})
        assert r.status_code == 404


# ── Dashboard Summary ──────────────────────────────────────────────────

class TestDashboardSummary:
    def test_unfiltered(self):
        r = client.get("/api/dashboard-summary")
        assert r.status_code == 200
        body = r.json()
        assert body["kpi"]["total_orders"] == 25753
        assert body["date_bounds"]["min_date"] == "2011-01-01"
        assert len(body["revenue_by_year"]) == 4
        assert len(body["sales_by_category"]) == 3
        assert len(body["monthly_trend"]) == 48

    def test_filtered(self):
        r = client.get("/api/dashboard-summary", params={
            "date_start": "2014-06-01",
            "date_end": "2014-12-31",
            "country": "United States",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["kpi"]["total_orders"] > 0
        assert body["kpi"]["total_orders"] < 25753


# ── Exploration / Paginated Tables ──────────────────────────────────────

class TestPaginatedOrders:
    def test_default_page(self):
        r = client.get("/api/orders")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 51290  # item rows, not order count
        assert body["page"] == 1
        assert body["limit"] == 20
        assert len(body["data"]) == 20

    def test_search(self):
        r = client.get("/api/orders", params={"q": "United States"})
        assert r.status_code == 200
        body = r.json()
        assert body["total"] > 0


class TestPaginatedProducts:
    def test_default_page(self):
        r = client.get("/api/products")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] > 0
        assert len(body["data"]) <= 20


class TestPaginatedCustomers:
    def test_default_page(self):
        r = client.get("/api/customers")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] > 0
        assert len(body["data"]) <= 20


class TestPaginatedLocations:
    def test_default_page(self):
        r = client.get("/api/locations")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] > 0
        assert len(body["data"]) <= 20


# ── Filter consistency ──────────────────────────────────────────────────

class TestFilterConsistency:
    """Verify that the same filter applied to different endpoints
    produces coherent results (e.g., KPI totals match breakdown sums)."""

    def test_category_sales_sum_matches_kpi(self):
        params = {"date_start": "2013-01-01", "date_end": "2013-12-31"}
        kpi = client.get("/api/kpi", params=params).json()
        cats = client.get("/api/sales-by-category", params=params).json()
        cat_total = round(sum(c["sales"] for c in cats), 2)
        assert abs(kpi["total_revenue"] - cat_total) < 1.0  # rounding tolerance

    def test_year_revenue_sum_matches_kpi(self):
        kpi = client.get("/api/kpi").json()
        years = client.get("/api/revenue-by-year").json()
        year_total = round(sum(y["revenue"] for y in years), 2)
        assert abs(kpi["total_revenue"] - year_total) < 1.0
