import React, { useEffect, useState } from 'react';
import { Row, Col, Form, InputNumber, Button, Card, message, Space, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function GracePeriodSettings() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [initialValues, setInitialValues] = useState({
    numOfDaysRentalReturn: 0,
    noOfDaysForMissingRepayment: 0,
  });

  const { loading, saving } = state;

  const normalizeDays = (value) => {
    const days = Number(value);
    return Number.isFinite(days) ? days : 0;
  };

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.setting.gracePeriodGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      const normalizedValues = {
        numOfDaysRentalReturn: normalizeDays(payload.numOfDaysRentalReturn),
        noOfDaysForMissingRepayment: normalizeDays(payload.noOfDaysForMissingRepayment),
      };

      setInitialValues(normalizedValues);
      form.setFieldsValue(normalizedValues);
    } catch (error) {
      console.error('Error fetching grace period settings:', error);
      message.error('Failed to fetch grace period settings');
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
        numOfDaysRentalReturn: normalizeDays(values.numOfDaysRentalReturn),
        noOfDaysForMissingRepayment: normalizeDays(values.noOfDaysForMissingRepayment),
      };

      await DataService.post(API.setting.gracePeriodUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Grace period settings updated successfully');
      setInitialValues(payload);
      form.setFieldsValue(payload);
    } catch (error) {
      console.error('Error updating grace period settings:', error);

      let errorMessage = 'Failed to update grace period settings. Please try again.';
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
          title="Grace Period Settings"
          subTitle="Configure grace period days for rental returns and missing repayments"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="clock" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Update the grace period durations used by the system
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
                    <FeatherIcon icon="calendar" size={20} />
                    Grace Period Configuration
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
                    label="Number of Days for Rental Return"
                    name="numOfDaysRentalReturn"
                    rules={[{ required: true, message: 'Please enter number of days for rental return' }]}
                    extra="Grace period in days allowed for rental vehicle returns"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter number of days" />
                  </Form.Item>

                  <Form.Item
                    label="Number of Days for Missing Repayment"
                    name="noOfDaysForMissingRepayment"
                    rules={[{ required: true, message: 'Please enter number of days for missing repayment' }]}
                    extra="Grace period in days allowed before marking a repayment as missing"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter number of days" />
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

export default GracePeriodSettings;
