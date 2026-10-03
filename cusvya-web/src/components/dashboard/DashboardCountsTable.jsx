import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';
import DashboardChartCard from './DashboardChartCard';
import { formatNumber, safeArray } from '../../utils/dashboardHelpers';

const lowerFirst = (value = '') => (value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value);

const DashboardCountsTable = ({ title, items, loading, empty, labelKey, valueKey }) => {
  const resolvedLabelKey = lowerFirst(labelKey);
  const resolvedValueKey = lowerFirst(valueKey);
  const dataSource = safeArray(items).map((item, index) => ({
    key: `${title}-${index}`,
    label:
      item[labelKey] ||
      item[resolvedLabelKey] ||
      item.Label ||
      item.label ||
      item.Status ||
      item.status ||
      item.Type ||
      item.type ||
      item.Reason ||
      item.reason ||
      '',
    value: Number(item[valueKey] ?? item[resolvedValueKey] ?? item.Count ?? item.count ?? 0),
  }));

  return (
    <DashboardChartCard title={title} loading={loading} empty={empty || !dataSource.length}>
      <Table
        size="small"
        pagination={false}
        dataSource={dataSource}
        columns={[
          { title: 'Label', dataIndex: 'label', key: 'label' },
          {
            title: 'Count',
            dataIndex: 'value',
            key: 'value',
            render: (value) => formatNumber(value),
          },
        ]}
      />
    </DashboardChartCard>
  );
};

DashboardCountsTable.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  labelKey: PropTypes.string,
  valueKey: PropTypes.string,
};

DashboardCountsTable.defaultProps = {
  items: [],
  loading: false,
  empty: false,
  labelKey: 'Label',
  valueKey: 'Count',
};

export default DashboardCountsTable;
