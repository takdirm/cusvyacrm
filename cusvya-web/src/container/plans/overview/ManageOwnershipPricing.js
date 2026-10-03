import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

function ManageOwnershipPricing({ visible, onCancel, planData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hasPriceModel, setHasPriceModel] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  };

  const resetForm = () => {
    form.setFieldsValue({
      name: '',
      insurancePercent: 0,
      maintainencePercent: 0,
      serviceChargesPercent: 0,
      priceMultiplier: 1,
      isActive: true,
    });
  };

  const fetchPriceModel = async () => {
    if (!visible || !planData?.id) {
      return;
    }

    try {
      setFetching(true);
      const response = await axios.get(`${getApiUrl()}/api${API.ownershipPlan.path}/${planData.id}/price-model`, {
        headers: getHeaders(),
      });

      const model = response?.data || {};
      const hasExistingModel = model && typeof model === 'object' && model.id;
      setHasPriceModel(Boolean(hasExistingModel));

      form.setFieldsValue({
        name: model.name || '',
        insurancePercent: model.insurancePercent ?? 0,
        maintainencePercent: model.maintainencePercent ?? 0,
        serviceChargesPercent: model.serviceChargesPercent ?? 0,
        priceMultiplier: model.priceMultiplier ?? 1,
        isActive: model.isActive ?? true,
      });
    } catch (error) {
      setHasPriceModel(false);

      if (error.response?.status === 404) {
        resetForm();
        return;
      }

      message.error(error.response?.data?.message || 'Failed to load pricing model');
      resetForm();
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPriceModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, planData?.id]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name?.trim(),
        insurancePercent: values.insurancePercent ?? 0,
        maintainencePercent: values.maintainencePercent ?? 0,
        serviceChargesPercent: values.serviceChargesPercent ?? 0,
        priceMultiplier: values.priceMultiplier ?? 1,
        isActive: values.isActive ?? true,
      };

      const url = `${getApiUrl()}/api${API.ownershipPlan.path}/${planData.id}/price-model`;
      const request = hasPriceModel
        ? axios.put(url, payload, { headers: getHeaders() })
        : axios.post(url, payload, { headers: getHeaders() });

      await request;

      message.success(hasPriceModel ? 'Pricing model updated successfully' : 'Pricing model created successfully');
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to save pricing model');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setHasPriceModel(false);
    onCancel();
  };

  return (
    <Modal
      type="primary"
      title={`Manage Pricing — ${planData?.tenure || `Plan #${planData?.id || ''}`}`}
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button type="white" outlined onClick={handleModalCancel} disabled={loading || fetching}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading} disabled={fetching}>
            {loading ? <Spin size="small" /> : hasPriceModel ? 'Update Pricing' : 'Create Pricing'}
          </Button>
        </div>,
      ]}
      onCancel={handleModalCancel}
      width={700}
    >
      <BasicFormWrapper>
        {fetching ? (
          <div style={{ minHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input prefix={<FeatherIcon icon="tag" size={14} />} placeholder="Standard Pricing" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priceMultiplier"
                  label="Price Multiplier"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="1.00" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="insurancePercent"
                  label="Insurance %"
                  rules={[
                    { required: true, message: 'Required' },
                    { type: 'number', min: 0, max: 100 },
                  ]}
                >
                  <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maintainencePercent"
                  label="Maintainence %"
                  rules={[
                    { required: true, message: 'Required' },
                    { type: 'number', min: 0, max: 100 },
                  ]}
                >
                  <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="serviceChargesPercent"
                  label="Service Charges %"
                  rules={[
                    { required: true, message: 'Required' },
                    { type: 'number', min: 0, max: 100 },
                  ]}
                >
                  <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </BasicFormWrapper>
    </Modal>
  );
}

ManageOwnershipPricing.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  planData: PropTypes.object,
};

export default ManageOwnershipPricing;
