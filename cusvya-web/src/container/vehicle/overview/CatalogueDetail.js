import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Spin,
  Empty,
  Descriptions,
  Space,
  Tag,
  Button as AntButton,
  message,
  Tabs,
  Table,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  Statistic,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import moment from 'moment';
import PlainLabel from '../../../components/labels/plain-label';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api';
import { DataService } from '../../../config/dataService/dataService';
import { getChargingTypeText, getFuelTypeText, getVehicleTypeText } from '../../../config/enum/enum';
import {
  activateCatalogueVendor,
  createCatalogueVendor,
  deactivateCatalogueVendor,
  deleteCatalogueVendor,
  getCatalogueVendors,
  updateCatalogueVendor,
} from './services/catalogueVendorService';

const { TabPane } = Tabs;

function CatalogueDetail() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();

  const [vendorForm] = Form.useForm();
  const [catalogue, setCatalogue] = useState(null);
  const [mappedVendors, setMappedVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);

  const loadMappedVendors = async () => {
    if (!catalogueId) return;

    try {
      const vendors = await getCatalogueVendors(catalogueId);
      setMappedVendors(Array.isArray(vendors) ? vendors : []);
    } catch (error) {
      setMappedVendors([]);
    }
  };

  const loadAllVendors = async () => {
    try {
      const response = await DataService.get(API.vendor.path);
      const vendors = Array.isArray(response?.data) ? response.data : [];
      setAllVendors(vendors);
    } catch (error) {
      setAllVendors([]);
    }
  };

  useEffect(() => {
    const fetchCatalogue = async () => {
      setLoading(true);
      try {
        const response = await DataService.get(`${API.catalogue.path}/${catalogueId}`);
        setCatalogue(response?.data || null);
      } catch (error) {
        setCatalogue(null);
      } finally {
        setLoading(false);
      }
    };

    if (catalogueId) {
      fetchCatalogue();
      loadMappedVendors();
      loadAllVendors();
    }
  }, [catalogueId]);

  const mappedVendorIds = useMemo(
    () => new Set(mappedVendors.map((vendor) => Number(vendor.vendorId))),
    [mappedVendors],
  );

  const selectableVendors = useMemo(
    () => allVendors.filter((vendor) => vendor.isActive && (editingMapping || !mappedVendorIds.has(Number(vendor.id)))),
    [allVendors, mappedVendorIds, editingMapping],
  );

  const openCreateVendorModal = () => {
    setEditingMapping(null);
    vendorForm.resetFields();
    vendorForm.setFieldsValue({
      priority: 0,
      isActive: true,
    });
    setVendorModalVisible(true);
  };

  const openEditVendorModal = (mapping) => {
    setEditingMapping(mapping);
    vendorForm.setFieldsValue({
      vendorId: mapping.vendorId,
      vendorCatalogueCode: mapping.vendorCatalogueCode,
      vendorModelCode: mapping.vendorModelCode,
      purchasePrice: mapping.purchasePrice,
      leadTimeDays: mapping.leadTimeDays,
      priority: mapping.priority,
      notes: mapping.notes,
      isActive: mapping.isActive,
    });
    setVendorModalVisible(true);
  };

  const closeVendorModal = () => {
    if (vendorLoading) return;
    setVendorModalVisible(false);
    setEditingMapping(null);
    vendorForm.resetFields();
  };

  const refreshVendors = async () => {
    await loadMappedVendors();
    await loadAllVendors();
  };

  const handleSubmitVendor = async () => {
    try {
      const values = await vendorForm.validateFields();
      const payload = {
        vendorId: Number(values.vendorId),
        vendorCatalogueCode: values.vendorCatalogueCode || null,
        vendorModelCode: values.vendorModelCode || null,
        purchasePrice: values.purchasePrice ?? null,
        leadTimeDays: values.leadTimeDays ?? null,
        priority: Number(values.priority || 0),
        notes: values.notes || null,
        isActive: Boolean(values.isActive),
      };

      setVendorLoading(true);
      if (editingMapping) {
        await updateCatalogueVendor(catalogueId, editingMapping.id, payload);
        message.success('Vendor mapping updated.');
      } else {
        await createCatalogueVendor(catalogueId, payload);
        message.success('Vendor mapping created.');
      }

      closeVendorModal();
      await refreshVendors();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      message.error(error?.response?.data?.message || error?.message || 'Failed to save vendor mapping');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleToggleVendorStatus = async (mapping) => {
    try {
      setVendorLoading(true);
      if (mapping.isActive) {
        await deactivateCatalogueVendor(catalogueId, mapping.id);
        message.success('Vendor deactivated.');
      } else {
        await activateCatalogueVendor(catalogueId, mapping.id);
        message.success('Vendor activated.');
      }

      await refreshVendors();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to update vendor status');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleRemoveVendor = async (mapping) => {
    if (!catalogueId || !mapping?.vendorId) {
      return;
    }

    try {
      setVendorLoading(true);
      await deleteCatalogueVendor(catalogueId, mapping.vendorId);
      message.success('Vendor mapping removed.');
      await refreshVendors();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to remove vendor mapping');
    } finally {
      setVendorLoading(false);
    }
  };

  const activeVendors = mappedVendors.filter((vendor) => vendor.isActive).length;
  const inactiveVendors = mappedVendors.length - activeVendors;
  const totalColors = Array.isArray(catalogue?.catalogueColors) ? catalogue.catalogueColors.length : 0;

  const boolTag = (value) =>
    value ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  const vendorColumns = [
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (_, record) => record.vendorName || `Vendor #${record.vendorId}`,
    },
    {
      title: 'Vendor Code',
      dataIndex: 'vendorCatalogueCode',
      key: 'vendorCatalogueCode',
      render: (value) => value || '-',
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: (value) => (value == null ? '-' : `₹${Number(value).toLocaleString()}`),
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTimeDays',
      key: 'leadTimeDays',
      render: (value) => (value == null ? '-' : `${value} days`),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          <AntButton size="small" onClick={() => openEditVendorModal(record)}>
            Edit
          </AntButton>
          <Popconfirm
            title={record.isActive ? 'Deactivate vendor mapping?' : 'Activate vendor mapping?'}
            description={
              record.isActive
                ? 'Vendor will not be available for new procurement. Existing procurements stay intact.'
                : undefined
            }
            okText={record.isActive ? 'Deactivate' : 'Activate'}
            onConfirm={() => handleToggleVendorStatus(record)}
          >
            <AntButton size="small">{record.isActive ? 'Deactivate' : 'Activate'}</AntButton>
          </Popconfirm>
          <Popconfirm
            title="Remove vendor mapping?"
            okText="Remove"
            okType="danger"
            onConfirm={() => handleRemoveVendor(record)}
          >
            <AntButton size="small" danger>
              Remove
            </AntButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="spin" style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!catalogue) {
    return (
      <Main>
        <Empty description="Catalogue not found" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/catalogues/list')}>
            Back to Catalogues
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <>
      <PageHeader
        ghost
        title={`Catalogue #${catalogue.id} - ${catalogue.brand || '-'} ${catalogue.model || ''}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="white" outlined onClick={() => navigate('/admin/catalogues/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Cards headless>
              <Statistic title="Colours" value={totalColors} />
            </Cards>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Cards headless>
              <Statistic title="Active Vendors" value={activeVendors} />
            </Cards>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Cards headless>
              <Statistic title="Inactive Vendors" value={inactiveVendors} />
            </Cards>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Cards title="Media" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              {catalogue.imageUrl ? (
                <img
                  src={catalogue.imageUrl}
                  alt={`${catalogue.brand || 'vehicle'} ${catalogue.model || ''}`}
                  style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 240 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 220,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FeatherIcon icon="image" size={40} color="#ccc" />
                </div>
              )}

              <Space direction="vertical" style={{ marginTop: 12 }}>
                {catalogue.videoUrl ? (
                  <a href={catalogue.videoUrl} target="_blank" rel="noopener noreferrer">
                    <FeatherIcon icon="play-circle" size={14} /> Watch Video
                  </a>
                ) : null}
                {catalogue.view360Url ? (
                  <a href={catalogue.view360Url} target="_blank" rel="noopener noreferrer">
                    <FeatherIcon icon="rotate-cw" size={14} /> 360 View
                  </a>
                ) : null}
              </Space>
            </Cards>
          </Col>

          <Col xs={24} lg={16}>
            <Cards headless>
              <Tabs defaultActiveKey="details">
                <TabPane tab="Details" key="details">
                  <Cards title="Overview" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                      <Descriptions.Item label="Summary" span={3}>
                        {catalogue.summary || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Description" span={3}>
                        {catalogue.description || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Brand">{catalogue.brand || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Model">{catalogue.model || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Year">{catalogue.year || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Vehicle Type">{getVehicleTypeText(catalogue.type)}</Descriptions.Item>
                      <Descriptions.Item label="Fuel Type">{getFuelTypeText(catalogue.fuelType)}</Descriptions.Item>
                      <Descriptions.Item label="Charging Type">
                        {getChargingTypeText(catalogue.chargingType)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Top Speed (Kmph)">{catalogue.topSpeedKmph ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Weight (Kg)">{catalogue.weightKg ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Seat Height (Mm)">{catalogue.seatHeightMm ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Wheel Base (Mm)">{catalogue.wheelBaseMm ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Price">
                        {catalogue.price != null ? `₹${Number(catalogue.price).toLocaleString()}` : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Available">{boolTag(catalogue.isAvailable)}</Descriptions.Item>
                    </Descriptions>
                  </Cards>

                  <Cards title="Technical Details" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                      <Descriptions.Item label="Engine CC">{catalogue.engineCC ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Engine Type">{catalogue.engineType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Horse Power">{catalogue.horsePower ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Torque (Nm)">{catalogue.torqueNm ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Transmission">{catalogue.transmission || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Mileage (Km/L)">{catalogue.mileageKmPerL ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Motor Power (W)">{catalogue.motorPowerW ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Motor Type">{catalogue.motorType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Battery Capacity (kWh)">
                        {catalogue.batteryCapacityKWh ?? '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Battery Type">{catalogue.batteryType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Range (Km)">{catalogue.rangeKm ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Charging Time (Hours)">
                        {catalogue.chargingTimeHours ?? '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Fast Charging">{boolTag(catalogue.hasFastCharging)}</Descriptions.Item>
                      <Descriptions.Item label="Regen Braking">
                        {boolTag(catalogue.hasRegenerativeBraking)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Smart Connectivity">
                        {boolTag(catalogue.hasSmartConnectivity)}
                      </Descriptions.Item>
                      <Descriptions.Item label="ABS">{boolTag(catalogue.hasABS)}</Descriptions.Item>
                      <Descriptions.Item label="Electric Start">
                        {boolTag(catalogue.hasElectricStart)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Brake Type">{catalogue.brakeType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Suspension Front">{catalogue.suspensionFront || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Suspension Rear">{catalogue.suspensionRear || '-'}</Descriptions.Item>
                    </Descriptions>
                  </Cards>

                  <Cards title="Dealer & Delivery" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                    <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                      <Descriptions.Item label="Delivery Timeline">
                        {catalogue.deliveryTimeline
                          ? moment(catalogue.deliveryTimeline).format('YYYY-MM-DD HH:mm')
                          : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {catalogue.createdAt ? moment(catalogue.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Updated At">
                        {catalogue.updatedAt ? moment(catalogue.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Features" span={3}>
                        {Array.isArray(catalogue.features) && catalogue.features.length
                          ? catalogue.features.join(', ')
                          : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Cards>
                </TabPane>

                <TabPane tab="Vendors" key="vendors">
                  <Cards
                    title="Catalogue Vendors"
                    headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                    extra={
                      <AntButton type="primary" onClick={openCreateVendorModal} disabled={vendorLoading}>
                        + Add Vendor
                      </AntButton>
                    }
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <AntButton type="primary" onClick={openCreateVendorModal} disabled={vendorLoading}>
                        + Add Vendor
                      </AntButton>
                    </div>
                    {mappedVendors.length === 0 ? (
                      <Empty description="No vendors mapped to this catalogue" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <AntButton type="primary" onClick={openCreateVendorModal} disabled={vendorLoading}>
                          Add First Vendor
                        </AntButton>
                      </Empty>
                    ) : (
                      <Table
                        rowKey="id"
                        loading={vendorLoading}
                        columns={vendorColumns}
                        dataSource={mappedVendors}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 1100 }}
                      />
                    )}
                  </Cards>
                </TabPane>
              </Tabs>
            </Cards>
          </Col>
        </Row>
      </Main>

      <Modal
        title={editingMapping ? 'Edit Catalogue Vendor' : 'Add Catalogue Vendor'}
        open={vendorModalVisible}
        onCancel={closeVendorModal}
        onOk={handleSubmitVendor}
        okText={editingMapping ? 'Update Vendor' : 'Add Vendor'}
        confirmLoading={vendorLoading}
        destroyOnClose
      >
        <Form form={vendorForm} layout="vertical">
          <Form.Item name="vendorId" label="Vendor" rules={[{ required: true, message: 'Vendor is required.' }]}>
            <Select
              showSearch
              disabled={Boolean(editingMapping)}
              optionFilterProp="label"
              placeholder="Select vendor"
              options={selectableVendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
            />
          </Form.Item>
          <Form.Item name="vendorCatalogueCode" label="Vendor Catalogue Code">
            <Input />
          </Form.Item>
          <Form.Item name="vendorModelCode" label="Vendor Model Code">
            <Input />
          </Form.Item>
          <Form.Item
            name="purchasePrice"
            label="Purchase Price"
            rules={[{ type: 'number', min: 0, message: 'Purchase Price cannot be negative.' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="leadTimeDays"
            label="Lead Time Days"
            rules={[{ type: 'number', min: 0, message: 'Lead Time Days cannot be negative.' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[
              { required: true, message: 'Priority is required.' },
              { type: 'number', min: 0, message: 'Priority must be valid.' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CatalogueDetail;
