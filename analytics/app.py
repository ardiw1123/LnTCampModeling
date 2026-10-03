# Superstore Analytics API – Read-Only Data Contract
#
# Independent analytics service for the Superstore dashboard.
# Reads from data/superstore.sqlite (read-only), does NOT import or
# depend on anything in backend/.
#
# Run:  uvicorn analytics.app:app --reload --port 8001

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Superstore Analytics API",
    version="1.0.0",
    description=(
        "Read-only analytics data contract for the Global Superstore dashboard. "
        "Provides filtered aggregate summaries, exploration data, date bounds "
        "and country choices backed by data/superstore.sqlite."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database helpers (read-only, no WAL writes)
# ---------------------------------------------------------------------------

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "superstore.sqlite",
)


@contextmanager
def _get_conn():
    """Yield a read-only SQLite connection with row-factory."""
    uri = f"file:{DB_PATH}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA query_only = ON")
    try:
        yield conn
    finally:
        conn.close()


def _query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with _get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]


def _query_one(sql: str, params: tuple = ()) -> dict[str, Any] | None:
    with _get_conn() as conn:
        row = conn.execute(sql, params).fetchone()
        return dict(row) if row else None


# ---------------------------------------------------------------------------
# Shared filter builder
# ---------------------------------------------------------------------------

def _parse_date(value: str | None, label: str) -> str | None:
    """Validate and normalise a date string to YYYY-MM-DD."""
    if value is None:
        return None
    try:
        # Accept YYYY-MM-DD or full ISO datetime
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {label}: expected YYYY-MM-DD format, got '{value}'.",
        )


class _Filters:
    """Encapsulates validated filter state."""

    def __init__(
        self,
        date_start: str | None,
        date_end: str | None,
        countries: list[str] | None,
    ):
        self.date_start = _parse_date(date_start, "date_start")
        self.date_end = _parse_date(date_end, "date_end")
        self.countries = countries

        # Validate date ordering
        if self.date_start and self.date_end and self.date_start > self.date_end:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"date_start ({self.date_start}) must be on or before "
                    f"date_end ({self.date_end})."
                ),
            )

    def where_clause(self, *, orders_alias: str = "o", locations_alias: str = "l") -> tuple[str, list]:
        """Build a SQL WHERE fragment and corresponding params list.

        Date filtering is inclusive on both ends. Country filtering uses IN.
        """
        clauses: list[str] = []
        params: list[Any] = []

        if self.date_start:
            clauses.append(f"DATE({orders_alias}.order_date) >= ?")
            params.append(self.date_start)

        if self.date_end:
            clauses.append(f"DATE({orders_alias}.order_date) <= ?")
            params.append(self.date_end)

        if self.countries:
            placeholders = ", ".join("?" for _ in self.countries)
            clauses.append(f"{locations_alias}.country IN ({placeholders})")
            params.extend(self.countries)

        fragment = " AND ".join(clauses) if clauses else "1=1"
        return fragment, params


# ---------------------------------------------------------------------------
# Response models (Pydantic)
# ---------------------------------------------------------------------------

class DateBounds(BaseModel):
    min_date: str = Field(..., description="Earliest order date (YYYY-MM-DD)")
    max_date: str = Field(..., description="Latest order date (YYYY-MM-DD)")


class CountryChoice(BaseModel):
    country: str
    order_count: int


class KPI(BaseModel):
    total_revenue: float = Field(..., description="Sum of order_items.sales (USD)")
    total_profit: float = Field(..., description="Sum of order_items.profit (USD)")
    total_orders: int = Field(..., description="Count of distinct order_key values")
    total_items: int = Field(..., description="Count of order_items rows")
    total_quantity: int = Field(..., description="Sum of order_items.quantity")
    total_customers: int = Field(..., description="Distinct customer_id count")
    avg_discount_pct: float = Field(..., description="Mean discount × 100")
    total_shipping_cost: float = Field(..., description="Sum of shipping_cost (USD)")
    avg_order_value: float = Field(..., description="total_revenue / total_orders")
    avg_items_per_order: float = Field(..., description="total_items / total_orders")
    profit_margin_pct: float = Field(..., description="(total_profit / total_revenue) × 100")


