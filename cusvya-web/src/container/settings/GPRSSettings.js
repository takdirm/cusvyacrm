import React, { useEffect, useState } from 'react';
import { Row, Col, Form, InputNumber, Button, Card, message, Space, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function GPRSSettings() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [initialValues, setInitialValues] = useState({
    keepGPRSHistoryDays: 4,
  });

  const { loading, saving } = state;

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.setting.gprsSettingsGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      const normalizedValues = {
        keepGPRSHistoryDays: payload.keepGPRSHistoryDays || 4,
      };

      setInitialValues(normalizedValues);
      form.setFieldsValue(normalizedValues);
    } catch (error) {
      console.error('Error fetching GPRS settings:', error);
      message.error('Failed to fetch GPRS settings');
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
        keepGPRSHistoryDays: Number(values.keepGPRSHistoryDays),
      };

      await DataService.post(API.setting.gprsSettingsUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('GPRS settings saved successfully');

      setInitialValues(payload);
      form.setFieldsValue(payload);
    } catch (error) {
      console.error('Error saving GPRS settings:', error);

      let errorMessage = 'Failed to save GPRS settings. Please try again.';
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
          title="GPRS Settings"
          subTitle="Configure GPRS history retention period"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Set the number of days to keep GPRS history data before cleanup
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
                    <FeatherIcon icon="sliders" size={20} />
                    GPRS History Configuration
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
                    label="Keep GPRS History Days"
                    name="keepGPRSHistoryDays"
                    rules={[
                      { required: true, message: 'Please enter the number of days' },
                      {
                        validator: (_, value) => {
                          if (value && Number(value) > 0) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Days must be greater than 0'));
                        },
                      },
                    ]}
                    tooltip={{
                      title: 'GPRS data older than this number of days will be automatically deleted',
                      icon: <FeatherIcon icon="help-circle" size={16} />,
                    }}
                  >
                    <InputNumber
                      min={1}
                      max={365}
                      style={{ width: '100%' }}
                      placeholder="Enter number of days"
                      addonAfter="days"
                    />
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

export default GPRSSettings;
