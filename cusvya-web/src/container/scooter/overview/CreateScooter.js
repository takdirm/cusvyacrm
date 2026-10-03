import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, Tabs, message, Spin, Button as AntButton } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import ScooterTypeSelector from './ScooterTypeSelector';

const { Option } = Select;
const { TabPane } = Tabs;

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

function CreateScooter({ visible, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [typeSelectorVisible, setTypeSelectorVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setTypeSelectorVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      message.warning('Please select a Scooter Type before saving');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        scooterTypeId: selectedType.id,
        manufacturer: values.manufacturer || '',
        range: values.range || '',
        rentalPricePerDay: values.rentalPricePerDay || 0,
        ownershipPrice: values.ownershipPrice || 0,
        costPrice: values.costPrice || 0,
        price: values.price || 0,
        savings: values.savings || 0,
        imageUrl: values.imageUrl || '',
        videoUrl: values.videoUrl || '',
        registerationNumber: values.registerationNumber || '',
        chassisNumber: values.chassisNumber || '',
        kmDriven: values.kmDriven || 0,
        modelYear: values.modelYear || new Date().getFullYear(),
        condition: values.condition || '',
        warrantyPeriod: values.warrantyPeriod || '',
        isCertified: values.isCertified ?? false,
        gprsimeiid: values.gprsimeiid || '',
        gprsid: values.gprsid || '',
      };

      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/api${API.scooter.path}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Scooter created successfully');
      form.resetFields();
      setSelectedType(null);
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create scooter');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedType(null);
    onCancel();
  };

  return (
    <>
      <Modal
        title="Add New Scooter"
        open={visible}
        onCancel={handleCancel}
        width={780}
        footer={[
          <Button key="cancel" type="white" outlined onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spin size="small" /> : 'Create Scooter'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Info" key="basic">
              {/* Scooter Type Selector */}
              <Form.Item label="Scooter Type" required>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {selectedType ? (
                    <PlainLabel
                      color="blue"
                      closable
                      onClose={() => setSelectedType(null)}
                      style={{ fontSize: 13, padding: '4px 10px' }}
                    >
                      <FeatherIcon icon="layers" size={12} style={{ marginRight: 5 }} />
                      {selectedType.name}
                      {selectedType.topSpeed && (
                        <span style={{ marginLeft: 8, color: '#adc6ff', fontWeight: 400 }}>
                          · {selectedType.topSpeed}
                        </span>
                      )}
                    </PlainLabel>
                  ) : (
                    <span style={{ color: '#bbb', fontSize: 13 }}>No type selected</span>
                  )}
                  <AntButton
                    size="small"
                    type={selectedType ? 'default' : 'primary'}
                    icon={<FeatherIcon icon="layers" size={13} />}
                    onClick={() => setTypeSelectorVisible(true)}
                  >
                    {selectedType ? 'Change Type' : 'Select Type'}
                  </AntButton>
                </div>
              </Form.Item>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="name"
                  label="Scooter Name"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Scooter #001" />
                </Form.Item>
                <Form.Item name="manufacturer" label="Manufacturer" style={{ flex: 1 }}>
                  <Input placeholder="Manufacturer" />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="range" label="Range" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 120 km" />
                </Form.Item>
                <Form.Item name="modelYear" label="Model Year" style={{ flex: 1 }}>
                  <InputNumber min={2000} max={2100} style={{ width: '100%' }} placeholder={new Date().getFullYear()} />
                </Form.Item>
                <Form.Item name="condition" label="Condition" style={{ flex: 1 }}>
                  <Select placeholder="Select condition">
                    {CONDITIONS.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="kmDriven" label="Km Driven" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="warrantyPeriod" label="Warranty Period" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 1 Year" />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="imageUrl" label="Image URL" style={{ flex: 1 }}>
                  <Input placeholder="https://..." />
                </Form.Item>
                <Form.Item name="videoUrl" label="Video URL" style={{ flex: 1 }}>
                  <Input placeholder="https://..." />
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="Pricing" key="pricing">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="costPrice" label="Cost Price (₹)" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="price" label="Sale Price (₹)" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="savings" label="Savings (₹)" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="rentalPricePerDay" label="Rental Price / Day (₹)" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="ownershipPrice" label="Ownership Price (₹)" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="IDs & Status" key="ids">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="registerationNumber" label="Registration No." style={{ flex: 1 }}>
                  <Input placeholder="KA-01-AB-1234" />
                </Form.Item>
                <Form.Item name="chassisNumber" label="Chassis No." style={{ flex: 1 }}>
                  <Input placeholder="Chassis number" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="gprsimeiid" label="GPRS IMEI ID" style={{ flex: 1 }}>
                  <Input placeholder="GPRS IMEI ID" />
                </Form.Item>
                <Form.Item name="gprsid" label="GPRS ID" style={{ flex: 1 }}>
                  <Input placeholder="GPRS ID" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <Form.Item name="isCertified" label="Certified" valuePropName="checked" initialValue={false}>
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      <ScooterTypeSelector
        visible={typeSelectorVisible}
        onCancel={() => setTypeSelectorVisible(false)}
        onSelect={handleTypeSelect}
        selectedTypeId={selectedType?.id}
      />
    </>
  );
}

export default CreateScooter;