class YearlyRevenue(BaseModel):
    year: int
    revenue: float
    profit: float
    quantity: int
    orders: int


class CategorySales(BaseModel):
    category: str
    sales: float
    profit: float
    quantity: int
    avg_unit_price: float


class MarketProfit(BaseModel):
    market: str
    sales: float
    profit: float
    quantity: int
    orders: int


class SubCategorySales(BaseModel):
    sub_category: str
    sales: float
    profit: float
    quantity: int
    avg_unit_price: float


class ShipModeStats(BaseModel):
    ship_mode: str
    order_count: int
    total_sales: float
    avg_order_value: float
    avg_shipping_days: float
    shipping_cost: float = 0.0


class SegmentStats(BaseModel):
    segment: str
    customers: int
    orders: int
    sales: float
    profit: float
    quantity: int


class RegionStats(BaseModel):
    region: str
    sales: float
    profit: float
    orders: int
    quantity: int
    avg_unit_price: float


class MonthlyTrend(BaseModel):
    year: int
    month: int
    sales: float
    profit: float
    orders: int


class CountryStats(BaseModel):
    country: str
    sales: float
    profit: float
    orders: int
    quantity: int
    shipping_cost: float
    profit_margin_pct: float


class RegionDrilldown(BaseModel):
    region: str
    top_subcategories: list[dict[str, Any]]
    segments: list[dict[str, Any]]
    trend: list[dict[str, Any]]
    top_countries: list[dict[str, Any]]


class PriorityStats(BaseModel):
    order_priority: str
    order_count: int
    total_sales: float
    avg_shipping_days: float


class DashboardSummary(BaseModel):
    """Single composite payload for the dashboard initial load."""
    kpi: KPI
    date_bounds: DateBounds
    revenue_by_year: list[YearlyRevenue]
    sales_by_category: list[CategorySales]
    profit_by_market: list[MarketProfit]
    top_subcategory: list[SubCategorySales]
    orders_by_shipmode: list[ShipModeStats]
    segment_stats: list[SegmentStats]
    region_stats: list[RegionStats]
    monthly_trend: list[MonthlyTrend]
    orders_by_priority: list[PriorityStats]


class PaginatedOrders(BaseModel):
    total: int
    page: int
    limit: int
    data: list[dict[str, Any]]


class PaginatedProducts(BaseModel):
    total: int
    page: int
    limit: int
    data: list[dict[str, Any]]


class PaginatedCustomers(BaseModel):
    total: int
    page: int
    limit: int
    data: list[dict[str, Any]]


class PaginatedLocations(BaseModel):
    total: int
    page: int
    limit: int
    data: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Endpoints – Meta / Filters
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def health_check():
    """Health check."""
    return {"status": "ok", "service": "Superstore Analytics API (read-only)"}


@app.get("/api/date-bounds", response_model=DateBounds, tags=["meta"])
def get_date_bounds():
    """Return the earliest and latest order dates in the dataset."""
    row = _query_one(
        "SELECT MIN(DATE(order_date)) AS min_date, MAX(DATE(order_date)) AS max_date FROM orders"
    )
    if not row or not row["min_date"]:
        raise HTTPException(status_code=503, detail="No order data available.")
    return row


@app.get("/api/countries", response_model=list[CountryChoice], tags=["meta"])
def get_countries():
    """Return all countries that have at least one order, with order counts."""
    rows = _query(
        """
        SELECT l.country, COUNT(DISTINCT o.order_key) AS order_count
        FROM orders o
        JOIN dim_locations l ON o.location_id = l.location_id
        GROUP BY l.country
        ORDER BY l.country
        """
    )
    return rows


