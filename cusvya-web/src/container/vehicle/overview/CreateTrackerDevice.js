import React, { useState } from 'react';
import { Form, Input, message, Row, Col, DatePicker } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { API } from '../../../config/api/index';
import { getItem, getSelectedRegion } from '../../../utility/localStorageControl';

function CreateTrackerDevice({ visible, onCancel }) {
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
        brandName: values.brandName || '',
        imei: values.imei,
        phoneNumber: values.phoneNumber,
        modelNumber: values.modelNumber || '',
        label: values.label || '',
        planExpiryDate: values.planExpiryDate ? values.planExpiryDate.toISOString() : null,
        vehicleId: null,
      };

      const token = getItem('access_token');
      const selectedRegion = getSelectedRegion();
      const headers = { Authorization: `Bearer ${token}` };
      if (selectedRegion?.code) {
        headers['X-Region-Code'] = selectedRegion.code;
      }

      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/api${API.trackerDevice.path}`, payload, {
        headers,
      });

      message.success('Tracker device created successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create tracker device');
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
      title="Add New Tracker Device"
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" outlined onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button size="default" type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? 'Creating...' : 'Create Device'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={680}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brandName" label="Brand Name">
                <Input prefix={<FeatherIcon icon="bookmark" size={14} />} placeholder="e.g. Teltonika" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="modelNumber"
                label="Model Number"
                rules={[{ max: 100, message: 'Model number is too long' }]}
              >
                <Input prefix={<FeatherIcon icon="cpu" size={14} />} placeholder="e.g. FMB920" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="label" label="Label" rules={[{ max: 100, message: 'Label is too long' }]}>
                <Input prefix={<FeatherIcon icon="tag" size={14} />} placeholder="e.g. Warehouse-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planExpiryDate" label="Plan Expiry Date">
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="Select plan expiry"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="imei" label="IMEI" rules={[{ required: true, message: 'Please enter IMEI' }]}>
                <Input prefix={<FeatherIcon icon="hash" size={14} />} placeholder="IMEI" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input prefix={<FeatherIcon icon="phone" size={14} />} placeholder="Phone number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

CreateTrackerDevice.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateTrackerDevice;
