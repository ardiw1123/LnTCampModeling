"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Globe2,
  MapPin,
  TrendingUp,
  DollarSign,
  Truck,
  ShoppingBag,
  Info,
  Navigation,
  Keyboard,
  MousePointer,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";
import { SUPERSTORE_COUNTRIES } from "@/lib/superstoreCountries";
import { getCountryStats } from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

import { fetchWorldMapSvg, getCachedWorldMapSvg } from "@/lib/worldMapAsset";

// Default full world viewBox matching reference world-map.svg (1010 x 666)
const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 1010, h: 666 };

// Regional zoom presets for rapid navigation
const REGION_ZOOM_PRESETS = {
  Global: { x: 0, y: 0, w: 1010, h: 666 },
  "North America": { x: 80, y: 80, w: 380, h: 300 },
  "Latin America": { x: 200, y: 350, w: 280, h: 280 },
  Europe: { x: 440, y: 120, w: 260, h: 240 },
  "Asia Pacific": { x: 600, y: 120, w: 380, h: 420 },
  "Africa & Middle East": { x: 440, y: 260, w: 320, h: 320 },
};

export default function InteractiveLocationMap({
  selectedLocation,
  onSelectLocation,
  dateFilters,
  globalCountryFilter,
  isLoadingDashboard,
  onApplyAsFilter,
  isFilteredByThisLocation,
}) {
  const [svgText, setSvgText] = useState(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(true);
  const [svgError, setSvgError] = useState(null);

  const [countryStats, setCountryStats] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeRegion, setActiveRegion] = useState("Global");

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    country: "",
    meta: null,
    stats: null,
  });

  // DOM Refs
  const containerRef = useRef(null);
  const mapWrapRef = useRef(null);
  const viewBoxRef = useRef({ ...DEFAULT_VIEWBOX });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  // Sorted list of all 147 store countries for quick selection
  const sortedCountryList = useMemo(() => {
    return Object.keys(SUPERSTORE_COUNTRIES).sort((a, b) => a.localeCompare(b));
  }, []);

  // Fetch country statistics whenever date filters or global filter changes
  useEffect(() => {
    let isMounted = true;

    async function loadCountryData() {
      setIsLoadingStats(true);
      try {
        const stats = await getCountryStats({
          date_start: dateFilters?.date_start,
          date_end: dateFilters?.date_end,
          country: globalCountryFilter,
          limit: 200,
        });
        if (isMounted) {
          setCountryStats(stats || []);
        }
      } catch (err) {
        console.error("Failed to load country stats for map:", err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    }

    loadCountryData();

    return () => {
      isMounted = false;
    };
  }, [dateFilters?.date_start, dateFilters?.date_end, globalCountryFilter]);

  // Fast map lookup: Country Name -> Live stats object
  const statsByCountry = useMemo(() => {
    const map = new Map();
    countryStats.forEach((c) => {
      map.set(c.country, c);
    });
    return map;
  }, [countryStats]);

  // Load world-map.svg asset
  useEffect(() => {
    let isMounted = true;

    const cached = getCachedWorldMapSvg();
    if (cached) {
      setSvgText(cached);
      setIsLoadingSvg(false);
      return;
    }

    fetchWorldMapSvg()
      .then((text) => {
        if (isMounted) {
          setSvgText(text);
          setIsLoadingSvg(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSvgError(err.message || "Failed to load map.");
          setIsLoadingSvg(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to apply current viewBox to SVG element
  const applyViewBox = useCallback(() => {
    if (!mapWrapRef.current) return;
    const svg = mapWrapRef.current.querySelector("svg");
    if (!svg) return;
    const vb = viewBoxRef.current;
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }, []);

  // Helper to zoom viewBox by a scaleFactor centered on current center
  const zoomMap = useCallback(
    (scaleFactor) => {
      const vb = viewBoxRef.current;
      const newW = Math.max(150, Math.min(DEFAULT_VIEWBOX.w, vb.w / scaleFactor));
      const newH = Math.max(100, Math.min(DEFAULT_VIEWBOX.h, vb.h / scaleFactor));
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      vb.x = Math.max(0, Math.min(DEFAULT_VIEWBOX.w - newW, cx - newW / 2));
      vb.y = Math.max(0, Math.min(DEFAULT_VIEWBOX.h - newH, cy - newH / 2));
      vb.w = newW;
      vb.h = newH;
      applyViewBox();
    },
    [applyViewBox]
  );

  // Helper to reset map zoom & position
  const resetMapZoom = useCallback(() => {
    viewBoxRef.current = { ...DEFAULT_VIEWBOX };
    setActiveRegion("Global");
    applyViewBox();
  }, [applyViewBox]);

  // Handler for region jump buttons
  const handleRegionSelect = useCallback(
    (regionName) => {
      setActiveRegion(regionName);
      const target = REGION_ZOOM_PRESETS[regionName] || DEFAULT_VIEWBOX;
      viewBoxRef.current = { ...target };
      applyViewBox();
    },
    [applyViewBox]
  );

  // Sync selected location highlighting on SVG paths
  useEffect(() => {
    if (!mapWrapRef.current) return;
    const svg = mapWrapRef.current.querySelector("svg");
    if (!svg) return;

    // Remove selected state from all
    svg.querySelectorAll(".map-country").forEach((el) => {
      el.classList.remove("selected");
    });

    if (selectedLocation) {
      // CSS escape helper
      const safe =
        window.CSS && CSS.escape
          ? CSS.escape(selectedLocation)
          : selectedLocation.replace(/["\\]/g, "\\$&");
      const matched = svg.querySelectorAll(`.map-country[data-country="${safe}"]`);
      matched.forEach((el) => el.classList.add("selected"));
    }
  }, [selectedLocation, svgText]);

  // Sync global country / region filter dimming on SVG paths
  useEffect(() => {
    if (!mapWrapRef.current) return;
    const svg = mapWrapRef.current.querySelector("svg");
    if (!svg) return;

    const filterList = Array.isArray(globalCountryFilter)
      ? globalCountryFilter
      : globalCountryFilter
      ? [globalCountryFilter]
      : [];

    const hasFilter = filterList.length > 0;

    svg.querySelectorAll(".map-country").forEach((el) => {
      el.classList.remove("filter-matched", "filter-dimmed");
      const countryName = el.getAttribute("data-country");
      const meta = SUPERSTORE_COUNTRIES[countryName];
      if (!meta) return;

      if (hasFilter) {
        if (filterList.includes(countryName)) {
          el.classList.add("filter-matched");
        } else {
          el.classList.add("filter-dimmed");
        }
      }
    });
  }, [globalCountryFilter, svgText]);

  // Setup pointer, keyboard, and drag interactions on the SVG DOM
  useEffect(() => {
    if (!svgText || !containerRef.current || !mapWrapRef.current) return;
    const container = containerRef.current;
    const wrap = mapWrapRef.current;
    const svg = wrap.querySelector("svg");
    if (!svg) return;

    // Apply initial viewBox
    applyViewBox();

    // 1. Tooltip move handler
    const handleMouseMove = (e) => {
      if (isDraggingRef.current) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const target = e.target.closest(".map-country");
      if (!target) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const countryName = target.getAttribute("data-country");
      if (!countryName) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const meta = SUPERSTORE_COUNTRIES[countryName] || null;
      const stats = statsByCountry.get(countryName) || null;

      setTooltip({
        visible: true,
        x,
        y,
        country: countryName,
        meta,
        stats,
      });
    };

    const handleMouseLeave = () => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    // 2. Click selection handler
    const handleClick = (e) => {
      const target = e.target.closest(".map-country.has-data");
      if (!target) return;
      const countryName = target.getAttribute("data-country");
      if (countryName && SUPERSTORE_COUNTRIES[countryName]) {
        onSelectLocation(countryName, SUPERSTORE_COUNTRIES[countryName]);
      }
    };

    // 3. Keyboard navigation handler (Tab + Enter / Space)
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target.closest(".map-country.has-data");
        if (target) {
          e.preventDefault();
          const countryName = target.getAttribute("data-country");
          if (countryName && SUPERSTORE_COUNTRIES[countryName]) {
            onSelectLocation(countryName, SUPERSTORE_COUNTRIES[countryName]);
          }
        }
      }
    };

    // 4. Mouse Drag to Pan
    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // left click only
      isDraggingRef.current = true;
      container.classList.add("grabbing");
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: viewBoxRef.current.x,
        origY: viewBoxRef.current.y,
      };
    };

    const handleWindowMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const factor = viewBoxRef.current.w / (container.clientWidth || 1);

      const newX = dragStartRef.current.origX - dx * factor;
      const newY = dragStartRef.current.origY - dy * factor;

      viewBoxRef.current.x = Math.max(
        -200,
        Math.min(DEFAULT_VIEWBOX.w - viewBoxRef.current.w + 200, newX)
      );
      viewBoxRef.current.y = Math.max(
        -150,
        Math.min(DEFAULT_VIEWBOX.h - viewBoxRef.current.h + 150, newY)
      );

      applyViewBox();
    };

    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.classList.remove("grabbing");
      }
    };

    // 5. Mouse Wheel Zoom
    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      zoomMap(1 / factor);
    };

    // 6. Touch to Pan (Mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchOrigX = 0;
    let touchOrigY = 0;
    let isTouchPanning = false;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isTouchPanning = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchOrigX = viewBoxRef.current.x;
        touchOrigY = viewBoxRef.current.y;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouchPanning || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      const factor = viewBoxRef.current.w / (container.clientWidth || 1);

      viewBoxRef.current.x = touchOrigX - dx * factor;
      viewBoxRef.current.y = touchOrigY - dy * factor;
      applyViewBox();
    };

    const handleTouchEnd = () => {
      isTouchPanning = false;
    };

    // Attach listeners
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseleave", handleMouseLeave);
    svg.addEventListener("click", handleClick);
    svg.addEventListener("keydown", handleKeyDown);
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      svg.removeEventListener("mousemove", handleMouseMove);
      svg.removeEventListener("mouseleave", handleMouseLeave);
      svg.removeEventListener("click", handleClick);
      svg.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [svgText, statsByCountry, onSelectLocation, applyViewBox, zoomMap]);

  // Country Quick Selector dropdown change handler
  const handleDropdownChange = (val) => {
    if (!val) {
      onSelectLocation(null);
    } else {
      const meta = SUPERSTORE_COUNTRIES[val];
      onSelectLocation(val, meta);
    }
  };

  const activeCountriesCount = countryStats.filter((c) => c.orders > 0).length;

  return (
    <div className="flex flex-col rounded-3xl border border-purple-100/80 dark:border-purple-950/40 bg-white dark:bg-[#1A1828] p-5 sm:p-6 shadow-sm relative overflow-hidden transition-colors">
      {/* Header & Map Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100/60 dark:border-purple-950/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7C69EF]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  Global Geographic Explorer
                </h2>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Interactive map of 147 store markets — select a country to inspect metrics
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Actions: Quick Country Selector + Zoom/Reset Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Quick Country Dropdown Selector */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none flex items-center gap-1.5">
            <select
              id="mapCountrySelect"
              value={selectedLocation || (Array.isArray(globalCountryFilter) ? globalCountryFilter[0] : globalCountryFilter) || ""}
              onChange={(e) => handleDropdownChange(e.target.value)}
              aria-label="Select Country"
              className="w-full rounded-xl border border-purple-100/80 dark:border-purple-950/60 bg-zinc-50 dark:bg-[#201D33] px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#7C69EF] cursor-pointer"
            >
              <option value="">Choose Country (147)...</option>
              {sortedCountryList.map((countryName) => {
                const meta = SUPERSTORE_COUNTRIES[countryName];
                return (
                  <option key={countryName} value={countryName}>
                    {countryName} {meta?.market ? `(${meta.market})` : ""}
                  </option>
                );
              })}
            </select>
            {selectedLocation && (
              <button
                type="button"
                onClick={() => handleDropdownChange("")}
                title="Clear country selection"
                aria-label="Clear country selection"
                className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Zoom and Pan Reset Controls */}
          <div className="flex items-center rounded-xl border border-purple-100/80 dark:border-purple-950/60 bg-zinc-50 dark:bg-[#201D33] p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => zoomMap(1.25)}
              title="Zoom in"
              aria-label="Zoom in"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-[#7C69EF] hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button
              type="button"
              onClick={() => zoomMap(0.8)}
              title="Zoom out"
              aria-label="Zoom out"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-[#7C69EF] hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button
              type="button"
              onClick={resetMapZoom}
              title="Reset view"
              aria-label="Reset view"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-[#7C69EF] hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scope and selection banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 my-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 text-xs">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-[#7C69EF] shrink-0" />
          {isFilteredByThisLocation ? (
            <span className="text-purple-900 dark:text-purple-200">
              <strong>Dashboard Filter Active:</strong> All views &amp; orders are filtered to <strong>{selectedLocation}</strong>. Other countries dimmed.
            </span>
          ) : globalCountryFilter && (Array.isArray(globalCountryFilter) ? globalCountryFilter.length > 0 : Boolean(globalCountryFilter)) ? (
            <span className="text-purple-900 dark:text-purple-200">
              <strong>Dashboard Filter Active:</strong> Highlighting {Array.isArray(globalCountryFilter) ? globalCountryFilter.join(", ") : globalCountryFilter}. Other countries dimmed.
            </span>
          ) : selectedLocation ? (
            <span className="text-purple-900 dark:text-purple-200">
              <strong>Local Inspection:</strong> Viewing <strong>{selectedLocation}</strong> in side panel. Dashboard remains on global scope.
            </span>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">
              Click any country on the map or dropdown to inspect localized metrics in the side panel.
            </span>
          )}
        </div>
        {selectedLocation && (
          <div className="flex items-center gap-2">
            {onApplyAsFilter && (
              <button
                type="button"
                onClick={() => onApplyAsFilter(selectedLocation)}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  isFilteredByThisLocation
                    ? "bg-[#7C69EF] text-white shadow-xs hover:bg-[#6D58E2]"
                    : "border border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                }`}
              >
                {isFilteredByThisLocation ? "Remove Global Filter" : "Filter Whole Dashboard"}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDropdownChange("")}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear inspection
            </button>
          </div>
        )}
      </div>

      {/* Region Jump Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-2.5 pb-1 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-zinc-400">Jump to:</span>
          {Object.keys(REGION_ZOOM_PRESETS).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => handleRegionSelect(reg)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                activeRegion === reg
                  ? "bg-[#7C69EF] text-white font-semibold shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-zinc-400 hidden md:block shrink-0">
          {activeCountriesCount > 0
            ? `${activeCountriesCount} countries with order activity in date scope`
            : "147 project store markets cataloged"}
        </div>
      </div>

      {/* Interactive SVG World Map Canvas */}
      <div
        ref={containerRef}
        className="geo-map-container mt-3"
        id="geoMapContainer"
      >
        {/* Loading Spinner State */}
        {isLoadingSvg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090c15]/90 z-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-2" />
            <span className="text-xs text-zinc-400">Loading interactive world map...</span>
          </div>
        )}

        {/* Error Fallback State */}
        {svgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090c15]/90 z-20 p-4 text-center">
            <span className="text-sm font-semibold text-rose-400">{svgError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-purple-400 underline"
            >
              Reload application
            </button>
          </div>
        )}

        {/* SVG Wrapper */}
        <div
          ref={mapWrapRef}
          className="map-svg-wrap"
          id="mapSvgWrap"
          suppressHydrationWarning
          dangerouslySetInnerHTML={svgText ? { __html: svgText } : undefined}
        />

        {/* Interactive Floating Tooltip */}
        {tooltip.visible && (
          <div
            className="map-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <div className="font-bold text-xs text-white">
              {tooltip.country}
            </div>

            {tooltip.meta ? (
              <div className="mt-1 space-y-0.5">
                <div className="text-[11px] text-sky-400 font-medium">
                  {tooltip.meta.market} &middot; {tooltip.meta.region}
                </div>

                {tooltip.stats && tooltip.stats.orders > 0 ? (
                  <>
                    <div className="text-[11px] text-zinc-300">
                      <span className="text-white font-semibold">
                        {formatCurrency(tooltip.stats.sales)}
                      </span>{" "}
                      sales &middot; {formatNumber(tooltip.stats.orders)} orders
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      Profit: {formatCurrency(tooltip.stats.profit)} (
                      {formatPercent(tooltip.stats.profit_margin_pct)})
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-zinc-400">
                    {formatNumber(tooltip.meta.orders)} catalog baseline orders
                  </div>
                )}

                <div className="text-[10px] text-cyan-400 font-semibold pt-1 flex items-center gap-1">
                  <MousePointer className="h-2.5 w-2.5" /> Click to inspect country
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 mt-0.5">
                No store presence in catalog
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Legend & Accessibility Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 mt-2 border-t border-purple-100/60 dark:border-purple-950/30 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="legend-swatch has-data-swatch" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Store Markets (147)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="legend-swatch selected-swatch" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Selected Country</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="legend-swatch no-data-swatch" />
            <span>No Presence</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Keyboard className="h-3.5 w-3.5 text-purple-500" />
          <span>Tab + Enter to select via keyboard &middot; Drag to pan &middot; Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
