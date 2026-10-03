import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Select, InputNumber, Button, Card, message, Space, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function OwnershipPaymentSettings() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [initialValues, setInitialValues] = useState({
    monthlyEmiDayOfMonth: undefined,
    weeklyEmiDayOfWeek: undefined,
  });

  const { loading, saving } = state;

  const normalizeWeekDay = (value) => {
    const day = Number(value);
    return Number.isInteger(day) && day >= 0 && day <= 6 ? day : undefined;
  };

  const normalizeMonthDay = (value) => {
    const day = Number(value);
    return Number.isInteger(day) && day >= 1 && day <= 31 ? day : undefined;
  };

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.setting.paymentScheduleGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      const normalizedValues = {
        monthlyEmiDayOfMonth: normalizeMonthDay(payload.monthlyEmiDayOfMonth),
        weeklyEmiDayOfWeek: normalizeWeekDay(payload.weeklyEmiDayOfWeek),
      };

      setInitialValues(normalizedValues);
      form.setFieldsValue(normalizedValues);
    } catch (error) {
      console.error('Error fetching payment schedule settings:', error);
      message.error('Failed to fetch payment schedule settings');
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
        monthlyEmiDayOfMonth: Number(values.monthlyEmiDayOfMonth),
        weeklyEmiDayOfWeek: Number(values.weeklyEmiDayOfWeek),
      };

      await DataService.post(API.setting.paymentScheduleUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Payment schedule settings saved successfully');

      setInitialValues(payload);
      form.setFieldsValue(payload);
    } catch (error) {
      console.error('Error saving payment schedule settings:', error);

      let errorMessage = 'Failed to save payment schedule settings. Please try again.';
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
          title="Ownership Payment Settings"
          subTitle="Configure weekly and monthly EMI schedules"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="calendar" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Select the day of week and day of month for ownership EMI processing
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
                    <FeatherIcon icon="credit-card" size={20} />
                    Payment Schedule Configuration
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
                    label="Weekly EMI Day Of Week"
                    name="weeklyEmiDayOfWeek"
                    rules={[{ required: true, message: 'Please select weekly EMI day of week' }]}
                  >
                    <Select placeholder="Select a day" options={WEEKDAY_OPTIONS} optionFilterProp="label" showSearch />
                  </Form.Item>

                  <Form.Item
                    label="Monthly EMI Day Of Month"
                    name="monthlyEmiDayOfMonth"
                    rules={[{ required: true, message: 'Please select monthly EMI day of month' }]}
                  >
                    <InputNumber min={1} max={31} style={{ width: '100%' }} placeholder="Enter day of month" />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving}>
                        Save Settings
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

export default OwnershipPaymentSettings;
