"use client";

import React from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  Percent,
  Truck,
  ArrowUpRight,
} from "lucide-react";

export default function KpiCards({ kpi, isLoading }) {
  if (isLoading || !kpi) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
            </div>
            <div className="h-7 w-32 bg-zinc-800 rounded"></div>
            <div className="h-3 w-20 bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const isProfitPositive = (kpi.total_profit ?? 0) >= 0;
  const isMarginPositive = (kpi.profit_margin_pct ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12141c]/95 p-5 shadow-lg transition-all hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Revenue</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatCurrency(kpi.total_revenue)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isMarginPositive
                  ? "bg-lime-400/10 text-lime-400 border border-lime-400/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isMarginPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(kpi.profit_margin_pct)} margin
            </span>
            <span className="text-[11px] text-zinc-500">of gross sales</span>
          </div>
        </div>
      </div>

      {/* 2. Total Profit */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12141c]/95 p-5 shadow-lg transition-all hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Net Profit</span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isProfitPositive
                ? "bg-lime-400/20 text-lime-400 border border-lime-400/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {isProfitPositive ? (
              <DollarSign className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight ${
              isProfitPositive ? "text-lime-300" : "text-rose-400"
            }`}
          >
            {formatCurrency(kpi.total_profit)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">
              Avg per order: <span className="font-semibold text-zinc-200">{formatCurrency((kpi.total_profit || 0) / (kpi.total_orders || 1))}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Total Orders & Items */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12141c]/95 p-5 shadow-lg transition-all hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Orders</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatNumber(kpi.total_orders)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              <Package className="h-3 w-3 text-zinc-400" />
              {formatNumber(kpi.total_items)} items
            </span>
            <span className="text-[11px] text-zinc-500">
              ({kpi.avg_items_per_order?.toFixed(1) || "2.0"} / order)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Total Customers & AOV */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12141c]/95 p-5 shadow-lg transition-all hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Customer Base</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatNumber(kpi.total_customers)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">
              Avg Order Value:{" "}
              <span className="font-semibold text-zinc-200">
                {formatCurrency(kpi.avg_order_value)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Secondary mini metrics strip */}
      <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Avg Discount</span>
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            {formatPercent(kpi.avg_discount_pct)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Shipping Cost</span>
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            {formatCurrency(kpi.total_shipping_cost, true)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Quantity Sold</span>
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            {formatNumber(kpi.total_quantity)} units
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-lime-400" />
            <span className="text-xs text-zinc-400">Avg Unit Price</span>
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            {kpi.total_quantity > 0
              ? formatCurrency(kpi.total_revenue / kpi.total_quantity)
              : "$0.00"}
          </span>
        </div>
      </div>
    </div>
  );
}
