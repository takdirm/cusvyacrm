import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, Tabs, message, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { VehicleCategoryOptions, VehicleTypeOptions, OwnershipStatusOptions } from '../../../config/enum/enum';
import { getCatalogueColors } from './services/catalogueMediaService';

const { Option } = Select;
const { TabPane } = Tabs;

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const VEHICLE_TYPE_TO_CATEGORY = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  10: 2,
  11: 2,
  20: 3,
  21: 3,
  30: 4,
  31: 4,
};

const getCatalogueVehicleCategory = (catalogue) => {
  const rawCategory =
    catalogue?.vehicleCategory ??
    catalogue?.vehicleCategoryId ??
    catalogue?.category ??
    catalogue?.vehicleModel?.vehicleCategory ??
    catalogue?.vehicle?.vehicleCategory;

  if (rawCategory != null && rawCategory !== '') {
    const numericCategory = Number(rawCategory);
    if (!Number.isNaN(numericCategory)) return numericCategory;
  }

  const rawType =
    catalogue?.type ??
    catalogue?.vehicleType ??
    catalogue?.vehicleTypeId ??
    catalogue?.vehicleModel?.vehicleType ??
    catalogue?.vehicle?.vehicleType;

  const numericType = Number(rawType);
  if (Number.isNaN(numericType)) return undefined;
  return VEHICLE_TYPE_TO_CATEGORY[numericType];
};

