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

const FleetDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getFleet,
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
            description={getDashboardErrorMessage(error, 'Unable to load Fleet Dashboard')}
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
            title="Total Vehicles"
            value={getSummaryValue(summary, ['TotalVehicles'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Available"
            value={getSummaryValue(summary, ['AvailableVehicles'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="Reserved" value={getSummaryValue(summary, ['ReservedVehicles'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="Rented" value={getSummaryValue(summary, ['RentedVehicles'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard title="Sold" value={getSummaryValue(summary, ['SoldVehicles'])} loading={loading} />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Under Maintenance"
            value={getSummaryValue(summary, ['MaintenanceVehicles'])}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Fleet Status"
            items={getSectionData(data, 'VehicleSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Ownership"
            items={getSectionData(data, 'VehicleOwnershipSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Vehicle Category"
            items={getSectionData(data, 'VehicleCategorySummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Vehicle Type"
            items={getSectionData(data, 'VehicleTypeSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Vehicle Condition"
            items={getSectionData(data, 'VehicleConditionSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardCountsTable title="Stations" items={getSectionData(data, 'StationSummary')} loading={loading} />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default FleetDashboard;
