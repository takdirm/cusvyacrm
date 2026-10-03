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

const FinancialDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getPayments,
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
            description={getDashboardErrorMessage(error, 'Unable to load Financial Dashboard')}
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
            title="Total Payments"
            value={getSummaryValue(summary, ['TotalPayments'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Confirmed Payments"
            value={getSummaryValue(summary, ['ConfirmedPayments'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Pending Payments"
            value={getSummaryValue(summary, ['PendingPayments'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Failed Payments"
            value={getSummaryValue(summary, ['FailedPayments'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Confirmed Amount"
            value={getSummaryValue(summary, ['ConfirmedAmount'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Refunded Amount"
            value={getSummaryValue(summary, ['RefundedAmount'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Payment Trend"
            items={getSectionData(data, 'PaymentTrend')}
            loading={loading}
            type="line"
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Payment Status"
            items={getSectionData(data, 'StatusSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Payment Type"
            items={getSectionData(data, 'PaymentTypeSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardCountsTable
            title="Financial Breakdown"
            items={getSectionData(data, 'StatusSummary')}
            loading={loading}
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default FinancialDashboard;
