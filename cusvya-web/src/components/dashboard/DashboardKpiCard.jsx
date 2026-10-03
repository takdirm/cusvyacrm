import React from 'react';
import PropTypes from 'prop-types';
import { Skeleton, Typography } from 'antd';
import { Cards } from '../cards/frame/cards-frame';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/dashboardHelpers';

const { Text, Title } = Typography;

const formatters = {
  number: formatNumber,
  currency: formatCurrency,
  percent: formatPercent,
};

const DashboardKpiCard = ({ title, value, loading, formatter, note, accent }) => {
  return (
    <Cards border bodypadding="20px">
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <div>
          <Text type="secondary">{title}</Text>
          <Title level={3} style={{ marginTop: 8, marginBottom: 0, color: accent || undefined }}>
            {formatters[formatter](value)}
          </Title>
          {note ? <Text type="secondary">{note}</Text> : null}
        </div>
      )}
    </Cards>
  );
};

DashboardKpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.bool,
  formatter: PropTypes.oneOf(['number', 'currency', 'percent']),
  note: PropTypes.string,
  accent: PropTypes.string,
};

DashboardKpiCard.defaultProps = {
  value: 0,
  loading: false,
  formatter: 'number',
  note: null,
  accent: null,
};

export default DashboardKpiCard;
