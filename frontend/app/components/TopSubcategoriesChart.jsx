"use client";

import React, { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Tag } from "lucide-react";

export default function TopSubcategoriesChart({ data = [], isLoading }) {
  const [limit, setLimit] = useState(8);

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
        <Tag className="h-8 w-8 text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No subcategory data</p>
      </div>
    );
  }

  const displayed = data.slice(0, limit);
  const maxSales = Math.max(...displayed.map((d) => d.sales || 0), 1);

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100/60 dark:border-purple-950/30">
        <div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">Top Product Sub-Categories</span>
          <span className="block text-[11px] text-zinc-400">Highest performing product lines</span>
        </div>

        {/* Limit Toggle */}
        <div className="flex items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => setLimit(5)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all ${
              limit === 5
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Top 5
          </button>
          <button
            type="button"
            onClick={() => setLimit(8)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all ${
              limit === 8
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Top 8
          </button>
          <button
            type="button"
            onClick={() => setLimit(12)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all ${
              limit === 12
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Ranked List with Bars */}
      <div className="my-4 space-y-3 overflow-y-auto max-h-56 pr-1">
        {displayed.map((item, idx) => {
          const widthPct = Math.max(8, ((item.sales || 0) / maxSales) * 100);
          const isPos = item.profit >= 0;

          return (
            <div key={item.sub_category} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-950 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-[#7C69EF] transition-colors">
                    {item.sub_category}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    {formatCurrency(item.sales, true)}
                  </span>
                  <span
                    className={`font-semibold ${
                      isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(item.profit, true)}
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C69EF] to-indigo-400 transition-all duration-300"
                  style={{ width: `${widthPct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Leader: <strong className="text-zinc-700 dark:text-zinc-300">{displayed[0]?.sub_category || "-"}</strong></span>
        <span>Sales &amp; Profit USD</span>
      </div>
    </div>
  );
}
