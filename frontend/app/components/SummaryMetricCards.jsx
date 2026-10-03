"use client";

import React from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default function SummaryMetricCards({ kpi, monthlyTrend = [], isLoading }) {
  const totalOrders = kpi?.total_orders ?? 0;
  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalProfit = kpi?.total_profit ?? 0;
  const profitMargin = kpi?.profit_margin_pct ?? 0;
  const avgOrderValue = kpi?.avg_order_value ?? 0;

  // Derive last 4 monthly points if available for mini chart
  const recentTrend = monthlyTrend.length > 4 ? monthlyTrend.slice(-4) : monthlyTrend;
  const maxSales = Math.max(...recentTrend.map((t) => t.sales || 0), 1);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Total Order Volume */}
      <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex items-center justify-between transition-all hover:shadow-sm">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Orders
          </span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-800 shadow-sm shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight text-zinc-900 dark:text-white ${isLoading ? "opacity-70 animate-pulse" : ""}`}>
                {formatNumber(totalOrders)}
              </span>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                Volume
              </span>
            </div>
          </div>
        </div>

        {/* Mini monthly bar chart */}
        <div className="flex flex-col items-end">
          <div className="flex items-end gap-1.5 h-12">
            {recentTrend.length > 0 ? (
              recentTrend.map((item, idx) => {
                const heightPercent = Math.max(20, Math.round(((item.sales || 0) / maxSales) * 100));
                const isLast = idx === recentTrend.length - 1;
                return (
                  <div
                    key={idx}
                    title={`${item.year}-${item.month}: ${formatCurrency(item.sales)} (${item.orders} orders)`}
                    className={`w-2.5 rounded-t-sm transition-all ${
                      isLast
                        ? "bg-[#7C69EF] shadow-sm"
                        : "bg-purple-200 dark:bg-purple-900/60"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })
            ) : (
              <>
                <div className="w-2.5 h-6 bg-purple-200 dark:bg-purple-900/60 rounded-t-sm"></div>
                <div className="w-2.5 h-8 bg-purple-200 dark:bg-purple-900/60 rounded-t-sm"></div>
                <div className="w-2.5 h-7 bg-purple-300 dark:bg-purple-800/80 rounded-t-sm"></div>
                <div className="w-2.5 h-11 bg-[#7C69EF] rounded-t-sm shadow-sm"></div>
              </>
            )}
          </div>
          <div className="flex gap-1.5 text-[9px] text-zinc-400 mt-1 font-medium">
            {recentTrend.length > 0 ? (
              recentTrend.map((item, idx) => (
                <span
                  key={idx}
                  className={idx === recentTrend.length - 1 ? "text-[#7C69EF] dark:text-purple-400 font-bold" : ""}
                >
                  {monthNames[(item.month - 1) % 12] || `${item.month}`}
                </span>
              ))
            ) : (
              <>
                <span>Q1</span>
                <span>Q2</span>
                <span>Q3</span>
                <span className="text-[#7C69EF] dark:text-purple-400 font-bold">Q4</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Total Revenue */}
      <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex items-center justify-between transition-all hover:shadow-sm">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Revenue
          </span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-800 shadow-sm shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight text-zinc-900 dark:text-white ${isLoading ? "opacity-70 animate-pulse" : ""}`}>
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Avg Order: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(avgOrderValue)}</span>
          </div>
        </div>

        {/* Mini indicator bars */}
        <div className="flex flex-col items-end">
          <div className="flex items-end gap-1.5 h-12">
            {[14, 22, 18, 30, 24, 38].map((h, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C69EF] mb-0.5"></div>
                <div
                  className="w-1 bg-purple-200 dark:bg-purple-900/60 rounded-full"
                  style={{ height: `${h}px` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 text-[8px] text-zinc-400 mt-1 font-mono">
            <span>S1</span>
            <span>S2</span>
            <span>S3</span>
            <span>S4</span>
            <span>S5</span>
            <span>S6</span>
          </div>
        </div>
      </div>

      {/* 3. Total Net Profit & Margin */}
      <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex items-center justify-between transition-all hover:shadow-sm">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Net Profit
          </span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-800 shadow-sm shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight text-zinc-900 dark:text-white ${isLoading ? "opacity-70 animate-pulse" : ""}`}>
                {formatCurrency(totalProfit)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Margin: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{profitMargin}%</span>
          </div>
        </div>

        {/* Mini sparkline chart */}
        <div className="flex flex-col items-end">
          <svg className="w-24 h-12 overflow-visible" viewBox="0 0 100 40">
            <path
              d="M 5,30 Q 20,35 35,22 T 65,26 T 95,10"
              fill="none"
              stroke="#B8ABFA"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Dots */}
            <circle cx="5" cy="30" r="2.5" fill="#7C69EF" />
            <circle cx="35" cy="22" r="2.5" fill="#7C69EF" />
            <circle cx="65" cy="26" r="2.5" fill="#7C69EF" />
            <circle cx="95" cy="10" r="3" fill="#7C69EF" />
          </svg>
          <div className="flex gap-1 text-[8px] text-zinc-400 mt-1 font-mono">
            <span>Trend</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">Positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
