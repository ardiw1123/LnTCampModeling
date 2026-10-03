"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Globe } from "lucide-react";

export default function MarketProfitChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 animate-pulse">
        <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 flex flex-col items-center justify-center text-center">
        <Globe className="h-8 w-8 text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No market data</p>
      </div>
    );
  }

  // Sort by sales descending
  const sorted = [...data].sort((a, b) => (b.sales || 0) - (a.sales || 0));
  const maxSales = Math.max(...sorted.map((d) => d.sales || 0), 1);

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-purple-100/60 dark:border-purple-950/30">
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Profitability by Market</span>
            <span className="block text-[11px] text-zinc-400">Regional market comparison</span>
          </div>
          <span className="rounded-full bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
            {sorted.length} regions
          </span>
        </div>
      </div>

      {/* Market Bars */}
      <div className="my-4 space-y-3">
        {sorted.map((m) => {
          const salesPct = Math.min(100, Math.max(5, ((m.sales || 0) / maxSales) * 100));
          const profitMargin = m.sales > 0 ? (m.profit / m.sales) * 100 : 0;
          const isProfitPos = m.profit >= 0;

          return (
            <div key={m.market} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-[#7C69EF] transition-colors">
                  {m.market}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400">{formatCurrency(m.sales, true)}</span>
                  <span
                    className={`font-semibold ${
                      isProfitPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(m.profit, true)} ({formatPercent(profitMargin)})
                  </span>
                </div>
              </div>

              {/* Stacked bar representation */}
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                <div
                  className="h-full rounded-full bg-[#7C69EF] transition-all duration-300"
                  style={{ width: `${salesPct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#7C69EF]"></span>
            <span>Sales</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Profit Margin</span>
          </span>
        </div>
        <span>Ordered by gross sales volume</span>
      </div>
    </div>
  );
}
