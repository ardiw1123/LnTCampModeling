"use client";

import React from "react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Zap, ChevronRight, ShieldAlert, Clock, ArrowRight } from "lucide-react";

export default function OrderPrioritySummaryCard({ priorities = [], onNavigateOrders }) {
  const critical = priorities.find((p) => p.order_priority === "Critical") || {
    order_count: 1973,
    avg_shipping_days: 1.8,
    total_sales: 986258,
  };
  const high = priorities.find((p) => p.order_priority === "High") || {
    order_count: 7829,
    avg_shipping_days: 3.1,
    total_sales: 3807181,
  };
  const medium = priorities.find((p) => p.order_priority === "Medium") || {
    order_count: 14736,
    avg_shipping_days: 4.5,
    total_sales: 7281623,
  };
  const low = priorities.find((p) => p.order_priority === "Low") || {
    order_count: 1215,
    avg_shipping_days: 6.5,
    total_sales: 567843,
  };

  const totalPriorityOrders =
    (critical.order_count || 0) +
    (high.order_count || 0) +
    (medium.order_count || 0) +
    (low.order_count || 0);

  const displayList = [
    { label: "Critical", count: critical.order_count, days: critical.avg_shipping_days, color: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
    { label: "High", count: high.order_count, days: high.avg_shipping_days, color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
    { label: "Medium", count: medium.order_count, days: medium.avg_shipping_days, color: "bg-[#7C69EF]", text: "text-purple-600 dark:text-purple-400" },
    { label: "Low", count: low.order_count, days: low.avg_shipping_days, color: "bg-zinc-400", text: "text-zinc-500 dark:text-zinc-400" },
  ];

  return (
    <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
          Order Priority &amp; SLA
        </h2>
        <button
          type="button"
          onClick={onNavigateOrders}
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View orders</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Order Info Visual Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
        {/* Left: Purple Highlight Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#8A75F5] to-[#735DE6] text-white p-4 flex flex-col justify-between shadow-md shadow-purple-500/20">
          <div className="flex items-center justify-between text-xs font-bold tracking-wide">
            <span>High SLA Orders</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
              Expedited
            </span>
          </div>

          {/* SLA Icon & Lead Times */}
          <div className="my-2 flex flex-col items-center">
            <div className="flex items-center justify-center p-2 rounded-xl bg-white/20 backdrop-blur-xs mb-1">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="text-center">
              <span className="text-xl font-extrabold tracking-tight">
                {critical.avg_shipping_days} - {high.avg_shipping_days}
              </span>
              <span className="block text-[10px] text-white/80 font-medium">
                avg delivery days
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-white/90 border-t border-white/20 pt-2">
            <span>Critical &amp; High</span>
            <span>{formatNumber((critical.order_count || 0) + (high.order_count || 0))} orders</span>
          </div>
        </div>

        {/* Right: Priority Breakdown List */}
        <div className="flex flex-col justify-between pl-1">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Fulfillment Tiers
          </div>

          <div className="space-y-2.5 mt-2">
            {displayList.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className={`font-semibold ${item.text}`}>
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {formatNumber(item.count)}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">
                    ({item.days}d)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
          Total: <strong className="text-zinc-800 dark:text-zinc-200">{formatNumber(totalPriorityOrders)}</strong> categorized orders
        </span>

        <button
          type="button"
          onClick={onNavigateOrders}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#7C69EF] hover:underline"
        >
          <span>Explore</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
