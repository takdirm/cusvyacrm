import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Empty, Result, Skeleton } from 'antd';

export const DashboardLoadingState = ({ rows }) => <Skeleton active paragraph={{ rows }} />;

DashboardLoadingState.propTypes = { rows: PropTypes.number };
DashboardLoadingState.defaultProps = { rows: 6 };

export const DashboardEmptyState = ({ description }) => <Empty description={description} />;

DashboardEmptyState.propTypes = { description: PropTypes.string.isRequired };

export const DashboardErrorState = ({ description, onRetry }) => (
  <Result
    status="warning"
    title={description}
    extra={
      <Button type="primary" onClick={onRetry}>
        Retry
      </Button>
    }
  />
);

DashboardErrorState.propTypes = {
  description: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default DashboardErrorState;
