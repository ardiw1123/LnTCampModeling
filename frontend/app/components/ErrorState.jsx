"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Terminal, Info } from "lucide-react";

export default function ErrorState({
  message,
  onRetry,
  isRetrying = false,
  isLocal,
}) {
  const [isLocalEnv, setIsLocalEnv] = useState(false);

  useEffect(() => {
    if (typeof isLocal === "boolean") {
      setIsLocalEnv(isLocal);
      return;
    }
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("env=local")) {
        setIsLocalEnv(true);
        return;
      }
      if (search.includes("env=deployed")) {
        setIsLocalEnv(false);
        return;
      }
      const host = window.location.hostname;
      const isLocalHost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "[::1]" ||
        host.endsWith(".local");
      setIsLocalEnv(isLocalHost);
    }
  }, [isLocal]);

  return (
    <div
      data-testid="analytics-error-state"
      className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-6 sm:p-8 text-center max-w-xl mx-auto shadow-sm"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto mb-4 border border-rose-200 dark:border-rose-800">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
        {isLocalEnv ? "Analytics Service Offline or Error" : "Analytics Service Temporarily Unavailable"}
      </h3>

      {isLocalEnv ? (
        <p
          data-testid="error-message"
          className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 mb-4 leading-relaxed"
        >
          {message || "Unable to reach the read-only analytics service. Make sure the analytics FastAPI backend is running locally."}
        </p>
      ) : (
        <>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 mb-3 leading-relaxed">
            The analytics service encountered an issue or is currently unreachable. Deployed visitors do not need to run local services.
          </p>
          <div
            data-testid="error-message"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100/70 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-mono text-xs mb-4 border border-rose-200/60 dark:border-rose-800/40 max-w-full truncate"
          >
            <span>{message || "Request failed or service unreachable"}</span>
          </div>
        </>
      )}

      {isLocalEnv ? (
        <div
          data-testid="local-dev-hint"
          className="rounded-2xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-950/40 p-3 sm:p-4 text-left font-mono text-xs text-zinc-700 dark:text-zinc-300 mb-6"
        >
          <div className="flex items-center gap-2 text-zinc-400 mb-1.5 text-[11px]">
            <Terminal className="h-3 w-3 text-[#7C69EF]" />
            <span>Start local analytics service:</span>
          </div>
          <code className="text-[#7C69EF] font-semibold select-all block bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl">
            uvicorn analytics.app:app --port 8001
          </code>
        </div>
      ) : (
        <div
          data-testid="deployed-guidance"
          className="rounded-2xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-950/40 p-4 text-left text-xs text-zinc-700 dark:text-zinc-300 mb-6 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-[#7C69EF] font-semibold text-xs">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Actionable Guidance</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The cloud analytics API is temporarily unavailable or restarting. Your browser and local machine do not require any configuration or running processes.
          </p>
          <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 pt-1.5 border-t border-purple-50 dark:border-purple-950/30">
            <li className="flex items-start gap-1.5">
              <span className="text-[#7C69EF] font-bold">•</span>
              <span>Click <strong>Retry Connection</strong> below to test if the service has recovered.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#7C69EF] font-bold">•</span>
              <span>If the problem persists, please check back shortly while the cloud service stabilizes.</span>
            </li>
          </ul>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          data-testid="retry-connection-button"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#7C69EF] hover:bg-[#6D58E2] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 text-xs shadow-md shadow-purple-500/25 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Reconnecting..." : "Retry Connection"}</span>
        </button>
      )}
    </div>
  );
}
