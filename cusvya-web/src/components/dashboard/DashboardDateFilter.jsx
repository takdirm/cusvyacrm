import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, Col, DatePicker, Row, Select, Space, Typography, message } from 'antd';
import dayjs from 'dayjs';
import {
  buildPresetRange,
  clampToDashboardRange,
  DASHBOARD_MAX_RANGE_DAYS,
  resolveGroupByLabel,
} from '../../utils/dashboardHelpers';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const presetOptions = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
  'Custom Range',
];

const groupByOptions = ['Day', 'Week', 'Month'];

const DashboardDateFilter = ({ value, onChange, onRefresh, refreshing }) => {
  const rangeText = useMemo(
    () => `${dayjs(value.from).format('YYYY-MM-DD')} - ${dayjs(value.to).format('YYYY-MM-DD')}`,
    [value.from, value.to],
  );

  const applyPreset = (preset) => {
    if (preset === 'Custom Range') {
      onChange({ ...value, preset });
      return;
    }

    const nextRange = buildPresetRange(preset);
    onChange({ ...value, preset, from: nextRange.from, to: nextRange.to });
  };

  const handleRangeChange = (dates) => {
    if (!dates || dates.length !== 2) {
      return;
    }

    const from = dates[0].toDate ? dates[0].toDate() : new Date(dates[0]);
    const to = dates[1].toDate ? dates[1].toDate() : new Date(dates[1]);
    const validation = clampToDashboardRange(from, to);

    if (!validation.valid) {
      message.error(`Date range cannot exceed ${DASHBOARD_MAX_RANGE_DAYS} days.`);
      return;
    }

    onChange({ ...value, preset: 'Custom Range', from: dates[0], to: dates[1] });
  };

  return (
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} xl={8}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary">Preset</Text>
          <Select
            value={value.preset}
            onChange={applyPreset}
            options={presetOptions.map((preset) => ({ label: preset, value: preset }))}
          />
        </Space>
      </Col>
      <Col xs={24} xl={8}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary">Date Range</Text>
          <RangePicker
            style={{ width: '100%' }}
            value={[dayjs(value.from), dayjs(value.to)]}
            onChange={handleRangeChange}
            allowClear={false}
          />
        </Space>
      </Col>
      <Col xs={24} xl={4}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary">Group By</Text>
          <Select
            value={value.groupBy}
            onChange={(groupBy) => onChange({ ...value, groupBy })}
            options={groupByOptions.map((groupBy) => ({ label: resolveGroupByLabel(groupBy), value: groupBy }))}
          />
        </Space>
      </Col>
      <Col xs={24} xl={4} style={{ textAlign: 'right' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text type="secondary">Selected Range</Text>
          <Text strong>{rangeText}</Text>
          <Button type="primary" onClick={onRefresh} loading={refreshing}>
            Refresh
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

DashboardDateFilter.propTypes = {
  value: PropTypes.shape({
    preset: PropTypes.string.isRequired,
    from: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    to: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    groupBy: PropTypes.oneOf(groupByOptions).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
};

DashboardDateFilter.defaultProps = {
  refreshing: false,
};

export default DashboardDateFilter;
