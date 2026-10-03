import React, { useState } from 'react';
import { Form, Input, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { getItem } from '../../../utility/localStorageControl';

function CreateRentalPlanDetail({ visible, onCancel, rentalPlanId }) {
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
        rentalPlanId,
        kmLimit: values.kmLimit || '',
        kmValue: values.kmValue ?? 0,
        priceMultiplier: values.priceMultiplier ?? 1,
        extraKmCharge: values.extraKmCharge ?? 0,
        isPopular: values.isPopular ?? false,
        isUnlimited: values.isUnlimited ?? false,
      };

      const token = getItem('access_token');
      await axios.post(`${getApiUrl()}/api/Plan/rental/details`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Detail added successfully');
      form.resetFields();
      onCancel(true);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create detail');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel(false);
  };

  return (
    <Modal
      type="primary"
      title="Add Plan Detail"
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button type="white" outlined onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? <Spin size="small" /> : 'Add Detail'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={560}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="kmLimit" label="KM Limit Label" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<FeatherIcon icon="map" size={14} />} placeholder="e.g. 100 KM / Unlimited" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="kmValue" label="KM Value">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="100" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priceMultiplier" label="Price Multiplier">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="1.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="extraKmCharge" label="Extra KM Charge (₹)">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isUnlimited" label="Unlimited KM" valuePropName="checked" initialValue={false}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
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

CreateRentalPlanDetail.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  rentalPlanId: PropTypes.number.isRequired,
};

export default CreateRentalPlanDetail;
