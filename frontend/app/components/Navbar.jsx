"use client";

import React from "react";
import { BarChart3, BrainCircuit, Search, Database, RefreshCw, CheckCircle2 } from "lucide-react";

export default function Navbar({ activeTab, onTabChange, onSearchSubmit, searchValue, onSearchChange, onRefresh, isRefreshing }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(searchValue);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#0c0d12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black shadow-lg shadow-lime-400/20 font-bold">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">StoreIQ</span>
                <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-lime-400 border border-lime-400/30">
                  ANALYTICS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Global Superstore Dataset</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "analytics"}
              onClick={() => onTabChange("analytics")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "analytics"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-lime-400" />
              <span>Overview & Insights</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "prediction"}
              onClick={() => onTabChange("prediction")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "prediction"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
              <span>AI Prediction</span>
            </button>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSubmit} className="relative hidden sm:block w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search data records..."
              value={searchValue || ""}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/40 transition-all"
            />
          </form>

          {/* Dataset Status Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-zinc-400">DB:</span>
            <span className="text-[11px] font-semibold text-zinc-200">superstore.sqlite</span>
            <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-0.5" />
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
            title="Refresh dashboard data"
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-lime-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-2 justify-around">
        <button
          onClick={() => onTabChange("analytics")}
          className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-lg ${
            activeTab === "analytics" ? "bg-zinc-800 text-lime-400" : "text-zinc-400"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onTabChange("prediction")}
          className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-lg ${
            activeTab === "prediction" ? "bg-zinc-800 text-cyan-400" : "text-zinc-400"
          }`}
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          <span>AI Prediction</span>
        </button>
      </div>
    </header>
  );
}
