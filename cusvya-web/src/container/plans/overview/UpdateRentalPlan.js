import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

function UpdateRentalPlan({ visible, onCancel, planData, getData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    if (planData && visible) {
      form.setFieldsValue({
        name: planData.name || '',
        duration: planData.duration || '',
        durationInDays: planData.durationInDays ?? 0,
        badge: planData.badge || '',
        icon: planData.icon || '',
        description: planData.description || '',
        colorCode: planData.colorCode || '',
        isPreferred: planData.isPreferred ?? false,
        discountPercentage: planData.discountPercentage ?? 0,
        isActive: planData.isActive ?? true,
      });
    }
  }, [planData, visible, form]);

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
        isActive: values.isActive ?? true,
      };

      const token = getItem('access_token');
      await axios.put(`${getApiUrl()}/api${API.rentalPlan.path}/${planData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Rental plan updated successfully');
      if (getData) getData();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update rental plan');
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
      title={`Edit Rental Plan — ${planData?.name || ''}`}
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button type="white" outlined onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? <Spin size="small" /> : 'Save Changes'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isPreferred" label="Mark as Preferred" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

UpdateRentalPlan.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  planData: PropTypes.object,
  getData: PropTypes.func.isRequired,
};

export default UpdateRentalPlan;
