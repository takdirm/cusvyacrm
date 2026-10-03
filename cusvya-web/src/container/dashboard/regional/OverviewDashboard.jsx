import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Col, Row } from 'antd';
import { useSelector } from 'react-redux';
import DashboardShell from '../../../components/dashboard/DashboardShell';
import DashboardDateFilter from '../../../components/dashboard/DashboardDateFilter';
import DashboardKpiCard from '../../../components/dashboard/DashboardKpiCard';
import DashboardTrendChart from '../../../components/dashboard/DashboardTrendChart';
import DashboardDoughnutChart from '../../../components/dashboard/DashboardDoughnutChart';
import DashboardCountsTable from '../../../components/dashboard/DashboardCountsTable';
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

const initialSectionState = () => ({ data: null, loading: true, error: null });

const OverviewDashboard = () => {
  const selectedRegionCode = useSelector((state) => state.region?.selected?.code || null);
  const regionLoading = useSelector((state) => Boolean(state.region?.loading));
  const [filters, setFilters] = useState(createInitialDashboardFilters());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sections, setSections] = useState({
    bookings: initialSectionState(),
    payments: initialSectionState(),
    fleet: initialSectionState(),
    arrears: initialSectionState(),
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(async () => {
    if (regionLoading) {
      return;
    }

    if (!selectedRegionCode) {
      const regionContextError = {
        response: {
          status: 400,
          data: {
            message: 'RegionContextRequired',
          },
        },
      };

      setSections({
        bookings: { data: null, loading: false, error: regionContextError },
        payments: { data: null, loading: false, error: regionContextError },
        fleet: { data: null, loading: false, error: regionContextError },
        arrears: { data: null, loading: false, error: regionContextError },
      });
      setRefreshing(false);
      return;
    }

    const params = {
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
      groupBy: filters.groupBy,
    };

    setRefreshing(true);
    setSections({
      bookings: initialSectionState(),
      payments: initialSectionState(),
      fleet: initialSectionState(),
      arrears: initialSectionState(),
    });

    const requests = [
      ['bookings', dashboardApi.getBookings(params)],
      ['payments', dashboardApi.getPayments(params)],
      ['fleet', dashboardApi.getFleet(params)],
      ['arrears', dashboardApi.getArrears(params)],
    ];

    const settled = await Promise.allSettled(requests.map(([, promise]) => promise));

    setSections(
      requests.reduce((accumulator, [key], index) => {
        const result = settled[index];
        accumulator[key] =
          result.status === 'fulfilled'
            ? { data: result.value, loading: false, error: null }
            : { data: null, loading: false, error: result.reason };
        return accumulator;
      }, {}),
    );

    setLastUpdated(new Date().toISOString());
    setRefreshing(false);
  }, [filters, regionLoading, selectedRegionCode]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const bookingData = sections.bookings.data || {};
  const paymentData = sections.payments.data || {};
  const fleetData = sections.fleet.data || {};
  const arrearsData = sections.arrears.data || {};

  const bookingSummary = getObjectData(bookingData, 'Summary');
  const paymentSummary = getObjectData(paymentData, 'Summary');
  const fleetSummary = getObjectData(fleetData, 'Summary');
  const arrearsSummary = getObjectData(arrearsData, 'Summary');

  const bookingStatuses = mapStatusItems(getSectionData(bookingData, 'StatusSummary'), 'Status');
  const paymentStatuses = getSectionData(paymentData, 'StatusSummary');
  const arrearsStatuses = getSectionData(arrearsData, 'StatusSummary');

  return (
    <DashboardShell
      title="Scootr Dashboard"
      regionName={getRegionName(bookingData)}
      dateRangeText={buildRangeLabel(filters)}
      groupByLabel={resolveGroupByLabel(filters.groupBy)}
      lastUpdated={lastUpdated}
      onRefresh={loadOverview}
      refreshing={refreshing}
    >
      <DashboardDateFilter value={filters} onChange={setFilters} onRefresh={loadOverview} refreshing={refreshing} />

      {Object.values(sections).some((section) => section.error) ? (
        <Alert
          style={{ marginTop: 16 }}
          type="warning"
          showIcon
          message="Some dashboard modules could not be loaded"
          description="The page will continue showing any sections that loaded successfully."
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Total Bookings"
            value={getSummaryValue(bookingSummary, ['TotalBookings'])}
            loading={sections.bookings.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Active Bookings"
            value={getSummaryValue(bookingSummary, ['ActiveBookings'])}
            loading={sections.bookings.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Completed"
            value={getSummaryValue(bookingSummary, ['CompletedBookings'])}
            loading={sections.bookings.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Cancelled"
            value={getSummaryValue(bookingSummary, ['CancelledBookings'])}
            loading={sections.bookings.loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Confirmed Amount"
            value={getSummaryValue(paymentSummary, ['ConfirmedAmount'])}
            formatter="currency"
            loading={sections.payments.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Pending Payments"
            value={getSummaryValue(paymentSummary, ['PendingPayments'])}
            loading={sections.payments.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Fleet Size"
            value={getSummaryValue(fleetSummary, ['TotalVehicles'])}
            loading={sections.fleet.loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DashboardKpiCard
            title="Available Vehicles"
            value={getSummaryValue(fleetSummary, ['AvailableVehicles'])}
            loading={sections.fleet.loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Booking Trend"
            items={getSectionData(bookingData, 'BookingTrend')}
            loading={sections.bookings.loading}
            type="line"
            valueKey="BookingCount"
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardTrendChart
            title="Payment Trend"
            items={getSectionData(paymentData, 'PaymentTrend')}
            loading={sections.payments.loading}
            type="line"
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Booking Status"
            items={bookingStatuses}
            loading={sections.bookings.loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Payment Status"
            items={paymentStatuses}
            loading={sections.payments.loading}
            valueKey="Count"
          />
        </Col>
        <Col xs={24} lg={8}>
          <DashboardDoughnutChart
            title="Arrears Status"
            items={arrearsStatuses}
            loading={sections.arrears.loading}
            valueKey="Count"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <DashboardCountsTable
            title="Cancellation Reasons"
            items={getSectionData(bookingData, 'CancellationReasons')}
            loading={sections.bookings.loading}
          />
        </Col>
        <Col xs={24} lg={12}>
          <DashboardCountsTable
            title="Arrears by Type"
            items={getSectionData(arrearsData, 'TypeSummary')}
            loading={sections.arrears.loading}
          />
        </Col>
      </Row>
    </DashboardShell>
  );
};

export default OverviewDashboard;
