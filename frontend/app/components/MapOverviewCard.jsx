"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Plus, Minus, Maximize2, Navigation, Globe2, RotateCcw, MousePointer } from "lucide-react";
import { fetchWorldMapSvg, getCachedWorldMapSvg } from "@/lib/worldMapAsset";
import { SUPERSTORE_COUNTRIES } from "@/lib/superstoreCountries";

// Default full world viewBox matching reference world-map.svg (1010 x 666)
const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 1010, h: 666 };

export default function MapOverviewCard({
  onExploreFullMap,
  totalCountries = 147,
  globalCountryFilter,
  selectedLocation,
  onSelectLocation,
}) {
  const [svgText, setSvgText] = useState(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(true);
  const [svgError, setSvgError] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    country: "",
    meta: null,
  });

  // DOM Refs
  const containerRef = useRef(null);
  const mapWrapRef = useRef(null);
  const viewBoxRef = useRef({ ...DEFAULT_VIEWBOX });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  // Load World Map SVG asset
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
          setSvgError(err.message || "Failed to load world map.");
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

    // Update isZoomed state
    const zoomed =
      Math.abs(vb.w - DEFAULT_VIEWBOX.w) > 5 ||
      Math.abs(vb.h - DEFAULT_VIEWBOX.h) > 5 ||
      Math.abs(vb.x - DEFAULT_VIEWBOX.x) > 5 ||
      Math.abs(vb.y - DEFAULT_VIEWBOX.y) > 5;
    setIsZoomed(zoomed);
  }, []);

  // Helper to zoom viewBox by a scaleFactor centered on current center
  const zoomMap = useCallback(
    (scaleFactor) => {
      const vb = viewBoxRef.current;
      const newW = Math.max(220, Math.min(DEFAULT_VIEWBOX.w, vb.w / scaleFactor));
      const newH = Math.max(145, Math.min(DEFAULT_VIEWBOX.h, vb.h / scaleFactor));
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
    applyViewBox();
  }, [applyViewBox]);

  // Sync selected location highlighting on SVG paths
  useEffect(() => {
    if (!mapWrapRef.current) return;
    const svg = mapWrapRef.current.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll(".map-country").forEach((el) => {
      el.classList.remove("selected");
    });

    if (selectedLocation) {
      const safe =
        typeof window !== "undefined" && window.CSS && CSS.escape
          ? CSS.escape(selectedLocation)
          : selectedLocation.replace(/["\\]/g, "\\$&");
      const matched = svg.querySelectorAll(`.map-country[data-country="${safe}"]`);
      matched.forEach((el) => el.classList.add("selected"));
    }
  }, [selectedLocation, svgText]);

  // Sync global country filter highlighting on SVG paths
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
      if (!countryName) return;

      if (hasFilter) {
        if (filterList.includes(countryName)) {
          el.classList.add("filter-matched");
        } else {
          el.classList.add("filter-dimmed");
        }
      }
    });
  }, [globalCountryFilter, svgText]);

  // Setup interactions (pan, zoom, hover tooltip, click to explore)
  useEffect(() => {
    if (!svgText || !containerRef.current || !mapWrapRef.current) return;
    const container = containerRef.current;
    const wrap = mapWrapRef.current;
    const svg = wrap.querySelector("svg");
    if (!svg) return;

    // Apply initial default viewBox
    applyViewBox();

    // 1. Tooltip move handler
    const handleMouseMove = (e) => {
      if (isDraggingRef.current) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const target = e.target.closest(".map-country.has-data");
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

      setTooltip({
        visible: true,
        x,
        y,
        country: countryName,
        meta,
      });
    };

    const handleMouseLeave = () => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    // 2. Click selection handler: selects country and navigates to full map
    const handleClick = (e) => {
      const target = e.target.closest(".map-country.has-data");
      if (!target) return;
      const countryName = target.getAttribute("data-country");
      if (countryName && SUPERSTORE_COUNTRIES[countryName]) {
        if (onSelectLocation) {
          onSelectLocation(countryName, SUPERSTORE_COUNTRIES[countryName]);
        }
        if (onExploreFullMap) {
          onExploreFullMap();
        }
      }
    };

    // 3. Keyboard navigation handler (Tab + Enter/Space)
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target.closest(".map-country.has-data");
        if (target) {
          e.preventDefault();
          const countryName = target.getAttribute("data-country");
          if (countryName && SUPERSTORE_COUNTRIES[countryName]) {
            if (onSelectLocation) {
              onSelectLocation(countryName, SUPERSTORE_COUNTRIES[countryName]);
            }
            if (onExploreFullMap) {
              onExploreFullMap();
            }
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
        -100,
        Math.min(DEFAULT_VIEWBOX.w - viewBoxRef.current.w + 100, newX)
      );
      viewBoxRef.current.y = Math.max(
        -80,
        Math.min(DEFAULT_VIEWBOX.h - viewBoxRef.current.h + 80, newY)
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
      const factor = e.deltaY > 0 ? 1.2 : 0.83;
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

    // Attach event listeners
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
  }, [svgText, onSelectLocation, onExploreFullMap, applyViewBox, zoomMap]);

  // Compute active filtered count
  const filterList = useMemo(() => {
    return Array.isArray(globalCountryFilter)
      ? globalCountryFilter
      : globalCountryFilter
      ? [globalCountryFilter]
      : [];
  }, [globalCountryFilter]);

  const hasFilter = filterList.length > 0;

  return (
    <div className="h-full min-h-[460px] rounded-3xl bg-zinc-50/80 dark:bg-[#201D33] border border-purple-100/60 dark:border-purple-950/40 p-5 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Global Market Reach
          </h2>
          <span className="text-[11px] text-zinc-400 font-medium">
            Worldwide Fulfillment Distribution
          </span>
        </div>
        <button
          type="button"
          onClick={onExploreFullMap}
          className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          title="Open interactive Map Overview"
        >
          <Navigation className="h-3 w-3" />
          <span>Full Map</span>
        </button>
      </div>

      {/* Map Graphic Area */}
      <div
        ref={containerRef}
        className="dashboard-map-container relative flex-1 my-3 rounded-2xl overflow-hidden bg-[#FAF9FD] dark:bg-[#1A1828] border border-purple-50 dark:border-purple-950/30 flex items-center justify-center"
      >
        {/* Loading Spinner */}
        {isLoadingSvg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9FD]/80 dark:bg-[#1A1828]/80 z-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-1.5" />
            <span className="text-[11px] text-zinc-400 font-medium">
              Loading geographic world map...
            </span>
          </div>
        )}

        {/* Error Fallback */}
        {svgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20">
            <span className="text-xs font-semibold text-rose-500">{svgError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 underline"
            >
              Reload application
            </button>
          </div>
        )}

        {/* World Map SVG Wrapper */}
        <div
          ref={mapWrapRef}
          className="dashboard-map-wrap"
          suppressHydrationWarning
          dangerouslySetInnerHTML={svgText ? { __html: svgText } : undefined}
        />

        {/* Floating Tooltip */}
        {tooltip.visible && (
          <div
            className="dashboard-map-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <div className="font-bold text-xs text-white">
              {tooltip.country}
            </div>
            {tooltip.meta ? (
              <div className="mt-0.5 space-y-0.5">
                <div className="text-[10px] text-purple-300 font-medium">
                  {tooltip.meta.market} &middot; {tooltip.meta.region}
                </div>
                <div className="text-[9px] text-zinc-300">
                  {tooltip.meta.orders.toLocaleString()} baseline orders
                </div>
                <div className="text-[9px] text-sky-300 font-semibold pt-0.5 flex items-center gap-1">
                  <MousePointer className="h-2 w-2" /> Click to open in Full Map
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Zoom & Fullscreen Controls */}
        <div className="absolute right-3 bottom-12 flex flex-col gap-1.5 z-20">
          <div className="flex flex-col rounded-xl bg-white dark:bg-zinc-800 shadow-md border border-purple-100 dark:border-purple-950/40 p-0.5">
            <button
              type="button"
              onClick={() => zoomMap(1.25)}
              aria-label="Zoom in"
              title="Zoom in"
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-px bg-zinc-100 dark:bg-zinc-700" />
            <button
              type="button"
              onClick={() => zoomMap(0.8)}
              aria-label="Zoom out"
              title="Zoom out"
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            {isZoomed && (
              <>
                <div className="h-px bg-zinc-100 dark:bg-zinc-700" />
                <button
                  type="button"
                  onClick={resetMapZoom}
                  aria-label="Reset zoom"
                  title="Reset view to whole world"
                  className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onExploreFullMap}
            aria-label="Open Full Map"
            title="Open Full Map view"
            className="flex items-center justify-center p-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-md border border-purple-100 dark:border-purple-950/40 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Country Count Badge at Bottom Left */}
        <div className="absolute left-4 bottom-3 z-20">
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-purple-50 dark:border-purple-950/30">
            <Globe2 className="h-3.5 w-3.5 text-[#7C69EF]" />
            <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
              {hasFilter ? `${filterList.length} of ${totalCountries}` : totalCountries}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">
              {hasFilter
                ? filterList.length === 1
                  ? "Country Filtered"
                  : "Countries Active"
                : "Countries Worldwide"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