# ---------------------------------------------------------------------------
# Endpoints – KPIs
# ---------------------------------------------------------------------------

@app.get("/api/kpi", response_model=KPI, tags=["analytics"])
def get_kpi(
    date_start: str | None = Query(None, description="Inclusive start date (YYYY-MM-DD)"),
    date_end: str | None = Query(None, description="Inclusive end date (YYYY-MM-DD)"),
    country: list[str] | None = Query(None, description="One or more country names"),
):
    """Top-level KPI aggregates with optional date/country filters."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()

    row = _query_one(
        f"""
        SELECT
            ROUND(COALESCE(SUM(oi.sales), 0), 2)                         AS total_revenue,
            ROUND(COALESCE(SUM(oi.profit), 0), 2)                        AS total_profit,
            COUNT(DISTINCT o.order_key)                                   AS total_orders,
            COUNT(oi.row_id)                                              AS total_items,
            COALESCE(SUM(oi.quantity), 0)                                 AS total_quantity,
            COUNT(DISTINCT o.customer_id)                                 AS total_customers,
            ROUND(COALESCE(AVG(oi.discount), 0) * 100, 2)                AS avg_discount_pct,
            ROUND(COALESCE(SUM(oi.shipping_cost), 0), 2)                 AS total_shipping_cost
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        """,
        tuple(params),
    )

    if not row or row["total_orders"] == 0:
        return KPI(
            total_revenue=0, total_profit=0, total_orders=0, total_items=0,
            total_quantity=0, total_customers=0, avg_discount_pct=0,
            total_shipping_cost=0, avg_order_value=0, avg_items_per_order=0,
            profit_margin_pct=0,
        )

    row["avg_order_value"] = round(row["total_revenue"] / row["total_orders"], 2)
    row["avg_items_per_order"] = round(row["total_items"] / row["total_orders"], 2)
    row["profit_margin_pct"] = (
        round(row["total_profit"] / row["total_revenue"] * 100, 2)
        if row["total_revenue"] != 0
        else 0
    )
    return row


# ---------------------------------------------------------------------------
# Endpoints – Breakdowns
# ---------------------------------------------------------------------------

@app.get("/api/revenue-by-year", response_model=list[YearlyRevenue], tags=["analytics"])
def revenue_by_year(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Revenue, profit, quantity, and order count by year."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            oi.year,
            ROUND(SUM(oi.sales), 2)          AS revenue,
            ROUND(SUM(oi.profit), 2)         AS profit,
            SUM(oi.quantity)                  AS quantity,
            COUNT(DISTINCT o.order_key)       AS orders
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY oi.year
        ORDER BY oi.year
        """,
        tuple(params),
    )


@app.get("/api/sales-by-category", response_model=list[CategorySales], tags=["analytics"])
def sales_by_category(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Sales, profit, quantity by product category."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            p.category,
            ROUND(SUM(oi.sales), 2)                            AS sales,
            ROUND(SUM(oi.profit), 2)                           AS profit,
            SUM(oi.quantity)                                    AS quantity,
            ROUND(SUM(oi.sales) / NULLIF(SUM(oi.quantity), 0), 2) AS avg_unit_price
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_products p ON oi.product_id = p.product_id
        WHERE {where}
        GROUP BY p.category
        ORDER BY sales DESC
        """,
        tuple(params),
    )


@app.get("/api/profit-by-market", response_model=list[MarketProfit], tags=["analytics"])
def profit_by_market(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Sales, profit, quantity, orders by market region."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            l.market,
            ROUND(SUM(oi.sales), 2)          AS sales,
            ROUND(SUM(oi.profit), 2)         AS profit,
            SUM(oi.quantity)                  AS quantity,
            COUNT(DISTINCT o.order_key)       AS orders
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY l.market
        ORDER BY sales DESC
        """,
        tuple(params),
    )


