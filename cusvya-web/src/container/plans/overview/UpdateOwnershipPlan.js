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

function UpdateOwnershipPlan({ visible, onCancel, planData, getData }) {
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
        tenure: planData.tenure || '',
        tenureInMonths: planData.tenureInMonths ?? 0,
        tenureInWeeks: planData.tenureInWeeks ?? null,
        frequency: planData.frequency || '',
        badge: planData.badge || '',
        isPopular: planData.isPopular ?? false,
        isActive: planData.isActive ?? true,
      });
    }
  }, [planData, visible, form]);

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
        isActive: values.isActive ?? true,
      };

      const token = getItem('access_token');
      await axios.put(`${getApiUrl()}/api${API.ownershipPlan.path}/${planData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Ownership plan updated successfully');
      if (getData) getData();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update ownership plan');
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
      title={`Edit Ownership Plan — ${planData?.tenure || ''}`}
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
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isPopular" label="Mark as Popular" valuePropName="checked">
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

UpdateOwnershipPlan.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  planData: PropTypes.object,
  getData: PropTypes.func.isRequired,
};

export default UpdateOwnershipPlan;
