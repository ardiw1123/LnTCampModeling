"use client";

import React from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Truck, AlertTriangle, Users2, Clock } from "lucide-react";

export default function OperationsBreakdown({
  shipModes = [],
  priorities = [],
  segments = [],
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 animate-pulse">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-6 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-xl"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalPriorityOrders = priorities.reduce((sum, p) => sum + (p.order_count || 0), 0);
  const totalShipOrders = shipModes.reduce((sum, s) => sum + (s.order_count || 0), 0);
  const totalSegmentSales = segments.reduce((sum, s) => sum + (s.sales || 0), 0);

  const PRIORITY_COLORS = {
    Critical: "bg-rose-500 text-rose-300",
    High: "bg-amber-500 text-amber-300",
    Medium: "bg-[#7C69EF] text-purple-300",
    Low: "bg-zinc-400 text-zinc-300",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Shipping Mode & Delivery Speed */}
      <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
                <Truck className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Shipping Modes</span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Avg Lead Time</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Order fulfillment channels</p>
        </div>

        <div className="my-4 space-y-3">
          {shipModes.map((mode) => {
            const pct = totalShipOrders > 0 ? (mode.order_count / totalShipOrders) * 100 : 0;
            return (
              <div key={mode.ship_mode} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{mode.ship_mode}</span>
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3 text-purple-500" />
                    <span>{mode.avg_shipping_days?.toFixed(1) || "-"} days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                  <span>{formatNumber(mode.order_count)} orders</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(mode.total_sales, true)} ({formatPercent(pct)})</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7C69EF] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400">
          Standard Class handles bulk volume; Same Day provides rapid turnarounds.
        </div>
      </div>

      {/* 2. Order Priority Distribution */}
      <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Order Priority</span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Urgency Mix</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Order distribution by urgency</p>
        </div>

        <div className="my-4 space-y-3">
          {priorities.map((p) => {
            const pct = totalPriorityOrders > 0 ? (p.order_count / totalPriorityOrders) * 100 : 0;
            const badgeClass = PRIORITY_COLORS[p.order_priority] || "bg-zinc-400";

            return (
              <div key={p.order_priority} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                    <span className={`h-2 w-2 rounded-full ${badgeClass}`}></span>
                    {p.order_priority}
                  </span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatNumber(p.order_count)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                  <span>{formatPercent(pct)} of total</span>
                  <span>Avg ship: {p.avg_shipping_days?.toFixed(1) || "-"}d</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${badgeClass} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400">
          Critical &amp; High orders demand priority routing to protect SLA margins.
        </div>
      </div>

      {/* 3. Customer Segments */}
      <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
                <Users2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Customer Segments</span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Segment Share</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Performance across client archetypes</p>
        </div>

        <div className="my-4 space-y-3">
          {segments.map((s) => {
            const pct = totalSegmentSales > 0 ? (s.sales / totalSegmentSales) * 100 : 0;
            const margin = s.sales > 0 ? (s.profit / s.sales) * 100 : 0;

            return (
              <div key={s.segment} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{s.segment}</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{formatCurrency(s.sales, true)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                  <span>{formatNumber(s.customers)} customers • {formatNumber(s.orders)} orders</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatPercent(margin)} margin
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7C69EF] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400">
          Consumer segment constitutes &gt;50% of revenue with steady profit yields.
        </div>
      </div>
    </div>
  );
}