@app.get("/api/top-subcategory", response_model=list[SubCategorySales], tags=["analytics"])
def top_subcategory(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
    limit: int = Query(10, ge=1, le=50),
):
    """Top sub-categories by sales."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            p.sub_category,
            ROUND(SUM(oi.sales), 2)                            AS sales,
            ROUND(SUM(oi.profit), 2)                           AS profit,
            SUM(oi.quantity)                                    AS quantity,
            ROUND(SUM(oi.sales) / NULLIF(SUM(oi.quantity), 0), 2) AS avg_unit_price
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_products p ON oi.product_id = p.product_id
        WHERE {where}
        GROUP BY p.sub_category
        ORDER BY sales DESC
        LIMIT ?
        """,
        tuple(params) + (limit,),
    )


@app.get("/api/orders-by-shipmode", response_model=list[ShipModeStats], tags=["analytics"])
def orders_by_shipmode(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Order counts, sales, and average shipping days by ship mode."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    rows = _query(
        f"""
        SELECT
            o.ship_mode,
            COUNT(DISTINCT o.order_key)                                       AS order_count,
            ROUND(SUM(oi.sales), 2)                                           AS total_sales,
            ROUND(SUM(oi.sales) / NULLIF(COUNT(DISTINCT o.order_key), 0), 2)  AS avg_order_value,
            ROUND(AVG(JULIANDAY(o.ship_date) - JULIANDAY(o.order_date)), 1)   AS avg_shipping_days,
            ROUND(COALESCE(SUM(oi.shipping_cost), 0), 2)                     AS shipping_cost
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY o.ship_mode
        ORDER BY order_count DESC
        """,
        tuple(params),
    )

    all_modes = ["Standard Class", "Second Class", "First Class", "Same Day"]
    mode_dict = {row["ship_mode"]: row for row in rows}
    
    result = []
    for mode in all_modes:
        if mode in mode_dict:
            result.append(mode_dict[mode])
        else:
            result.append({
                "ship_mode": mode,
                "order_count": 0,
                "total_sales": 0.0,
                "avg_order_value": 0.0,
                "avg_shipping_days": 0.0,
                "shipping_cost": 0.0,
            })
            
    # Sort by order_count descending
    result.sort(key=lambda x: x["order_count"], reverse=True)
    return result


@app.get("/api/orders-by-priority", response_model=list[PriorityStats], tags=["analytics"])
def orders_by_priority(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Order counts, sales, and average shipping days by order priority."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    rows = _query(
        f"""
        SELECT
            o.order_priority,
            COUNT(DISTINCT o.order_key)                                       AS order_count,
            ROUND(SUM(oi.sales), 2)                                           AS total_sales,
            ROUND(AVG(JULIANDAY(o.ship_date) - JULIANDAY(o.order_date)), 1)   AS avg_shipping_days
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY o.order_priority
        ORDER BY order_count DESC
        """,
        tuple(params),
    )

    all_priorities = ["Critical", "High", "Medium", "Low"]
    priority_dict = {row["order_priority"]: row for row in rows}
    
    result = []
    for p in all_priorities:
        if p in priority_dict:
            result.append(priority_dict[p])
        else:
            result.append({
                "order_priority": p,
                "order_count": 0,
                "total_sales": 0.0,
                "avg_shipping_days": 0.0,
            })
            
    # Sort by order_count descending
    result.sort(key=lambda x: x["order_count"], reverse=True)
    return result


