import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Doughnut } from 'react-chartjs-2';
import DashboardChartCard from './DashboardChartCard';
import { buildChartPalette, safeArray } from '../../utils/dashboardHelpers';

const lowerFirst = (value = '') => (value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
};

const DashboardDoughnutChart = ({ title, items, loading, empty, valueKey }) => {
  const labels = useMemo(
    () =>
      safeArray(items).map(
        (item) =>
          item.Label ||
          item.label ||
          item.Status ||
          item.status ||
          item.Type ||
          item.type ||
          item.Reason ||
          item.reason ||
          '',
      ),
    [items],
  );
  const resolvedValueKey = lowerFirst(valueKey);
  const values = useMemo(
    () =>
      safeArray(items).map((item) => Number(item[valueKey] ?? item[resolvedValueKey] ?? item.Count ?? item.count ?? 0)),
    [items, resolvedValueKey, valueKey],
  );
  const colors = buildChartPalette(Math.max(labels.length, 1));
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <DashboardChartCard title={title} loading={loading} empty={empty || !safeArray(items).length}>
      <div style={{ height: 320 }}>
        <Doughnut data={data} options={options} />
      </div>
    </DashboardChartCard>
  );
};

DashboardDoughnutChart.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  valueKey: PropTypes.string,
};

DashboardDoughnutChart.defaultProps = {
  items: [],
  loading: false,
  empty: false,
  valueKey: 'Count',
};

export default DashboardDoughnutChart;
