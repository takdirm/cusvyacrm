import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Select, Button as AntButton, Card, Descriptions, Empty, Space, Table, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const formatMoney = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatUtcDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
};

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function RentalPriceEstimation() {
  const [vehicleModels, setVehicleModels] = useState([]);
  const [rentalPlans, setRentalPlans] = useState([]);
  const [selectedVehicleModelId, setSelectedVehicleModelId] = useState(null);
  const [selectedRentalPlanId, setSelectedRentalPlanId] = useState(null);
  const [loadingVehicleModels, setLoadingVehicleModels] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);

  const selectedVehicleModel = useMemo(
    () => vehicleModels.find((item) => item.id === selectedVehicleModelId) || null,
    [selectedVehicleModelId, vehicleModels],
  );

  const selectedRentalPlan = useMemo(
    () => rentalPlans.find((item) => item.id === selectedRentalPlanId) || null,
    [selectedRentalPlanId, rentalPlans],
  );

  const vehicleModelOptions = useMemo(
    () =>
      vehicleModels.map((item) => ({
        value: item.id,
        label: item.name || `Vehicle Model #${item.id}`,
      })),
    [vehicleModels],
  );

  const rentalPlanOptions = useMemo(
    () =>
      rentalPlans.map((item) => ({
        value: item.id,
        label: item.name || `Rental Plan #${item.id}`,
      })),
    [rentalPlans],
  );

  const detailColumns = [
    {
      title: 'KM Limit',
      dataIndex: 'kmLimit',
      key: 'kmLimit',
    },
    {
      title: 'KM Value',
      dataIndex: 'kmValue',
      key: 'kmValue',
      align: 'center',
    },
    {
      title: 'Price Multiplier',
      dataIndex: 'priceMultiplier',
      key: 'priceMultiplier',
      align: 'center',
      render: (value) => {
        if (value === null || value === undefined || value === '') return '-';
        const parsed = Number(value);
        return Number.isFinite(parsed) ? `${parsed.toFixed(2)}x` : `${value}x`;
      },
    },
    {
      title: 'Gross Price',
      key: 'grossPrice',
      align: 'right',
      render: (_, record) => {
        const total = Number(record?.forecastedTotalPrice);
        const discount = Number(record?.discountAmount);
        if (!Number.isFinite(total) && !Number.isFinite(discount)) return '-';
        return formatMoney((Number.isFinite(total) ? total : 0) + (Number.isFinite(discount) ? discount : 0));
      },
    },
    {
      title: 'Discount Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      align: 'right',
      render: (value) => formatMoney(value),
    },
    {
      title: 'Forecasted Total Price',
      dataIndex: 'forecastedTotalPrice',
      key: 'forecastedTotalPrice',
      align: 'right',
      render: (value) => formatMoney(value),
    },
    {
      title: 'Forecasted Price/Day',
      dataIndex: 'forecastedPricePerDay',
      key: 'forecastedPricePerDay',
      align: 'right',
      render: (value) => formatMoney(value),
    },
  ];

  const detailRows = Array.isArray(forecastResult?.details) ? forecastResult.details : [];

  const additionsColumns = [
    {
      title: 'Particulars',
      key: 'particulars',
      render: (_, record) => `Gross Price (${record?.kmLimit || '-'} KM)`,
    },
    {
      title: 'Type',
      key: 'type',
      render: () => '+ Add',
      width: 120,
    },
    {
      title: 'Amount',
      key: 'amount',
      align: 'right',
      render: (_, record) => {
        const total = Number(record?.forecastedTotalPrice);
        const discount = Number(record?.discountAmount);
        if (!Number.isFinite(total) && !Number.isFinite(discount)) return '-';
        return formatMoney((Number.isFinite(total) ? total : 0) + (Number.isFinite(discount) ? discount : 0));
      },
      width: 180,
    },
  ];

  const deductionsColumns = [
    {
      title: 'Particulars',
      key: 'particulars',
      render: (_, record) =>
        `Discount (${record?.discountPercentage ?? forecastResult?.discountPercentage ?? 0}% - ${record?.kmLimit || '-'} KM)`,
    },
    {
      title: 'Type',
      key: 'type',
      render: () => '- Deduct',
      width: 120,
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'amount',
      align: 'right',
      render: (value) => formatMoney(value),
      width: 180,
    },
  ];

  const formulaRows = detailRows.map((row) => {
    const basePricePerDay = asNumber(forecastResult?.rentalPricePerDay);
    const days = asNumber(forecastResult?.tenureInDays);
    const multiplier = asNumber(row?.priceMultiplier);
    const discount = asNumber(row?.discountAmount);
    const gross = basePricePerDay * days * multiplier;
    const total = gross - discount;

    return {
      key: row?.rentalPlanDetailId ?? `${row?.kmLimit}-${row?.kmValue}`,
      kmLimit: row?.kmLimit,
      formula: `${formatMoney(basePricePerDay)} × ${days} × ${multiplier.toFixed(2)} - ${formatMoney(discount)} = ${formatMoney(total)}`,
      computedTotal: total,
      apiTotal: asNumber(row?.forecastedTotalPrice),
    };
  });

  const loadVehicleModels = async () => {
    try {
      setLoadingVehicleModels(true);
      const query = new URLSearchParams({
        isAvailableForRental: 'true',
        isAvailableForOwnership: 'false',
        isPetrolEngine: 'false',
      });
      const response = await DataService.get(`${API.vehicleModel.filter}?${query.toString()}`);
      const list = Array.isArray(response.data) ? response.data : [];
      setVehicleModels(list.filter((item) => item?.isActive !== false));
    } catch (error) {
      console.error('Failed to load vehicle models', error);
      message.error(error.response?.data?.message || 'Failed to load vehicle models');
    } finally {
      setLoadingVehicleModels(false);
    }
  };

  const loadRentalPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await DataService.get(API.rentalPlan.path);
      const list = Array.isArray(response.data) ? response.data : [];
      setRentalPlans(list.filter((item) => item?.isActive !== false));
    } catch (error) {
      console.error('Failed to load rental plans', error);
      message.error(error.response?.data?.message || 'Failed to load rental plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadVehicleModels();
    loadRentalPlans();
  }, []);

  const handleCalculate = async () => {
    if (!selectedVehicleModelId || !selectedRentalPlanId) {
      message.warning('Please select vehicle model and rental plan');
      return;
    }

    try {
      setCalculating(true);
      const response = await DataService.post(`${API.forecast.path}/rented`, {
        vehicleModelId: selectedVehicleModelId,
        rentalPlanId: selectedRentalPlanId,
      });
      setForecastResult(response.data || null);
      message.success('Rental forecast calculated successfully');
    } catch (error) {
      console.error('Failed to calculate rental forecast', error);
      message.error(error.response?.data?.message || 'Failed to calculate rental forecast');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <>
      <PageHeader
        ghost
        title="Rental Plan Estimation"
        subTitle="Select vehicle model and rental plan to estimate rented pricing outcomes"
      />
      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <Space>
                    <FeatherIcon icon="search" size={18} />
                    Selection & Calculation
                  </Space>
                }
              >
                <Row gutter={16} align="bottom">
                  <Col xs={24} md={10}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Vehicle Model</label>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select vehicle model"
                      loading={loadingVehicleModels}
                      options={vehicleModelOptions}
                      value={selectedVehicleModelId}
                      onChange={setSelectedVehicleModelId}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={10}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Rental Plan</label>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select rental plan"
                      loading={loadingPlans}
                      options={rentalPlanOptions}
                      value={selectedRentalPlanId}
                      onChange={setSelectedRentalPlanId}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <AntButton
                      type="primary"
                      style={{ width: '100%' }}
                      onClick={handleCalculate}
                      loading={calculating}
                      disabled={!selectedVehicleModelId || !selectedRentalPlanId}
                    >
                      Calculate
                    </AntButton>
                  </Col>
                </Row>
              </Card>
            </Cards>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <Space>
                    <FeatherIcon icon="info" size={18} />
                    Selected Plan Summary
                  </Space>
                }
              >
                {!selectedVehicleModel || !selectedRentalPlan ? (
                  <Empty
                    description="Select vehicle model and rental plan to view summary"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
                    <Descriptions.Item label="Rental Base Price">
                      {formatMoney(selectedVehicleModel.rentalPriceStarts ?? selectedVehicleModel.basePrice)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Discount">
                      {selectedRentalPlan.discountPercentage ?? 0}%
                    </Descriptions.Item>
                    <Descriptions.Item label="Tenure In Days">
                      {selectedRentalPlan.durationInDays ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Plan Name">{selectedRentalPlan.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Vehicle Model Name">{selectedVehicleModel.name || '-'}</Descriptions.Item>
                  </Descriptions>
                )}
              </Card>
            </Cards>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <Space>
                    <FeatherIcon icon="bar-chart-2" size={18} />
                    Forecasted Value
                  </Space>
                }
              >
                {forecastResult ? (
                  <>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16,
                        background: '#fff',
                      }}
                    >
                      <h4 style={{ marginTop: 0, marginBottom: 12 }}>FORECASTED VALUE</h4>
                      <Row gutter={[12, 8]}>
                        <Col xs={24} md={10}>
                          <strong>Vehicle Model</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {forecastResult.vehicleModelName || forecastResult.scooterTypeName || '-'}
                        </Col>

                        <Col xs={24} md={10}>
                          <strong>Rental Plan</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {forecastResult.rentalPlanName || '-'}
                        </Col>

                        <Col xs={24} md={10}>
                          <strong>Tenure (Days)</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {forecastResult.tenureInDays ?? '-'}
                        </Col>

                        <Col xs={24} md={10}>
                          <strong>Base Price/Day</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {formatMoney(forecastResult.rentalPricePerDay)}
                        </Col>

                        <Col xs={24} md={10}>
                          <strong>Discount</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {forecastResult.discountPercentage ?? 0}%
                        </Col>

                        <Col xs={24} md={10}>
                          <strong>Forecasted At</strong>
                        </Col>
                        <Col xs={24} md={14}>
                          {formatUtcDate(forecastResult.forecastedAt)} UTC
                        </Col>
                      </Row>
                    </div>

                    <h4 style={{ marginTop: 0, marginBottom: 10 }}>PRICING BREAKDOWN</h4>

                    <Row gutter={16} style={{ marginBottom: 12 }}>
                      <Col xs={24} lg={12}>
                        <h5 style={{ marginTop: 0, marginBottom: 8 }}>ADDITIONS</h5>
                        <Table
                          rowKey={(record) => `add-${record.rentalPlanDetailId}`}
                          columns={additionsColumns}
                          dataSource={detailRows}
                          pagination={false}
                          size="small"
                          locale={{ emptyText: 'No additions found' }}
                        />
                      </Col>
                      <Col xs={24} lg={12}>
                        <h5 style={{ marginTop: 0, marginBottom: 8 }}>DEDUCTIONS</h5>
                        <Table
                          rowKey={(record) => `ded-${record.rentalPlanDetailId}`}
                          columns={deductionsColumns}
                          dataSource={detailRows}
                          pagination={false}
                          size="small"
                          locale={{ emptyText: 'No deductions found' }}
                        />
                      </Col>
                    </Row>

                    <Table
                      rowKey="rentalPlanDetailId"
                      columns={detailColumns}
                      dataSource={detailRows}
                      pagination={false}
                      locale={{ emptyText: 'No rental forecast details found' }}
                    />

                    <div style={{ marginTop: 16, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                      <h5 style={{ marginTop: 0, marginBottom: 8 }}>CALCULATION</h5>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Formula:</strong> Base Price/Day × Number of Days × Price Multiplier - Discount
                        deduction
                      </div>
                      {formulaRows.length ? (
                        formulaRows.map((row) => (
                          <div key={row.key} style={{ marginBottom: 6 }}>
                            <strong>{row.kmLimit || '-'} KM:</strong> {row.formula}
                          </div>
                        ))
                      ) : (
                        <div>-</div>
                      )}
                    </div>
                  </>
                ) : (
                  <Empty
                    description="Choose vehicle model + rental plan and click Calculate"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default RentalPriceEstimation;
