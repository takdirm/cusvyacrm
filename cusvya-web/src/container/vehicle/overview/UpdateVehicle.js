import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, Tabs, message, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { getEnumOptions } from '../../../config/enum/enum';
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

const getBikeConditionLabel = (value) => {
  if (value == null) return 'Good';
  if (typeof value === 'number') return CONDITIONS[value] || 'Good';

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && String(value).trim() !== '') {
    return CONDITIONS[numericValue] || 'Good';
  }

  const normalized = String(value).trim().toLowerCase();
  const matched = CONDITIONS.find((condition) => condition.toLowerCase() === normalized);
  return matched || 'Good';
};

const getVehicleCatalogueId = (vehicleData) => {
  const rawValue = vehicleData?.vehicleCatalogueId ?? vehicleData?.catalogueId ?? vehicleData?.vehicleCatalogue?.id;
  if (rawValue == null || rawValue === '') return undefined;

  const numericValue = Number(rawValue);
  return Number.isNaN(numericValue) ? rawValue : numericValue;
};

const normalizeNumericId = (value) => {
  if (value == null || value === '') return undefined;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? undefined : numericValue;
};

const getVehicleCatalogueColorId = (vehicleData) => {
  const rawValue =
    vehicleData?.catalogueColorId ??
    vehicleData?.catalogColorId ??
    vehicleData?.vehicleCatalogueColorId ??
    vehicleData?.catalogueColor?.id ??
    vehicleData?.catalogueColor?.catalogueColorId;
  return normalizeNumericId(rawValue);
};

