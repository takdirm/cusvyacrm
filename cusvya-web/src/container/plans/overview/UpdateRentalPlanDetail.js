import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { getItem } from '../../../utility/localStorageControl';

function UpdateRentalPlanDetail({ visible, onCancel, detailData }) {
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
    if (detailData && visible) {
      form.setFieldsValue({
        kmLimit: detailData.kmLimit || '',
        kmValue: detailData.kmValue ?? 0,
        priceMultiplier: detailData.priceMultiplier ?? 1,
        extraKmCharge: detailData.extraKmCharge ?? 0,
        isPopular: detailData.isPopular ?? false,
        isUnlimited: detailData.isUnlimited ?? false,
        isActive: detailData.isActive ?? true,
      });
    }
  }, [detailData, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        rentalPlanId: detailData.rentalPlanId,
        kmLimit: values.kmLimit || '',
        kmValue: values.kmValue ?? 0,
        priceMultiplier: values.priceMultiplier ?? 1,
        extraKmCharge: values.extraKmCharge ?? 0,
        isPopular: values.isPopular ?? false,
        isUnlimited: values.isUnlimited ?? false,
        isActive: values.isActive ?? detailData?.isActive ?? true,
      };

      const token = getItem('access_token');
      await axios.put(`${getApiUrl()}/api/Plan/rental/details/${detailData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Detail updated successfully');
      onCancel(true);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update detail');
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
      title={`Edit Detail — ${detailData?.kmLimit || ''}`}
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
              <Form.Item name="isUnlimited" label="Unlimited KM" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPopular" label="Mark as Popular" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isActive" label="Plan Detail Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Deactive" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

UpdateRentalPlanDetail.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  detailData: PropTypes.object,
};

export default UpdateRentalPlanDetail;
