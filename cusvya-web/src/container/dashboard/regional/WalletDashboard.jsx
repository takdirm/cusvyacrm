import React from 'react';
import { Col, Row } from 'antd';
import DashboardShell from '../../../components/dashboard/DashboardShell';
import DashboardDateFilter from '../../../components/dashboard/DashboardDateFilter';
import DashboardKpiCard from '../../../components/dashboard/DashboardKpiCard';
import DashboardTrendChart from '../../../components/dashboard/DashboardTrendChart';
import DashboardDoughnutChart from '../../../components/dashboard/DashboardDoughnutChart';
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

const WalletDashboard = () => {
  const { data, error, filters, lastUpdated, loading, refresh, setFilters } = useDashboardRequest(
    dashboardApi.getWallet,
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
            description={getDashboardErrorMessage(error, 'Unable to load Wallet Dashboard')}
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
            title="Total Wallets"
            value={getSummaryValue(summary, ['TotalWallets'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Active Wallets"
            value={getSummaryValue(summary, ['ActiveWallets'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Total Transactions"
            value={getSummaryValue(summary, ['TotalTransactions'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Confirmed Transactions"
            value={getSummaryValue(summary, ['ConfirmedTransactions'])}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Total Balance"
            value={getSummaryValue(summary, ['TotalBalance'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DashboardKpiCard
            title="Pending Withdrawals"
            value={getSummaryValue(summary, ['PendingWithdrawalAmount'])}
            formatter="currency"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Wallet Trend"
            items={getSectionData(data, 'WalletTrend')}
            loading={loading}
            type="line"
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Transaction Status"
            items={getSectionData(data, 'StatusSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardDoughnutChart
            title="Transaction Types"
            items={getSectionData(data, 'TransactionTypeSummary')}
            loading={loading}
            valueKey="Count"
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default WalletDashboard;