@app.get("/api/segment-stats", response_model=list[SegmentStats], tags=["analytics"])
def segment_stats(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Customer segment breakdown."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            c.segment,
            COUNT(DISTINCT o.customer_id)    AS customers,
            COUNT(DISTINCT o.order_key)      AS orders,
            ROUND(SUM(oi.sales), 2)          AS sales,
            ROUND(SUM(oi.profit), 2)         AS profit,
            SUM(oi.quantity)                  AS quantity
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_customers c ON o.customer_id = c.customer_id
        WHERE {where}
        GROUP BY c.segment
        ORDER BY sales DESC
        """,
        tuple(params),
    )


@app.get("/api/region-stats", response_model=list[RegionStats], tags=["analytics"])
def region_stats(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Sales, profit, orders by region."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            l.region,
            ROUND(SUM(oi.sales), 2)                            AS sales,
            ROUND(SUM(oi.profit), 2)                           AS profit,
            COUNT(DISTINCT o.order_key)                         AS orders,
            SUM(oi.quantity)                                    AS quantity,
            ROUND(SUM(oi.sales) / NULLIF(SUM(oi.quantity), 0), 2) AS avg_unit_price
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY l.region
        ORDER BY sales DESC
        """,
        tuple(params),
    )


@app.get("/api/monthly-trend", response_model=list[MonthlyTrend], tags=["analytics"])
def monthly_trend(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Monthly time series of sales, profit and order counts."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            CAST(STRFTIME('%Y', o.order_date) AS INTEGER) AS year,
            CAST(STRFTIME('%m', o.order_date) AS INTEGER) AS month,
            ROUND(SUM(oi.sales), 2)                       AS sales,
            ROUND(SUM(oi.profit), 2)                      AS profit,
            COUNT(DISTINCT o.order_key)                    AS orders
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY year, month
        ORDER BY year, month
        """,
        tuple(params),
    )


@app.get("/api/country-stats", response_model=list[CountryStats], tags=["analytics"])
def country_stats(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
    limit: int = Query(20, ge=1, le=200),
):
    """Aggregated stats per country, sorted by sales descending."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    return _query(
        f"""
        SELECT
            l.country,
            ROUND(SUM(oi.sales), 2)                                   AS sales,
            ROUND(SUM(oi.profit), 2)                                  AS profit,
            COUNT(DISTINCT o.order_key)                                AS orders,
            SUM(oi.quantity)                                           AS quantity,
            ROUND(SUM(oi.shipping_cost), 2)                           AS shipping_cost,
            ROUND(
                CASE WHEN SUM(oi.sales) = 0 THEN 0
                     ELSE SUM(oi.profit) / SUM(oi.sales) * 100
                END, 2
            )                                                          AS profit_margin_pct
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {where}
        GROUP BY l.country
        ORDER BY sales DESC
        LIMIT ?
        """,
        tuple(params) + (limit,),
    )


