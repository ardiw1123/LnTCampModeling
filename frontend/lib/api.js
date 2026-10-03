// Superstore Analytics API Client
// Connects to David's independent analytics service (port 8001)

const ANALYTICS_BASE_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "http://127.0.0.1:8001";

/**
 * Builds query string with support for repeated array params (e.g. country=USA&country=France)
 */
export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined && v !== "") {
          searchParams.append(key, String(v));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/**
 * Fetch wrapper with error extraction and URL fallback
 */
async function fetchAnalytics(endpoint, queryParams = {}) {
  const query = buildQueryString(queryParams);
  const primaryUrl = `/analytics-api${endpoint}${query}`;
  const directUrl = `${ANALYTICS_BASE_URL}/api${endpoint}${query}`;

  let res;
  try {
    // Try relative route first (works with Next.js rewrites)
    res = await fetch(primaryUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    // Fall back to direct backend URL if proxy fails (e.g. static export)
    try {
      res = await fetch(directUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch (err) {
      throw new Error(`Unable to connect to Analytics Service at ${ANALYTICS_BASE_URL}. Ensure uvicorn is running.`);
    }
  }

  // If primary returned 404 or 502/504 proxy error, attempt directUrl once
  if ((!res.ok && (res.status === 404 || res.status === 502 || res.status === 504)) && typeof window !== "undefined") {
    try {
      const fallbackRes = await fetch(directUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch {
      // Continue to handle res below
    }
  }

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) errorDetail = data.detail;
      else if (data?.message) errorDetail = data.message;
    } catch {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

/**
 * Get date bounds from dataset
 */
export async function getDateBounds() {
  return await fetchAnalytics("/date-bounds");
}

/**
 * Get country list with order counts
 */
export async function getCountries() {
  return await fetchAnalytics("/countries");
}

/**
 * Get composite dashboard summary (KPIs, Breakdowns, Trends)
 */
export async function getDashboardSummary({ date_start, date_end, country } = {}) {
  return await fetchAnalytics("/dashboard-summary", {
    date_start,
    date_end,
    country,
  });
}

/**
 * Get regional drilldown
 */
export async function getRegionDrilldown(region, { date_start, date_end, country } = {}) {
  return await fetchAnalytics("/region-drilldown", {
    region,
    date_start,
    date_end,
    country,
  });
}

/**
 * Get paginated exploration data for orders, products, customers, or locations
 */
export async function getExplorationData(resource, { page = 1, limit = 20, q, date_start, date_end, country } = {}) {
  return await fetchAnalytics(`/${resource}`, {
    page,
    limit,
    q,
    date_start,
    date_end,
    country,
  });
}

/**
 * Get country statistics for interactive map
 */
export async function getCountryStats({ date_start, date_end, country, limit = 200 } = {}) {
  return await fetchAnalytics("/country-stats", {
    date_start,
    date_end,
    country,
    limit,
  });
}

/**
 * Get KPI metrics for a specific filter / location
 */
export async function getKpi({ date_start, date_end, country } = {}) {
  return await fetchAnalytics("/kpi", {
    date_start,
    date_end,
    country,
  });
}

/**
 * Get ship mode breakdown for a specific filter / location
 */
export async function getShipModes({ date_start, date_end, country } = {}) {
  return await fetchAnalytics("/orders-by-shipmode", {
    date_start,
    date_end,
    country,
  });
}

/**
 * Get top subcategories for a specific filter / location
 */
export async function getTopSubcategories({ date_start, date_end, country } = {}) {
  return await fetchAnalytics("/top-subcategory", {
    date_start,
    date_end,
    country,
  });
}

/**
 * Get list of locations (cities / states) for a country
 */
export async function getLocations({ date_start, date_end, country, page = 1, limit = 10, q } = {}) {
  return await fetchAnalytics("/locations", {
    date_start,
    date_end,
    country,
    page,
    limit,
    q,
  });
}

// ============================================================
// AI Prediction API Client (Port 8000)
// ============================================================

const PREDICTION_BASE_URL =
  process.env.NEXT_PUBLIC_PREDICTION_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

async function fetchPrediction(endpoint, { method = "GET", body } = {}) {
  const primaryUrl = `/prediction-api${endpoint}`;
  const directUrl = `${PREDICTION_BASE_URL}${endpoint}`;

  const options = {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let res;
  try {
    // Try relative route first (works with Next.js rewrites)
    res = await fetch(primaryUrl, options);
  } catch {
    // Fall back to direct backend URL if proxy fails
    try {
      res = await fetch(directUrl, options);
    } catch {
      throw new Error(
        `Unable to connect to Prediction Service at ${PREDICTION_BASE_URL}. Ensure FastAPI is running.`
      );
    }
  }

  // If primary returned 404 or 502/504 proxy error, attempt directUrl once
  if (
    !res.ok &&
    (res.status === 404 || res.status === 502 || res.status === 504) &&
    typeof window !== "undefined"
  ) {
    try {
      const fallbackRes = await fetch(directUrl, options);
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
      res = fallbackRes;
    } catch {
      // Continue to handle res below
    }
  }

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) {
        errorDetail = data.error.message;
        if (data.error.details && Array.isArray(data.error.details)) {
          const detailMsgs = data.error.details
            .map((d) => d.msg || `${d.loc?.join(".")}: ${d.type}`)
            .join("; ");
          if (detailMsgs) errorDetail += `: ${detailMsgs}`;
        }
      } else if (data?.detail) {
        if (typeof data.detail === "string") errorDetail = data.detail;
        else if (data.detail?.message) errorDetail = data.detail.message;
      } else if (data?.message) {
        errorDetail = data.message;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

/**
 * Check health status of prediction models
 */
export async function getPredictionHealth() {
  return await fetchPrediction("/health");
}

/**
 * Get categories and thresholds metadata for prediction
 */
export async function getPredictionMeta() {
  return await fetchPrediction("/meta");
}

/**
 * Predict item-level profit using regression model
 */
export async function predictProfitRegression(payload) {
  return await fetchPrediction("/api/predict/regression", {
    method: "POST",
    body: payload,
  });
}

/**
 * Predict order-level late delivery using classification model
 */
export async function predictLateClassification(payload) {
  return await fetchPrediction("/api/predict/classification", {
    method: "POST",
    body: payload,
  });
}

