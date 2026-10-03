// Shared World Map SVG asset loader with in-memory caching
let cachedSvgText = null;
let svgFetchPromise = null;

/**
 * Fetches the world-map.svg asset with caching so multiple components
 * (MapOverviewCard and InteractiveLocationMap) share a single network request.
 */
export async function fetchWorldMapSvg() {
  if (cachedSvgText) {
    return cachedSvgText;
  }

  if (!svgFetchPromise) {
    svgFetchPromise = (async () => {
      let res = await fetch("/assets/world-map.svg").catch(() => null);
      if (!res || !res.ok) res = await fetch("/world-map.svg").catch(() => null);
      if (!res || !res.ok) res = await fetch("assets/world-map.svg").catch(() => null);
      if (!res || !res.ok) {
        throw new Error("Could not load world-map.svg asset.");
      }
      const text = await res.text();
      cachedSvgText = text;
      return text;
    })();
  }

  return svgFetchPromise;
}

/**
 * Returns synchronously cached SVG text if available.
 */
export function getCachedWorldMapSvg() {
  return cachedSvgText;
}
