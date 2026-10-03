"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Percent, TrendingUp } from "lucide-react";

export default function ProfitMarginGaugeCard({ kpi, isLoading }) {
  const profitMargin = kpi?.profit_margin_pct ?? 11.6;
  const totalProfit = kpi?.total_profit ?? 0;
  const totalRevenue = kpi?.total_revenue ?? 0;

  // Generate tick dashes around an arc for radial gauge
  const totalTicks = 32;
  // Map margin percentage (0% to 25%) to tick count
  const normalizedMargin = Math.max(0, Math.min(profitMargin, 25));
  const activeTicks = Math.max(1, Math.round((normalizedMargin / 25) * totalTicks));
  const startAngle = 135; // degrees
  const sweepAngle = 270; // degrees

  const ticks = [];
  for (let i = 0; i < totalTicks; i++) {
    const angle = startAngle + (i / (totalTicks - 1)) * sweepAngle;
    const rad = (angle * Math.PI) / 180;
    const r1 = 62;
    const r2 = 72;
    const x1 = (100 + r1 * Math.cos(rad)).toFixed(3);
    const y1 = (100 + r1 * Math.sin(rad)).toFixed(3);
    const x2 = (100 + r2 * Math.cos(rad)).toFixed(3);
    const y2 = (100 + r2 * Math.sin(rad)).toFixed(3);

    const isActive = i < activeTicks;
    ticks.push({ x1, y1, x2, y2, isActive, index: i });
  }

  return (
    <div className="rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Profit Margin Rate
          </h2>
          <span className="text-[11px] text-zinc-400 font-medium">
            Financial Health
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100"></span>
            <span>Target (12%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#7C69EF]"></span>
            <span>Actual Margin</span>
          </div>
        </div>
      </div>

      {/* Radial Gauge Meter */}
      <div className="relative flex items-center justify-center my-3">
        <svg className="w-44 h-44 overflow-visible" viewBox="0 0 200 200">
          {ticks.map((tick) => (
            <line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isActive ? "#7C69EF" : "currentColor"}
              className={tick.isActive ? "" : "text-purple-100 dark:text-purple-950/60"}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Center reading */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight ${isLoading ? "animate-pulse" : ""}`}>
            {profitMargin}%
          </span>
          <span className="text-[11px] font-medium text-zinc-400 -mt-0.5">
            Net Margin
          </span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>Profit: <strong className="text-zinc-800 dark:text-zinc-200">{formatCurrency(totalProfit)}</strong></span>
        <span>Sales: <strong className="text-zinc-800 dark:text-zinc-200">{formatCurrency(totalRevenue)}</strong></span>
      </div>
    </div>
  );
}
