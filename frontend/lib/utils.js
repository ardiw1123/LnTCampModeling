// Utility formatters for metrics, currency, percentages and dates

export function formatCurrency(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  const num = Number(value);

  if (compact && Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(num) >= 10_000) {
    return `$${(num / 1_000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const num = Number(value);

  if (compact && Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(num) >= 10_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
