"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  ShoppingBag,
  MapPin,
  Globe2,
  Calendar,
  Filter,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { getKpi, getShipModes } from "@/lib/api";
import { SUPERSTORE_COUNTRIES } from "@/lib/superstoreCountries";

const QUICK_PICK_COUNTRIES = [
  { name: "United States", flag: "🇺🇸" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "France", flag: "🇫🇷" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "China", flag: "🇨🇳" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Indonesia", flag: "🇮🇩" },
];

const SHIP_MODE_CONFIG = {
  "Standard Class": { color: "#4f8ef7", bg: "bg-blue-500" },
  "Second Class": { color: "#06b6d4", bg: "bg-cyan-500" },
  "First Class": { color: "#f59e0b", bg: "bg-amber-500" },
  "Same Day": { color: "#ec4899", bg: "bg-pink-500" },
};

export default function LocationStatsCard({
  selectedLocation,
  locationMeta,
  globalKpi,
  dateFilters,
  onClearSelection,
  onApplyAsFilter,
  onSelectLocation,
  isFilteredByThisLocation,
}) {
  // Date modes: 'range' or 'single'
  const [dateMode, setDateMode] = useState("range");
  const [startDate, setStartDate] = useState(dateFilters?.date_start || "2011-01-01");
  const [endDate, setEndDate] = useState(dateFilters?.date_end || "2014-12-31");
  const [singleDate, setSingleDate] = useState("2014-12-30");

  const [stats, setStats] = useState(null);
  const [shipModes, setShipModes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync date inputs when parent dateFilters change
  useEffect(() => {
    if (dateFilters?.date_start) setStartDate(dateFilters.date_start);
    if (dateFilters?.date_end) setEndDate(dateFilters.date_end);
  }, [dateFilters?.date_start, dateFilters?.date_end]);

  // Determine effective query date range
  const isRange = dateMode === "range";
  const effectiveStart = isRange ? startDate : singleDate;
  const effectiveEnd = isRange ? endDate : singleDate;
  const isInvalidRange = isRange && startDate && endDate && startDate > endDate;

  // Fetch country KPI and ship modes
  const fetchCountryData = useCallback(async () => {
    if (!selectedLocation || isInvalidRange) return;

    setIsLoading(true);
    setError(null);

    try {
      const [kpiRes, shipRes] = await Promise.all([
        getKpi({
          country: selectedLocation,
          date_start: effectiveStart,
          date_end: effectiveEnd,
        }),
        getShipModes({
          country: selectedLocation,
          date_start: effectiveStart,
          date_end: effectiveEnd,
        }),
      ]);

      setStats(kpiRes || null);
      setShipModes(shipRes || []);
    } catch (err) {
      console.error(`Failed to load stats for ${selectedLocation}:`, err);
      setError(err.message || "Failed to load order data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, effectiveStart, effectiveEnd, isInvalidRange]);

  useEffect(() => {
    fetchCountryData();
  }, [fetchCountryData]);

  // Date Preset Handlers
  const handleRangePreset = (preset) => {
    setDateMode("range");
    if (preset === "all") {
      setStartDate("2011-01-01");
      setEndDate("2014-12-31");
    } else if (preset === "2014") {
      setStartDate("2014-01-01");
      setEndDate("2014-12-31");
    } else if (preset === "2013") {
      setStartDate("2013-01-01");
      setEndDate("2013-12-31");
    } else if (preset === "q4_2014") {
      setStartDate("2014-10-01");
      setEndDate("2014-12-31");
    }
  };

  const handleStepDay = (deltaDays) => {
    setDateMode("single");
    const parts = (singleDate || "2014-12-30").split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(Date.UTC(y, m, d + deltaDays));

    const minD = new Date(Date.UTC(2011, 0, 1));
    const maxD = new Date(Date.UTC(2014, 11, 31));
    let target = dt;
    if (target < minD) target = minD;
    if (target > maxD) target = maxD;

    setSingleDate(target.toISOString().substring(0, 10));
  };

  // Reconciled Metrics
  const countryMeta = selectedLocation
    ? SUPERSTORE_COUNTRIES[selectedLocation] || locationMeta || { region: "Global", market: "All" }
    : null;

  const currentStats = stats;
  const isProfitPositive = (currentStats?.total_profit ?? 0) >= 0;
  const profitMargin = currentStats?.profit_margin_pct ?? 0;
  const totalOrders = currentStats?.total_orders ?? 0;
  const totalRevenue = currentStats?.total_revenue ?? 0;
  const totalShipping = currentStats?.total_shipping_cost ?? 0;
  const totalQuantity = currentStats?.total_quantity ?? 0;

  const avgShippingPerOrder = totalOrders > 0 ? totalShipping / totalOrders : 0;
  const shippingSalesRatio = totalRevenue > 0 ? (totalShipping / totalRevenue) * 100 : 0;

  // 1. EMPTY / GLOBAL STATE (No country selected)
  if (!selectedLocation) {
    return (
      <div className="h-full flex flex-col justify-between rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#1A1828] p-5 sm:p-6 shadow-sm transition-colors min-h-[480px]">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-purple-100/60 dark:border-purple-950/30 pb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Country Performance Deep-Dive
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Select any highlighted country on the map or dropdown to inspect localized metrics
              </p>
            </div>
          </div>

          {/* Quick Picks Section */}
          <div className="mt-4">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <span>Quick Picks:</span>
              <span className="text-[11px] font-normal text-zinc-400">Popular store markets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_PICK_COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    if (onSelectLocation) {
                      onSelectLocation(c.name, SUPERSTORE_COUNTRIES[c.name]);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-100/80 dark:border-purple-950/60 bg-zinc-50 dark:bg-[#201D33] px-2.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-[#7C69EF] hover:text-[#7C69EF] transition-all text-left"
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Global Network Overview Fallback KPIs */}
          {globalKpi && (
            <div className="mt-5 pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center justify-between">
                <span>Global Baseline Catalog Summary</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  147 Countries Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                  <span className="text-[11px] font-medium text-zinc-400">Total Sales</span>
                  <div className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                    {formatCurrency(globalKpi.total_revenue, true)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {formatNumber(globalKpi.total_quantity)} units sold
                  </span>
                </div>

                <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                  <span className="text-[11px] font-medium text-zinc-400">Net Profit</span>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(globalKpi.total_profit, true)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Margin: {formatPercent(globalKpi.profit_margin_pct)}
                  </span>
                </div>

                <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                  <span className="text-[11px] font-medium text-zinc-400">Order Volume</span>
                  <div className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                    {formatNumber(globalKpi.total_orders)}
                  </div>
                  <span className="text-[10px] text-zinc-500">Transactions cataloged</span>
                </div>

                <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                  <span className="text-[11px] font-medium text-zinc-400">Shipping Cost</span>
                  <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {formatCurrency(globalKpi.total_shipping_cost, true)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Avg {formatCurrency(globalKpi.total_shipping_cost / (globalKpi.total_orders || 1))}/order
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-3 border-t border-purple-100/60 dark:border-purple-950/30 text-center text-xs text-zinc-400">
          💡 Click any country on the map to unlock localized order and logistics breakdowns.
        </div>
      </div>
    );
  }

  // 2. SELECTED COUNTRY DETAIL VIEW
  return (
    <div className="h-full flex flex-col justify-between rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#1A1828] p-5 sm:p-6 shadow-sm transition-colors min-h-[480px]">
      <div>
        {/* Country Header */}
        <div className="flex items-start justify-between gap-3 border-b border-purple-100/60 dark:border-purple-950/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  {selectedLocation}
                </h3>
                {countryMeta?.region && (
                  <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">
                    {countryMeta.region}
                  </span>
                )}
                {countryMeta?.market && (
                  <span className="rounded-full bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800 dark:text-purple-300">
                    {countryMeta.market}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Market analysis and localized supply metrics
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onApplyAsFilter && (
              <button
                type="button"
                onClick={() => onApplyAsFilter(selectedLocation)}
                title="Filter entire dashboard to this country"
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  isFilteredByThisLocation
                    ? "bg-purple-600 text-white shadow-xs"
                    : "border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
                }`}
              >
                <Filter className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {isFilteredByThisLocation ? "Active Filter" : "Focus"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              title="Clear country selection"
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Control Section (Reference Style) */}
        <div className="mt-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/30">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-xl bg-zinc-200/70 dark:bg-zinc-900/80 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  isRange
                    ? "bg-white dark:bg-[#7C69EF] text-zinc-900 dark:text-white font-bold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setDateMode("single")}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  !isRange
                    ? "bg-white dark:bg-[#7C69EF] text-zinc-900 dark:text-white font-bold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Single Day
              </button>
            </div>

            {/* Date Context Badge */}
            <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {isRange
                  ? `${startDate} → ${endDate}`
                  : `Day: ${singleDate}`}
              </span>
            </div>
          </div>

          {/* Date Range Mode Controls */}
          {isRange ? (
            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min="2011-01-01"
                    max="2014-12-31"
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-purple-100 dark:border-purple-950/60 bg-white dark:bg-[#1A1828] px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#7C69EF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min="2011-01-01"
                    max="2014-12-31"
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-purple-100 dark:border-purple-950/60 bg-white dark:bg-[#1A1828] px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#7C69EF]"
                  />
                </div>
              </div>

              {/* Range Presets */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/40 text-[11px]">
                <span className="text-zinc-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleRangePreset("all")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handleRangePreset("2014")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  2014
                </button>
                <button
                  type="button"
                  onClick={() => handleRangePreset("2013")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  2013
                </button>
                <button
                  type="button"
                  onClick={() => handleRangePreset("q4_2014")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  Q4 2014
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Single Day Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepDay(-1)}
                  title="Previous Day"
                  aria-label="Previous day"
                  className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <input
                  type="date"
                  value={singleDate}
                  min="2011-01-01"
                  max="2014-12-31"
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="flex-1 rounded-xl border border-purple-100 dark:border-purple-950/60 bg-white dark:bg-[#1A1828] px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#7C69EF]"
                />

                <button
                  type="button"
                  onClick={() => handleStepDay(1)}
                  title="Next Day"
                  aria-label="Next day"
                  className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sample Days */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/40 text-[11px]">
                <span className="text-zinc-400">Sample Days:</span>
                <button
                  type="button"
                  onClick={() => setSingleDate("2014-12-30")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  Dec 30, 2014
                </button>
                <button
                  type="button"
                  onClick={() => setSingleDate("2014-11-28")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  Nov 28, 2014
                </button>
                <button
                  type="button"
                  onClick={() => setSingleDate("2014-06-18")}
                  className="rounded-lg px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  Jun 18, 2014
                </button>
              </div>
            </div>
          )}
        </div>

        {/* State Banners: Loading / Error / Invalid Range / Zero Data */}
        {isInvalidRange ? (
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Invalid date range: Start date ({startDate}) is after End date ({endDate}).
            </span>
          </div>
        ) : error ? (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchCountryData}
              className="text-xs font-bold underline hover:text-rose-600"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-4 py-8 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-2" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Loading complete order records for {selectedLocation}...
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5">
              Reconciling sales, profit &amp; shipping measures
            </span>
          </div>
        ) : totalOrders === 0 ? (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/30 text-center">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              No transactions recorded for <strong>{selectedLocation}</strong> in this period.
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
              Try adjusting the date boundary or reset to all-time to view this country&apos;s catalog history.
            </p>
            <button
              type="button"
              onClick={() => handleRangePreset("all")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-200"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to All-Time</span>
            </button>
          </div>
        ) : (
          /* Live KPI Grid */
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Sales Tile */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium">Sales</span>
                  <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {formatNumber(totalQuantity)} total units sold
                </div>
              </div>

              {/* Net Profit Tile */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium">Net Profit</span>
                  {isProfitPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    isProfitPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isProfitPositive ? "+" : ""}
                  {formatCurrency(currentStats?.total_profit || 0)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Margin: {formatPercent(profitMargin)}
                </div>
              </div>

              {/* Order Volume Tile */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium">Order Volume</span>
                  <ShoppingBag className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                  {formatNumber(totalOrders)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Distinct order transactions
                </div>
              </div>

              {/* Shipping Cost Tile */}
              <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium">Shipping Cost</span>
                  <Truck className="h-3.5 w-3.5 text-sky-500" />
                </div>
                <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                  {formatCurrency(totalShipping)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Avg {formatCurrency(avgShippingPerOrder)}/order ({shippingSalesRatio.toFixed(1)}% of sales)
                </div>
              </div>
            </div>

            {/* Ship Mode Fulfillment Breakdown (Reference Layout) */}
            <div className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-[#201D33]/60 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <Truck className="h-3.5 w-3.5 text-[#7C69EF]" />
                  <span>Ship Mode Breakdown</span>
                </div>
                <span className="text-[11px] font-normal text-zinc-400">
                  {formatNumber(totalOrders)} orders
                </span>
              </div>

              <div className="space-y-2">
                {["Standard Class", "Second Class", "First Class", "Same Day"].map((modeName) => {
                  const cfg = SHIP_MODE_CONFIG[modeName] || { color: "#7C69EF", bg: "bg-purple-500" };
                  const item = shipModes.find((sm) => sm.ship_mode === modeName) || {
                    ship_mode: modeName,
                    order_count: 0,
                    orders: 0,
                    shipping_cost: 0,
                  };
                  const orderCount = item.order_count ?? item.orders ?? 0;
                  const pct = totalOrders > 0 ? (orderCount / totalOrders) * 100 : 0;

                  return (
                    <div key={modeName} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span>{modeName}</span>
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                          <strong className="text-zinc-800 dark:text-zinc-200">
                            {formatNumber(orderCount)} orders
                          </strong>{" "}
                          ({pct.toFixed(1)}%) &middot; {formatCurrency(item.shipping_cost, true)} ship
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cfg.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Coverage Note */}
      <div className="mt-4 pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            {totalOrders > 0
              ? `Reconciled from ${formatNumber(totalOrders)} orders in scope`
              : "0 matching records in date window"}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            totalOrders > 0
              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          }`}
        >
          {totalOrders > 0 ? "Complete Data" : "Zero Data"}
        </span>
      </div>
    </div>
  );
}
