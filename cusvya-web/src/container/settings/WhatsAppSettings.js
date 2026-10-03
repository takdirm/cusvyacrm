import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Input, Button, Card, message, Space, Spin, Switch } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function WhatsAppSettings() {
  const [settingsForm] = Form.useForm();
  const [testSimpleForm] = Form.useForm();

  const [state, setState] = useState({
    loading: false,
    saving: false,
    testingSimple: false,
  });

  const { loading, saving, testingSimple } = state;

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.whatsapp.settingsGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      settingsForm.setFieldsValue({
        enabled: payload.enabled || false,
        accessToken: payload.accessToken || '',
        phoneNumberId: payload.phoneNumberId || '',
        businessAccountId: payload.businessAccountId || '',
        businessPhone: payload.businessPhone || '',
        apiVersion: payload.apiVersion || 'v25.0',
        apiBaseUrl: payload.apiBaseUrl || 'https://graph.facebook.com',
        testPhoneNumber: payload.testPhoneNumber || '',
        webhookVerifyToken: payload.webhookVerifyToken || '',
      });
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      message.error('Failed to fetch WhatsApp settings');
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
        enabled: values.enabled || false,
        accessToken: values.accessToken || '',
        phoneNumberId: values.phoneNumberId || '',
        businessAccountId: values.businessAccountId || '',
        businessPhone: values.businessPhone || '',
        apiVersion: values.apiVersion || 'v25.0',
        apiBaseUrl: values.apiBaseUrl || 'https://graph.facebook.com',
        testPhoneNumber: values.testPhoneNumber || '',
        webhookVerifyToken: values.webhookVerifyToken || '',
      };

      await DataService.post(API.whatsapp.settingsUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('WhatsApp settings saved successfully!');
      await getData();
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);

      let errorMessage = 'Failed to save WhatsApp settings. Please try again.';
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

  const handleTestSimpleMessage = async (values) => {
    try {
      setState((prev) => ({ ...prev, testingSimple: true }));

      const payload = {
        phoneNumber: values.phoneNumber,
        message: values.message,
      };

      await DataService.post(API.notificationTest.testSimpleMessage, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Test message sent successfully!');
      testSimpleForm.resetFields();
    } catch (error) {
      console.error('Error sending test message:', error);

      let errorMessage = 'Failed to send test message. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, testingSimple: false }));
    }
  };

  const handleReset = () => {
    getData();
    message.info('Form reset to saved values');
  };

  if (loading) {
    return (
      <Main>
        <PageHeader
          ghost
          title="WhatsApp Settings"
          subTitle="Configure WhatsApp integration settings"
          buttons={[
            <Button key="back" onClick={() => window.history.back()} type="default">
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>,
          ]}
        />
        <ProjectHeader>
          <Cards headless>
            <div className="spin" style={{ minHeight: 400 }}>
              <Spin size="large" />
            </div>
          </Cards>
        </ProjectHeader>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        ghost
        title="WhatsApp Settings"
        subTitle="Configure WhatsApp integration settings"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
        ]}
      />
      <ProjectHeader>
        <Row gutter={[24, 24]}>
          {/* WhatsApp Settings Card */}
          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FeatherIcon icon="message-circle" size={18} />
                  <span>WhatsApp Configuration</span>
                </div>
              }
            >
              <Form form={settingsForm} layout="vertical" onFinish={handleSave}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="enabled" label="Enable WhatsApp" valuePropName="checked">
                      <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="accessToken"
                      label="Access Token"
                      rules={[{ required: true, message: 'Please enter access token' }]}
                    >
                      <Input.Password placeholder="Enter WhatsApp API access token" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phoneNumberId"
                      label="Phone Number ID"
                      rules={[{ required: true, message: 'Please enter phone number ID' }]}
                    >
                      <Input placeholder="Enter WhatsApp phone number ID" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="businessAccountId"
                      label="Business Account ID"
                      rules={[{ required: true, message: 'Please enter business account ID' }]}
                    >
                      <Input placeholder="Enter WhatsApp business account ID" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="businessPhone"
                      label="Business Phone"
                      rules={[{ required: true, message: 'Please enter business phone' }]}
                    >
                      <Input placeholder="Enter business phone number" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="apiVersion"
                      label="API Version"
                      rules={[{ required: true, message: 'Please enter API version' }]}
                    >
                      <Input placeholder="e.g., v25.0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="apiBaseUrl"
                      label="API Base URL"
                      rules={[{ required: true, message: 'Please enter API base URL' }]}
                    >
                      <Input placeholder="e.g., https://graph.facebook.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="testPhoneNumber" label="Test Phone Number">
                      <Input placeholder="Enter test phone number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="webhookVerifyToken" label="Webhook Verify Token">
                      <Input.Password placeholder="Enter webhook verify token" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      <FeatherIcon icon="save" size={14} />
                      Save Settings
                    </Button>
                    <Button onClick={handleReset}>
                      <FeatherIcon icon="refresh-cw" size={14} />
                      Reset
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Cards>
          </Col>

          {/* Test API Card */}
          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FeatherIcon icon="send" size={18} />
                  <span>Test WhatsApp API</span>
                </div>
              }
            >
              <Row gutter={24}>
                {/* Test Simple Message */}
                <Col xs={24}>
                  <Card
                    type="inner"
                    title="Test Simple Message"
                    style={{ marginBottom: 16 }}
                    headStyle={{ background: '#f5f5f5' }}
                  >
                    <Form form={testSimpleForm} layout="vertical" onFinish={handleTestSimpleMessage}>
                      <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                      >
                        <Input placeholder="Enter phone number with country code" />
                      </Form.Item>
                      <Form.Item
                        name="message"
                        label="Message"
                        rules={[{ required: true, message: 'Please enter message' }]}
                      >
                        <Input.TextArea rows={3} placeholder="Enter test message" />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={testingSimple} block>
                          <FeatherIcon icon="send" size={14} />
                          Send Simple Message
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
              </Row>
            </Cards>
          </Col>
        </Row>
      </ProjectHeader>
    </Main>
  );
}

export default WhatsAppSettings;
