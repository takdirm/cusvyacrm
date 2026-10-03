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

function CatalogueScooterFormModal({ visible, mode, catalogueId, scooter, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scooterTypes, setScooterTypes] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    if (!visible) return;

    const loadScooterTypes = async () => {
      try {
        setTypeLoading(true);
        const token = getItem('access_token');
        const response = await axios.get(`${getApiUrl()}/api${API.scooterType.path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = response.data;
        setScooterTypes(Array.isArray(data) ? data : data.items || []);
      } catch {
        setScooterTypes([]);
      } finally {
        setTypeLoading(false);
      }
    };

    loadScooterTypes();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (!scooter) {
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
      ...scooter,
      scooterTypeId: scooter.scooterTypeId || scooter.scooterType?.id,
      isCertified: scooter.isCertified ?? false,
      isActive: scooter.isActive ?? true,
      rentalPricePerDay: scooter.rentalPricePerDay ?? 0,
      ownershipPrice: scooter.ownershipPrice ?? 0,
      costPrice: scooter.costPrice ?? 0,
      price: scooter.price ?? 0,
    });
  }, [form, scooter, visible]);

  const buildPayload = (values) => ({
    name: normalizeText(values.name),
    scooterTypeId: normalizeNumber(values.scooterTypeId),
    manufacturer: normalizeText(values.manufacturer),
    range: normalizeText(values.range),
    rentalPricePerDay: normalizeNumber(values.rentalPricePerDay),
    ownershipPrice: normalizeNumber(values.ownershipPrice),
    costPrice: normalizeNumber(values.costPrice),
    price: normalizeNumber(values.price),
    imageUrl: normalizeText(values.imageUrl),
    videoUrl: normalizeText(values.videoUrl),
    registerationNumber: mode === 'edit' ? normalizeText(scooter?.registerationNumber) : '',
    chassisNumber: normalizeText(values.chassisNumber),
    kmDriven: mode === 'edit' ? normalizeNumber(scooter?.kmDriven) : 0,
    modelYear: normalizeNumber(values.modelYear, new Date().getFullYear()),
    bikeCondition: 0,
    warrantyPeriod: normalizeText(values.warrantyPeriod),
    isCertified: Boolean(values.isCertified),
    isActive: Boolean(values.isActive),
    accruedEarnings: mode === 'edit' ? normalizeNumber(scooter?.accruedEarnings) : 0,
    initialOdometerReading: mode === 'edit' ? normalizeNumber(scooter?.initialOdometerReading) : 0,
    currentOdometerReading: mode === 'edit' ? normalizeNumber(scooter?.currentOdometerReading) : 0,
    bikeConditionPercentId: mode === 'edit' ? (scooter?.bikeConditionPercentId ?? null) : null,
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
        await axios.put(`${apiUrl}/api${API.catalogue.path}/${catalogueId}/scooters/${scooter.id}`, payload, {
          headers,
        });
      } else {
        await axios.post(`${apiUrl}/api${API.catalogue.path}/${catalogueId}/scooters`, payload, { headers });
      }

      message.success(mode === 'edit' ? 'Scooter updated successfully' : 'Scooter added to catalogue successfully');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      if (error?.errorFields) {
        message.error('Please fill the required fields');
      } else {
        message.error(error.response?.data?.message || 'Failed to save scooter');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? `Update Scooter #${scooter?.id}` : 'Add Scooter to Catalogue'}
      open={visible}
      onCancel={onCancel}
      width={980}
      destroyOnHidden
      footer={[
        <Button key="cancel" type="white" outlined onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spin size="small" /> : mode === 'edit' ? 'Update Scooter' : 'Add Scooter'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Tabs defaultActiveKey="basic">
          <TabPane tab="Basic" key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Scooter name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="scooterTypeId" label="Scooter Type" rules={[{ required: true, message: 'Required' }]}>
                  <Select
                    loading={typeLoading}
                    placeholder="Select scooter type"
                    showSearch
                    optionFilterProp="children"
                  >
                    {scooterTypes.map((type) => (
                      <Select.Option key={type.id} value={type.id}>
                        {type.name}
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

CatalogueScooterFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['add', 'edit']).isRequired,
  catalogueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  scooter: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

function CatalogueScooters() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();
  const [catalogue, setCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scooters, setScooters] = useState([]);
  const [scootersLoading, setScootersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingScooter, setEditingScooter] = useState(null);

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

  const fetchScooters = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setScootersLoading(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/scooters?page=${page}&pageSize=${size}`,
          getHeaders(),
        );
        const data = response.data || {};
        setScooters(data.items || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setScooters([]);
        setTotalCount(0);
        message.error(error.response?.data?.message || 'Failed to load catalogue scooters');
      } finally {
        setScootersLoading(false);
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
    fetchScooters(currentPage, pageSize);
  }, [catalogueId, currentPage, fetchScooters, pageSize]);

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
    setEditingScooter(null);
    setFormVisible(true);
  };

  const openEditModal = (record) => {
    setEditingScooter(record);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingScooter(null);
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/scooters/${record.id}`, getHeaders());
      message.success('Scooter removed from catalogue');
      fetchScooters(currentPage, pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete scooter');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180, render: (value) => value || '-' },
    {
      title: 'ScooterTypeId',
      dataIndex: 'scooterTypeId',
      key: 'scooterTypeId',
      width: 120,
      render: (value, record) => value || record.scooterType?.id || '-',
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
            alt="scooter"
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
                title: 'Delete scooter from catalogue?',
                content: `Remove scooter #${record.id} from this catalogue?`,
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
          title="Manage New Scooter"
          buttons={[
            <div key="1" className="page-header-actions">
              <Button size="small" type="default" outlined onClick={() => navigate('/admin/scooter/catalogues')}>
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
        title="Manage New Scooter"
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="small" type="primary" onClick={openAddModal}>
              + Add Scooter
            </Button>
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/scooter/catalogues')}>
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
            <Cards title="Catalogue Scooters" headless={false}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={scooters}
                loading={scootersLoading}
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
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} scooters`}
                />
              </div>
            </Cards>
          </Col>
        </Row>
      </Main>

      <CatalogueScooterFormModal
        visible={formVisible}
        mode={editingScooter ? 'edit' : 'add'}
        catalogueId={catalogueId}
        scooter={editingScooter}
        onCancel={closeForm}
        onSuccess={() => fetchScooters(currentPage, pageSize)}
      />
    </>
  );
}

export default CatalogueScooters;
