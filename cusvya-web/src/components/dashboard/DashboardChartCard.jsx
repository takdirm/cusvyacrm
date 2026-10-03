import React from 'react';
import PropTypes from 'prop-types';
import { Card, Empty, Skeleton } from 'antd';

const DashboardChartCard = ({ title, loading, empty, children, extra }) => {
  return (
    <Card title={title} extra={extra} style={{ height: '100%' }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : empty ? (
        <Empty description="No activity for selected period" />
      ) : (
        children
      )}
    </Card>
  );
};

DashboardChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  children: PropTypes.node,
  extra: PropTypes.node,
};

DashboardChartCard.defaultProps = {
  loading: false,
  empty: false,
  children: null,
  extra: null,
};

export default DashboardChartCard;
