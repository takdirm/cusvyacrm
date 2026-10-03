import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Table,
  Pagination,
  Dropdown,
  Modal,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tabs,
  Spin,
  message,
} from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

const { TabPane } = Tabs;

const normalizeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value));

function CatalogueVehicleFormModal({ visible, mode, catalogueId, vehicle, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    if (!visible) return;

    const loadVehicleModels = async () => {
      try {
        setModelLoading(true);
        const token = getItem('access_token');
        const response = await axios.get(`${getApiUrl()}/api${API.vehicleModel.path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = response.data;
        setVehicleModels(Array.isArray(data) ? data : data.items || []);
      } catch {
        setVehicleModels([]);
      } finally {
        setModelLoading(false);
      }
    };

    loadVehicleModels();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (!vehicle) {
      form.resetFields();
      form.setFieldsValue({
        modelYear: new Date().getFullYear(),
        isCertified: false,
        isActive: true,
        rentalPricePerDay: 0,
        ownershipPrice: 0,
        costPrice: 0,
        price: 0,
      });
      return;
    }

    form.setFieldsValue({
      ...vehicle,
      vehicleModelId: vehicle.vehicleModelId || vehicle.vehicleModel?.id,
      isCertified: vehicle.isCertified ?? false,
      isActive: vehicle.isActive ?? true,
      rentalPricePerDay: vehicle.rentalPricePerDay ?? 0,
      ownershipPrice: vehicle.ownershipPrice ?? 0,
      costPrice: vehicle.costPrice ?? 0,
      price: vehicle.price ?? 0,
    });
  }, [form, vehicle, visible]);

  const buildPayload = (values) => ({
    name: normalizeText(values.name),
    vehicleModelId: normalizeNumber(values.vehicleModelId),
    manufacturer: normalizeText(values.manufacturer),
    range: normalizeText(values.range),
    rentalPricePerDay: normalizeNumber(values.rentalPricePerDay),
    ownershipPrice: normalizeNumber(values.ownershipPrice),
    costPrice: normalizeNumber(values.costPrice),
    price: normalizeNumber(values.price),
    imageUrl: normalizeText(values.imageUrl),
    videoUrl: normalizeText(values.videoUrl),
    registerationNumber: mode === 'edit' ? normalizeText(vehicle?.registerationNumber) : '',
    chassisNumber: normalizeText(values.chassisNumber),
    kmDriven: mode === 'edit' ? normalizeNumber(vehicle?.kmDriven) : 0,
    modelYear: normalizeNumber(values.modelYear, new Date().getFullYear()),
    bikeCondition: 0,
    warrantyPeriod: normalizeText(values.warrantyPeriod),
    isCertified: Boolean(values.isCertified),
    isActive: Boolean(values.isActive),
    accruedEarnings: mode === 'edit' ? normalizeNumber(vehicle?.accruedEarnings) : 0,
    initialOdometerReading: mode === 'edit' ? normalizeNumber(vehicle?.initialOdometerReading) : 0,
    currentOdometerReading: mode === 'edit' ? normalizeNumber(vehicle?.currentOdometerReading) : 0,
    bikeConditionPercentId: mode === 'edit' ? (vehicle?.bikeConditionPercentId ?? null) : null,
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = buildPayload(values);
      const apiUrl = getApiUrl();

      if (mode === 'edit') {
        await axios.put(`${apiUrl}/api${API.catalogue.path}/${catalogueId}/vehicles/${vehicle.id}`, payload, {
          headers,
        });
      } else {
        await axios.post(`${apiUrl}/api${API.catalogue.path}/${catalogueId}/vehicles`, payload, { headers });
      }

      message.success(mode === 'edit' ? 'Vehicle updated successfully' : 'Vehicle added to catalogue successfully');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      if (error?.errorFields) {
        message.error('Please fill the required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to save vehicle');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? `Update Vehicle #${vehicle?.id}` : 'Add Vehicle to Catalogue'}
      open={visible}
      onCancel={onCancel}
      width={980}
      destroyOnHidden
      footer={[
        <Button key="cancel" type="white" outlined onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spin size="small" /> : mode === 'edit' ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Tabs defaultActiveKey="basic">
          <TabPane tab="Basic" key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Vehicle name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="vehicleModelId"
                  label="Vehicle Model"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    loading={modelLoading}
                    placeholder="Select vehicle model"
                    showSearch
                    optionFilterProp="children"
                  >
                    {vehicleModels.map((model) => (
                      <Select.Option key={model.id} value={model.id}>
                        {model.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="manufacturer" label="Manufacturer">
                  <Input placeholder="Manufacturer" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="range" label="Range">
                  <Input placeholder="Range" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="modelYear" label="Model Year">
                  <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="warrantyPeriod" label="Warranty Period">
                  <Input placeholder="Warranty period" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab="Pricing" key="pricing">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="rentalPricePerDay" label="Rental Price / Day">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ownershipPrice" label="Ownership Price">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="costPrice" label="Cost Price">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="price" label="Price">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab="IDs & Status" key="ids">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="chassisNumber" label="Chassis Number">
                  <Input placeholder="Chassis number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="isCertified" label="Certified" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
}

CatalogueVehicleFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  catalogueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  vehicle: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

function CatalogueVehicles() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();
  const [catalogue, setCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchCatalogue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api${API.catalogue.path}/${catalogueId}`, getHeaders());
      setCatalogue(response.data || null);
    } catch {
      setCatalogue(null);
    } finally {
      setLoading(false);
    }
  }, [catalogueId]);

  const fetchVehicles = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setVehiclesLoading(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/vehicles?page=${page}&pageSize=${size}`,
          getHeaders(),
        );
        const data = response.data || {};
        setVehicles(data.items || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setVehicles([]);
        setTotalCount(0);
        message.error(error.response?.data?.message || 'Failed to load catalogue vehicles');
      } finally {
        setVehiclesLoading(false);
      }
    },
    [catalogueId, currentPage, pageSize],
  );

  useEffect(() => {
    if (!catalogueId) return;
    fetchCatalogue();
  }, [catalogueId, fetchCatalogue]);

  useEffect(() => {
    if (!catalogueId) return;
    fetchVehicles(currentPage, pageSize);
  }, [catalogueId, currentPage, fetchVehicles, pageSize]);

  const catalogueSummary = useMemo(() => {
    if (!catalogue) return [];
    return [
      { label: 'Summary', value: catalogue.summary || '-' },
      { label: 'Brand', value: catalogue.brand || '-' },
      { label: 'Model', value: catalogue.model || '-' },
      { label: 'Year', value: catalogue.year || '-' },
      { label: 'Vehicle Type', value: catalogue.type ?? '-' },
      { label: 'Fuel Type', value: catalogue.fuelType ?? '-' },
      { label: 'Charging Type', value: catalogue.chargingType ?? '-' },
      { label: 'Price', value: catalogue.price != null ? `₹${Number(catalogue.price).toLocaleString()}` : '-' },
      { label: 'Available', value: catalogue.isAvailable ? 'Yes' : 'No' },
    ];
  }, [catalogue]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormVisible(true);
  };

  const openEditModal = (record) => {
    setEditingVehicle(record);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingVehicle(null);
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/vehicles/${record.id}`, getHeaders());
      message.success('Vehicle removed from catalogue');
      fetchVehicles(currentPage, pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180, render: (value) => value || '-' },
    {
      title: 'VehicleModelId',
      dataIndex: 'vehicleModelId',
      key: 'vehicleModelId',
      width: 120,
      render: (value, record) => value || record.vehicleModel?.id || '-',
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'OwnershipPrice',
      dataIndex: 'ownershipPrice',
      key: 'ownershipPrice',
      width: 130,
      align: 'right',
      render: (value) => (value != null ? `₹${Number(value).toLocaleString()}` : '-'),
    },
    {
      title: 'CostPrice',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      align: 'right',
      render: (value) => (value != null ? `₹${Number(value).toLocaleString()}` : '-'),
    },
    {
      title: 'ImageUrl',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (value) =>
        value ? (
          <img
            src={value}
            alt="vehicle"
            style={{ width: 60, height: 42, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'ModelYear',
      dataIndex: 'modelYear',
      key: 'modelYear',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: 'BikeCondition',
      dataIndex: 'bikeCondition',
      key: 'bikeCondition',
      width: 120,
      render: (value) => value ?? '-',
    },
    {
      title: 'WarrantyPeriod',
      dataIndex: 'warrantyPeriod',
      key: 'warrantyPeriod',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'ChassisNumber',
      dataIndex: 'chassisNumber',
      key: 'chassisNumber',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="edit" size={14} />
                Edit
              </span>
            ),
            onClick: () => openEditModal(record),
          },
          { type: 'divider' },
          {
            key: 'delete',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} />
                Delete
              </span>
            ),
            onClick: () =>
              Modal.confirm({
                title: 'Delete vehicle from catalogue?',
                content: `Remove vehicle #${record.id} from this catalogue?`,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => handleDelete(record),
              }),
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button size="small" type="white" outlined style={{ padding: '4px 10px' }}>
              Actions <FeatherIcon icon="chevron-down" size={13} />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  if (!loading && !catalogue) {
    return (
      <Main>
        <PageHeader
          ghost
          title="Manage New Vehicle"
          buttons={[
            <div key="1" className="page-header-actions">
              <Button size="small" type="default" outlined onClick={() => navigate('/admin/catalogues/list')}>
                <FeatherIcon icon="arrow-left" size={14} /> Back
              </Button>
            </div>,
          ]}
        />
        <Cards headless>
          <Empty description="Catalogue not found" />
        </Cards>
      </Main>
    );
  }

  return (
    <>
      <PageHeader
        ghost
        title="Manage New Vehicle"
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="small" type="primary" onClick={openAddModal}>
              + Add Vehicle
            </Button>
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/catalogues/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards title="Catalogue Summary" headless={false}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                  {catalogueSummary.map((item) => (
                    <Descriptions.Item key={item.label} label={item.label}>
                      {item.value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              )}
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards title="Catalogue Vehicles" headless={false}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={vehicles}
                loading={vehiclesLoading}
                pagination={false}
                scroll={{ x: 1400 }}
                className="table-responsive"
              />
              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={['10', '20', '50']}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} vehicles`}
                />
              </div>
            </Cards>
          </Col>
        </Row>
      </Main>

      <CatalogueVehicleFormModal
        visible={formVisible}
        mode={editingVehicle ? 'edit' : 'add'}
        catalogueId={catalogueId}
        vehicle={editingVehicle}
        onCancel={closeForm}
        onSuccess={() => fetchVehicles(currentPage, pageSize)}
      />
    </>
  );
}

export default CatalogueVehicles;
