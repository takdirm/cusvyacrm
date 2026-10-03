import React from 'react';
import { Col, Row } from 'antd';
import DashboardShell from '../../../components/dashboard/DashboardShell';
import DashboardDateFilter from '../../../components/dashboard/DashboardDateFilter';
import DashboardKpiCard from '../../../components/dashboard/DashboardKpiCard';
import DashboardTrendChart from '../../../components/dashboard/DashboardTrendChart';
import DashboardDoughnutChart from '../../../components/dashboard/DashboardDoughnutChart';
import DashboardCountsTable from '../../../components/dashboard/DashboardCountsTable';
import DashboardChartCard from '../../../components/dashboard/DashboardChartCard';
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
  mapStatusItems,
} from './dashboardPageUtils';
import { getDashboardErrorMessage, resolveGroupByLabel } from '../../../utils/dashboardHelpers';

const BookingDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getBookings,
    createInitialDashboardFilters(),
  );

  const summary = getObjectData(data, 'Summary');
  const trend = getSectionData(data, 'BookingTrend');
  const cancellationTrend = getSectionData(data, 'CancellationTrend');
  const statusSummary = mapStatusItems(getSectionData(data, 'StatusSummary'), 'Status');
  const typeSummary = getSectionData(data, 'BookingTypeSummary');

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
            description={getDashboardErrorMessage(error, 'Unable to load Booking Dashboard')}
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
            title="Total Bookings"
            value={getSummaryValue(summary, ['TotalBookings'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="New Bookings" value={getSummaryValue(summary, ['NewBookings'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Active Bookings"
            value={getSummaryValue(summary, ['ActiveBookings'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Completed"
            value={getSummaryValue(summary, ['CompletedBookings'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Cancelled"
            value={getSummaryValue(summary, ['CancelledBookings'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Cancellation Rate"
            value={getSummaryValue(summary, ['CancellationRate'])}
            formatter="percent"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Booking Trend"
            items={trend}
            loading={loading}
            type="line"
            valueKey="BookingCount"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Cancellation Trend"
            items={cancellationTrend}
            loading={loading}
            type="bar"
            valueKey="CancelledBookingCount"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart title="Booking Status" items={statusSummary} loading={loading} valueKey="Count" />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart title="Booking Type" items={typeSummary} loading={loading} valueKey="Count" />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardCountsTable
            title="Cancellation Reasons"
            items={getSectionData(data, 'CancellationReasons')}
            loading={loading}
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default BookingDashboard;
