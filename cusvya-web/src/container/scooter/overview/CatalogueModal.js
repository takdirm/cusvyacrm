import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Tabs, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { ChargingTypeOptions, FuelType, FuelTypeOptions, VehicleTypeOptions } from '../../../config/enum/enum';

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

function CatalogueModal({ visible, onCancel, onSuccess, catalogueData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const selectedFuelType = Form.useWatch('fuelType', form);

  const isEdit = useMemo(() => Boolean(catalogueData?.id), [catalogueData]);
  const showPetrolFields = selectedFuelType === FuelType.Petrol || selectedFuelType === FuelType.Hybrid;
  const showElectricFields = selectedFuelType === FuelType.Electric || selectedFuelType === FuelType.Hybrid;

  useEffect(() => {
    if (!visible) return;

    if (!catalogueData) {
      form.resetFields();
      form.setFieldsValue({
        year: new Date().getFullYear(),
        type: 0,
        fuelType: 0,
        chargingType: 0,
        topSpeedKmph: 0,
        weightKg: 0,
        seatHeightMm: 0,
        wheelBaseMm: 0,
        price: 0,
        hasABS: false,
        hasElectricStart: false,
        isAvailable: true,
      });
      return;
    }

    form.setFieldsValue({
      ...catalogueData,
      featuresText: Array.isArray(catalogueData.features) ? catalogueData.features.join(', ') : '',
      hasFastChargingSelect: boolToSelectValue(catalogueData.hasFastCharging),
      hasRegenerativeBrakingSelect: boolToSelectValue(catalogueData.hasRegenerativeBraking),
      hasSmartConnectivitySelect: boolToSelectValue(catalogueData.hasSmartConnectivity),
      deliveryTimeline: catalogueData.deliveryTimeline ? catalogueData.deliveryTimeline.slice(0, 16) : undefined,
    });
  }, [catalogueData, visible, form]);

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
      year: Number(values.year),
      type: Number(values.type),
      fuelType: Number(values.fuelType),
      chargingType: Number(values.chargingType),
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
      topSpeedKmph: Number(values.topSpeedKmph),
      weightKg: Number(values.weightKg),
      seatHeightMm: Number(values.seatHeightMm),
      wheelBaseMm: Number(values.wheelBaseMm),
      brakeType: nullableText(values.brakeType),
      suspensionFront: nullableText(values.suspensionFront),
      suspensionRear: nullableText(values.suspensionRear),
      hasABS: Boolean(values.hasABS),
      hasElectricStart: Boolean(values.hasElectricStart),
      price: Number(values.price),
      isAvailable: Boolean(values.isAvailable),
      features,
      view360Url: nullableText(values.view360Url),
      imageUrl: nullableText(values.imageUrl),
      videoUrl: nullableText(values.videoUrl),
      deliveryTimeline: values.deliveryTimeline ? new Date(values.deliveryTimeline).toISOString() : null,
    };

    if (isEdit) {
      payload.updatedAt = catalogueData?.updatedAt || new Date().toISOString();
    }

    return payload;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
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
                <Form.Item name="description" label="Description">
                  <Input placeholder="Description" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
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
                <Form.Item name="type" label="Vehicle Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={VehicleTypeOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select options={FuelTypeOptions} />
                </Form.Item>
              </Col>
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
                <Form.Item name="isAvailable" label="Is Available" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="deliveryTimeline" label="Delivery Timeline">
                  <Input type="datetime-local" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="featuresText" label="Features (comma separated)">
              <TextArea rows={2} placeholder="ABS, Smart connectivity, Fast charging" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="view360Url" label="360 View URL">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="imageUrl" label="Image URL">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="videoUrl" label="Video URL">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
            </Row>
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
