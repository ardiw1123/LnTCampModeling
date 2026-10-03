"use client";

import React from "react";
import { FilterX, RotateCcw } from "lucide-react";

export default function EmptyState({ onReset }) {
  return (
    <div className="rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#201D33] p-12 text-center max-w-lg mx-auto shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF] mx-auto mb-4">
        <FilterX className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
        No Matching Superstore Records
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">
        No orders or transactions match the selected date window and country filters.
        Try broadening your date range or clearing specific country selections.
      </p>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#7C69EF] hover:bg-[#6D58E2] text-white font-bold px-4 py-2 text-xs shadow-md shadow-purple-500/25 transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
