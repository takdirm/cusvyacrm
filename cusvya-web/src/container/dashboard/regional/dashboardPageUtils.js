import { buildPresetRange, formatDateLabel, resolveStatusLabel } from '../../../utils/dashboardHelpers';

const lowerFirst = (value = '') => (value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value);

const pickByCaseVariants = (source, key) => {
  if (!source || !key) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(source, key)) {
    return source[key];
  }

  const camelKey = lowerFirst(key);
  if (Object.prototype.hasOwnProperty.call(source, camelKey)) {
    return source[camelKey];
  }

  return undefined;
};

export const createInitialDashboardFilters = () => {
  const range = buildPresetRange('This Month');
  return {
    preset: 'This Month',
    from: range.from,
    to: range.to,
    groupBy: 'Day',
  };
};

export const buildRangeLabel = (filters) => `${formatDateLabel(filters.from)} - ${formatDateLabel(filters.to)}`;

export const getSectionData = (response, key) => {
  const value = pickByCaseVariants(response, key);
  return Array.isArray(value) ? value : [];
};

export const getObjectData = (response, key) => {
  const value = pickByCaseVariants(response, key);
  return value && typeof value === 'object' ? value : {};
};

export const getRegionName = (response, fallback = 'Region') => {
  const region = getObjectData(response, 'Region');
  return region.Name || region.name || fallback;
};

export const getSummaryValue = (summary, keys) => {
  const source = summary || {};
  for (const key of keys) {
    const value = pickByCaseVariants(source, key);
    if (value != null) {
      return value;
    }
  }
  return 0;
};

export const mapStatusItems = (items, fieldName) =>
  (items || []).map((item) => ({
    ...item,
    Label: resolveStatusLabel(
      item?.[fieldName] ||
        item?.[lowerFirst(fieldName)] ||
        item?.Label ||
        item?.label ||
        item?.Status ||
        item?.status ||
        '',
    ),
  }));
