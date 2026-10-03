import React, { useEffect, useMemo, useState } from 'react';
import {
  Space,
  Tag,
  Button as AntButton,
  message,
  Table,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  Empty,
} from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { API } from '../../../config/api';
import { DataService } from '../../../config/dataService/dataService';
import {
  activateCatalogueVendor,
  createCatalogueVendor,
  deactivateCatalogueVendor,
  deleteCatalogueVendor,
  getCatalogueVendors,
  updateCatalogueVendor,
} from './services/catalogueVendorService';

function CatalogueVendorsManager({ catalogueId, title = 'Catalogue Vendors' }) {
  const [vendorForm] = Form.useForm();
  const [mappedVendors, setMappedVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
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
    if (catalogueId) {
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <AntButton type="primary" onClick={openCreateVendorModal} disabled={vendorLoading}>
          + Add Vendor
        </AntButton>
      </div>

      <Cards
        title={title}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        extra={
          <AntButton type="primary" onClick={openCreateVendorModal} disabled={vendorLoading}>
            + Add Vendor
          </AntButton>
        }
      >
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

      <Modal
        title={editingMapping ? 'Edit Catalogue Vendor' : 'Add Catalogue Vendor'}
        open={vendorModalVisible}
        onCancel={closeVendorModal}
        onOk={handleSubmitVendor}
        okText={editingMapping ? 'Update Vendor' : 'Add Vendor'}
        confirmLoading={vendorLoading}
        destroyOnClose
        width={720}
      >
        <Form form={vendorForm} layout="vertical">
          <Form.Item name="vendorId" label="Vendor" rules={[{ required: true, message: 'Vendor is required.' }]}>
            <Select
              showSearch
              disabled={Boolean(editingMapping)}
              optionFilterProp="label"
              placeholder="Select vendor"
              options={selectableVendors.map((vendor) => ({
                value: vendor.id,
                label: vendor.name,
              }))}
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

export default CatalogueVendorsManager;
