"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  getPredictionMeta,
  getPredictionHealth,
  predictProfitRegression,
  predictLateClassification,
} from "@/lib/api";
import {
  BrainCircuit,
  TrendingUp,
  DollarSign,
  Truck,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Package,
  Layers,
  Calendar,
  MapPin,
  RefreshCw,
  Info,
} from "lucide-react";

// Standard canonical categories matching model training & backend encoders
const DEFAULT_CATEGORIES = {
  ship_mode: ["First Class", "Same Day", "Second Class", "Standard Class"],
  order_priority: ["Critical", "High", "Low", "Medium"],
  segment: ["Consumer", "Corporate", "Home Office"],
  region: [
    "Africa",
    "Canada",
    "Caribbean",
    "Central",
    "Central Asia",
    "EMEA",
    "East",
    "North",
    "North Asia",
    "Oceania",
    "South",
    "Southeast Asia",
    "West",
  ],
  market: ["APAC", "Africa", "Canada", "EMEA", "EU", "LATAM", "US"],
  sub_category: [
    "Accessories",
    "Appliances",
    "Art",
    "Binders",
    "Bookcases",
    "Chairs",
    "Copiers",
    "Envelopes",
    "Fasteners",
    "Furnishings",
    "Labels",
    "Machines",
    "Paper",
    "Phones",
    "Storage",
    "Supplies",
    "Tables",
  ],
};

const DEFAULT_LATE_DAYS_LIMIT = {
  "Same Day": 0,
  "First Class": 2,
  "Second Class": 3,
  "Standard Class": 5,
};

