"use client";

import React from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Users, ChevronRight, Tag, Layers, ShoppingCart } from "lucide-react";

export default function CustomerPortfolioCard({ kpi, segmentStats = [], onNavigateCustomers }) {
  const topSegment = segmentStats && segmentStats.length > 0 ? segmentStats[0] : null;
  const segmentName = topSegment?.segment || "Consumer";
  const segmentOrders = topSegment?.orders ? formatNumber(topSegment.orders) : "26,518";
  const segmentSales = topSegment?.sales ? formatCurrency(topSegment.sales) : "$6.51M";

  const totalCustomers = kpi?.total_customers ? formatNumber(kpi.total_customers) : "4,873";
  const avgItemsPerOrder = kpi?.avg_items_per_order ?? "3.4";
  const avgDiscount = kpi?.avg_discount_pct !== undefined ? `${kpi.avg_discount_pct}%` : "14.3%";

  return (
    <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Customer &amp; Order Portfolio
          </h2>
          <span className="text-[11px] text-zinc-400 font-medium">
            Active Accounts
          </span>
        </div>

        {/* 3 Metric Chips */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-purple-50 dark:border-purple-950/40 p-2.5 text-center shadow-2xs">
            <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate">
              {totalCustomers}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Customers</span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-purple-50 dark:border-purple-950/40 p-2.5 text-center shadow-2xs">
            <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate">
              {avgItemsPerOrder}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Items/Order</span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-purple-50 dark:border-purple-950/40 p-2.5 text-center shadow-2xs">
            <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate">
              {avgDiscount}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">Avg Discount</span>
          </div>
        </div>
      </div>

      {/* Segment Highlight */}
      <div className="mt-5 pt-4 border-t border-purple-100/60 dark:border-purple-950/30">
        <span className="block text-[11px] font-medium text-zinc-400 mb-2">Top Customer Segment</span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C69EF] ring-2 ring-purple-100 dark:ring-purple-900/40">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white">
                {segmentName} Segment
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {segmentOrders} orders • {segmentSales}
              </div>
            </div>
          </div>

          {/* Action Explore Button */}
          <button
            type="button"
            onClick={onNavigateCustomers}
            aria-label="View customer records"
            title="Explore customers in records table"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C69EF] text-white hover:bg-[#6D58E2] transition-colors shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