@app.get("/api/region-drilldown", response_model=RegionDrilldown, tags=["analytics"])
def region_drilldown(
    region: str = Query(..., description="Region name to drill into"),
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Deep-dive into a specific region: top sub-categories, segments, monthly trend, top countries."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()
    region_where = f"{where} AND l.region = ?"
    region_params = tuple(params) + (region,)

    # Verify region exists
    check = _query_one(
        "SELECT COUNT(*) AS cnt FROM dim_locations WHERE region = ?", (region,)
    )
    if not check or check["cnt"] == 0:
        raise HTTPException(status_code=404, detail=f"Region '{region}' not found.")

    top_sub = _query(
        f"""
        SELECT p.sub_category, ROUND(SUM(oi.sales), 2) AS sales,
               ROUND(SUM(oi.profit), 2) AS profit, SUM(oi.quantity) AS quantity
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_products p ON oi.product_id = p.product_id
        WHERE {region_where}
        GROUP BY p.sub_category ORDER BY sales DESC LIMIT 10
        """,
        region_params,
    )

    segments = _query(
        f"""
        SELECT c.segment, COUNT(DISTINCT o.customer_id) AS customers,
               COUNT(DISTINCT o.order_key) AS orders,
               ROUND(SUM(oi.sales), 2) AS sales, ROUND(SUM(oi.profit), 2) AS profit
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_customers c ON o.customer_id = c.customer_id
        WHERE {region_where}
        GROUP BY c.segment ORDER BY sales DESC
        """,
        region_params,
    )

    trend = _query(
        f"""
        SELECT CAST(STRFTIME('%Y', o.order_date) AS INTEGER) AS year,
               CAST(STRFTIME('%m', o.order_date) AS INTEGER) AS month,
               ROUND(SUM(oi.sales), 2) AS sales, ROUND(SUM(oi.profit), 2) AS profit
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {region_where}
        GROUP BY year, month ORDER BY year, month
        """,
        region_params,
    )

    top_countries = _query(
        f"""
        SELECT l.country, ROUND(SUM(oi.sales), 2) AS sales,
               ROUND(SUM(oi.profit), 2) AS profit,
               COUNT(DISTINCT o.order_key) AS orders
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        WHERE {region_where}
        GROUP BY l.country ORDER BY sales DESC LIMIT 10
        """,
        region_params,
    )

    return RegionDrilldown(
        region=region,
        top_subcategories=top_sub,
        segments=segments,
        trend=trend,
        top_countries=top_countries,
    )


# ---------------------------------------------------------------------------
# Endpoints – Composite dashboard summary
# ---------------------------------------------------------------------------

@app.get("/api/dashboard-summary", response_model=DashboardSummary, tags=["analytics"])
def dashboard_summary(
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Single composite endpoint returning all dashboard data in one call.

    This avoids multiple round-trips on initial load and filter changes.
    All sub-queries share the same validated filter parameters.
    """
    return DashboardSummary(
        kpi=get_kpi(date_start, date_end, country),
        date_bounds=get_date_bounds(),
        revenue_by_year=revenue_by_year(date_start, date_end, country),
        sales_by_category=sales_by_category(date_start, date_end, country),
        profit_by_market=profit_by_market(date_start, date_end, country),
        top_subcategory=top_subcategory(date_start, date_end, country, limit=10),
        orders_by_shipmode=orders_by_shipmode(date_start, date_end, country),
        segment_stats=segment_stats(date_start, date_end, country),
        region_stats=region_stats(date_start, date_end, country),
        monthly_trend=monthly_trend(date_start, date_end, country),
        orders_by_priority=orders_by_priority(date_start, date_end, country),
    )


# ---------------------------------------------------------------------------
# Endpoints – Exploration / Paginated tables
# ---------------------------------------------------------------------------

@app.get("/api/orders", response_model=PaginatedOrders, tags=["exploration"])
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Search across order ID, customer, product, country"),
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Paginated order line items with optional search and filters."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()

    if q:
        where += (
            " AND (o.order_id_raw LIKE ? OR c.customer_name LIKE ? "
            "OR p.product_name LIKE ? OR l.country LIKE ?)"
        )
        like = f"%{q}%"
        params.extend([like, like, like, like])

    base_from = """
        FROM order_items oi
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
        JOIN dim_customers c ON o.customer_id = c.customer_id
        JOIN dim_products p ON oi.product_id = p.product_id
    """

    total_row = _query_one(
        f"SELECT COUNT(*) AS cnt {base_from} WHERE {where}",
        tuple(params),
    )
    total = total_row["cnt"] if total_row else 0

    offset = (page - 1) * limit
    data = _query(
        f"""
        SELECT
            oi.row_id,
            o.order_id_raw,
            c.customer_name,
            c.segment,
            p.category,
            p.sub_category,
            p.product_name,
            ROUND(oi.sales, 2) AS sales,
            ROUND(oi.profit, 2) AS profit,
            ROUND(oi.discount * 100, 1) AS discount_pct,
            oi.quantity,
            ROUND(oi.shipping_cost, 2) AS shipping_cost,
            o.ship_mode,
            o.order_priority,
            DATE(o.order_date) AS order_date,
            DATE(o.ship_date) AS ship_date,
            l.city,
            l.country,
            l.market,
            l.region
        {base_from}
        WHERE {where}
        ORDER BY o.order_date DESC, o.order_id_raw
        LIMIT ? OFFSET ?
        """,
        tuple(params) + (limit, offset),
    )

    return PaginatedOrders(total=total, page=page, limit=limit, data=data)


@app.get("/api/products", response_model=PaginatedProducts, tags=["exploration"])
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Paginated product summary with aggregated metrics."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()

    if q:
        where += " AND (p.product_name LIKE ? OR p.category LIKE ? OR p.sub_category LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like, like])

    base_from = """
        FROM dim_products p
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_key = o.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
    """

    total_row = _query_one(
        f"SELECT COUNT(DISTINCT p.product_id) AS cnt {base_from} WHERE {where}",
        tuple(params),
    )
    total = total_row["cnt"] if total_row else 0

    offset = (page - 1) * limit
    data = _query(
        f"""
        SELECT
            p.product_id,
            p.category,
            p.sub_category,
            p.product_name,
            ROUND(AVG(oi.sales), 2) AS avg_sales,
            ROUND(SUM(oi.profit), 2) AS total_profit,
            COUNT(oi.row_id) AS times_sold
        {base_from}
        WHERE {where}
        GROUP BY p.product_id
        ORDER BY total_profit DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params) + (limit, offset),
    )

    return PaginatedProducts(total=total, page=page, limit=limit, data=data)


