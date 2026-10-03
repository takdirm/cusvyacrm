import React, { useEffect, useState } from 'react';
import { Row, Col, Form, InputNumber, Button, Card, message, Space, Spin, Select, Switch, Divider } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import {
  ArrearsTypeLabels,
  ArrearsCalculationType,
  ArrearsCalculationTypeLabels,
} from '../../config/enum/arrearsEnums';

const { Option } = Select;

function ArrearsSettingScreen() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [initialValues, setInitialValues] = useState({
    latePaymentFeeCalculationType: 0,
    latePaymentFeeValue: 0,
    dailyOverdueInterestCalculationType: 0,
    dailyOverdueInterestValue: 0,
    missedEMIPenaltyCalculationType: 0,
    missedEMIPenaltyValue: 0,
    scooterReturnDelayFeeCalculationType: 0,
    scooterReturnDelayFeeValue: 0,
    excessKilometerChargesCalculationType: 0,
    excessKilometerChargesValue: 0,
    damageMisusePenaltyCalculationType: 0,
    damageMisusePenaltyValue: 0,
    lostHelmetAccessoryFeeCalculationType: 0,
    lostHelmetAccessoryFeeValue: 0,
    bounceFailedTransactionFeeCalculationType: 0,
    bounceFailedTransactionFeeValue: 0,
    earlyTerminationFeeCalculationType: 0,
    earlyTerminationFeeValue: 0,
    repossessionFeeCalculationType: 0,
    repossessionFeeValue: 0,
    insuranceLapsePenaltyCalculationType: 0,
    insuranceLapsePenaltyValue: 0,
    isArrearsEnabled: true,
  });

  const { loading, saving } = state;

  const normalizeValue = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.arrears.settingsGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      const normalizedValues = {
        latePaymentFeeCalculationType: normalizeValue(payload.latePaymentFeeCalculationType),
        latePaymentFeeValue: normalizeValue(payload.latePaymentFeeValue),
        dailyOverdueInterestCalculationType: normalizeValue(payload.dailyOverdueInterestCalculationType),
        dailyOverdueInterestValue: normalizeValue(payload.dailyOverdueInterestValue),
        missedEMIPenaltyCalculationType: normalizeValue(payload.missedEMIPenaltyCalculationType),
        missedEMIPenaltyValue: normalizeValue(payload.missedEMIPenaltyValue),
        scooterReturnDelayFeeCalculationType: normalizeValue(payload.scooterReturnDelayFeeCalculationType),
        scooterReturnDelayFeeValue: normalizeValue(payload.scooterReturnDelayFeeValue),
        excessKilometerChargesCalculationType: normalizeValue(payload.excessKilometerChargesCalculationType),
        excessKilometerChargesValue: normalizeValue(payload.excessKilometerChargesValue),
        damageMisusePenaltyCalculationType: normalizeValue(payload.damageMisusePenaltyCalculationType),
        damageMisusePenaltyValue: normalizeValue(payload.damageMisusePenaltyValue),
        lostHelmetAccessoryFeeCalculationType: normalizeValue(payload.lostHelmetAccessoryFeeCalculationType),
        lostHelmetAccessoryFeeValue: normalizeValue(payload.lostHelmetAccessoryFeeValue),
        bounceFailedTransactionFeeCalculationType: normalizeValue(payload.bounceFailedTransactionFeeCalculationType),
        bounceFailedTransactionFeeValue: normalizeValue(payload.bounceFailedTransactionFeeValue),
        earlyTerminationFeeCalculationType: normalizeValue(payload.earlyTerminationFeeCalculationType),
        earlyTerminationFeeValue: normalizeValue(payload.earlyTerminationFeeValue),
        repossessionFeeCalculationType: normalizeValue(payload.repossessionFeeCalculationType),
        repossessionFeeValue: normalizeValue(payload.repossessionFeeValue),
        insuranceLapsePenaltyCalculationType: normalizeValue(payload.insuranceLapsePenaltyCalculationType),
        insuranceLapsePenaltyValue: normalizeValue(payload.insuranceLapsePenaltyValue),
        isArrearsEnabled: payload.isArrearsEnabled ?? true,
      };

      setInitialValues(normalizedValues);
      form.setFieldsValue(normalizedValues);
    } catch (error) {
      console.error('Error fetching arrears settings:', error);
      message.error('Failed to fetch arrears settings');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSave = async (values) => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      const payload = {
        latePaymentFeeCalculationType: normalizeValue(values.latePaymentFeeCalculationType),
        latePaymentFeeValue: normalizeValue(values.latePaymentFeeValue),
        dailyOverdueInterestCalculationType: normalizeValue(values.dailyOverdueInterestCalculationType),
        dailyOverdueInterestValue: normalizeValue(values.dailyOverdueInterestValue),
        missedEMIPenaltyCalculationType: normalizeValue(values.missedEMIPenaltyCalculationType),
        missedEMIPenaltyValue: normalizeValue(values.missedEMIPenaltyValue),
        scooterReturnDelayFeeCalculationType: normalizeValue(values.scooterReturnDelayFeeCalculationType),
        scooterReturnDelayFeeValue: normalizeValue(values.scooterReturnDelayFeeValue),
        excessKilometerChargesCalculationType: normalizeValue(values.excessKilometerChargesCalculationType),
        excessKilometerChargesValue: normalizeValue(values.excessKilometerChargesValue),
        damageMisusePenaltyCalculationType: normalizeValue(values.damageMisusePenaltyCalculationType),
        damageMisusePenaltyValue: normalizeValue(values.damageMisusePenaltyValue),
        lostHelmetAccessoryFeeCalculationType: normalizeValue(values.lostHelmetAccessoryFeeCalculationType),
        lostHelmetAccessoryFeeValue: normalizeValue(values.lostHelmetAccessoryFeeValue),
        bounceFailedTransactionFeeCalculationType: normalizeValue(values.bounceFailedTransactionFeeCalculationType),
        bounceFailedTransactionFeeValue: normalizeValue(values.bounceFailedTransactionFeeValue),
        earlyTerminationFeeCalculationType: normalizeValue(values.earlyTerminationFeeCalculationType),
        earlyTerminationFeeValue: normalizeValue(values.earlyTerminationFeeValue),
        repossessionFeeCalculationType: normalizeValue(values.repossessionFeeCalculationType),
        repossessionFeeValue: normalizeValue(values.repossessionFeeValue),
        insuranceLapsePenaltyCalculationType: normalizeValue(values.insuranceLapsePenaltyCalculationType),
        insuranceLapsePenaltyValue: normalizeValue(values.insuranceLapsePenaltyValue),
        isArrearsEnabled: values.isArrearsEnabled ?? true,
      };

      await DataService.post(API.arrears.settingsUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Arrears settings updated successfully');
      setInitialValues(payload);
      form.setFieldsValue(payload);
    } catch (error) {
      console.error('Error updating arrears settings:', error);

      let errorMessage = 'Failed to update arrears settings. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleReset = () => {
    form.setFieldsValue(initialValues);
    message.info('Form reset to saved values');
  };

  const renderArrearField = (fieldKey, label) => {
    const calculationTypeField = `${fieldKey}CalculationType`;
    const valueField = `${fieldKey}Value`;

    return (
      <Card
        size="small"
        style={{ marginBottom: '16px' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FeatherIcon icon="dollar-sign" size={14} />
            {label}
          </div>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Calculation Type"
              name={calculationTypeField}
              rules={[{ required: true, message: 'Please select calculation type' }]}
            >
              <Select placeholder="Select type">
                {Object.keys(ArrearsCalculationType).map((key) => (
                  <Option key={key} value={Number(key)}>
                    {ArrearsCalculationTypeLabels[key]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Value" name={valueField} rules={[{ required: true, message: 'Please enter value' }]}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Enter value"
                precision={2}
                formatter={(value) => {
                  const calcType = form.getFieldValue(calculationTypeField);
                  if (calcType === 1) {
                    return value ? `${value}%` : '';
                  }
                  return value ? `₹ ${value}` : '';
                }}
                parser={(value) => value.replace(/₹\s?|(,*)|%/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Arrears Settings"
          subTitle="Configure arrears calculation types and values for various scenarios"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="alert-circle" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>Update arrears settings used by the system</span>
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="settings" size={20} />
                    Arrears Configuration
                  </div>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={initialValues}
                  style={{ marginTop: '8px' }}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item name="isArrearsEnabled" label="Enable Arrears System" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      {renderArrearField('latePaymentFee', ArrearsTypeLabels[0])}
                      {renderArrearField('dailyOverdueInterest', ArrearsTypeLabels[1])}
                      {renderArrearField('missedEMIPenalty', ArrearsTypeLabels[2])}
                      {renderArrearField('scooterReturnDelayFee', ArrearsTypeLabels[3])}
                      {renderArrearField('excessKilometerCharges', ArrearsTypeLabels[4])}
                      {renderArrearField('damageMisusePenalty', ArrearsTypeLabels[5])}
                    </Col>
                    <Col xs={24} lg={12}>
                      {renderArrearField('lostHelmetAccessoryFee', ArrearsTypeLabels[6])}
                      {renderArrearField('bounceFailedTransactionFee', ArrearsTypeLabels[7])}
                      {renderArrearField('earlyTerminationFee', ArrearsTypeLabels[8])}
                      {renderArrearField('repossessionFee', ArrearsTypeLabels[9])}
                      {renderArrearField('insuranceLapsePenalty', ArrearsTypeLabels[10])}
                    </Col>
                  </Row>

                  <Divider />

                  <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving} size="large">
                        <FeatherIcon icon="save" size={16} style={{ marginRight: '8px' }} />
                        Update Settings
                      </Button>
                      <Button htmlType="button" onClick={handleReset} disabled={saving} size="large">
                        <FeatherIcon icon="rotate-ccw" size={16} style={{ marginRight: '8px' }} />
                        Reset
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default ArrearsSettingScreen;
