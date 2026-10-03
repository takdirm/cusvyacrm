import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Tabs, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import {
  ChargingTypeOptions,
  FuelType,
  FuelTypeOptions,
  VehicleCategory,
  VehicleCategoryOptions,
  VehicleType,
  VehicleTypeOptions,
} from '../../../config/enum/enum';

const { TextArea } = Input;
const { TabPane } = Tabs;

function boolToSelectValue(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return undefined;
}

function selectValueToBool(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function nullableText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function requiredNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requiredInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function CatalogueModal({ visible, onCancel, onSuccess, catalogueData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleModelsLoading, setVehicleModelsLoading] = useState(false);
  const selectedFuelType = Form.useWatch('fuelType', form);
  const selectedVehicleCategory = Form.useWatch('vehicleCategory', form);

  const isEdit = useMemo(() => Boolean(catalogueData?.id), [catalogueData]);
  const showPetrolFields = selectedFuelType === FuelType.Petrol || selectedFuelType === FuelType.Hybrid;
  const showElectricFields = selectedFuelType === FuelType.Electric || selectedFuelType === FuelType.Hybrid;

  const vehicleTypeOptionsByCategory = useMemo(
    () => ({
      [VehicleCategory.TwoWheeler]: VehicleTypeOptions.filter((opt) => [1, 2, 3, 4].includes(Number(opt.value))),
      [VehicleCategory.ThreeWheeler]: VehicleTypeOptions.filter((opt) => [10, 11].includes(Number(opt.value))),
      [VehicleCategory.Bicycle]: VehicleTypeOptions.filter((opt) => [20, 21].includes(Number(opt.value))),
      [VehicleCategory.FourWheeler]: VehicleTypeOptions.filter((opt) => [30, 31].includes(Number(opt.value))),
    }),
    [],
  );

  const filteredVehicleTypeOptions = vehicleTypeOptionsByCategory[selectedVehicleCategory] || VehicleTypeOptions;

  useEffect(() => {
    if (!visible) return;

    const loadVehicleModels = async () => {
      try {
        setVehicleModelsLoading(true);
        const token = getItem('access_token');
        const apiUrl = getApiUrl();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${apiUrl}/api${API.vehicleModel.path}`, { headers });
        const data = response?.data;
        setVehicleModels(Array.isArray(data) ? data : data?.items || []);
      } catch (error) {
        setVehicleModels([]);
      } finally {
        setVehicleModelsLoading(false);
      }
    };

    loadVehicleModels();

    if (!catalogueData) {
      form.resetFields();
      form.setFieldsValue({
        year: new Date().getFullYear(),
        vehicleCategory: VehicleCategory.TwoWheeler,
        type: VehicleType.ElectricScooter,
        fuelType: 0,
        chargingType: 0,
        topSpeedKmph: 0,
        weightKg: 0,
        seatHeightMm: 0,
        wheelBaseMm: 0,
        price: 0,
        exShowroomPrice: 0,
        hasABS: false,
        hasElectricStart: false,
        isLicenseRequired: false,
        isAvailable: true,
      });
      return;
    }

    form.setFieldsValue({
      ...catalogueData,
      type: catalogueData.type ?? catalogueData.vehicleType,
      topSpeedKmph: requiredInt(catalogueData.topSpeedKmph, 0),
      weightKg: requiredNumber(catalogueData.weightKg, 0),
      seatHeightMm: requiredNumber(catalogueData.seatHeightMm, 0),
      wheelBaseMm: requiredNumber(catalogueData.wheelBaseMm, 0),
      price: requiredNumber(catalogueData.price, 0),
      exShowroomPrice: requiredNumber(catalogueData.exShowroomPrice, 0),
      featuresText: Array.isArray(catalogueData.features) ? catalogueData.features.join(', ') : '',
      hasFastChargingSelect: boolToSelectValue(catalogueData.hasFastCharging),
      hasRegenerativeBrakingSelect: boolToSelectValue(catalogueData.hasRegenerativeBraking),
      hasSmartConnectivitySelect: boolToSelectValue(catalogueData.hasSmartConnectivity),
    });
  }, [catalogueData, visible, form]);

  useEffect(() => {
    if (!visible) return;
    if (!selectedVehicleCategory) return;

    const selectedType = form.getFieldValue('type');
    if (selectedType == null || selectedType === '') {
      return;
    }

    const isValidForCategory = filteredVehicleTypeOptions.some((opt) => Number(opt.value) === Number(selectedType));
    if (!isValidForCategory) {
      form.setFieldsValue({
        type: filteredVehicleTypeOptions[0]?.value,
      });
    }
  }, [visible, selectedVehicleCategory, filteredVehicleTypeOptions, form]);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const buildPayload = (values) => {
    const features = (values.featuresText || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      summary: nullableText(values.summary),
      description: nullableText(values.description),
      brand: nullableText(values.brand),
      model: nullableText(values.model),
      vehicleModelId: nullableNumber(values.vehicleModelId),
      year: requiredInt(values.year),
      vehicleCategory: requiredInt(values.vehicleCategory),
      vehicleType: requiredInt(values.type),
      fuelType: requiredInt(values.fuelType),
      chargingType: requiredInt(values.chargingType),
      engineCC: nullableNumber(values.engineCC),
      engineType: nullableText(values.engineType),
      horsePower: nullableNumber(values.horsePower),
      torqueNm: nullableNumber(values.torqueNm),
      transmission: nullableText(values.transmission),
      mileageKmPerL: nullableNumber(values.mileageKmPerL),
      motorPowerW: nullableNumber(values.motorPowerW),
      motorType: nullableText(values.motorType),
      batteryCapacityKWh: nullableNumber(values.batteryCapacityKWh),
      batteryType: nullableText(values.batteryType),
      rangeKm: nullableNumber(values.rangeKm),
      chargingTimeHours: nullableNumber(values.chargingTimeHours),
      hasFastCharging: selectValueToBool(values.hasFastChargingSelect),
      hasRegenerativeBraking: selectValueToBool(values.hasRegenerativeBrakingSelect),
      hasSmartConnectivity: selectValueToBool(values.hasSmartConnectivitySelect),
      topSpeedKmph: requiredInt(values.topSpeedKmph),
      weightKg: requiredNumber(values.weightKg),
      seatHeightMm: requiredNumber(values.seatHeightMm),
      wheelBaseMm: requiredNumber(values.wheelBaseMm),
      brakeType: nullableText(values.brakeType),
      suspensionFront: nullableText(values.suspensionFront),
      suspensionRear: nullableText(values.suspensionRear),
      hasABS: Boolean(values.hasABS),
      hasElectricStart: Boolean(values.hasElectricStart),
      isLicenseRequired: Boolean(values.isLicenseRequired),
      price: requiredNumber(values.price),
      exShowroomPrice: requiredNumber(values.exShowroomPrice),
      isAvailable: Boolean(values.isAvailable),
      features,
      estimatedDelivaryDays: nullableNumber(values.estimatedDelivaryDays),
    };

    if (isEdit) {
      payload.updatedAt = catalogueData?.updatedAt || new Date().toISOString();
    }

    return payload;
  };

  const handleSubmit = async () => {
    try {
      const validatedValues = await form.validateFields();
      const values = {
        ...form.getFieldsValue(true),
        ...validatedValues,
      };
      const payload = buildPayload(values);
      setLoading(true);

      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isEdit) {
        await axios.put(`${apiUrl}/api${API.catalogue.path}/${catalogueData.id}`, payload, { headers });
      } else {
        await axios.post(`${apiUrl}/api${API.catalogue.path}`, payload, { headers });
      }

      message.success(isEdit ? 'Catalogue updated successfully' : 'Catalogue created successfully');
      form.resetFields();
      onCancel();
      onSuccess();
    } catch (error) {
      if (error?.errorFields) {
        message.error('Please fill the required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to save catalogue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? `Update Catalogue #${catalogueData?.id}` : 'Add Vehicle Catalogue'}
      open={visible}
      onCancel={onCancel}
      width={980}
      destroyOnHidden
      footer={[
        <Button key="cancel" type="white" outlined onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spin size="small" /> : isEdit ? 'Update Catalogue' : 'Create Catalogue'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Tabs defaultActiveKey="basic">
          <TabPane tab="Basic" key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="summary" label="Summary" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Short summary" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Description" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="vehicleModelId"
                  label="Vehicle Model"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="Select Vehicle Model"
                    loading={vehicleModelsLoading}
                    optionFilterProp="label"
                    options={vehicleModels.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="brand" label="Brand" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Brand" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="model" label="Model" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Model" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="year" label="Year" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="vehicleCategory"
                  label="Vehicle Category"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select options={VehicleCategoryOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="type" label="Vehicle Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={filteredVehicleTypeOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={FuelTypeOptions} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="chargingType" label="Charging Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={ChargingTypeOptions} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Powertrain" key="powertrain">
            {showPetrolFields && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Petrol Powertrain</div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="engineCC" label="Engine CC">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="engineType" label="Engine Type">
                      <Input placeholder="Engine type" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="transmission" label="Transmission">
                      <Input placeholder="Transmission" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="horsePower" label="Horse Power">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="torqueNm" label="Torque (Nm)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="mileageKmPerL" label="Mileage (Km/L)">
                      <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {showElectricFields && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Electric Powertrain</div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="motorPowerW" label="Motor Power (W)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="motorType" label="Motor Type">
                      <Input placeholder="Motor type" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="batteryCapacityKWh" label="Battery Capacity (kWh)">
                      <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="batteryType" label="Battery Type">
                      <Input placeholder="Battery type" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="rangeKm" label="Range (Km)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="chargingTimeHours" label="Charging Time (Hours)">
                      <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="hasFastChargingSelect" label="Fast Charging">
                      <Select
                        allowClear
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="hasRegenerativeBrakingSelect" label="Regenerative Braking">
                      <Select
                        allowClear
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="hasSmartConnectivitySelect" label="Smart Connectivity">
                      <Select
                        allowClear
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </TabPane>

          <TabPane tab="Specs" key="specs">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="topSpeedKmph"
                  label="Top Speed (Kmph)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="weightKg" label="Weight (Kg)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="seatHeightMm"
                  label="Seat Height (Mm)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="wheelBaseMm" label="Wheel Base (Mm)" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="brakeType" label="Brake Type">
                  <Input placeholder="Brake type" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="suspensionFront" label="Suspension Front">
                  <Input placeholder="Front suspension" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="suspensionRear" label="Suspension Rear">
                  <Input placeholder="Rear suspension" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="hasABS" label="Has ABS" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="hasElectricStart" label="Has Electric Start" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Commercial" key="commercial">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="exShowroomPrice"
                  label="Ex-showroom Price"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="isLicenseRequired" label="Driving Licence Required" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="isAvailable" label="Is Available" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="estimatedDelivaryDays" label="Estimated Delivery Days">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="featuresText" label="Features (comma separated)">
              <TextArea rows={2} placeholder="ABS, Smart connectivity, Fast charging" />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
}

CatalogueModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  catalogueData: PropTypes.object,
};

CatalogueModal.defaultProps = {
  catalogueData: null,
};

export default CatalogueModal;