function UpdateVehicle({ visible, onCancel, vehicleData, getData }) {
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

  const existingImageUrl = resolveMediaUrl(vehicleData?.imageUrl);
  const existingVideoUrl = resolveMediaUrl(vehicleData?.videoUrl);
  const displayImageUrl = imagePreviewUrl || existingImageUrl;
  const displayVideoUrl = videoPreviewUrl || existingVideoUrl;

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
      return [];
    }

    try {
      setModelsLoading(true);
      const apiUrl = getApiUrl();
      const endpoint = API.vehicleModel.byCategory.replace('{vehicleCategory}', String(vehicleCategory));
      const response = await axios.get(`${apiUrl}/api${endpoint}`, {
        headers: getHeaders(),
      });
      const data = response.data;
      const items = Array.isArray(data) ? data : data.items || [];
      setVehicleModels(items);
      return items;
    } catch (error) {
      setVehicleModels([]);
      message.error('Failed to load vehicle models for selected category');
      return [];
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
      const catalogueItems = Array.isArray(data) ? data : data.items || [];
      setCatalogues(catalogueItems);

      if (bikeCondition === 'New') {
        const existingCatalogueId = getVehicleCatalogueId(vehicleData);
        const normalizedCatalogueId =
          existingCatalogueId != null && existingCatalogueId !== '' ? Number(existingCatalogueId) : undefined;

        if (normalizedCatalogueId != null && !Number.isNaN(normalizedCatalogueId)) {
          form.setFieldsValue({ vehicleCatalogueId: normalizedCatalogueId });
        }
      }
    } catch (error) {
      setCatalogues([]);
      message.error('Failed to load catalogues');
    } finally {
      setCataloguesLoading(false);
    }
  };

  const fetchCatalogueColors = async (catalogueId, preselectedColorId) => {
    if (!catalogueId) {
      setCatalogueColors([]);
      return;
    }

    try {
      setCatalogueColorsLoading(true);
      const colors = await getCatalogueColors(catalogueId);
      const normalizedColors = (Array.isArray(colors) ? colors : []).map((color) => ({
        ...color,
        _normalizedId: normalizeNumericId(color?.id ?? color?.catalogueColorId),
      }));
      setCatalogueColors(normalizedColors);

      const expectedColorId = normalizeNumericId(preselectedColorId);
      if (expectedColorId != null) {
        const matchedColor = normalizedColors.find((color) => color._normalizedId === expectedColorId);
        if (matchedColor) {
          form.setFieldsValue({ catalogueColorId: matchedColor._normalizedId });
        }
      }
    } catch (error) {
      setCatalogueColors([]);
      message.error('Failed to load catalogue colours');
    } finally {
      setCatalogueColorsLoading(false);
    }
  };

  useEffect(() => {
    if (!vehicleData || !visible) return;

    form.setFieldsValue({
      name: vehicleData.name,
      vehicleModelId: vehicleData.vehicleModelId,
      manufacturer: vehicleData.manufacturer,
      range: vehicleData.range,
      costPrice: vehicleData.costPrice,
      registerationNumber: vehicleData.registerationNumber,
      chassisNumber: vehicleData.chassisNumber,
      kmDriven: vehicleData.kmDriven,
      modelYear: vehicleData.modelYear,
      bikeCondition: getBikeConditionLabel(vehicleData.bikeCondition),
      warrantyPeriod: vehicleData.warrantyPeriod,
      isCertified: vehicleData.isCertified,
      vehicleListingStatus: vehicleData.vehicleListingStatus ?? 1,
      vehicleCategory: vehicleData.vehicleCategory ?? 1,
      vehicleType: vehicleData.vehicleType ?? 1,
      ownershipStatus: vehicleData.ownershipStatus ?? 1,
      isActive: vehicleData.isActive ?? true,
      initialOdometerReading: vehicleData.initialOdometerReading,
      currentOdometerReading: vehicleData.currentOdometerReading,
      vehicleCatalogueId: getVehicleCatalogueId(vehicleData),
      catalogueColorId: getVehicleCatalogueColorId(vehicleData),
      stationId: vehicleData.stationId,
    });

    fetchModelsByCategory(vehicleData.vehicleCategory ?? 1);
    fetchStations();
    fetchCatalogues();
    fetchCatalogueColors(getVehicleCatalogueId(vehicleData), getVehicleCatalogueColorId(vehicleData));
  }, [vehicleData, visible, form]);

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

  useEffect(() => {
    if (bikeCondition == null) return;

    if (bikeCondition !== 'New') {
      return;
    }

    const existingCatalogueId = getVehicleCatalogueId(vehicleData);
    if (existingCatalogueId != null && existingCatalogueId !== '') {
      const normalizedCatalogueId = Number(existingCatalogueId);
      if (!Number.isNaN(normalizedCatalogueId)) {
        form.setFieldsValue({ vehicleCatalogueId: normalizedCatalogueId });
        fetchCatalogueColors(normalizedCatalogueId, getVehicleCatalogueColorId(vehicleData));
      }
    }
  }, [bikeCondition, form, vehicleData]);

  useEffect(() => {
    if (bikeCondition !== 'New') return;
    fetchCatalogueColors(selectedCatalogueId, getVehicleCatalogueColorId(vehicleData));
  }, [bikeCondition, selectedCatalogueId]);

  const handleVehicleCategoryChange = (vehicleCategory) => {
    const currentModelId = form.getFieldValue('vehicleModelId');
    form.setFieldsValue({
      vehicleCategory,
      vehicleCatalogueId: undefined,
      catalogueColorId: undefined,
    });
    setCatalogueColors([]);
    fetchModelsByCategory(vehicleCategory).then((items) => {
      const stillAvailable = items.some((item) => item.id === currentModelId);
      if (!stillAvailable) {
        form.setFieldsValue({ vehicleModelId: undefined });
      }
    });
  };

  const handleCatalogueChange = (catalogueId) => {
    form.setFieldsValue({ catalogueColorId: undefined });
    fetchCatalogueColors(catalogueId);
  };

  const handleSubmit = async () => {
    try {
      const validatedValues = await form.validateFields();
      const values = {
        ...form.getFieldsValue(true),
        ...validatedValues,
      };
      setLoading(true);
      const isNewBike = values.bikeCondition === 'New';

      const selectedCatalogueId = normalizeNumericId(values.vehicleCatalogueId);
      const selectedCatalogueColorId = normalizeNumericId(values.catalogueColorId);
      const existingCatalogueId = normalizeNumericId(getVehicleCatalogueId(vehicleData));
      const existingCatalogueColorId = normalizeNumericId(getVehicleCatalogueColorId(vehicleData));

      let resolvedVehicleCatalogueId = isNewBike
        ? (selectedCatalogueId ?? existingCatalogueId ?? null)
        : (existingCatalogueId ?? selectedCatalogueId ?? null);
      let resolvedCatalogueColorId = isNewBike
        ? (selectedCatalogueColorId ?? existingCatalogueColorId ?? null)
        : (existingCatalogueColorId ?? selectedCatalogueColorId ?? null);

      // Backend requires catalogue and colour to be supplied together.
      if ((resolvedVehicleCatalogueId == null) !== (resolvedCatalogueColorId == null)) {
        resolvedVehicleCatalogueId = null;
        resolvedCatalogueColorId = null;
      }

      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('vehicleModelId', String(values.vehicleModelId));
      formData.append('manufacturer', values.manufacturer || '');
      formData.append('range', values.range || '');
      formData.append('costPrice', String(values.costPrice ?? vehicleData?.costPrice ?? 0));
      formData.append('registerationNumber', values.registerationNumber || '');
      formData.append('chassisNumber', values.chassisNumber || '');
      formData.append('kmDriven', String(values.kmDriven || 0));
      formData.append('modelYear', String(values.modelYear || new Date().getFullYear()));
      formData.append('bikeCondition', String(CONDITIONS.indexOf(values.bikeCondition || 'Good')));
      formData.append('warrantyPeriod', values.warrantyPeriod || '');
      formData.append('isCertified', String(values.isCertified ?? false));
      formData.append('vehicleListingStatus', String(values.vehicleListingStatus || 1));
      formData.append('vehicleCategory', String(values.vehicleCategory || 1));
      formData.append('vehicleType', String(values.vehicleType || 1));
      formData.append('ownershipStatus', String(values.ownershipStatus || 1));
      formData.append('isActive', String(values.isActive ?? true));
      formData.append('initialOdometerReading', String(values.initialOdometerReading || 0));
      formData.append('currentOdometerReading', String(values.currentOdometerReading || 0));
      formData.append(
        'vehicleCatalogueId',
        resolvedVehicleCatalogueId == null ? '' : String(resolvedVehicleCatalogueId),
      );
      formData.append('catalogueColorId', resolvedCatalogueColorId == null ? '' : String(resolvedCatalogueColorId));
      formData.append('stationId', String(values.stationId ?? vehicleData?.stationId ?? ''));

      const imageFile = imageFileList[0]?.originFileObj;
      const videoFile = videoFileList[0]?.originFileObj;
      if (imageFile) formData.append('imageFile', imageFile);
      if (videoFile) formData.append('videoFile', videoFile);

      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/api${API.vehicle.path}/${vehicleData.id}`, formData, {
        headers: getHeaders(),
      });

      const selectedStationId = normalizeNumericId(values.stationId);
      const existingStationId = normalizeNumericId(vehicleData?.stationId);
      try {
        if (selectedStationId != null && selectedStationId !== existingStationId) {
          const assignEndpoint = API.vehicle.assignStation
            .replace('{vehicleId}', String(vehicleData.id))
            .replace('{stationId}', String(selectedStationId));
          await axios.put(`${apiUrl}/api${assignEndpoint}`, {}, { headers: getHeaders() });
        } else if (selectedStationId == null && existingStationId != null) {
          const removeEndpoint = API.vehicle.removeFromStation.replace('{vehicleId}', String(vehicleData.id));
          await axios.put(`${apiUrl}/api${removeEndpoint}`, {}, { headers: getHeaders() });
        }
      } catch (stationError) {
        message.warning('Vehicle updated, but station update could not be completed.');
      }

      message.success('Vehicle updated successfully');
      form.setFieldsValue({
        ...values,
        bikeCondition: values.bikeCondition || 'Good',
      });
      setVehicleModels([]);
      setImageFileList([]);
      setVideoFileList([]);
      if (getData) getData();
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to update vehicle');
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
        title={`Update Vehicle #${vehicleData?.id} — ${vehicleData?.name}`}
        open={visible}
        onCancel={handleCancel}
        width={780}
        footer={[
          <Button key="cancel" type="white" outlined onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spin size="small" /> : 'Update Vehicle'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Info" key="basic">
              <Form.Item
                name="vehicleModelId"
                label="Vehicle Model"
                rules={[{ required: true, message: 'Vehicle model is required' }]}
              >
                <Select placeholder="Select model" loading={modelsLoading} showSearch optionFilterProp="children">
                  {vehicleModels.map((model) => (
                    <Option key={model.id} value={model.id}>
                      {model.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="name"
                  label="Vehicle Name"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Vehicle name" />
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
                    {getEnumOptions('VehicleCategory').map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="vehicleType" label="Vehicle Type" style={{ flex: 1 }} rules={[{ required: true }]}>
                  <Select placeholder="Select type">
                    {getEnumOptions('VehicleType').map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="range" label="Range" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 120 km" />
                </Form.Item>
                <Form.Item name="modelYear" label="Model Year" style={{ flex: 1 }}>
                  <InputNumber min={2000} max={2100} style={{ width: '100%' }} />
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
                        <Option
                          key={color._normalizedId ?? color.id ?? color.catalogueColorId}
                          value={color._normalizedId}
                        >
                          {color.name ||
                            color.colorName ||
                            `Colour #${color._normalizedId ?? color.id ?? color.catalogueColorId}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="kmDriven" label="Km Driven" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="warrantyPeriod" label="Warranty Period" style={{ flex: 1 }}>
                  <Input placeholder="e.g. 1 Year" />
                </Form.Item>
                <Form.Item
                  name="ownershipStatus"
                  label="Ownership"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Ownership is required' }]}
                >
                  <Select placeholder="Ownership status">
                    {getEnumOptions('OwnershipStatus').map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item label="Upload New Image" style={{ flex: 1 }}>
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
                      <div style={{ color: '#999', fontSize: 12 }}>No image available</div>
                    )}
                  </div>
                </Form.Item>
                <Form.Item label="Upload New Video" style={{ flex: 1 }}>
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
              </div>
            </TabPane>

            <TabPane tab="Price & Readings" key="pricing">
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="costPrice"
                  label="Cost Price (₹)"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Cost Price is required' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <div style={{ flex: 1 }} />
                <div style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="initialOdometerReading" label="Initial Odometer Reading" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="currentOdometerReading" label="Current Odometer Reading" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
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
                <Form.Item name="vehicleListingStatus" label="Vehicle Listing Status" style={{ flex: 1 }}>
                  <Select placeholder="Select listing status">
                    {getEnumOptions('VehicleListingStatus').map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
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
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
                <Form.Item name="isCertified" label="Certified" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
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

export default UpdateVehicle;
