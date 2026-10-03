"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center max-w-xl mx-auto shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto mb-4 border border-rose-200 dark:border-rose-800">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white">Analytics Service Offline or Error</h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 mb-4 leading-relaxed">
        {message || "Unable to reach the read-only analytics service. Make sure the analytics FastAPI backend is running."}
      </p>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-950/40 p-3 text-left font-mono text-xs text-zinc-700 dark:text-zinc-300 mb-6">
        <div className="flex items-center gap-2 text-zinc-400 mb-1.5 text-[11px]">
          <Terminal className="h-3 w-3" />
          <span>Start local analytics service:</span>
        </div>
        <code className="text-[#7C69EF] font-semibold select-all">uvicorn analytics.app:app --port 8001</code>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#7C69EF] hover:bg-[#6D58E2] text-white font-bold px-4 py-2 text-xs shadow-md shadow-purple-500/25 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
