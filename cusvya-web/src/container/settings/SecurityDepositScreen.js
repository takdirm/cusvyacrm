import React, { useEffect, useState } from 'react';
import { Row, Col, Form, InputNumber, Button, Card, message, Space, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function SecurityDepositScreen() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [initialValues, setInitialValues] = useState({
    ownershipPlanSecurityAmount: 0,
    ownershipBookingFee: 0,
    rentalPlanSecurityAmount: 0,
  });

  const { loading, saving } = state;

  const normalizeAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  };

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.setting.securityAmountGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      const normalizedValues = {
        ownershipPlanSecurityAmount: normalizeAmount(payload.ownershipPlanSecurityAmount),
        ownershipBookingFee: normalizeAmount(payload.ownershipBookingFee),
        rentalPlanSecurityAmount: normalizeAmount(payload.rentalPlanSecurityAmount),
      };

      setInitialValues(normalizedValues);
      form.setFieldsValue(normalizedValues);
    } catch (error) {
      console.error('Error fetching security deposit settings:', error);
      message.error('Failed to fetch security deposit settings');
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
        ownershipPlanSecurityAmount: normalizeAmount(values.ownershipPlanSecurityAmount),
        ownershipBookingFee: normalizeAmount(values.ownershipBookingFee),
        rentalPlanSecurityAmount: normalizeAmount(values.rentalPlanSecurityAmount),
      };

      await DataService.post(API.setting.securityAmountUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Security deposit settings updated successfully');
      setInitialValues(payload);
      form.setFieldsValue(payload);
    } catch (error) {
      console.error('Error updating security deposit settings:', error);

      let errorMessage = 'Failed to update security deposit settings. Please try again.';
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
          title="Security Deposit Settings"
          subTitle="Configure security deposit amounts for ownership and rental plans"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="shield" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Update the default security deposits used by the system
              </span>
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24} lg={16} xl={12}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="lock" size={20} />
                    Security Deposit Configuration
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
                  <Form.Item
                    label="Ownership Plan Security Amount"
                    name="ownershipPlanSecurityAmount"
                    rules={[{ required: true, message: 'Please enter ownership plan security amount' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter amount" />
                  </Form.Item>

                  <Form.Item
                    label="Ownership Booking Fee"
                    name="ownershipBookingFee"
                    rules={[{ required: true, message: 'Please enter ownership booking fee' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter amount" />
                  </Form.Item>

                  <Form.Item
                    label="Rental Plan Security Amount"
                    name="rentalPlanSecurityAmount"
                    rules={[{ required: true, message: 'Please enter rental plan security amount' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter amount" />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving}>
                        Update
                      </Button>
                      <Button htmlType="button" onClick={handleReset} disabled={saving}>
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

export default SecurityDepositScreen;
