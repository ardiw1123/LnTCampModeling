"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import SummaryMetricCards from "./components/SummaryMetricCards";
import CustomerPortfolioCard from "./components/CustomerPortfolioCard";
import ProfitMarginGaugeCard from "./components/ProfitMarginGaugeCard";
import OrderPrioritySummaryCard from "./components/OrderPrioritySummaryCard";
import ShipModeFulfillmentCard from "./components/ShipModeFulfillmentCard";
import MapOverviewCard from "./components/MapOverviewCard";
import FilterBar from "./components/FilterBar";
import ExplorationTable from "./components/ExplorationTable";
import OperationsBreakdown from "./components/OperationsBreakdown";
import InteractiveLocationMap from "./components/InteractiveLocationMap";
import LocationStatsCard from "./components/LocationStatsCard";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import CategoryDonutChart from "./components/CategoryDonutChart";
import MarketProfitChart from "./components/MarketProfitChart";
import TopSubcategoriesChart from "./components/TopSubcategoriesChart";
import RegionDrilldown from "./components/RegionDrilldown";
import PredictionView from "./components/PredictionView";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import { getDashboardSummary, getDateBounds, getCountries } from "@/lib/api";
import { SUPERSTORE_COUNTRIES } from "@/lib/superstoreCountries";
import {
  ShoppingBag,
  Truck,
  Globe2,
  BarChart2,
  BrainCircuit,
  ArrowRight,
  Search,
  X,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'orders' | 'shipments' | 'map' | 'prediction' | 'analytics'
  const [dateBounds, setDateBounds] = useState(null);
  const [countries, setCountries] = useState([]);
  const [filters, setFilters] = useState({
    date_start: undefined,
    date_end: undefined,
    country: undefined,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [showFilterBar, setShowFilterBar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationMeta, setSelectedLocationMeta] = useState(null);

  // Load initial date bounds and country list
  useEffect(() => {
    let isMounted = true;

    Promise.all([getDateBounds().catch(() => null), getCountries().catch(() => [])])
      .then(([bounds, countryList]) => {
        if (!isMounted) return;
        if (bounds) {
          setDateBounds(bounds);
          setFilters((prev) => ({
            ...prev,
            date_start: bounds.min_date,
            date_end: bounds.max_date,
          }));
        }
        if (countryList) {
          setCountries(countryList);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch dashboard summary data based on current filters
  const loadDashboard = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await getDashboardSummary(filters);
        setDashboardData(data);
        setError(null);

        // Recover dateBounds or countries if initial fetch failed during service outage
        if (data?.date_bounds && !dateBounds) {
          setDateBounds(data.date_bounds);
        }
        if (countries.length === 0) {
          getCountries()
            .then((list) => {
              if (list?.length) setCountries(list);
            })
            .catch(() => {});
        }
      } catch (err) {
        setError(err.message || "Failed to load analytics dashboard data.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, dateBounds, countries.length]
  );

  useEffect(() => {
    if (filters.date_start && filters.date_end && filters.date_start > filters.date_end) {
      return;
    }
    loadDashboard();
  }, [loadDashboard, filters]);

  // Synchronize selectedLocation with global country filter if single country is active
  useEffect(() => {
    if (filters.country) {
      const activeCountries = Array.isArray(filters.country) ? filters.country : [filters.country];
      if (activeCountries.length === 1 && selectedLocation !== activeCountries[0]) {
        setSelectedLocation(activeCountries[0]);
        setSelectedLocationMeta(SUPERSTORE_COUNTRIES[activeCountries[0]] || null);
      }
    }
  }, [filters.country, selectedLocation]);

  const handleSelectLocation = (locationName, meta) => {
    setSelectedLocation(locationName);
    setSelectedLocationMeta(meta);
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSelectedLocationMeta(null);
  };

  const handleApplyLocationFilter = (countryName) => {
    setFilters((prev) => {
      const isAlready = Array.isArray(prev.country)
        ? prev.country.includes(countryName)
        : prev.country === countryName;
      return {
        ...prev,
        country: isAlready ? undefined : [countryName],
      };
    });
  };

  const handleDateFilterChange = (dateUpdates) => {
    setFilters((prev) => ({
      ...prev,
      ...dateUpdates,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      date_start: dateBounds?.min_date,
      date_end: dateBounds?.max_date,
      country: undefined,
    });
    setSelectedLocation(null);
    setSelectedLocationMeta(null);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setShowSearchModal(false);
      setActiveTab("orders");
    }
  };

  const hasActiveFilters =
    Boolean(dateBounds && filters.date_start && filters.date_start !== dateBounds.min_date) ||
    Boolean(dateBounds && filters.date_end && filters.date_end !== dateBounds.max_date) ||
    Boolean(filters.country && filters.country.length > 0);

  const isZeroResults =
    dashboardData &&
    dashboardData.kpi &&
    dashboardData.kpi.total_orders === 0;

  return (
    <div className="min-h-screen bg-[#ECEAF8] text-zinc-900 dark:bg-[#0E0D18] dark:text-zinc-100 p-2 sm:p-4 lg:p-6 flex flex-col justify-start transition-colors duration-200">
      {/* Inner White / Dark Canvas Container */}
      <div className="max-w-[1600px] w-full mx-auto bg-white dark:bg-[#181628] rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-purple-950/5 dark:shadow-none border border-purple-100/70 dark:border-purple-900/30 overflow-hidden flex flex-col md:flex-row p-4 sm:p-6 lg:p-7 gap-6 lg:gap-8 min-h-[calc(100vh-3rem)]">
        {/* Left Sidebar Navigation (Desktop) */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
            onOpenSettings={() => setShowFilterBar((prev) => !prev)}
          />
        </div>

        {/* Mobile Navigation Drawer / Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#181628] p-4 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-purple-50 dark:border-purple-950/40">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                onOpenSettings={() => {
                  setShowFilterBar(true);
                  setIsMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <DashboardHeader
            onOpenPrediction={() => setActiveTab("prediction")}
            onToggleFilters={() => setShowFilterBar((prev) => !prev)}
            onSearchClick={() => setShowSearchModal(true)}
            onRefresh={() => loadDashboard(true)}
            isRefreshing={isRefreshing}
            filtersActive={hasActiveFilters}
            onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
            isMobileMenuOpen={isMobileMenuOpen}
          />

          {/* Collapsible / Expandable Global Filter Bar */}
          {showFilterBar && (
            <div className="my-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <FilterBar
                dateBounds={dateBounds}
                countries={countries}
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Active Filter Strip (visible when filters are active and FilterBar is closed) */}
          {hasActiveFilters && !showFilterBar && (
            <div className="my-3 flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-2 w-2 rounded-full bg-[#7C69EF] shrink-0" />
                <span className="font-bold text-zinc-900 dark:text-white">Active Scope:</span>
                {filters.date_start && filters.date_end && (filters.date_start !== dateBounds?.min_date || filters.date_end !== dateBounds?.max_date) && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold">
                    {filters.date_start === filters.date_end ? `Day: ${filters.date_start}` : `${filters.date_start} → ${filters.date_end}`}
                  </span>
                )}
                {filters.country && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold">
                    Country: {Array.isArray(filters.country) ? filters.country.join(", ") : filters.country}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFilterBar(true)}
                  className="text-xs font-semibold text-[#7C69EF] hover:underline"
                >
                  Adjust Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Reset Scope
                </button>
              </div>
            </div>
          )}

          {/* Error / Empty / Dynamic Content */}
          <div className="flex-1 mt-4">
            {error ? (
              <ErrorState
                message={error}
                onRetry={() => loadDashboard(true)}
                isRetrying={isRefreshing}
              />
            ) : isZeroResults ? (
              <EmptyState onReset={handleResetFilters} />
            ) : (
              <>
                {/* 1. DASHBOARD VIEW (Reference Redesign) */}
                {activeTab === "dashboard" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Top Row: 3 Summary Cards */}
                    <SummaryMetricCards
                      kpi={dashboardData?.kpi}
                      monthlyTrend={dashboardData?.monthly_trend}
                      isLoading={isLoading}
                    />

                    {/* Middle & Lower Grid: 3 Columns matching Reference */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Column 1: Customer Portfolio & Profit Margin Gauge */}
                      <div className="lg:col-span-4 flex flex-col gap-5">
                        <CustomerPortfolioCard
                          kpi={dashboardData?.kpi}
                          segmentStats={dashboardData?.segment_stats}
                          onNavigateCustomers={() => setActiveTab("orders")}
                        />
                        <ProfitMarginGaugeCard
                          kpi={dashboardData?.kpi}
                          isLoading={isLoading}
                        />
                      </div>

                      {/* Column 2: Order Priority SLA & Ship Mode Fulfillment */}
                      <div className="lg:col-span-4 flex flex-col gap-5">
                        <OrderPrioritySummaryCard
                          priorities={dashboardData?.orders_by_priority}
                          onNavigateOrders={() => setActiveTab("orders")}
                        />
                        <ShipModeFulfillmentCard
                          shipModes={dashboardData?.orders_by_shipmode}
                          kpi={dashboardData?.kpi}
                        />
                      </div>

                      {/* Column 3: Map Overview */}
                      <div className="lg:col-span-4">
                        <MapOverviewCard
                          onExploreFullMap={() => setActiveTab("map")}
                          totalCountries={countries?.length || 147}
                          globalCountryFilter={filters.country}
                          selectedLocation={selectedLocation}
                          onSelectLocation={handleSelectLocation}
                        />
                      </div>
                    </div>

                    {/* Shortcut Navigation Hub to Full Features */}
                    <div className="pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Full Analytics Modules
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Click any module for deep exploration
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab("orders")}
                          className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 text-left hover:border-[#7C69EF] dark:hover:border-[#7C69EF] transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <ShoppingBag className="h-4 w-4 text-[#7C69EF] group-hover:scale-110 transition-transform" />
                            <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-[#7C69EF] transition-colors" />
                          </div>
                          <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Orders Explorer
                          </span>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            51,290 records &amp; search
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("shipments")}
                          className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 text-left hover:border-[#7C69EF] dark:hover:border-[#7C69EF] transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Truck className="h-4 w-4 text-sky-500 group-hover:scale-110 transition-transform" />
                            <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-sky-500 transition-colors" />
                          </div>
                          <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Shipments &amp; SLA
                          </span>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            4 ship modes &amp; lead times
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("map")}
                          className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 text-left hover:border-[#7C69EF] dark:hover:border-[#7C69EF] transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Globe2 className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Global Map
                          </span>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            147 countries distribution
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab("analytics")}
                          className="rounded-2xl border border-purple-100/80 dark:border-purple-950/40 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 text-left hover:border-[#7C69EF] dark:hover:border-[#7C69EF] transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <BarChart2 className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                            <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-purple-600 transition-colors" />
                          </div>
                          <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Trends &amp; Insights
                          </span>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            Monthly &amp; category breakdown
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ORDERS VIEW */}
                {activeTab === "orders" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <ExplorationTable filters={filters} initialSearch={searchQuery} />
                  </div>
                )}

                {/* 3. SHIPMENTS & LOGISTICS VIEW */}
                {activeTab === "shipments" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <OperationsBreakdown
                      shipModes={dashboardData?.orders_by_shipmode}
                      priorities={dashboardData?.orders_by_priority}
                      segments={dashboardData?.segment_stats}
                      isLoading={isLoading}
                    />
                  </div>
                )}

                {/* 4. MAP OVERVIEW VIEW */}
                {activeTab === "map" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
                    <div className="lg:col-span-7 xl:col-span-8">
                      <InteractiveLocationMap
                        selectedLocation={selectedLocation}
                        onSelectLocation={handleSelectLocation}
                        dateFilters={filters}
                        globalCountryFilter={filters.country}
                        isLoadingDashboard={isLoading}
                        onApplyAsFilter={handleApplyLocationFilter}
                        isFilteredByThisLocation={
                          Boolean(
                            selectedLocation &&
                              filters.country &&
                              (Array.isArray(filters.country)
                                ? filters.country.includes(selectedLocation)
                                : filters.country === selectedLocation)
                          )
                        }
                      />
                    </div>
                    <div className="lg:col-span-5 xl:col-span-4">
                      <LocationStatsCard
                        selectedLocation={selectedLocation}
                        locationMeta={selectedLocationMeta}
                        globalKpi={dashboardData?.kpi}
                        dateFilters={filters}
                        onClearSelection={handleClearLocation}
                        onApplyAsFilter={handleApplyLocationFilter}
                        onSelectLocation={handleSelectLocation}
                        onDateFilterChange={handleDateFilterChange}
                        isFilteredByThisLocation={
                          Boolean(
                            selectedLocation &&
                              filters.country &&
                              (Array.isArray(filters.country)
                                ? filters.country.includes(selectedLocation)
                                : filters.country === selectedLocation)
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 5. AI PREDICTION VIEW */}
                {activeTab === "prediction" && (
                  <div className="animate-in fade-in duration-200">
                    <PredictionView />
                  </div>
                )}

                {/* 6. ANALYTICS DEEP DIVE VIEW */}
                {activeTab === "analytics" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Trend & Category */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <MonthlyTrendChart
                          data={dashboardData?.monthly_trend}
                          isLoading={isLoading}
                        />
                      </div>
                      <div>
                        <CategoryDonutChart
                          data={dashboardData?.sales_by_category}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>

                    {/* Market Comparison & Top Subcategories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <MarketProfitChart
                        data={dashboardData?.profit_by_market}
                        isLoading={isLoading}
                      />
                      <TopSubcategoriesChart
                        data={dashboardData?.top_subcategory}
                        isLoading={isLoading}
                      />
                    </div>

                    {/* Regional Drilldown */}
                    <RegionDrilldown
                      regionStats={dashboardData?.region_stats}
                      filters={filters}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#201D33] p-6 shadow-2xl border border-purple-100 dark:border-purple-950/60 z-50">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-950/40">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#7C69EF]" />
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  Search Superstore Records
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Search across 51,290 records. Matches <strong>Order ID</strong> (e.g. CA-2014-...), <strong>Customer Name</strong>, <strong>Product Name</strong>, or <strong>Country</strong>.
              </p>
              <input
                type="text"
                autoFocus
                placeholder="Search by Order ID, Customer Name, Product, or Country..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#7C69EF] focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#7C69EF] hover:bg-[#6D58E2] text-white px-5 py-2 text-xs font-semibold shadow-sm"
                >
                  Search Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
