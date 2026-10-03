"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getRegionDrilldown } from "@/lib/api";
import { Compass, MapPin, Loader2 } from "lucide-react";

export default function RegionDrilldown({ regionStats = [], filters, isLoading: parentLoading }) {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [drilldownData, setDrilldownData] = useState(null);
  const [isLoadingDrilldown, setIsLoadingDrilldown] = useState(false);
  const [error, setError] = useState(null);

  // Set default region once regionStats are loaded
  useEffect(() => {
    if (regionStats.length > 0 && !selectedRegion) {
      setSelectedRegion(regionStats[0].region);
    }
  }, [regionStats, selectedRegion]);

  // Fetch drilldown data whenever selectedRegion or filters change
  useEffect(() => {
    if (!selectedRegion) return;

    let isMounted = true;
    setIsLoadingDrilldown(true);
    setError(null);

    getRegionDrilldown(selectedRegion, filters)
      .then((data) => {
        if (isMounted) {
          setDrilldownData(data);
          setIsLoadingDrilldown(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoadingDrilldown(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, filters]);

  if (parentLoading || regionStats.length === 0) {
    return (
      <div className="h-64 rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-5 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-44 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl"></div>
      </div>
    );
  }

  const currentRegionStat = regionStats.find((r) => r.region === selectedRegion);

  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-6 shadow-sm">
      {/* Header with region selection pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-100/60 dark:border-purple-950/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Regional Drilldown Explorer</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">In-depth geographical analysis by territory</p>
        </div>

        {/* Region selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {regionStats.slice(0, 7).map((r) => (
            <button
              key={r.region}
              type="button"
              onClick={() => setSelectedRegion(r.region)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRegion === r.region
                  ? "bg-[#7C69EF] text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {r.region}
            </button>
          ))}
        </div>
      </div>

      {/* Drilldown Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Region Snapshot */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              <MapPin className="h-3.5 w-3.5 text-[#7C69EF]" />
              <span>{selectedRegion} Overview</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {formatCurrency(currentRegionStat?.sales || 0)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatCurrency(currentRegionStat?.profit || 0)} profit
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {formatNumber(currentRegionStat?.orders || 0)} orders
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-100/60 dark:border-purple-950/30 text-[11px] text-zinc-400">
            Avg unit price: <strong className="text-zinc-700 dark:text-zinc-300">{formatCurrency(currentRegionStat?.avg_unit_price || 0)}</strong>
          </div>
        </div>

        {/* Top Subcategories in Region */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-4">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-2">
            Top Categories in {selectedRegion}
          </span>
          {isLoadingDrilldown ? (
            <div className="flex items-center justify-center h-28 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#7C69EF]" />
            </div>
          ) : drilldownData?.top_subcategories?.length > 0 ? (
            <div className="space-y-2">
              {drilldownData.top_subcategories.slice(0, 4).map((sub) => (
                <div key={sub.sub_category} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{sub.sub_category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{formatCurrency(sub.sales, true)}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(sub.profit, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 py-6 text-center">No categories found</div>
          )}
        </div>

        {/* Top Countries in Region */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-purple-50 dark:border-purple-950/40 p-4">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-2">
            Leading Countries in {selectedRegion}
          </span>
          {isLoadingDrilldown ? (
            <div className="flex items-center justify-center h-28 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#7C69EF]" />
            </div>
          ) : drilldownData?.top_countries?.length > 0 ? (
            <div className="space-y-2">
              {drilldownData.top_countries.slice(0, 4).map((cty) => (
                <div key={cty.country} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{cty.country}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{formatCurrency(cty.sales, true)}</span>
                    <span className="text-[11px] text-zinc-400">{formatNumber(cty.orders)} ord</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 py-6 text-center">No country details</div>
          )}
        </div>
      </div>
    </div>
  );
}