@app.get("/api/customers", response_model=PaginatedCustomers, tags=["exploration"])
def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Paginated customer summary with aggregated metrics."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()

    if q:
        where += " AND (c.customer_name LIKE ? OR c.segment LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like])

    base_from = """
        FROM dim_customers c
        JOIN orders o ON c.customer_id = o.customer_id
        JOIN order_items oi ON o.order_key = oi.order_key
        JOIN dim_locations l ON o.location_id = l.location_id
    """

    total_row = _query_one(
        f"SELECT COUNT(DISTINCT c.customer_id) AS cnt {base_from} WHERE {where}",
        tuple(params),
    )
    total = total_row["cnt"] if total_row else 0

    offset = (page - 1) * limit
    data = _query(
        f"""
        SELECT
            c.customer_id,
            c.customer_name,
            c.segment,
            COUNT(DISTINCT o.order_key) AS total_orders,
            ROUND(SUM(oi.sales), 2) AS total_sales,
            ROUND(SUM(oi.profit), 2) AS total_profit,
            ROUND(AVG(oi.discount) * 100, 1) AS avg_discount
        {base_from}
        WHERE {where}
        GROUP BY c.customer_id
        ORDER BY total_sales DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params) + (limit, offset),
    )

    return PaginatedCustomers(total=total, page=page, limit=limit, data=data)


@app.get("/api/locations", response_model=PaginatedLocations, tags=["exploration"])
def list_locations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
    date_start: str | None = Query(None),
    date_end: str | None = Query(None),
    country: list[str] | None = Query(None),
):
    """Paginated location summary with aggregated metrics."""
    f = _Filters(date_start, date_end, country)
    where, params = f.where_clause()

    if q:
        where += " AND (l.city LIKE ? OR l.state LIKE ? OR l.country LIKE ? OR l.region LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like, like, like])

    base_from = """
        FROM dim_locations l
        JOIN orders o ON l.location_id = o.location_id
        JOIN order_items oi ON o.order_key = oi.order_key
    """

    total_row = _query_one(
        f"SELECT COUNT(DISTINCT l.location_id) AS cnt {base_from} WHERE {where}",
        tuple(params),
    )
    total = total_row["cnt"] if total_row else 0

    offset = (page - 1) * limit
    data = _query(
        f"""
        SELECT
            l.location_id,
            l.city,
            l.state,
            l.country,
            l.region,
            l.market,
            COUNT(DISTINCT o.order_key) AS total_orders,
            ROUND(SUM(oi.sales), 2) AS total_sales,
            ROUND(SUM(oi.profit), 2) AS total_profit
        {base_from}
        WHERE {where}
        GROUP BY l.location_id
        ORDER BY total_sales DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params) + (limit, offset),
    )

    return PaginatedLocations(total=total, page=page, limit=limit, data=data)
