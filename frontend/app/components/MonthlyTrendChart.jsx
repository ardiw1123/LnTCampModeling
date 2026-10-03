"use client";

import React, { useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export default function MonthlyTrendChart({ data = [], isLoading }) {
  const [metric, setMetric] = useState("sales"); // 'sales' | 'profit' | 'orders'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (isLoading) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 animate-pulse">
        <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-52 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 flex flex-col items-center justify-center text-center">
        <BarChart3 className="h-8 w-8 text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No trend data available</p>
        <p className="text-xs text-zinc-400">Try adjusting your date or country filters</p>
      </div>
    );
  }

  // Values calculation
  const values = data.map((d) => Number(d[metric] || 0));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const height = 180;
  const barWidth = Math.max(4, Math.min(18, 540 / data.length));

  const getMetricColor = (val) => {
    if (metric === "profit") {
      return val >= 0 ? "#10b981" : "#f43f5e";
    }
    if (metric === "orders") {
      return "#7C69EF"; // purple
    }
    return "#3b82f6"; // blue for sales
  };

  const getMetricLabel = () => {
    if (metric === "profit") return "Profit";
    if (metric === "orders") return "Orders";
    return "Revenue";
  };

  const formatVal = (val) => {
    if (metric === "orders") return formatNumber(val);
    return formatCurrency(val, true);
  };

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
      {/* Header with Title and Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Monthly Performance Trend</span>
            <span className="rounded-full bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
              {data.length} months
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {metric === "sales" ? "Total sales revenue" : metric === "profit" ? "Net profit margin" : "Order volume"} over time
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setMetric("sales")}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              metric === "sales"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setMetric("profit")}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              metric === "profit"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Profit
          </button>
          <button
            type="button"
            onClick={() => setMetric("orders")}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              metric === "orders"
                ? "bg-[#7C69EF] text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* SVG Bar Chart with Tooltips */}
      <div className="relative">
        {/* Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute top-0 right-0 z-20 pointer-events-none rounded-2xl border border-purple-100 dark:border-purple-900/60 bg-white/95 dark:bg-zinc-900/95 p-3 shadow-xl text-xs backdrop-blur-xs"
          >
            <div className="font-semibold text-zinc-900 dark:text-white">
              {data[hoveredIndex].year}-{String(data[hoveredIndex].month).padStart(2, "0")}
            </div>
            <div className="mt-1 space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                <span>Revenue:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(data[hoveredIndex].sales)}</span>
              </div>
              <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                <span>Profit:</span>
                <span className={`font-medium ${data[hoveredIndex].profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {formatCurrency(data[hoveredIndex].profit)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                <span>Orders:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{formatNumber(data[hoveredIndex].orders)}</span>
              </div>
            </div>
          </div>
        )}

        {/* SVG Container */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${Math.max(600, data.length * 20)} ${height + 30}`}
            className="w-full h-52 overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line x1="0" y1={height} x2="100%" y2={height} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />
            <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="4 4" strokeWidth="1" />

            {/* Zero line if profit has negative values */}
            {metric === "profit" && minVal < 0 && (
              <line
                x1="0"
                y1={height - (Math.abs(minVal) / range) * height}
                x2="100%"
                y2={height - (Math.abs(minVal) / range) * height}
                stroke="#a1a1aa"
                strokeWidth="1"
              />
            )}

            {/* Bars */}
            {data.map((item, index) => {
              const val = Number(item[metric] || 0);
              const barHeight = Math.max(2, (Math.abs(val) / maxVal) * height);
              const totalW = Math.max(600, data.length * 20);
              const step = totalW / data.length;
              const x = index * step + step / 2 - barWidth / 2;
              const y = height - barHeight;
              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={`${item.year}-${item.month}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity"
                >
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={getMetricColor(val)}
                    opacity={hoveredIndex === null || isHovered ? 0.9 : 0.35}
                    className="transition-all duration-150"
                  />
                  {/* Month Label */}
                  {(data.length <= 16 || index % 3 === 0) && (
                    <text
                      x={x + barWidth / 2}
                      y={height + 18}
                      fontSize="9"
                      fill="#a1a1aa"
                      textAnchor="middle"
                    >
                      {item.month === 1 || index === 0 ? `'${String(item.year).slice(2)}` : `M${item.month}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend / Range summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-purple-100/60 dark:border-purple-950/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getMetricColor(1) }}></span>
              <span>{getMetricLabel()}</span>
            </span>
            <span>Peak: {formatVal(maxVal)}</span>
          </div>
          <span className="text-[11px] text-zinc-400">Hover over bars for exact values</span>
        </div>
      </div>
    </div>
  );
}
