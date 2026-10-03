import React, { useState } from 'react';
import { Form, Input, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

function CreateRentalPlan({ visible, onCancel }) {
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
        name: values.name,
        duration: values.duration || '',
        durationInDays: values.durationInDays ?? 0,
        badge: values.badge || '',
        icon: values.icon || '',
        description: values.description || '',
        colorCode: values.colorCode || '',
        isPreferred: values.isPreferred ?? false,
        discountPercentage: values.discountPercentage || 0,
      };

      const token = getItem('access_token');
      await axios.post(`${getApiUrl()}/api${API.rentalPlan.path}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Rental plan created successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create rental plan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      type="primary"
      title="Create Rental Plan"
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button type="white" outlined onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? <Spin size="small" /> : 'Create Plan'}
          </Button>
        </div>,
      ]}
      onCancel={onCancel}
      width={680}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Plan Name" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<FeatherIcon icon="file-text" size={14} />} placeholder="e.g. Monthly Plan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration Label">
                <Input prefix={<FeatherIcon icon="clock" size={14} />} placeholder="e.g. 30 Days" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="durationInDays"
                label="Duration (Days)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="30" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discountPercentage" label="Discount %">
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="colorCode" label="Color Code">
                <Input prefix={<FeatherIcon icon="droplet" size={14} />} placeholder="#1890ff" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="badge" label="Badge Text">
                <Input prefix={<FeatherIcon icon="award" size={14} />} placeholder="e.g. Popular" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="icon" label="Icon">
                <Input prefix={<FeatherIcon icon="image" size={14} />} placeholder="icon name or URL" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this plan..." />
          </Form.Item>
          <Form.Item name="isPreferred" label="Mark as Preferred" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

CreateRentalPlan.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateRentalPlan;