function CreateVehicle({ visible, onCancel }) {
  const [form] = Form.useForm();
  const bikeCondition = Form.useWatch('bikeCondition', form);
  const selectedVehicleCategory = Form.useWatch('vehicleCategory', form);
  const selectedCatalogueId = Form.useWatch('vehicleCatalogueId', form);
  const [loading, setLoading] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [catalogues, setCatalogues] = useState([]);
  const [cataloguesLoading, setCataloguesLoading] = useState(false);
  const [catalogueColors, setCatalogueColors] = useState([]);
  const [catalogueColorsLoading, setCatalogueColorsLoading] = useState(false);
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

  const filteredCatalogues = useMemo(() => {
    if (!selectedVehicleCategory) return catalogues;

    const normalizedCategory = Number(selectedVehicleCategory);
    if (Number.isNaN(normalizedCategory)) return catalogues;

    return catalogues.filter((catalogue) => getCatalogueVehicleCategory(catalogue) === normalizedCategory);
  }, [catalogues, selectedVehicleCategory]);

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

  const fetchStations = async () => {
    try {
      setStationsLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.station.path}/paged?page=1&pageSize=500&isActive=true`, {
        headers: getHeaders(),
      });
      const data = response.data;
      setStations(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      setStations([]);
    } finally {
      setStationsLoading(false);
    }
  };

  const fetchModelsByCategory = async (vehicleCategory) => {
    if (!vehicleCategory) {
      setVehicleModels([]);
      return;
    }

    try {
      setModelsLoading(true);
      const apiUrl = getApiUrl();
      const endpoint = API.vehicleModel.byCategory.replace('{vehicleCategory}', String(vehicleCategory));
      const response = await axios.get(`${apiUrl}/api${endpoint}`, {
        headers: getHeaders(),
      });
      const data = response.data;
      setVehicleModels(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      setVehicleModels([]);
      message.error('Failed to load vehicle models for selected category');
    } finally {
      setModelsLoading(false);
    }
  };

  const fetchCatalogues = async () => {
    try {
      setCataloguesLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.catalogue.path}/paged?page=1&pageSize=500`, {
        headers: getHeaders(),
      });
      const data = response.data;
      setCatalogues(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      setCatalogues([]);
      message.error('Failed to load catalogues');
    } finally {
      setCataloguesLoading(false);
    }
  };

  const fetchCatalogueColors = async (catalogueId) => {
    if (!catalogueId) {
      setCatalogueColors([]);
      return;
    }

    try {
      setCatalogueColorsLoading(true);
      const colors = await getCatalogueColors(catalogueId);
      setCatalogueColors(Array.isArray(colors) ? colors : []);
    } catch (error) {
      setCatalogueColors([]);
      message.error('Failed to load catalogue colours');
    } finally {
      setCatalogueColorsLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;

    form.setFieldsValue({
      vehicleCategory: 1,
      vehicleType: 1,
      ownershipStatus: 1,
      vehicleCatalogueId: undefined,
      catalogueColorId: undefined,
    });
    fetchModelsByCategory(1);
    fetchStations();
    fetchCatalogues();
  }, [visible]);

  useEffect(() => {
    if (bikeCondition !== 'New') {
      form.setFieldsValue({ vehicleCatalogueId: undefined });
      form.setFieldsValue({ catalogueColorId: undefined });
      setCatalogueColors([]);
    }
  }, [bikeCondition, form]);

  useEffect(() => {
    if (bikeCondition !== 'New') return;
    form.setFieldsValue({ catalogueColorId: undefined });
    fetchCatalogueColors(selectedCatalogueId);
  }, [bikeCondition, selectedCatalogueId]);

  const handleVehicleCategoryChange = (vehicleCategory) => {
    form.setFieldsValue({
      vehicleModelId: undefined,
      vehicleCategory,
      vehicleCatalogueId: undefined,
      catalogueColorId: undefined,
    });
    setCatalogueColors([]);
    fetchModelsByCategory(vehicleCategory);
  };

  const handleCatalogueChange = (catalogueId) => {
    form.setFieldsValue({ catalogueColorId: undefined });
    fetchCatalogueColors(catalogueId);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const isNewBike = values.bikeCondition === 'New';

      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('vehicleModelId', String(values.vehicleModelId));
      formData.append('manufacturer', values.manufacturer || '');
      formData.append('range', values.range || '');
      formData.append('costPrice', String(values.costPrice || 0));
      formData.append('imageUrl', '');
      formData.append('videoUrl', '');
      formData.append('registerationNumber', values.registerationNumber || '');
      formData.append('chassisNumber', values.chassisNumber || '');
      formData.append('kmDriven', String(values.kmDriven || 0));
      formData.append('modelYear', String(values.modelYear || new Date().getFullYear()));
      formData.append('bikeCondition', String(CONDITIONS.indexOf(values.bikeCondition || 'Good')));
      formData.append('warrantyPeriod', values.warrantyPeriod || '');
      formData.append('isCertified', String(values.isCertified ?? false));
      formData.append('vehicleCategory', String(values.vehicleCategory || 1));
      formData.append('vehicleType', String(values.vehicleType || 1));
      formData.append('ownershipStatus', String(values.ownershipStatus || 1));
      formData.append('accruedEarnings', '0');
      formData.append('initialOdometerReading', String(values.initialOdometerReading || 0));
      formData.append('vehicleCatalogueId', isNewBike ? String(values.vehicleCatalogueId || '') : '');
      formData.append('catalogueColorId', isNewBike ? String(values.catalogueColorId || '') : '');
      formData.append('stationId', String(values.stationId || 0));

      const imageFile = imageFileList[0]?.originFileObj;
      const videoFile = videoFileList[0]?.originFileObj;
      if (imageFile) formData.append('imageFile', imageFile);
      if (videoFile) formData.append('videoFile', videoFile);

      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/api${API.vehicle.path}`, formData, {
        headers: getHeaders(),
      });

      message.success('Vehicle created successfully');
      form.resetFields();
      setVehicleModels([]);
      setImageFileList([]);
      setVideoFileList([]);
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to create vehicle');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setVehicleModels([]);
    setImageFileList([]);
    setVideoFileList([]);
    onCancel();
  };

  return (
    <>
      <Modal
        title="Add New Vehicle"
        open={visible}
        onCancel={handleCancel}
        width={820}
        footer={[
          <Button key="cancel" type="white" outlined onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spin size="small" /> : 'Create Vehicle'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Info" key="basic">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="name"
                  label="Vehicle Name"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Vehicle #001" />
                </Form.Item>
                <Form.Item name="manufacturer" label="Manufacturer" style={{ flex: 1 }}>
                  <Input placeholder="Manufacturer" />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="vehicleCategory"
                  label="Vehicle Category"
                  style={{ flex: 1 }}
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select category" onChange={handleVehicleCategoryChange}>
                    {VehicleCategoryOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="vehicleType" label="Vehicle Type" style={{ flex: 1 }} rules={[{ required: true }]}>
                  <Select placeholder="Select type">
                    {VehicleTypeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="vehicleModelId"
                  label="Vehicle Model"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Vehicle model is required' }]}
                >
                  <Select
                    placeholder="Select model"
                    loading={modelsLoading}
                    showSearch
                    optionFilterProp="children"
                    disabled={!form.getFieldValue('vehicleCategory')}
                  >
                    {vehicleModels.map((model) => (
                      <Option key={model.id} value={model.id}>
                        {model.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <div style={{ flex: 1 }} />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="range" label="Range" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 120 km" />
                </Form.Item>
                <Form.Item name="modelYear" label="Model Year" style={{ flex: 1 }}>
                  <InputNumber min={2000} max={2100} style={{ width: '100%' }} placeholder={new Date().getFullYear()} />
                </Form.Item>
                <Form.Item name="bikeCondition" label="Condition" style={{ flex: 1 }}>
                  <Select placeholder="Select condition">
                    {CONDITIONS.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {bikeCondition === 'New' && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item
                    name="vehicleCatalogueId"
                    label="Catalogue"
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: 'Catalogue is required for new vehicles' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select catalogue"
                      loading={cataloguesLoading}
                      onChange={handleCatalogueChange}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children || '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {filteredCatalogues.map((catalogue) => (
                        <Option key={catalogue.id} value={catalogue.id}>
                          {catalogue.summary ||
                            `${catalogue.brand || ''} ${catalogue.model || ''}`.trim() ||
                            `Catalogue #${catalogue.id}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="catalogueColorId"
                    label="Catalogue Colour"
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: 'Catalogue colour is required for new vehicles' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select catalogue colour"
                      loading={catalogueColorsLoading}
                      disabled={!selectedCatalogueId}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        String(option?.children || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {catalogueColors.map((color) => (
                        <Option key={color.id} value={color.id}>
                          {color.name || color.colorName || `Colour #${color.id}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="kmDriven" label="Km Driven" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="warrantyPeriod" label="Warranty Period" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 1 Year" />
                </Form.Item>
                <Form.Item name="ownershipStatus" label="Ownership" style={{ flex: 1 }} rules={[{ required: true }]}>
                  <Select placeholder="Ownership status">
                    {OwnershipStatusOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item label="Upload Image" style={{ flex: 1 }}>
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
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Vehicle preview"
                        style={{
                          width: 120,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #eee',
                        }}
                      />
                    ) : (
                      <div style={{ color: '#999', fontSize: 12 }}>No image selected</div>
                    )}
                  </div>
                </Form.Item>
                <Form.Item label="Upload Video" style={{ flex: 1 }}>
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
                    {videoPreviewUrl ? (
                      <video
                        src={videoPreviewUrl}
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
                      <div style={{ color: '#999', fontSize: 12 }}>No video selected</div>
                    )}
                  </div>
                </Form.Item>
              </div>
            </TabPane>

            <TabPane tab="Pricing & Readings" key="pricing">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="costPrice"
                  label="Cost Price (₹)"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Cost Price is required' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <div style={{ flex: 1 }} />
                <div style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="initialOdometerReading" label="Initial Odometer" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <div style={{ flex: 1 }} />
                <div style={{ flex: 1 }} />
              </div>
            </TabPane>

            <TabPane tab="IDs & Status" key="ids">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="registerationNumber"
                  label="Registration No."
                  style={{ flex: 1 }}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue('bikeCondition') === 'New') {
                          return Promise.resolve();
                        }
                        if (value && String(value).trim()) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Registration number is required'));
                      },
                    }),
                  ]}
                >
                  <Input placeholder="KA-01-AB-1234" />
                </Form.Item>
                <Form.Item
                  name="chassisNumber"
                  label="Chassis No."
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Chassis number is required' }]}
                >
                  <Input placeholder="Chassis number" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="stationId" label="Station" style={{ flex: 1 }}>
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    placeholder="Select station"
                    loading={stationsLoading}
                    filterOption={(input, option) =>
                      (option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {stations.map((station) => (
                      <Option key={station.id} value={station.id}>
                        {station.name || `Station #${station.id}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <div style={{ flex: 1 }} />
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
    </>
  );
}

export default CreateVehicle;
