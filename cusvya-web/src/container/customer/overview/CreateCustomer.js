import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Tabs, Row, Col, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

const { Option } = Select;
const { TabPane } = Tabs;

const BILLING_OPTIONS = [
  { label: 'Prepaid', value: 0 },
  { label: 'Postpaid', value: 1 },
];

function CreateCustomer({ visible, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        address: values.address || '',
        city: values.city || '',
        state: values.state || '',
        zipCode: values.zipCode || '',
        billingType: values.billingType ?? 0,
      };

      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/api${API.customer.path}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Customer created successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create customer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      type="primary"
      title="Add New Customer"
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" outlined onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button size="default" type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={760}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical" initialValues={{ billingType: 0 }}>
          <Tabs defaultActiveKey="personal">
            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="user" size={14} /> Personal Info
                </span>
              }
              key="personal"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input prefix={<FeatherIcon icon="user" size={14} />} placeholder="John" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input prefix={<FeatherIcon icon="user" size={14} />} placeholder="Doe" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Enter a valid email address' },
                    ]}
                  >
                    <Input prefix={<FeatherIcon icon="mail" size={14} />} placeholder="john@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phoneNumber"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input prefix={<FeatherIcon icon="phone" size={14} />} placeholder="+91 98765 43210" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: 'Please enter a password' },
                      { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                  >
                    <Input.Password prefix={<FeatherIcon icon="lock" size={14} />} placeholder="••••••••" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      disabledDate={(d) => d && d > dayjs()}
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="billingType" label="Billing Type">
                    <Select placeholder="Select billing type">
                      {BILLING_OPTIONS.map((o) => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="map-pin" size={14} /> Address
                </span>
              }
              key="address"
            >
              <Form.Item name="address" label="Street Address">
                <Input prefix={<FeatherIcon icon="home" size={14} />} placeholder="123 Main Street" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="city" label="City">
                    <Input prefix={<FeatherIcon icon="map" size={14} />} placeholder="Mumbai" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="state" label="State">
                    <Input prefix={<FeatherIcon icon="map" size={14} />} placeholder="Maharashtra" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="zipCode" label="ZIP Code">
                    <Input prefix={<FeatherIcon icon="hash" size={14} />} placeholder="400001" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

CreateCustomer.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateCustomer;
