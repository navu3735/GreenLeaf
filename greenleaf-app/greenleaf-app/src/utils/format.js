// src/utils/format.js

export const palette = {
  bg: '#f4ede0',
  surface: '#ebe0cc',
  ink: '#1a1a1a',
  inkSoft: '#8a7f6f',
  primary: '#1c4a32',
  primaryPale: '#c2d4c8',
  accent: '#b8421b',
  accentPale: '#e8b89e',
  highlight: '#c89933',
  danger: '#a83232',
  success: '#2d6a47',
  border: 'rgba(28, 74, 50, 0.18)',
};

export const treatmentColors = {
  'Control': palette.inkSoft,
  'High N': palette.primary,
  'Low N': palette.primaryPale,
  'High Light': palette.highlight,
  'Shade': palette.accent,
  'Integrated Pest': palette.success,
  'Reduced Pest': palette.danger,
};

export const fmtMoney = (val = 0, { decimals = 0, compact = false } = {}) => {
  if (compact && val >= 1000) return `$${(val / 1000).toFixed(decimals)}K`;
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const fmtPct = (val = 0, decimals = 0) => `${(val * 100).toFixed(decimals)}%`;
export const fmtNum = (val = 0) => val.toLocaleString();
export const fmtDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
export const fmtDateLong = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';

export const expandTimeline = (tl) => tl || [];

// Ordinary least-squares fit: returns y = a + b*x
export const linreg = (pts) => {
  const n = pts.length;
  if (n < 2) return { a: 0, b: 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [x, y] of pts) {
    sx += x; sy += y; sxy += x * y; sxx += x * x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { a: sy / n, b: 0 };
  const b = (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  return { a, b };
};