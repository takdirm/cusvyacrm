import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Tabs, Row, Col, message } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

const { TabPane } = Tabs;

function UpdateScooterType({ visible, onCancel, typeData, getData }) {
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
    if (typeData && visible) {
      form.setFieldsValue({
        name: typeData.name || '',
        description: typeData.description || '',
        imageUrl: typeData.imageUrl || '',
        videoUrl: typeData.videoUrl || '',
        topSpeed: typeData.topSpeed || '',
        range: typeData.range || '',
        isPetrolEngine: typeData.isPetrolEngine ?? false,
        isLicenseRequired: typeData.isLicenseRequired ?? false,
        isAvailableForRental: typeData.isAvailableForRental ?? false,
        isAvailableForOwnership: typeData.isAvailableForOwnership ?? false,
        isForSale: typeData.isForSale ?? false,
        isNew: typeData.isNew ?? true,
        rentalPriceStarts: typeData.rentalPriceStarts ?? 0,
        ownershipPriceStarts: typeData.ownershipPriceStarts ?? 0,
        basePrice: typeData.basePrice ?? 0,
        isActive: typeData.isActive ?? true,
      });
    }
  }, [typeData, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        description: values.description || '',
        imageUrl: values.imageUrl || '',
        videoUrl: values.videoUrl || '',
        topSpeed: values.topSpeed || '',
        range: values.range || '',
        isPetrolEngine: values.isPetrolEngine ?? false,
        isLicenseRequired: values.isLicenseRequired ?? false,
        isAvailableForRental: values.isAvailableForRental ?? false,
        isAvailableForOwnership: values.isAvailableForOwnership ?? false,
        isForSale: values.isForSale ?? false,
        isNew: values.isNew ?? true,
        rentalPriceStarts: values.rentalPriceStarts || 0,
        ownershipPriceStarts: values.ownershipPriceStarts || 0,
        basePrice: values.basePrice || 0,
        isActive: values.isActive ?? true,
      };

      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/api${API.scooterType.path}/${typeData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Scooter type updated successfully');
      if (getData) getData();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update scooter type');
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
      title={`Edit Scooter Type — ${typeData?.name || ''}`}
      visible={visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" outlined onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button size="default" type="primary" onClick={handleSubmit} loading={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={760}
    >
      <BasicFormWrapper>
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="details">
            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="info" size={14} /> Details
                </span>
              }
              key="details"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Type Name" rules={[{ required: true, message: 'Please enter a name' }]}>
                    <Input prefix={<FeatherIcon icon="tag" size={14} />} placeholder="e.g. High Speed" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="topSpeed" label="Top Speed">
                    <Input prefix={<FeatherIcon icon="zap" size={14} />} placeholder="e.g. 80 km/h" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="range" label="Range">
                    <Input prefix={<FeatherIcon icon="battery" size={14} />} placeholder="e.g. 120 km" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Brief description of this scooter type..." />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="imageUrl" label="Image URL">
                    <Input prefix={<FeatherIcon icon="image" size={14} />} placeholder="https://..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="videoUrl" label="Video URL">
                    <Input prefix={<FeatherIcon icon="video" size={14} />} placeholder="https://..." />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="dollar-sign" size={14} /> Pricing &amp; Availability
                </span>
              }
              key="pricing"
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="basePrice" label="Base Price (₹)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="rentalPriceStarts" label="Rental Price Starts (₹)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="ownershipPriceStarts" label="Ownership Price Starts (₹)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Form.Item name="isAvailableForRental" label="Available for Rental" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isAvailableForOwnership" label="Available for Ownership" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isForSale" label="For Sale" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isNew" label="Is New" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isPetrolEngine" label="Petrol Engine" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isLicenseRequired" label="License Required" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="toggle-right" size={14} /> Status
                </span>
              }
              key="status"
            >
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

UpdateScooterType.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  typeData: PropTypes.object,
  getData: PropTypes.func.isRequired,
};

export default UpdateScooterType;
