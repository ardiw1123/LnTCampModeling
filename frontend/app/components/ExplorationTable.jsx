"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { getExplorationData } from "@/lib/api";
import {
  Table,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  Users,
  MapPin,
  Loader2,
  FileSpreadsheet,
  X,
  RotateCcw,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function ExplorationTable({ filters, initialSearch = "" }) {
  const [resource, setResource] = useState("orders"); // 'orders' | 'products' | 'customers' | 'locations'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [submittedQuery, setSubmittedQuery] = useState(initialSearch);
  const [result, setResult] = useState({ total: 0, page: 1, limit: 10, data: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync initialSearch when parent passes a new search
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
      setSubmittedQuery(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  // Debounced auto-search (350ms) for responsive search experience
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (trimmed !== submittedQuery) {
        setSubmittedQuery(trimmed);
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, submittedQuery]);

  const handleResourceChange = (newResource) => {
    setResource(newResource);
    setPage(1);
    setSearchQuery("");
    setSubmittedQuery("");
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSubmittedQuery("");
    setPage(1);
  };

  // Fetch paginated data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getExplorationData(resource, {
      page,
      limit,
      q: submittedQuery || undefined,
      date_start: filters.date_start,
      date_end: filters.date_end,
      country: filters.country,
    })
      .then((data) => {
        if (isMounted) {
          setResult(data || { total: 0, page: 1, limit: 10, data: [] });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [resource, page, limit, submittedQuery, filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((result.total || 0) / limit));

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 sm:p-6 shadow-sm">
      {/* Top Header & Resource Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100/60 dark:border-purple-950/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Dataset Exploration Browser
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Filtered records dynamically queried from SQLite
          </p>
        </div>

        {/* Resource Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
          <button
            type="button"
            onClick={() => handleResourceChange("orders")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              resource === "orders"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Orders</span>
          </button>
          <button
            type="button"
            onClick={() => handleResourceChange("products")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              resource === "products"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Products</span>
          </button>
          <button
            type="button"
            onClick={() => handleResourceChange("customers")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              resource === "customers"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Customers</span>
          </button>
          <button
            type="button"
            onClick={() => handleResourceChange("locations")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              resource === "locations"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Locations</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar inside table */}
      <div className="py-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder={
                resource === "orders"
                  ? "Search orders by Order ID, Customer, Product, or Country..."
                  : resource === "locations"
                  ? "Search locations by City (e.g. Jakarta), State, Country, or Region..."
                  : resource === "products"
                  ? "Search products by Product Name, Category, or Sub-Category..."
                  : "Search customers by Customer Name or Segment..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 pl-9 pr-24 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:border-[#7C69EF] focus:outline-none"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Clear search input"
                  aria-label="Clear search input"
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-[#7C69EF] text-white text-[11px] font-semibold px-2.5 py-1 shadow-sm hover:bg-[#6D58E2] transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>
              Total: <strong className="text-zinc-800 dark:text-zinc-200">{formatNumber(result.total)}</strong> records
            </span>
          </div>
        </div>

        {/* Search Scope Hint for Current Resource */}
        <p className="text-[11px] text-zinc-400">
          {resource === "orders" && (
            <span>Supported fields: <strong>Order ID</strong> (e.g. CA-2014-...), <strong>Customer Name</strong>, <strong>Product Name</strong>, and <strong>Country</strong>.</span>
          )}
          {resource === "locations" && (
            <span>Supported fields: <strong>City</strong> (e.g. Jakarta, New York), <strong>State</strong>, <strong>Country</strong>, and <strong>Region</strong>.</span>
          )}
          {resource === "products" && (
            <span>Supported fields: <strong>Product Name</strong>, <strong>Category</strong>, and <strong>Sub-Category</strong>.</span>
          )}
          {resource === "customers" && (
            <span>Supported fields: <strong>Customer Name</strong> and <strong>Segment</strong> (Consumer, Corporate, Home Office).</span>
          )}
          {" "}Auto-searches as you type, or press Enter/Search to submit immediately.
        </p>

        {/* Active Search Indicator */}
        {submittedQuery && (
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#7C69EF]" />
              <span className="text-zinc-700 dark:text-zinc-300">
                Active search: <strong className="text-purple-700 dark:text-purple-300">&ldquo;{submittedQuery}&rdquo;</strong>
              </span>
              <span className="text-zinc-400">&middot;</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Narrowed to <strong className="text-zinc-800 dark:text-zinc-200">{formatNumber(result.total)}</strong> records
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline"
            >
              <X className="h-3 w-3" />
              <span>Clear search (restore full list)</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-purple-100/70 dark:border-purple-950/40 bg-zinc-50/50 dark:bg-zinc-900/40 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#7C69EF] mb-2" />
            <span className="text-xs">Querying database records...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-rose-500">
            <span className="text-sm font-semibold">Error querying data</span>
            <span className="text-xs text-zinc-400 mt-1">{error}</span>
          </div>
        ) : result.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-[#7C69EF] mb-3">
              <Search className="h-6 w-6" />
            </div>
            {submittedQuery ? (
              <>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  No records matching &ldquo;{submittedQuery}&rdquo;
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                  Searched across Order ID, Customer Name, Product Name, and Country. Check for typos or clear your search term to restore the full records.
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7C69EF] text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-[#6D58E2] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Search Query</span>
                </button>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  No records match current filters
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                  The active date range or country filter returned 0 matching records. Try expanding your date range or clearing country selections.
                </p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="border-b border-purple-100/80 dark:border-purple-950/40 bg-purple-50/50 dark:bg-zinc-800/80 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              {resource === "orders" && (
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product / Category</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Ship Mode</th>
                  <th className="px-4 py-3">Order Date</th>
                </tr>
              )}
              {resource === "products" && (
                <tr>
                  <th className="px-4 py-3">Product ID</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sub-Category</th>
                  <th className="px-4 py-3 text-right">Avg Sales</th>
                  <th className="px-4 py-3 text-right">Total Profit</th>
                  <th className="px-4 py-3 text-center">Times Sold</th>
                </tr>
              )}
              {resource === "customers" && (
                <tr>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3 text-center">Total Orders</th>
                  <th className="px-4 py-3 text-right">Total Sales</th>
                  <th className="px-4 py-3 text-right">Total Profit</th>
                  <th className="px-4 py-3 text-right">Avg Discount</th>
                </tr>
              )}
              {resource === "locations" && (
                <tr>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3 text-center">Total Orders</th>
                  <th className="px-4 py-3 text-right">Total Sales</th>
                  <th className="px-4 py-3 text-right">Total Profit</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-purple-50 dark:divide-purple-950/20">
              {resource === "orders" &&
                result.data.map((row, idx) => (
                  <tr key={row.row_id ? `order-${row.row_id}` : `order-${row.order_id_raw}-${row.product_name}-${idx}`} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-purple-600 dark:text-purple-400">
                      {row.order_id_raw}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                      {row.customer_name}
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        {row.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={row.product_name}>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {row.product_name}
                      </span>
                      <span className="block text-[10px] text-zinc-400">
                        {row.category} &gt; {row.sub_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(row.sales)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-zinc-800 dark:text-zinc-200">
                        {row.city}
                      </span>
                      <span className="block text-[10px] text-zinc-400">
                        {row.country}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                        {row.ship_mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                      {formatDate(row.order_date)}
                    </td>
                  </tr>
                ))}

              {resource === "products" &&
                result.data.map((row, idx) => (
                  <tr key={row.product_id ? `prod-${row.product_id}` : `prod-${row.product_name}-${idx}`} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400">
                      {row.product_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white max-w-[240px] truncate" title={row.product_name}>
                      {row.product_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.category}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.sub_category}</td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(row.avg_sales)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.total_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(row.total_profit)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {formatNumber(row.times_sold)}
                    </td>
                  </tr>
                ))}

              {resource === "customers" &&
                result.data.map((row, idx) => (
                  <tr key={row.customer_id ? `cust-${row.customer_id}` : `cust-${row.customer_name}-${idx}`} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400">
                      {row.customer_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                      {row.customer_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.segment}</td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {formatNumber(row.total_orders)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(row.total_sales)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.total_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(row.total_profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {formatPercent(row.avg_discount)}
                    </td>
                  </tr>
                ))}

              {resource === "locations" &&
                result.data.map((row, idx) => (
                  <tr key={row.location_id ? `loc-${row.location_id}` : `loc-${row.city}-${row.country}-${idx}`} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{row.city}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.state}</td>
                    <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 font-medium">{row.country}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.region}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.market}</td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {formatNumber(row.total_orders)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(row.total_sales)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.total_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(row.total_profit)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-purple-100/60 dark:border-purple-950/30 text-xs">
        <span className="text-zinc-500">
          {result.total > 0 ? (
            <>
              Showing page <strong className="text-zinc-800 dark:text-zinc-200">{page}</strong> of{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{totalPages}</strong> &middot;{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{formatNumber(result.total)}</strong> total matching records
            </>
          ) : (
            <span>0 matching records found</span>
          )}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading || result.total === 0}
            className="flex items-center gap-1 rounded-xl border border-purple-100 dark:border-purple-950/40 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading || result.total === 0}
            className="flex items-center gap-1 rounded-xl border border-purple-100 dark:border-purple-950/40 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
