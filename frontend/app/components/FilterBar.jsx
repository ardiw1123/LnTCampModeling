"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Globe2,
  RotateCcw,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";

export default function FilterBar({
  dateBounds,
  countries = [],
  filters,
  onFilterChange,
  onResetFilters,
  isLoading,
}) {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minDate = dateBounds?.min_date || "2011-01-01";
  const maxDate = dateBounds?.max_date || "2014-12-31";

  const isInvalidDateRange =
    filters.date_start &&
    filters.date_end &&
    filters.date_start > filters.date_end;

  const activeCountries = Array.isArray(filters.country)
    ? filters.country
    : filters.country
    ? [filters.country]
    : [];

  const hasActiveFilters =
    Boolean(filters.date_start && filters.date_start !== minDate) ||
    Boolean(filters.date_end && filters.date_end !== maxDate) ||
    activeCountries.length > 0;

  const isCurrentlySingleDay = Boolean(
    filters.date_start &&
      filters.date_end &&
      filters.date_start === filters.date_end
  );

  const [dateMode, setDateMode] = useState(
    isCurrentlySingleDay ? "day" : "range"
  );

  // Sync dateMode if parent updates single-day filter
  useEffect(() => {
    if (
      filters.date_start &&
      filters.date_end &&
      filters.date_start === filters.date_end
    ) {
      setDateMode("day");
    }
  }, [filters.date_start, filters.date_end]);

  const handleSetDateMode = (mode) => {
    setDateMode(mode);
    if (mode === "day") {
      const targetDay = filters.date_end || maxDate;
      onFilterChange({
        ...filters,
        date_start: targetDay,
        date_end: targetDay,
      });
    } else {
      onFilterChange({
        ...filters,
        date_start: minDate,
        date_end: maxDate,
      });
    }
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      date_start: val,
    });
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      date_end: val,
    });
  };

  const handleSingleDayChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      date_start: val,
      date_end: val,
    });
  };

  const handleStepDay = (step) => {
    const current = new Date(filters.date_start || maxDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + step);
    const nextStr = current.toISOString().split("T")[0];

    if (nextStr >= minDate && nextStr <= maxDate) {
      onFilterChange({
        ...filters,
        date_start: nextStr,
        date_end: nextStr,
      });
    }
  };

  const handlePresetDate = (start, end) => {
    setDateMode("range");
    onFilterChange({
      ...filters,
      date_start: start,
      date_end: end,
    });
  };

  const toggleCountry = (countryName) => {
    let next;
    if (activeCountries.includes(countryName)) {
      next = activeCountries.filter((c) => c !== countryName);
    } else {
      next = [...activeCountries, countryName];
    }
    onFilterChange({
      ...filters,
      country: next.length > 0 ? next : undefined,
    });
  };

  const clearAllCountries = () => {
    onFilterChange({
      ...filters,
      country: undefined,
    });
    setIsCountryOpen(false);
  };

  const removeCountry = (c) => {
    const next = activeCountries.filter((item) => item !== c);
    onFilterChange({
      ...filters,
      country: next.length > 0 ? next : undefined,
    });
  };

  const filteredCountries = countries.filter((c) =>
    c.country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="w-full rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white/90 dark:bg-[#201D33]/90 p-4 sm:p-5 shadow-sm backdrop-blur-md">
      {/* Scope banner explaining what these filters affect */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-purple-100/60 dark:border-purple-950/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#7C69EF]" />
          <span className="font-bold text-zinc-900 dark:text-white">Global Scope Filters</span>
          <span className="text-zinc-400 hidden sm:inline">&middot;</span>
          <span className="text-zinc-500 dark:text-zinc-400">
            Narrows all dashboard KPI cards, trend charts, category distributions, map activity, and exploration records
          </span>
        </div>
        <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
          {hasActiveFilters ? "Active Filters Applied" : "All Time • 147 Countries"}
        </div>
      </div>

      {/* Top row: controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Date Filtering (Range or Single Day) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
              <Calendar className="h-4 w-4" />
            </div>
            {/* Mode switch: Range vs Single Day */}
            <div className="flex items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSetDateMode("range")}
                className={`rounded-xl px-2.5 py-1 transition-colors ${
                  dateMode === "range"
                    ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => handleSetDateMode("day")}
                className={`rounded-xl px-2.5 py-1 transition-colors ${
                  dateMode === "day"
                    ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Single Day
              </button>
            </div>
          </div>

          {/* Controls based on active dateMode */}
          {dateMode === "range" ? (
            <>
              {/* Quick preset buttons */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => handlePresetDate(minDate, maxDate)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    (!filters.date_start || filters.date_start === minDate) &&
                    (!filters.date_end || filters.date_end === maxDate)
                      ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("2014-01-01", "2014-12-31")}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    filters.date_start === "2014-01-01" && filters.date_end === "2014-12-31"
                      ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  2014
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("2013-01-01", "2013-12-31")}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    filters.date_start === "2013-01-01" && filters.date_end === "2013-12-31"
                      ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  2013
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("2012-01-01", "2012-12-31")}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    filters.date_start === "2012-01-01" && filters.date_end === "2012-12-31"
                      ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  2012
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetDate("2011-01-01", "2011-12-31")}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    filters.date_start === "2011-01-01" && filters.date_end === "2011-12-31"
                      ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  2011
                </button>
              </div>

              {/* Date inputs */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  aria-label="Start date"
                  value={filters.date_start || minDate}
                  min={minDate}
                  max={maxDate}
                  onChange={handleStartDateChange}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                />
                <span className="text-zinc-400 text-xs font-medium">to</span>
                <input
                  type="date"
                  aria-label="End date"
                  value={filters.date_end || maxDate}
                  min={minDate}
                  max={maxDate}
                  onChange={handleEndDateChange}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Single Day Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepDay(-1)}
                  title="Previous Day"
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  aria-label="Single Day selector"
                  value={filters.date_start || maxDate}
                  min={minDate}
                  max={maxDate}
                  onChange={handleSingleDayChange}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-[#7C69EF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStepDay(1)}
                  title="Next Day"
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-purple-100 dark:border-purple-950/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Single Day Presets */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {[
                  { label: "Peak (2014-11-18)", day: "2014-11-18" },
                  { label: "Cyber Mon (2014-12-01)", day: "2014-12-01" },
                  { label: "Latest (2014-12-31)", day: "2014-12-31" },
                  { label: "Mid-2013 (2013-06-15)", day: "2013-06-15" },
                ].map((preset) => (
                  <button
                    key={preset.day}
                    type="button"
                    onClick={() => {
                      onFilterChange({
                        ...filters,
                        date_start: preset.day,
                        date_end: preset.day,
                      });
                    }}
                    className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                      filters.date_start === preset.day && filters.date_end === preset.day
                        ? "bg-[#7C69EF] text-white font-semibold shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Country filter & Reset */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium transition-all ${
                activeCountries.length > 0
                  ? "border-[#7C69EF] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                  : "border-purple-100 dark:border-purple-950/40 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5 text-[#7C69EF]" />
              <span>
                {activeCountries.length === 0
                  ? "All Countries"
                  : activeCountries.length === 1
                  ? activeCountries[0]
                  : `${activeCountries.length} Countries`}
              </span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isCountryOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Country Popover */}
            {isCountryOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-purple-100 dark:border-purple-950/60 bg-white dark:bg-[#1f1c30] p-3 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-950/40 mb-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">Filter by Country</span>
                  {activeCountries.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllCountries}
                      className="text-[11px] text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-purple-100 dark:border-purple-950/40 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 mb-2 focus:border-[#7C69EF] focus:outline-none"
                />

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                  {filteredCountries.map((c) => {
                    const isSelected = activeCountries.includes(c.country);
                    return (
                      <button
                        key={c.country}
                        type="button"
                        onClick={() => toggleCountry(c.country)}
                        className={`w-full flex items-center justify-between rounded-xl px-2 py-1.5 text-xs text-left transition-colors ${
                          isSelected
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        }`}
                      >
                        <span className="truncate">{c.country}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400">{c.order_count}</span>
                          {isSelected && <Check className="h-3 w-3 text-[#7C69EF]" />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <div className="py-4 text-center text-xs text-zinc-400">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!hasActiveFilters || isLoading}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              hasActiveFilters
                ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-[#7C69EF] hover:bg-purple-100"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C69EF] text-[10px] font-bold text-white ml-0.5">
                {(filters.date_start !== minDate || filters.date_end !== maxDate ? 1 : 0) + activeCountries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Validation alert */}
      {isInvalidDateRange && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 p-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Start date cannot be after end date ({filters.date_start} &gt; {filters.date_end}). Please adjust the range.</span>
        </div>
      )}

      {/* Active tags row */}
      {activeCountries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-100/60 dark:border-purple-950/30 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 mr-1">Active Countries:</span>
          {activeCountries.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300"
            >
              {c}
              <button
                type="button"
                onClick={() => removeCountry(c)}
                aria-label={`Remove ${c}`}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllCountries}
            className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline ml-1"
          >
            Clear countries
          </button>
        </div>
      )}
    </div>
  );
}
