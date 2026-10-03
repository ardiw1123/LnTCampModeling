"use client";

import React, { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PieChart } from "lucide-react";

export default function CategoryDonutChart({ data = [], isLoading }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  if (isLoading) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-48 w-48 rounded-full bg-zinc-100 dark:bg-zinc-800/50 mx-auto"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 flex flex-col items-center justify-center text-center">
        <PieChart className="h-8 w-8 text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No category data</p>
      </div>
    );
  }

  const totalSales = data.reduce((acc, curr) => acc + Number(curr.sales || 0), 0);

  const CATEGORY_COLORS = {
    Technology: "#7C69EF", // Purple
    Furniture: "#3b82f6", // Blue
    "Office Supplies": "#10b981", // Emerald
  };

  const DEFAULT_COLORS = ["#7C69EF", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  // SVG Donut calculation
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce((acc, item, index) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    const val = Number(item.sales || 0);
    const pct = totalSales > 0 ? val / totalSales : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -prevOffset;
    const nextOffset = prevOffset + pct * circumference;
    const color =
      CATEGORY_COLORS[item.category] ||
      DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    acc.push({
      ...item,
      pct,
      color,
      strokeDasharray,
      strokeDashoffset,
      nextOffset,
    });
    return acc;
  }, []);

  const activeItem = segments.find((s) => s.category === hoveredCategory);

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100/60 dark:border-purple-950/30">
        <div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">Sales by Category</span>
          <span className="block text-[11px] text-zinc-400">Product sector distribution</span>
        </div>
        <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Composition</span>
      </div>

      {/* Donut and Legend */}
      <div className="my-4 flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth={strokeWidth}
            />
            {/* Segments */}
            {segments.map((seg) => (
              <circle
                key={seg.category}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoveredCategory === seg.category ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(seg.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            ))}
          </svg>

          {/* Center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              {activeItem ? activeItem.category : "Total"}
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              {activeItem
                ? formatPercent(activeItem.pct * 100)
                : formatCurrency(totalSales, true)}
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="space-y-2.5 w-full sm:w-auto">
          {segments.map((seg) => (
            <div
              key={seg.category}
              onMouseEnter={() => setHoveredCategory(seg.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center justify-between gap-4 p-2 rounded-2xl cursor-pointer transition-colors ${
                hoveredCategory === seg.category ? "bg-purple-50 dark:bg-purple-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                ></span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{seg.category}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  {formatCurrency(seg.sales, true)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {formatPercent(seg.pct * 100)} •{" "}
                  <span className={seg.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
                    {formatCurrency(seg.profit, true)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400 text-center sm:text-left">
        Technology leads in margin efficiency, while Office Supplies drives volume.
      </div>
    </div>
  );
}
