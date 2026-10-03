import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, TimePicker, Select, message, Spin } from 'antd';

const { Option } = Select;

const CITY_OPTIONS = [
  { value: 'BANGALORE', label: 'Bangalore' },
  { value: 'MUMBAI', label: 'Mumbai' },
  { value: 'DELHI', label: 'Delhi' },
];
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';
import SearchableMap from '../../../components/maps/searchablemap';
import moment from 'moment';

function CreateStation({ visible, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getAuthHeaders = () => {
    const token = getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleLocationSelect = (locationData) => {
    setCoordinates({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
    form.setFieldsValue({
      address: locationData.address || form.getFieldValue('address'),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        address: values.address,
        phoneNumber: values.phoneNumber,
        openTime: values.openTime ? values.openTime.format('HH:mm:ss') : '00:00:00',
        closeTime: values.closeTime ? values.closeTime.format('HH:mm:ss') : '00:00:00',
        latitude: values.latitude ?? coordinates.latitude,
        longitude: values.longitude ?? coordinates.longitude,
        imageUrl: values.imageUrl || '',
        cityCode: values.cityCode,
        availableScooters: values.availableScooters || 0,
      };

      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/api${API.station.path}`, payload, {
        headers: getAuthHeaders(),
      });

      message.success('Station created successfully');
      form.resetFields();
      setCoordinates({ latitude: 0, longitude: 0 });
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Error creating station:', error);
        message.error(error.response?.data?.message || 'Failed to create station');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCoordinates({ latitude: 0, longitude: 0 });
    onCancel();
  };

  return (
    <Modal
      title="Add New Station"
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" type="white" outlined onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spin size="small" /> : 'Create Station'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="name" label="Station Name" rules={[{ required: true, message: 'Please enter station name' }]}>
          <Input placeholder="Enter station name" />
        </Form.Item>

        <Form.Item label="Search Location on Map">
          <SearchableMap
            onLocationSelect={handleLocationSelect}
            placeholder="Search for station address..."
            height="280px"
            zoom={13}
            countryCode="IN"
            showSearchHints={false}
          />
        </Form.Item>

        <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Please enter address' }]}>
          <Input.TextArea rows={2} placeholder="Station address (auto-filled from map or enter manually)" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="latitude"
            label="Latitude"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Latitude is required' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Latitude" step={0.000001} precision={6} />
          </Form.Item>
          <Form.Item
            name="longitude"
            label="Longitude"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Longitude is required' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Longitude" step={0.000001} precision={6} />
          </Form.Item>
        </div>

        <Form.Item name="cityCode" label="City" rules={[{ required: true, message: 'Please select a city' }]}>
          <Select placeholder="Select city">
            {CITY_OPTIONS.map((city) => (
              <Option key={city.value} value={city.value}>
                {city.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="phoneNumber" label="Phone Number">
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="openTime" label="Open Time" style={{ flex: 1 }}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="Select open time" />
          </Form.Item>
          <Form.Item name="closeTime" label="Close Time" style={{ flex: 1 }}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="Select close time" />
          </Form.Item>
        </div>

        <Form.Item name="availableScooters" label="Available Scooters" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} placeholder="Number of available scooters" />
        </Form.Item>

        <Form.Item name="imageUrl" label="Image URL">
          <Input placeholder="Enter image URL (optional)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateStation;
