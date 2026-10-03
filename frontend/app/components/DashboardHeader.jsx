"use client";

import React, { useState } from "react";
import {
  Bell,
  Search,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

export default function DashboardHeader({
  onOpenPrediction,
  onToggleFilters,
  onSearchClick,
  onRefresh,
  isRefreshing,
  filtersActive,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-purple-50 dark:border-purple-950/30">
      {/* Left: Greeting & Subtitle */}
      <div className="flex items-center justify-between sm:block">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, Jack!
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            51,290 historical orders across 147 global markets.
          </p>
        </div>

        {/* Mobile menu hamburger */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {/* Notifications Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <Bell className="h-4 w-4" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1f1c30] p-4 shadow-xl border border-purple-100 dark:border-purple-900/50 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  System Activity
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  Superstore Analytics
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      FastAPI Analytics Connected
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Port 8001 • SQLite database verified
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      AI Inference Engine Ready
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Late Delivery Classifier &amp; Profit Regressor active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search orders & records"
          title="Search orders & records"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors shadow-sm"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Filter Toggle / Message Button */}
        <button
          type="button"
          onClick={onToggleFilters}
          aria-label="Toggle filters"
          title="Toggle date & country filters"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors shadow-sm ${
            filtersActive
              ? "bg-[#7C69EF] text-white"
              : "bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh data"
          title="Refresh dashboard summary"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-purple-600" : ""}`} />
        </button>

        {/* Primary Action Button: "AI Order Predictor" */}
        <button
          type="button"
          onClick={onOpenPrediction}
          className="flex items-center gap-2 rounded-full bg-[#7C69EF] hover:bg-[#6D58E2] text-white px-4 sm:px-5 py-2 text-xs font-semibold shadow-md shadow-purple-500/25 transition-all active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Order Predictor</span>
        </button>
      </div>
    </header>
  );
}
