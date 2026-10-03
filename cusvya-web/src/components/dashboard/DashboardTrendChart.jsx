import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Bar, Line } from 'react-chartjs-2';
import DashboardChartCard from './DashboardChartCard';
import { buildChartDataset, buildChartPalette, safeArray } from '../../utils/dashboardHelpers';

const lowerFirst = (value = '') => (value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' },
    tooltip: { enabled: true },
  },
  scales: {
    y: { beginAtZero: true },
  },
};

const DashboardTrendChart = ({ title, items, loading, empty, type, valueKey }) => {
  const labels = useMemo(
    () =>
      safeArray(items).map((item) => item.periodLabel || item.Period || item.period || item.Label || item.label || ''),
    [items],
  );
  const resolvedValueKey = lowerFirst(valueKey);
  const values = useMemo(
    () =>
      safeArray(items).map((item) =>
        Number(item[valueKey] ?? item[resolvedValueKey] ?? item.Value ?? item.value ?? item.Count ?? item.count ?? 0),
      ),
    [items, resolvedValueKey, valueKey],
  );
  const palette = buildChartPalette(1);
  const dataset = buildChartDataset(title, values, palette[0]);
  const data = { labels, datasets: [dataset] };

  return (
    <DashboardChartCard title={title} loading={loading} empty={empty || !safeArray(items).length}>
      <div style={{ height: 320 }}>
        {type === 'bar' ? <Bar data={data} options={baseOptions} /> : <Line data={data} options={baseOptions} />}
      </div>
    </DashboardChartCard>
  );
};

DashboardTrendChart.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  type: PropTypes.oneOf(['line', 'bar']),
  valueKey: PropTypes.string,
};

DashboardTrendChart.defaultProps = {
  items: [],
  loading: false,
  empty: false,
  type: 'line',
  valueKey: 'Count',
};

export default DashboardTrendChart;
