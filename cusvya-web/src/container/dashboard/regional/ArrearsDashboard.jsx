import React from 'react';
import { Col, Row } from 'antd';
import DashboardShell from '../../../components/dashboard/DashboardShell';
import DashboardDateFilter from '../../../components/dashboard/DashboardDateFilter';
import DashboardKpiCard from '../../../components/dashboard/DashboardKpiCard';
import DashboardTrendChart from '../../../components/dashboard/DashboardTrendChart';
import DashboardDoughnutChart from '../../../components/dashboard/DashboardDoughnutChart';
import DashboardCountsTable from '../../../components/dashboard/DashboardCountsTable';
import DashboardErrorState from '../../../components/dashboard/DashboardState';
import useDashboardRequest from '../../../hooks/useDashboardRequest';
import { dashboardApi } from '../../../services/dashboard/dashboardApi';
import {
  buildRangeLabel,
  createInitialDashboardFilters,
  getObjectData,
  getRegionName,
  getSectionData,
  getSummaryValue,
} from './dashboardPageUtils';
import { getDashboardErrorMessage, resolveGroupByLabel } from '../../../utils/dashboardHelpers';

const ArrearsDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getArrears,
    createInitialDashboardFilters(),
  );

  const summary = getObjectData(data, 'Summary');

  if (error) {
    return (
      <DashboardShell
        title="Scootr Dashboard"
        regionName={getRegionName(data)}
        dateRangeText={buildRangeLabel(filters)}
        groupByLabel={resolveGroupByLabel(filters.groupBy)}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        refreshing={loading}
      >
        <DashboardDateFilter value={filters} onChange={setFilters} onRefresh={refresh} refreshing={loading} />
        <div style={{ marginTop: 16 }}>
          <DashboardErrorState
            description={getDashboardErrorMessage(error, 'Unable to load Arrears Dashboard')}
            onRetry={refresh}
          />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Scootr Dashboard"
      regionName={getRegionName(data)}
      dateRangeText={buildRangeLabel(filters)}
      groupByLabel={resolveGroupByLabel(filters.groupBy)}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      refreshing={loading}
    >
      <DashboardDateFilter value={filters} onChange={setFilters} onRefresh={refresh} refreshing={loading} />

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Total Arrears"
            value={getSummaryValue(summary, ['TotalArrears'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="Pending" value={getSummaryValue(summary, ['PendingArrears'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Partially Paid"
            value={getSummaryValue(summary, ['PartiallyPaidArrears'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="Paid" value={getSummaryValue(summary, ['PaidArrears'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Outstanding"
            value={getSummaryValue(summary, ['OutstandingAmount'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Total Amount"
            value={getSummaryValue(summary, ['TotalAmount'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Arrears Trend"
            items={getSectionData(data, 'ArrearsTrend')}
            loading={loading}
            type="line"
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Arrears Status"
            items={getSectionData(data, 'StatusSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Arrears by Type"
            items={getSectionData(data, 'TypeSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardCountsTable
            title="Arrears Breakdown"
            items={getSectionData(data, 'StatusSummary')}
            loading={loading}
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default ArrearsDashboard;
