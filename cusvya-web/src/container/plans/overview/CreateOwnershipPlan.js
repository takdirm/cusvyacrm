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

function CreateOwnershipPlan({ visible, onCancel }) {
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
        tenure: values.tenure || '',
        tenureInMonths: values.tenureInMonths || 0,
        tenureInWeeks: values.tenureInWeeks || null,
        frequency: values.frequency || '',
        badge: values.badge || '',
        isPopular: values.isPopular ?? false,
      };

      const token = getItem('access_token');
      await axios.post(`${getApiUrl()}/api${API.ownershipPlan.path}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Ownership plan created successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create ownership plan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      type="primary"
      title="Create Ownership Plan"
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
      width={620}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenure" label="Tenure Label" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<FeatherIcon icon="calendar" size={14} />} placeholder="e.g. 12 Months" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="frequency" label="Payment Frequency">
                <Input prefix={<FeatherIcon icon="repeat" size={14} />} placeholder="e.g. Monthly" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenureInMonths" label="Tenure (Months)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="12" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tenureInWeeks" label="Tenure (Weeks)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="badge" label="Badge Text">
                <Input prefix={<FeatherIcon icon="award" size={14} />} placeholder="e.g. Best Value" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPopular" label="Mark as Popular" valuePropName="checked" initialValue={false}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

CreateOwnershipPlan.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateOwnershipPlan;
