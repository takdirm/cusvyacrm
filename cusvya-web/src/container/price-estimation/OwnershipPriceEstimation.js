import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Select,
  Button as AntButton,
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Descriptions,
  Divider,
  Empty,
  Space,
  Spin,
  message,
} from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import { VehicleServiceType } from '../../config/enum/enum';

const BIKE_CONDITION_LABELS = {
  0: 'New',
  1: 'Excellent',
  2: 'Good',
  3: 'Fair',
  4: 'Poor',
  5: 'Broken',
};

const toPercent = (value) => (value === null || value === undefined ? '-' : `${value}%`);

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

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateReductionAmount = (costPrice, percent) => (asNumber(costPrice) * asNumber(percent)) / 100;

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.response?.data?.title || error?.response?.data?.message || fallback;

const isOwnershipServiceType = (value) => {
  const normalized = Number(value);
  return normalized === VehicleServiceType.RentToOwn || normalized === VehicleServiceType.RentalAndRentToOwn;
};

function OwnershipPriceEstimation() {
  const [priceModelForm] = Form.useForm();
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [vehicleResults, setVehicleResults] = useState([]);
  const [ownershipPlans, setOwnershipPlans] = useState([]);
  const [searchingVehicles, setSearchingVehicles] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPriceModel, setLoadingPriceModel] = useState(false);
  const [savingPriceModel, setSavingPriceModel] = useState(false);
  const [hasPriceModel, setHasPriceModel] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [batteryLifeSettings, setBatteryLifeSettings] = useState([]);
  const [vehicleConditionSettings, setVehicleConditionSettings] = useState([]);
  const [odometerSettings, setOdometerSettings] = useState([]);

  const selectedVehicle = useMemo(
    () => vehicleResults.find((item) => item.id === selectedVehicleId) || null,
    [selectedVehicleId, vehicleResults],
  );

  const selectedPlan = useMemo(
    () => ownershipPlans.find((item) => item.id === selectedPlanId) || null,
    [selectedPlanId, ownershipPlans],
  );

  const vehicleOptions = useMemo(
    () =>
      vehicleResults.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name || 'Unnamed'} (${vehicle.registerationNumber || 'No Reg.'})`,
      })),
    [vehicleResults],
  );

  const ownershipPlanOptions = useMemo(
    () =>
      ownershipPlans.map((plan) => ({
        value: plan.id,
        label: plan.tenure || `Plan #${plan.id}`,
      })),
    [ownershipPlans],
  );

  const loadOwnershipPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await DataService.get(API.ownershipPlan.path);
      const plans = Array.isArray(response.data) ? response.data : [];
      setOwnershipPlans(plans.filter((item) => item?.isActive !== false));
    } catch (error) {
      console.error('Failed to load ownership plans', error);
      message.error(getApiErrorMessage(error, 'Failed to load ownership plans'));
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadOwnershipPlans();
  }, []);

  const handleVehicleSearch = async (searchTerm) => {
    try {
      setSearchingVehicles(true);
      const query = new URLSearchParams({
        page: '1',
        pageSize: '50',
      });
      const trimmedSearch = searchTerm?.trim();
      if (trimmedSearch) {
        query.append('searchTerm', trimmedSearch);
      }

      const response = await DataService.get(`${API.vehicle.path}/paged?${query.toString()}`);
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data)
          ? response.data
          : [];

      const filtered = items.filter(
        (vehicle) =>
          isOwnershipServiceType(vehicle?.vehicleServiceType) ||
          isOwnershipServiceType(vehicle?.vehicleModel?.vehicleServiceType),
      );

      setVehicleResults(filtered);
    } catch (error) {
      console.error('Failed to search vehicles', error);
      message.error(getApiErrorMessage(error, 'Failed to search vehicles'));
    } finally {
      setSearchingVehicles(false);
    }
  };

  const loadPriceModelAndSettings = async (planId) => {
    if (!planId) {
      return;
    }

    try {
      setLoadingPriceModel(true);
      setSettingsLoading(true);

      const priceModelPromise = DataService.get(`${API.ownershipPlan.path}/${planId}/price-model`);
      const settingsPromise = Promise.all([
        DataService.get(`${API.forecast.path}/${API.forecast.batteryLifePercent}`),
        DataService.get(`${API.forecast.path}/${API.forecast.bikeConditionPercent}`),
        DataService.get(`${API.forecast.path}/${API.forecast.odometerPercent}`),
      ]);

      const [priceModelResult, settingsResult] = await Promise.allSettled([priceModelPromise, settingsPromise]);

      if (priceModelResult.status === 'fulfilled') {
        const model = priceModelResult.value?.data || {};
        setHasPriceModel(Boolean(model.id));
        priceModelForm.setFieldsValue({
          name: model.name || '',
          insurancePercent: model.insurancePercent ?? 0,
          maintainencePercent: model.maintainencePercent ?? 0,
          serviceChargesPercent: model.serviceChargesPercent ?? 0,
          priceMultiplier: model.priceMultiplier ?? 1,
          isActive: model.isActive ?? true,
        });
      } else {
        setHasPriceModel(false);
        priceModelForm.setFieldsValue({
          name: '',
          insurancePercent: 0,
          maintainencePercent: 0,
          serviceChargesPercent: 0,
          priceMultiplier: 1,
          isActive: true,
        });
      }

      if (settingsResult.status === 'fulfilled') {
        setBatteryLifeSettings(Array.isArray(settingsResult.value[0]?.data) ? settingsResult.value[0].data : []);
        setVehicleConditionSettings(Array.isArray(settingsResult.value[1]?.data) ? settingsResult.value[1].data : []);
        setOdometerSettings(Array.isArray(settingsResult.value[2]?.data) ? settingsResult.value[2].data : []);
      } else {
        setBatteryLifeSettings([]);
        setVehicleConditionSettings([]);
        setOdometerSettings([]);
      }
    } catch (error) {
      console.error('Failed to load pricing and settings data', error);
    } finally {
      setLoadingPriceModel(false);
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadPriceModelAndSettings(selectedPlanId);
    setForecastResult(null);
  }, [selectedPlanId]);

  const handleSavePriceModel = async () => {
    if (!selectedPlanId) {
      message.warning('Please select an ownership plan first');
      return;
    }

    try {
      const values = await priceModelForm.validateFields();
      setSavingPriceModel(true);

      const payload = {
        name: values.name?.trim(),
        insurancePercent: values.insurancePercent ?? 0,
        maintainencePercent: values.maintainencePercent ?? 0,
        serviceChargesPercent: values.serviceChargesPercent ?? 0,
        priceMultiplier: values.priceMultiplier ?? 1,
        isActive: values.isActive ?? true,
      };

      const endpoint = `${API.ownershipPlan.path}/${selectedPlanId}/price-model`;
      if (hasPriceModel) {
        await DataService.put(endpoint, payload);
        message.success('Price model updated successfully');
      } else {
        await DataService.post(endpoint, payload);
        message.success('Price model created successfully');
        setHasPriceModel(true);
      }
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      message.error(error.response?.data?.message || 'Failed to save price model');
    } finally {
      setSavingPriceModel(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedVehicleId || !selectedPlanId) {
      message.warning('Please select vehicle and ownership plan');
      return;
    }

    try {
      setForecastLoading(true);
      const response = await DataService.post(`${API.forecast.path}/ownership`, {
        vehicleId: selectedVehicleId,
        ownershipPlanId: selectedPlanId,
      });
      setForecastResult(response.data || null);
      message.success('Price forecast calculated successfully');
    } catch (error) {
      console.error('Failed to calculate ownership forecast', error);
      message.error(getApiErrorMessage(error, 'Failed to calculate ownership forecast'));
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        ghost
        title="Ownership Price Estimation - Used Vehicle"
        subTitle="Select vehicle and ownership plan, adjust pricing factors, and forecast used vehicle ownership amount"
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
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Vehicle</label>
                    <Select
                      showSearch
                      placeholder="Search vehicle"
                      filterOption={false}
                      onSearch={handleVehicleSearch}
                      onFocus={() => handleVehicleSearch('')}
                      options={vehicleOptions}
                      value={selectedVehicleId}
                      onChange={setSelectedVehicleId}
                      notFoundContent={searchingVehicles ? <Spin size="small" /> : null}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={10}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Ownership Plan</label>
                    <Select
                      showSearch
                      placeholder="Select ownership plan"
                      options={ownershipPlanOptions}
                      value={selectedPlanId}
                      loading={loadingPlans}
                      onChange={setSelectedPlanId}
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <AntButton
                      type="primary"
                      style={{ width: '100%' }}
                      onClick={handleCalculate}
                      loading={forecastLoading}
                      disabled={!selectedVehicleId || !selectedPlanId}
                    >
                      Calculate
                    </AntButton>
                  </Col>
                </Row>

                <Divider />

                {selectedVehicle ? (
                  <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small" title="Selected Vehicle Details">
                    <Descriptions.Item label="Name">{selectedVehicle.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Registeration Number">
                      {selectedVehicle.registerationNumber || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Model Year">{selectedVehicle.modelYear || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Km Driven">{selectedVehicle.kmDriven ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Initial Odometer Reading">
                      {selectedVehicle.initialOdometerReading ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Odometer Reading">
                      {selectedVehicle.currentOdometerReading ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bike Condition">
                      {BIKE_CONDITION_LABELS[selectedVehicle.bikeCondition] || selectedVehicle.bikeCondition || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Select a vehicle to view details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                    <FeatherIcon icon="sliders" size={18} />
                    Price Model & Forecast Settings
                  </Space>
                }
                extra={
                  <AntButton
                    type="primary"
                    onClick={handleSavePriceModel}
                    loading={savingPriceModel}
                    disabled={!selectedPlanId}
                  >
                    Save Price Model
                  </AntButton>
                }
              >
                {!selectedPlan ? (
                  <Empty
                    description="Select an ownership plan to load pricing model and settings"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <>
                    {loadingPriceModel || settingsLoading ? (
                      <div style={{ minHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Spin size="large" />
                      </div>
                    ) : (
                      <>
                        <Form form={priceModelForm} layout="vertical" initialValues={{ isActive: true }}>
                          <Row gutter={16}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="name"
                                label="Model Name"
                                rules={[{ required: true, message: 'Required' }]}
                              >
                                <Input placeholder="Enter model name" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="priceMultiplier"
                                label="Price Multiplier"
                                rules={[{ required: true, message: 'Required' }]}
                              >
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item name="isActive" label="Active" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="insurancePercent"
                                label="Insurance %"
                                rules={[{ required: true, message: 'Required' }]}
                              >
                                <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="maintainencePercent"
                                label="Maintainence %"
                                rules={[{ required: true, message: 'Required' }]}
                              >
                                <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="serviceChargesPercent"
                                label="Service Charges %"
                                rules={[{ required: true, message: 'Required' }]}
                              >
                                <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>

                        <Divider />

                        <Row gutter={16}>
                          <Col xs={24} lg={8}>
                            <Card size="small" title="Battery Life Settings">
                              {batteryLifeSettings.length ? (
                                batteryLifeSettings.map((item) => (
                                  <div key={item.id} style={{ marginBottom: 8 }}>
                                    <strong>{item.name}</strong>: {toPercent(item.batteryLifePercentValue)}
                                  </div>
                                ))
                              ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No battery settings" />
                              )}
                            </Card>
                          </Col>
                          <Col xs={24} lg={8}>
                            <Card size="small" title="Vehicle Condition Settings">
                              {vehicleConditionSettings.length ? (
                                vehicleConditionSettings.map((item) => (
                                  <div key={item.id} style={{ marginBottom: 8 }}>
                                    <strong>{item.name}</strong>: {toPercent(item.bikeConditionPercentValue)}
                                  </div>
                                ))
                              ) : (
                                <Empty
                                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                                  description="No vehicle condition settings"
                                />
                              )}
                            </Card>
                          </Col>
                          <Col xs={24} lg={8}>
                            <Card size="small" title="Odometer Settings">
                              {odometerSettings.length ? (
                                odometerSettings.map((item) => (
                                  <div key={item.id} style={{ marginBottom: 8 }}>
                                    <strong>{item.name}</strong>: {toPercent(item.odometerPercentValue)}
                                  </div>
                                ))
                              ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No odometer settings" />
                              )}
                            </Card>
                          </Col>
                        </Row>
                      </>
                    )}
                  </>
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
                  (() => {
                    const costPrice = asNumber(forecastResult.costPrice);
                    const maintenanceAmount = asNumber(forecastResult.maintenanceAmount);
                    const serviceChargesAmount = asNumber(forecastResult.serviceChargesAmount);
                    const insuranceAmount = asNumber(forecastResult.insuranceAmount);
                    const conditionReductionPercent = asNumber(forecastResult.conditionReductionPercent);
                    const odometerReductionPercent = asNumber(forecastResult.odometerReductionPercent);
                    const batteryLifeReductionPercent = asNumber(forecastResult.batteryLifeReductionPercent);

                    const conditionReductionAmount = calculateReductionAmount(costPrice, conditionReductionPercent);
                    const odometerReductionAmount = calculateReductionAmount(costPrice, odometerReductionPercent);
                    const batteryLifeReductionAmount = calculateReductionAmount(costPrice, batteryLifeReductionPercent);

                    return (
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 12 }}>FINAL COST SUMMARY REPORT</h3>

                        <Row gutter={[16, 8]} style={{ marginBottom: 8 }}>
                          <Col xs={24} md={16}>
                            <strong>Tenure:</strong> {forecastResult.tenure || '-'} (
                            {forecastResult.tenureInDays ?? '-'} days)
                          </Col>
                          <Col xs={24} md={8}>
                            <strong>Forecasted At:</strong> {forecastResult.forecastedAt || '-'}
                          </Col>
                          <Col xs={24}>
                            <strong>Cost Price:</strong> {formatMoney(forecastResult.costPrice)}
                          </Col>
                        </Row>

                        <h4 style={{ marginBottom: 8 }}>ADDITIONS</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>
                                Particulars
                              </th>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>Type</th>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Cost Price</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Base</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.costPrice)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Maintenance</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>+ Add</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.maintenanceAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Service Charges</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>+ Add</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.serviceChargesAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Insurance</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>+ Add</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.insuranceAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <h4 style={{ marginBottom: 8 }}>DEDUCTIONS</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>
                                Particulars
                              </th>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>Type</th>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>
                                Condition Reduction @ {conditionReductionPercent}%
                              </td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>- Deduct</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(conditionReductionAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>
                                Odometer Reduction @ {odometerReductionPercent}%
                              </td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>- Deduct</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(odometerReductionAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>
                                Battery Life Reduction @ {batteryLifeReductionPercent}%
                              </td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>- Deduct</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(batteryLifeReductionAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <h4 style={{ marginBottom: 8 }}>PAYMENT DETAILS</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>
                                Payment Term
                              </th>
                              <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Tenure</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {forecastResult.tenure || '-'} / {forecastResult.tenureInDays ?? '-'} Days
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Monthly EMI</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.monthlyAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>Weekly EMI</td>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                                {formatMoney(forecastResult.weeklyAmount)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #e8e8e8', padding: 8, fontWeight: 700 }}>
                                Total Ownership Price
                              </td>
                              <td
                                style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right', fontWeight: 700 }}
                              >
                                {formatMoney(forecastResult.totalOwnershipPrice)}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <h4 style={{ marginBottom: 8 }}>CALCULATION</h4>
                        <div
                          style={{ background: '#fafafa', border: '1px solid #f0f0f0', padding: 12, borderRadius: 6 }}
                        >
                          {`${formatMoney(costPrice)} + ${formatMoney(maintenanceAmount)} + ${formatMoney(
                            serviceChargesAmount,
                          )} + ${formatMoney(insuranceAmount)} - ${formatMoney(conditionReductionAmount)} - ${formatMoney(
                            odometerReductionAmount,
                          )} - ${formatMoney(batteryLifeReductionAmount)} = ${formatMoney(
                            forecastResult.totalOwnershipPrice,
                          )}`}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <Empty description="Choose vehicle + plan and click Calculate" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default OwnershipPriceEstimation;
