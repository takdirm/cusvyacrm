import React from 'react';
import { Col, Row } from 'antd';
import DashboardShell from '../../../components/dashboard/DashboardShell';
import DashboardDateFilter from '../../../components/dashboard/DashboardDateFilter';
import DashboardKpiCard from '../../../components/dashboard/DashboardKpiCard';
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

const PlanDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getPlans,
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
            description={getDashboardErrorMessage(error, 'Unable to load Plan Dashboard')}
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
            title="Total Rental Plans"
            value={getSummaryValue(summary, ['TotalRentalPlans'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Active Rental Plans"
            value={getSummaryValue(summary, ['ActiveRentalPlans'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Total Ownership Plans"
            value={getSummaryValue(summary, ['TotalOwnershipPlans'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Active Ownership Plans"
            value={getSummaryValue(summary, ['ActiveOwnershipPlans'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Region Configurations"
            value={getSummaryValue(summary, ['RegionConfigurationCount'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Preferred / Popular"
            value={
              getSummaryValue(summary, ['PreferredRentalPlans']) + getSummaryValue(summary, ['PopularOwnershipPlans'])
            }
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Rental Plan Summary"
            items={getSectionData(data, 'RentalPlanSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Ownership Plan Summary"
            items={getSectionData(data, 'OwnershipPlanSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardCountsTable
            title="Region Configuration Summary"
            items={getSectionData(data, 'RegionConfigurationSummary')}
            loading={loading}
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default PlanDashboard;