export default function PredictionView() {
  // Mode selection: 'regression' | 'classification'
  const [mode, setMode] = useState("regression");

  // Meta & Service health
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [lateDaysLimit, setLateDaysLimit] = useState(DEFAULT_LATE_DAYS_LIMIT);
  const [healthStatus, setHealthStatus] = useState("checking"); // 'ok' | 'degraded' | 'offline' | 'checking'
  const [serviceError, setServiceError] = useState(null);

  // Form states
  const [regressionForm, setRegressionForm] = useState({
    order_date: "2024-06-15",
    discount: 0.2,
    quantity: 3,
    sales: 300,
    shipping_cost: 20,
    sub_category: "Tables",
    region: "Central",
    market: "US",
    segment: "Consumer",
    ship_mode: "Standard Class",
    order_priority: "Medium",
  });

  const [classificationOrder, setClassificationOrder] = useState({
    order_date: "2024-01-15",
    ship_mode: "Standard Class",
    order_priority: "Medium",
    segment: "Consumer",
    region: "Central",
    market: "US",
  });

  const [classificationItems, setClassificationItems] = useState([
    {
      id: 1,
      quantity: 3,
      sales: 500,
      discount: 0.1,
      shipping_cost: 20,
      sub_category: "Binders",
    },
    {
      id: 2,
      quantity: 1,
      sales: 150,
      discount: 0.0,
      shipping_cost: 8,
      sub_category: "Chairs",
    },
  ]);

  // Inference states
  const [isPredicting, setIsPredicting] = useState(false);
  const [regressionResult, setRegressionResult] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const [formError, setFormError] = useState(null);

  // Load service metadata and health
  const loadServiceStatus = async () => {
    setHealthStatus("checking");
    setServiceError(null);

    try {
      const [health, meta] = await Promise.all([
        getPredictionHealth().catch((e) => ({ status: "error", error: e.message })),
        getPredictionMeta().catch(() => null),
      ]);

      if (health?.status === "ok") {
        setHealthStatus("ok");
      } else if (health?.status === "degraded") {
        setHealthStatus("degraded");
      } else {
        setHealthStatus("offline");
        setServiceError(health?.error || "Prediction service offline");
      }

      if (meta?.categories) {
        setCategories((prev) => ({
          ...prev,
          ...meta.categories,
          // Guarantee all 17 sub-categories are present
          sub_category: meta.categories.sub_category || prev.sub_category,
        }));
      }
      if (meta?.late_days_limit) {
        setLateDaysLimit(meta.late_days_limit);
      }
    } catch (err) {
      setHealthStatus("offline");
      setServiceError(err.message);
    }
  };

  useEffect(() => {
    loadServiceStatus();
  }, []);

  // Handlers for Regression form
  const handleRegressionChange = (e) => {
    const { name, value, type } = e.target;
    let parsed = value;
    if (type === "number") {
      parsed = value === "" ? "" : parseFloat(value);
    }
    setRegressionForm((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleRegressionSubmit = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setFormError(null);
    setRegressionResult(null);

    // Validation
    const discount = Number(regressionForm.discount);
    const quantity = parseInt(regressionForm.quantity, 10);
    const sales = Number(regressionForm.sales);
    const shipping_cost = Number(regressionForm.shipping_cost);

    if (isNaN(discount) || discount < 0 || discount > 1) {
      setFormError("Discount must be between 0.00 and 1.00 (e.g. 0.15 for 15%).");
      setIsPredicting(false);
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setFormError("Quantity must be a positive integer greater than 0.");
      setIsPredicting(false);
      return;
    }
    if (isNaN(sales) || sales < 0) {
      setFormError("Sales amount cannot be negative.");
      setIsPredicting(false);
      return;
    }
    if (isNaN(shipping_cost) || shipping_cost < 0) {
      setFormError("Shipping cost cannot be negative.");
      setIsPredicting(false);
      return;
    }
    if (!regressionForm.order_date) {
      setFormError("Order date is required.");
      setIsPredicting(false);
      return;
    }

    const payload = {
      order_date: regressionForm.order_date,
      discount,
      quantity,
      sales,
      shipping_cost,
      sub_category: regressionForm.sub_category,
      region: regressionForm.region,
      market: regressionForm.market,
      segment: regressionForm.segment,
      ship_mode: regressionForm.ship_mode,
      order_priority: regressionForm.order_priority,
    };

    try {
      const data = await predictProfitRegression(payload);
      setRegressionResult(data);
    } catch (err) {
      setFormError(err.message || "Failed to execute profit regression.");
    } finally {
      setIsPredicting(false);
    }
  };

  // Handlers for Classification form
  const handleClassificationOrderChange = (e) => {
    const { name, value } = e.target;
    setClassificationOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setClassificationItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]:
            field === "quantity"
              ? value === "" ? "" : parseInt(value, 10)
              : field === "sales" || field === "discount" || field === "shipping_cost"
              ? value === "" ? "" : parseFloat(value)
              : value,
        };
      })
    );
  };

  const handleAddItem = () => {
    const nextId =
      classificationItems.length > 0
        ? Math.max(...classificationItems.map((i) => i.id)) + 1
        : 1;

    setClassificationItems((prev) => [
      ...prev,
      {
        id: nextId,
        quantity: 1,
        sales: 120,
        discount: 0.0,
        shipping_cost: 10,
        sub_category: "Binders",
      },
    ]);
  };

  const handleRemoveItem = (idToRemove) => {
    setClassificationItems((prev) => {
      if (prev.length <= 1) return prev; // Never allow zero items
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  // Aggregated live preview of classification order
  const orderSummary = useMemo(() => {
    const n_items = classificationItems.length;
    const total_quantity = classificationItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
    const total_sales = classificationItems.reduce(
      (sum, item) => sum + (Number(item.sales) || 0),
      0
    );
    const avg_discount =
      n_items > 0
        ? classificationItems.reduce(
            (sum, item) => sum + (Number(item.discount) || 0),
            0
          ) / n_items
        : 0;
    const total_shipping_cost = classificationItems.reduce(
      (sum, item) => sum + (Number(item.shipping_cost) || 0),
      0
    );
    const distinct_sub_categories = new Set(
      classificationItems.map((item) => item.sub_category)
    ).size;

    return {
      n_items,
      total_quantity,
      total_sales,
      avg_discount,
      total_shipping_cost,
      distinct_sub_categories,
    };
  }, [classificationItems]);

  const handleClassificationSubmit = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setFormError(null);
    setClassificationResult(null);

    if (classificationItems.length === 0) {
      setFormError("At least one order line item is required.");
      setIsPredicting(false);
      return;
    }

    if (!classificationOrder.order_date) {
      setFormError("Order date is required.");
      setIsPredicting(false);
      return;
    }

    // Validate each item
    for (let i = 0; i < classificationItems.length; i++) {
      const item = classificationItems[i];
      const qty = parseInt(item.quantity, 10);
      const sales = Number(item.sales);
      const discount = Number(item.discount);
      const shipping_cost = Number(item.shipping_cost);

      if (isNaN(qty) || qty <= 0) {
        setFormError(`Item #${i + 1}: Quantity must be greater than 0.`);
        setIsPredicting(false);
        return;
      }
      if (isNaN(sales) || sales < 0) {
        setFormError(`Item #${i + 1}: Sales amount cannot be negative.`);
        setIsPredicting(false);
        return;
      }
      if (isNaN(discount) || discount < 0 || discount > 1) {
        setFormError(`Item #${i + 1}: Discount must be between 0.00 and 1.00.`);
        setIsPredicting(false);
        return;
      }
      if (isNaN(shipping_cost) || shipping_cost < 0) {
        setFormError(`Item #${i + 1}: Shipping cost cannot be negative.`);
        setIsPredicting(false);
        return;
      }
    }

    const payload = {
      order_date: classificationOrder.order_date,
      ship_mode: classificationOrder.ship_mode,
      order_priority: classificationOrder.order_priority,
      segment: classificationOrder.segment,
      region: classificationOrder.region,
      market: classificationOrder.market,
      items: classificationItems.map((item) => ({
        quantity: parseInt(item.quantity, 10),
        sales: Number(item.sales),
        discount: Number(item.discount),
        shipping_cost: Number(item.shipping_cost),
        sub_category: item.sub_category,
      })),
    };

    try {
      const data = await predictLateClassification(payload);
      setClassificationResult(data);
    } catch (err) {
      setFormError(err.message || "Failed to execute delivery classification.");
    } finally {
      setIsPredicting(false);
    }
  };

  const currentSlaLimit =
    mode === "regression"
      ? lateDaysLimit[regressionForm.ship_mode] ?? 5
      : lateDaysLimit[classificationOrder.ship_mode] ?? 5;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Status */}
      <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80 dark:from-[#201D33] dark:via-[#1B192B] dark:to-[#201D33] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7C69EF] to-[#9B88FC] text-white shadow-md shadow-purple-500/25 shrink-0">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Superstore AI Prediction Center
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C69EF]/10 text-[#7C69EF] dark:bg-[#7C69EF]/20">
                  XGBoost
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Execute machine learning inference for item profit regression and multi-item late delivery classification.
              </p>
            </div>
          </div>

          {/* Service Health Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-purple-100/80 dark:border-purple-950/40 shadow-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                healthStatus === "ok"
                  ? "bg-emerald-500 animate-pulse"
                  : healthStatus === "degraded"
                  ? "bg-amber-500"
                  : healthStatus === "checking"
                  ? "bg-sky-400 animate-spin"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              {healthStatus === "ok"
                ? "Models Ready (Port 8000)"
                : healthStatus === "degraded"
                ? "Degraded (Check Models)"
                : healthStatus === "checking"
                ? "Checking Service..."
                : "Service Offline"}
            </span>
            <button
              type="button"
              onClick={loadServiceStatus}
              title="Refresh backend service status"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Regression Tab Card */}
        <button
          type="button"
          onClick={() => {
            setMode("regression");
            setFormError(null);
          }}
          className={`flex items-start gap-4 p-4 sm:p-5 rounded-3xl border text-left transition-all relative overflow-hidden ${
            mode === "regression"
              ? "bg-white dark:bg-[#201D33] border-[#7C69EF] shadow-lg shadow-purple-500/10 ring-2 ring-[#7C69EF]/20"
              : "bg-white/60 dark:bg-[#1B192B]/60 border-purple-100/80 dark:border-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800"
          }`}
          aria-pressed={mode === "regression"}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 transition-colors ${
              mode === "regression"
                ? "bg-[#7C69EF] text-white shadow-md shadow-purple-500/30"
                : "bg-purple-100/70 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Item Profit Regression
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Forecast estimated dollar profit for a specific item transaction using price, discount, and routing parameters.
            </p>
          </div>
        </button>

        {/* Classification Tab Card */}
        <button
          type="button"
          onClick={() => {
            setMode("classification");
            setFormError(null);
          }}
          className={`flex items-start gap-4 p-4 sm:p-5 rounded-3xl border text-left transition-all relative overflow-hidden ${
            mode === "classification"
              ? "bg-white dark:bg-[#201D33] border-[#7C69EF] shadow-lg shadow-purple-500/10 ring-2 ring-[#7C69EF]/20"
              : "bg-white/60 dark:bg-[#1B192B]/60 border-purple-100/80 dark:border-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800"
          }`}
          aria-pressed={mode === "classification"}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 transition-colors ${
              mode === "classification"
                ? "bg-[#7C69EF] text-white shadow-md shadow-purple-500/30"
                : "bg-purple-100/70 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
            }`}
          >
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Late Delivery Classification
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Predict whether an entire order will arrive late or on-time across one or multiple item sets and ship mode SLA.
            </p>
          </div>
        </button>
      </div>

      {/* Main Grid: Form on Left / Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: INTERACTIVE FORM (7 cols on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {mode === "regression" ? (
            /* REGRESSION FORM */
            <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-purple-100/60 dark:border-purple-950/30 mb-5">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Profit Regression Parameters
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Enter the 11 transaction fields to predict estimated item profit.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegressionSubmit} className="space-y-5">
                {/* Group 1: Order & Route Context */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#7C69EF]" />
                    <span>Order &amp; Routing Attributes</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Order Date
                      </label>
                      <input
                        type="date"
                        name="order_date"
                        value={regressionForm.order_date}
                        onChange={handleRegressionChange}
                        required
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Ship Mode
                      </label>
                      <select
                        name="ship_mode"
                        value={regressionForm.ship_mode}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.ship_mode.map((modeOpt) => (
                          <option key={modeOpt} value={modeOpt}>
                            {modeOpt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Order Priority
                      </label>
                      <select
                        name="order_priority"
                        value={regressionForm.order_priority}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.order_priority.map((pOpt) => (
                          <option key={pOpt} value={pOpt}>
                            {pOpt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Customer Segment
                      </label>
                      <select
                        name="segment"
                        value={regressionForm.segment}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.segment.map((segOpt) => (
                          <option key={segOpt} value={segOpt}>
                            {segOpt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Region
                      </label>
                      <select
                        name="region"
                        value={regressionForm.region}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.region.map((regOpt) => (
                          <option key={regOpt} value={regOpt}>
                            {regOpt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Market
                      </label>
                      <select
                        name="market"
                        value={regressionForm.market}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.market.map((mktOpt) => (
                          <option key={mktOpt} value={mktOpt}>
                            {mktOpt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Group 2: Item Financials & Category */}
                <div className="pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[#7C69EF]" />
                    <span>Item Category &amp; Financials</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Sub-Category
                      </label>
                      <select
                        name="sub_category"
                        value={regressionForm.sub_category}
                        onChange={handleRegressionChange}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      >
                        {categories.sub_category.map((subOpt) => (
                          <option key={subOpt} value={subOpt}>
                            {subOpt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        step="1"
                        value={regressionForm.quantity}
                        onChange={handleRegressionChange}
                        required
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Sales (USD)
                      </label>
                      <input
                        type="number"
                        name="sales"
                        min="0"
                        step="0.01"
                        value={regressionForm.sales}
                        onChange={handleRegressionChange}
                        required
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Discount (0.00 – 1.00)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        min="0"
                        max="1"
                        step="0.01"
                        value={regressionForm.discount}
                        onChange={handleRegressionChange}
                        required
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Shipping Cost (USD)
                      </label>
                      <input
                        type="number"
                        name="shipping_cost"
                        min="0"
                        step="0.01"
                        value={regressionForm.shipping_cost}
                        onChange={handleRegressionChange}
                        required
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
                  <button
                    type="submit"
                    disabled={isPredicting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#7C69EF] hover:bg-[#6D58E2] text-white font-bold py-3.5 px-4 text-xs shadow-md shadow-purple-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isPredicting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Estimating Profit...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Estimate Profit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CLASSIFICATION FORM */
            <div className="space-y-6">
              {/* Order Shared Attributes Card */}
              <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-purple-100/60 dark:border-purple-950/30 mb-5">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                      1. Shared Order Parameters
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      These 6 order-level fields apply once to the entire delivery package.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Order Date
                    </label>
                    <input
                      type="date"
                      name="order_date"
                      value={classificationOrder.order_date}
                      onChange={handleClassificationOrderChange}
                      required
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Ship Mode
                    </label>
                    <select
                      name="ship_mode"
                      value={classificationOrder.ship_mode}
                      onChange={handleClassificationOrderChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    >
                      {categories.ship_mode.map((modeOpt) => (
                        <option key={modeOpt} value={modeOpt}>
                          {modeOpt} ({lateDaysLimit[modeOpt] ?? 0}d SLA)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Order Priority
                    </label>
                    <select
                      name="order_priority"
                      value={classificationOrder.order_priority}
                      onChange={handleClassificationOrderChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    >
                      {categories.order_priority.map((pOpt) => (
                        <option key={pOpt} value={pOpt}>
                          {pOpt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Segment
                    </label>
                    <select
                      name="segment"
                      value={classificationOrder.segment}
                      onChange={handleClassificationOrderChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    >
                      {categories.segment.map((segOpt) => (
                        <option key={segOpt} value={segOpt}>
                          {segOpt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Region
                    </label>
                    <select
                      name="region"
                      value={classificationOrder.region}
                      onChange={handleClassificationOrderChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    >
                      {categories.region.map((regOpt) => (
                        <option key={regOpt} value={regOpt}>
                          {regOpt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      Market
                    </label>
                    <select
                      name="market"
                      value={classificationOrder.market}
                      onChange={handleClassificationOrderChange}
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:ring-1 focus:ring-[#7C69EF] focus:outline-none transition-all"
                    >
                      {categories.market.map((mktOpt) => (
                        <option key={mktOpt} value={mktOpt}>
                          {mktOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items List Card */}
              <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-purple-100/60 dark:border-purple-950/30">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>2. Order Line Items</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
                        {classificationItems.length}{" "}
                        {classificationItems.length === 1 ? "Item" : "Items"}
                      </span>
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Each item has 5 attributes. The server aggregates all items automatically.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#7C69EF] px-3 py-1.5 text-xs font-semibold border border-purple-200/60 dark:border-purple-900/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3.5">
                  {classificationItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-purple-100/70 dark:border-purple-950/40 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C69EF] text-white text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {item.sub_category || "Unassigned"}
                          </span>
                        </div>

                        {classificationItems.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remove this item"
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span
                            className="text-[10px] text-zinc-400 italic"
                            title="An order must contain at least 1 item"
                          >
                            Required (min 1 item)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            Sub-Category
                          </label>
                          <select
                            value={item.sub_category}
                            onChange={(e) =>
                              handleItemChange(item.id, "sub_category", e.target.value)
                            }
                            className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                          >
                            {categories.sub_category.map((subOpt) => (
                              <option key={subOpt} value={subOpt}>
                                {subOpt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, "quantity", e.target.value)
                            }
                            className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            Sales (USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sales}
                            onChange={(e) =>
                              handleItemChange(item.id, "sales", e.target.value)
                            }
                            className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            Discount (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemChange(item.id, "discount", e.target.value)
                            }
                            className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                            Ship Cost (USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.shipping_cost}
                            onChange={(e) =>
                              handleItemChange(item.id, "shipping_cost", e.target.value)
                            }
                            className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Computed Aggregates Preview Bar */}
                <div className="rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/70 dark:border-purple-900/30 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#7C69EF]" />
                      <span>Aggregated Order Feature Preview</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Calculated on backend during inference
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Items</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {orderSummary.n_items}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Total Qty</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {orderSummary.total_quantity}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Total Sales</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(orderSummary.total_sales, true)}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Avg Discount</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {formatPercent(orderSummary.avg_discount * 100, 1)}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Total Shipping</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(orderSummary.total_shipping_cost, true)}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-purple-50 dark:border-purple-950/40">
                      <span className="block text-[10px] text-zinc-400">Distinct SubCats</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {orderSummary.distinct_sub_categories}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
                  <button
                    type="button"
                    onClick={handleClassificationSubmit}
                    disabled={isPredicting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#7C69EF] hover:bg-[#6D58E2] text-white font-bold py-3.5 px-4 text-xs shadow-md shadow-purple-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isPredicting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Evaluating Delivery SLA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>
                          Predict Late Delivery for Order ({classificationItems.length}{" "}
                          {classificationItems.length === 1 ? "Item" : "Items"})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 p-4 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <span className="font-bold">Input Error: </span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {serviceError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 text-xs text-amber-700 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1">
                <span className="font-bold">Service Notice: </span>
                <span>
                  Backend connection warning ({serviceError}). Make sure FastAPI server is active on port 8000.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PREDICTION OUTPUT (5 cols on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100/60 dark:border-purple-950/30 mb-5">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Inference Result</span>
                {mode === "regression" && regressionResult && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    Profit Evaluated
                  </span>
                )}
                {mode === "classification" && classificationResult && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      classificationResult.is_late
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                    }`}
                  >
                    {classificationResult.is_late ? "Late Alert" : "On-Time Status"}
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-zinc-400 capitalize">Mode: {mode}</span>
            </div>

            {/* Content for Mode 1: Regression Result */}
            {mode === "regression" && (
              <>
                {regressionResult ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Big Profit Hero */}
                    <div
                      className={`rounded-2xl border p-5 text-center ${
                        regressionResult.estimated_profit >= 0
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200"
                          : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block mb-1">
                        Estimated Net Profit
                      </span>
                      <div className="text-3xl font-extrabold tracking-tight">
                        {formatCurrency(regressionResult.estimated_profit)}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        {regressionResult.estimated_profit >= 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <span className="text-xs font-medium">
                          {regressionResult.estimated_profit >= 0
                            ? "Projected Profitable Transaction"
                            : "Projected Margin Deficit (Loss)"}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Metrics */}
                    <div className="space-y-2.5">
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-3 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Gross Sales</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {formatCurrency(regressionForm.sales)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-3 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Discount Applied</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {formatPercent(regressionForm.discount * 100, 1)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-3 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Shipping Cost</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {formatCurrency(regressionForm.shipping_cost)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-3 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Profit Margin</span>
                        <span
                          className={`font-bold ${
                            regressionResult.estimated_profit >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {regressionForm.sales > 0
                            ? formatPercent(
                                (regressionResult.estimated_profit / regressionForm.sales) *
                                  100,
                                1
                              )
                            : "0.0%"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 p-3 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Target Category:</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {regressionForm.sub_category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ship Mode SLA:</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {regressionForm.ship_mode} ({currentSlaLimit}d limit)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-400">
                    <TrendingUp className="h-10 w-10 text-purple-200 dark:text-purple-900/60 mb-3" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      No regression result yet
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px]">
                      Configure the 11 inputs on the left and click Estimate Item Profit.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Content for Mode 2: Classification Result */}
            {mode === "classification" && (
              <>
                {classificationResult ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Late Delivery Status Alert Card */}
                    <div
                      className={`rounded-2xl border p-5 text-center ${
                        classificationResult.is_late
                          ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                          : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {classificationResult.is_late ? (
                          <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className="text-sm font-extrabold tracking-wide uppercase">
                          {classificationResult.is_late
                            ? "Late Delivery Predicted"
                            : "On-Time Delivery Expected"}
                        </span>
                      </div>

                      {/* Official English Message from Backend */}
                      <p className="text-xs font-medium leading-relaxed bg-white/70 dark:bg-black/30 p-3 rounded-xl border border-current/10">
                        {classificationResult.message}
                      </p>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Late Risk Probability
                        </span>
                        <span
                          className={`font-extrabold ${
                            classificationResult.is_late
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatPercent(classificationResult.late_probability * 100, 1)}
                        </span>
                      </div>

                      <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            classificationResult.late_probability >= 0.5
                              ? "bg-rose-500"
                              : classificationResult.late_probability >= 0.25
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, classificationResult.late_probability * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-zinc-400 pt-1">
                        <span>0% Low Risk</span>
                        <span>50% Threshold</span>
                        <span>100% Critical Risk</span>
                      </div>
                    </div>

                    {/* Ship Mode & SLA Window Limit Card */}
                    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-100/60 dark:border-purple-950/40 p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#7C69EF]" />
                          <span>Delivery SLA Limit</span>
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {classificationResult.limit_days}{" "}
                          {classificationResult.limit_days === 1 ? "Day" : "Days"} Max
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Selected Ship Mode</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {classificationOrder.ship_mode}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Order Priority</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {classificationOrder.order_priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Order Items Evaluated
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {classificationItems.length} items (
                          {orderSummary.distinct_sub_categories} distinct sub-categories)
                        </span>
                      </div>
                    </div>

                    {/* Recommendation note */}
                    <div className="rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 p-3 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-[#7C69EF] shrink-0 mt-0.5" />
                      <div>
                        {classificationResult.is_late ? (
                          <span>
                            <strong>Suggested Remediation:</strong> Upgrade to First Class or Same Day
                            shipping, or flag order in fulfillment queue to prevent SLA violation.
                          </span>
                        ) : (
                          <span>
                            <strong>Optimal Route:</strong> Current shipping configuration meets fulfillment
                            SLA within expected lead times.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-400">
                    <Truck className="h-10 w-10 text-purple-200 dark:text-purple-900/60 mb-3" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      No classification result yet
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px]">
                      Specify order routing, manage line items on the left, and click Predict Late Delivery.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400 text-center">
              Powered by local XGBoost models
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
