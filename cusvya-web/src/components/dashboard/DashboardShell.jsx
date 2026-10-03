import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Button, Space, Typography, Tag } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../page-headers/page-headers';
import { Main } from '../../container/styled';
import { Cards } from '../cards/frame/cards-frame';
import { formatDateTimeLabel } from '../../utils/dashboardHelpers';

const { Text } = Typography;

const DashboardShell = ({
  title,
  regionName,
  dateRangeText,
  groupByLabel,
  lastUpdated,
  onRefresh,
  refreshing,
  children,
}) => {
  const selectedRegion = useSelector((state) => state.region?.selected || null);

  const currentRegionName = selectedRegion?.name || regionName;

  return (
    <>
      <PageHeader
        ghost
        title={title}
        buttons={[
          <Button key="refresh" type="primary" onClick={onRefresh} loading={refreshing}>
            <FeatherIcon icon="refresh-cw" size={14} /> Refresh
          </Button>,
        ]}
      />
      <Main>
        <Cards border bodypadding="24px">
          <Row gutter={[16, 12]} align="middle" justify="space-between">
            <Col xs={24} lg={16}>
              <Space size={12} wrap>
                <Tag color="blue">Current Region</Tag>
                <Tag color="geekblue">{currentRegionName}</Tag>
                <Text strong>{dateRangeText}</Text>
                <Text type="secondary">Group By: {groupByLabel}</Text>
              </Space>
            </Col>
            <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
              <Text type="secondary">Last Updated: {lastUpdated ? formatDateTimeLabel(lastUpdated) : '—'}</Text>
            </Col>
          </Row>
        </Cards>
        <div style={{ marginTop: 16 }}>{children}</div>
      </Main>
    </>
  );
};

DashboardShell.propTypes = {
  title: PropTypes.string.isRequired,
  regionName: PropTypes.string.isRequired,
  dateRangeText: PropTypes.string.isRequired,
  groupByLabel: PropTypes.string.isRequired,
  lastUpdated: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

DashboardShell.defaultProps = {
  lastUpdated: null,
  refreshing: false,
};

export default DashboardShell;
