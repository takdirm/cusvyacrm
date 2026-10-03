import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Switch, Tabs, Row, Col, Select, message } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { getEnumOptions } from '../../../config/enum/enum';

const { TabPane } = Tabs;
const { Option } = Select;

function UpdateVehicleModel({ visible, onCancel, typeData, getData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);
  const [videoFileList, setVideoFileList] = useState([]);
  const imagePreviewUrl = useMemo(() => {
    const file = imageFileList[0]?.originFileObj;
    return file ? URL.createObjectURL(file) : '';
  }, [imageFileList]);
  const videoPreviewUrl = useMemo(() => {
    const file = videoFileList[0]?.originFileObj;
    return file ? URL.createObjectURL(file) : '';
  }, [videoFileList]);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    if (/^(https?:)?\/\//i.test(trimmedUrl) || trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('blob:')) {
      return trimmedUrl;
    }

    const baseUrl = getApiUrl();
    return trimmedUrl.startsWith('/') ? `${baseUrl}${trimmedUrl}` : `${baseUrl}/${trimmedUrl}`;
  };

  const existingImageUrl = resolveMediaUrl(typeData?.imageUrl);
  const existingVideoUrl = resolveMediaUrl(typeData?.videoUrl);
  const displayImageUrl = imagePreviewUrl || existingImageUrl;
  const displayVideoUrl = videoPreviewUrl || existingVideoUrl;

  useEffect(() => {
    if (typeData && visible) {
      form.setFieldsValue({
        name: typeData.name || '',
        description: typeData.description || '',
        topSpeed: typeData.topSpeed || '',
        range: typeData.range || '',
        isPetrolEngine: typeData.isPetrolEngine ?? false,
        isLicenseRequired: typeData.isLicenseRequired ?? false,
        vehicleCategory: typeData.vehicleCategory ?? 1,
        vehicleServiceType: typeData.vehicleServiceType ?? 0,
        isNew: typeData.isNew ?? true,
        rentalPriceStarts: typeData.rentalPriceStarts ?? 0,
        ownershipPriceStarts: typeData.ownershipPriceStarts ?? 0,
        basePrice: typeData.basePrice ?? 0,
        isActive: typeData.isActive ?? true,
      });
    }
  }, [typeData, visible, form]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const handleSubmit = async () => {
    try {
      const validatedValues = await form.validateFields();
      const values = {
        ...form.getFieldsValue(true),
        ...validatedValues,
      };
      setLoading(true);

      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('description', values.description || '');
      formData.append('topSpeed', values.topSpeed || '');
      formData.append('range', values.range || '');
      formData.append('isPetrolEngine', String(values.isPetrolEngine ?? false));
      formData.append('isLicenseRequired', String(values.isLicenseRequired ?? false));
      formData.append('vehicleCategory', String(values.vehicleCategory ?? 1));
      formData.append('vehicleServiceType', String(values.vehicleServiceType ?? 0));
      formData.append('isNew', String(values.isNew ?? true));
      formData.append('rentalPriceStarts', String(values.rentalPriceStarts ?? typeData?.rentalPriceStarts ?? 0));
      formData.append(
        'ownershipPriceStarts',
        String(values.ownershipPriceStarts ?? typeData?.ownershipPriceStarts ?? 0),
      );
      formData.append('basePrice', String(values.basePrice ?? typeData?.basePrice ?? 0));
      formData.append('isActive', String(values.isActive ?? true));

      const imageFile = imageFileList[0]?.originFileObj;
      const videoFile = videoFileList[0]?.originFileObj;
      if (imageFile) formData.append('imageFile', imageFile);
      if (videoFile) formData.append('videoFile', videoFile);

      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/api${API.vehicleModel.path}/${typeData.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Vehicle model updated successfully');
      setImageFileList([]);
      setVideoFileList([]);
      if (getData) getData();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update vehicle model');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImageFileList([]);
    setVideoFileList([]);
    onCancel();
  };

  return (
    <Modal
      type="primary"
      title={`Edit Vehicle Model — ${typeData?.name || ''}`}
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
                  <Form.Item
                    name="name"
                    label="Model Name"
                    rules={[{ required: true, message: 'Please enter a name' }]}
                  >
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
                <Col span={12}>
                  <Form.Item name="vehicleCategory" label="Vehicle Category">
                    <Select placeholder="Select vehicle category">
                      {getEnumOptions('VehicleCategory').map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Brief description of this vehicle model..." />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Upload New Image">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          setImageFileList([]);
                          return;
                        }
                        setImageFileList([{ originFileObj: file }]);
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      {displayImageUrl ? (
                        <img
                          src={displayImageUrl}
                          alt="Vehicle model preview"
                          style={{
                            width: 120,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #eee',
                          }}
                        />
                      ) : (
                        <div style={{ color: '#999', fontSize: 12 }}>No image available</div>
                      )}
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Upload New Video">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          setVideoFileList([]);
                          return;
                        }
                        setVideoFileList([{ originFileObj: file }]);
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      {displayVideoUrl ? (
                        <video
                          src={displayVideoUrl}
                          controls
                          style={{
                            width: 180,
                            maxHeight: 110,
                            borderRadius: 6,
                            border: '1px solid #eee',
                            background: '#000',
                          }}
                        />
                      ) : (
                        <div style={{ color: '#999', fontSize: 12 }}>No video available</div>
                      )}
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FeatherIcon icon="dollar-sign" size={14} /> Pricing &amp; Service
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
                  <Form.Item name="vehicleServiceType" label="Service">
                    <Select placeholder="Select service type">
                      {getEnumOptions('VehicleServiceType').map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
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

UpdateVehicleModel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  typeData: PropTypes.object,
  getData: PropTypes.func.isRequired,
};

export default UpdateVehicleModel;
