import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfDay,
  subDays,
  subMonths,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';
import { DASHBOARD_GROUP_BY_LABELS, DASHBOARD_PRESETS, DASHBOARD_STATUS_LABELS } from '../types/dashboard';

export const DASHBOARD_MAX_RANGE_DAYS = 366;

export const dashboardText = {
  title: 'Scootr Dashboard',
  currentRegion: 'Current Region',
  dateRange: 'Date Range',
  groupBy: 'Group By',
  refresh: 'Refresh',
  lastUpdated: 'Last Updated',
  loading: 'Loading dashboard data...',
  empty: 'No activity for selected period',
  retry: 'Retry',
  regionContextRequired: 'Dashboard requires a selected region.',
};

export const dashboardLabels = {
  dashboard: dashboardText,
  filters: {
    presets: DASHBOARD_PRESETS,
    groupBy: DASHBOARD_GROUP_BY_LABELS,
  },
  status: DASHBOARD_STATUS_LABELS,
};

export const getDashboardErrorMessage = (error, fallback = 'Unable to load dashboard data') => {
  const status = error?.response?.status;
  const messageText = error?.response?.data?.message || error?.response?.data?.title || error?.message || '';

  if (status === 400 && /region/i.test(`${messageText}`)) {
    return dashboardText.regionContextRequired;
  }

  if (status === 403) {
    return 'You do not have access to this dashboard.';
  }

  if (messageText) {
    return messageText;
  }

  return fallback;
};

export const formatNumber = (value) => new Intl.NumberFormat(undefined).format(Number(value || 0));

export const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const formatDateLabel = (value) => format(new Date(value), 'dd MMM yyyy');

export const formatDateTimeLabel = (value) => format(new Date(value), 'dd MMM yyyy, HH:mm');

export const toUtcStartOfDayIso = (value) => startOfDay(new Date(value)).toISOString();

export const toUtcEndOfDayIso = (value) => endOfDay(new Date(value)).toISOString();

export const clampToDashboardRange = (from, to) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  if (diffDays <= DASHBOARD_MAX_RANGE_DAYS) {
    return { valid: true, diffDays };
  }

  return { valid: false, diffDays };
};

export const buildPresetRange = (preset, now = new Date()) => {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'Today':
      return { from: todayStart, to: todayEnd };
    case 'Yesterday': {
      const yesterday = subDays(todayStart, 1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }
    case 'Last 7 Days': {
      const from = subDays(todayStart, 6);
      return { from, to: todayEnd };
    }
    case 'Last 30 Days': {
      const from = subDays(todayStart, 29);
      return { from, to: todayEnd };
    }
    case 'This Month': {
      const from = startOfMonth(now);
      return { from, to: endOfMonth(now) };
    }
    case 'Last Month': {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case 'This Quarter': {
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    }
    case 'This Year': {
      return { from: startOfYear(now), to: endOfYear(now) };
    }
    default:
      return { from: todayStart, to: todayEnd };
  }
};

export const resolveStatusLabel = (value) => DASHBOARD_STATUS_LABELS[value] || value;

export const resolveGroupByLabel = (value) => DASHBOARD_GROUP_BY_LABELS[value] || value;

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const buildChartPalette = (count = 1) => {
  const colors = ['#1D4ED8', '#059669', '#D97706', '#DB2777', '#7C3AED', '#0F766E', '#DC2626', '#2563EB'];
  return Array.from({ length: count }, (_, index) => colors[index % colors.length]);
};

export const buildChartDataset = (label, data, color) => ({
  label,
  data,
  borderColor: color,
  backgroundColor: `${color}CC`,
  fill: false,
  tension: 0.3,
});
