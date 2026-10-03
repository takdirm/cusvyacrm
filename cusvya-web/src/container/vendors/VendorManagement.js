import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Space, Spin, Switch, Table, Tag, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';

const vendorStatusTagStyles = {
  active: {
    backgroundColor: '#237804',
    borderColor: '#237804',
    color: '#ffffff',
    fontWeight: 600,
  },
  inactive: {
    backgroundColor: '#cf1322',
    borderColor: '#cf1322',
    color: '#ffffff',
    fontWeight: 600,
  },
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

function VendorManagement() {
  const [form] = Form.useForm();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await DataService.get(API.vendor.path);
      setVendors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesSearch =
        !search ||
        [vendor.id, vendor.name, vendor.contactPerson, vendor.phoneNumber, vendor.email, vendor.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesActive = !showActiveOnly || vendor.isActive;
      return matchesSearch && matchesActive;
    });
  }, [vendors, searchText, showActiveOnly]);

  const openCreateModal = () => {
    setEditingVendor(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    form.setFieldsValue({
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      phoneNumber: vendor.phoneNumber,
      email: vendor.email,
      address: vendor.address,
      isActive: vendor.isActive,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setEditingVendor(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = {
        name: values.name?.trim(),
        contactPerson: values.contactPerson?.trim() || null,
        phoneNumber: values.phoneNumber?.trim() || null,
        email: values.email?.trim() || null,
        address: values.address?.trim() || null,
        isActive: values.isActive ?? true,
      };

      if (editingVendor) {
        await DataService.put(`${API.vendor.path}/${editingVendor.id}`, payload);
        message.success('Vendor updated successfully');
      } else {
        await DataService.post(API.vendor.path, payload);
        message.success('Vendor created successfully');
      }

      closeModal();
      await loadVendors();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      render: (value) => value || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (value) => (
        <Tag style={value ? vendorStatusTagStyles.active : vendorStatusTagStyles.inactive}>
          {value ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      render: (value) => formatDate(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" onClick={() => openEditModal(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Vendor Management"
        subTitle="List and maintain vendor records"
        buttons={[
          <div key="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button icon={<FeatherIcon icon="refresh-cw" size={14} />} onClick={loadVendors}>
              Refresh
            </Button>
            <Button
              type={showActiveOnly ? 'default' : 'primary'}
              onClick={() => setShowActiveOnly((current) => !current)}
            >
              {showActiveOnly ? 'Show All' : 'Active Only'}
            </Button>
            <Button type="primary" icon={<FeatherIcon icon="plus" size={14} />} onClick={openCreateModal}>
              Add Vendor
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Input.Search
              placeholder="Search by name, phone, email or contact person"
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Col>
        </Row>

        <Cards headless>
          {loading ? (
            <div className="spin">
              <Spin size="large" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <Empty description="No vendors found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredVendors}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          )}
        </Cards>
      </Main>

      <Modal
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        open={modalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Vendor Name" rules={[{ required: true, message: 'Vendor name is required' }]}>
            <Input placeholder="Vendor name" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="contactPerson" label="Contact Person">
                <Input placeholder="Contact person" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="vendor@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={4} placeholder="Vendor address" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default VendorManagement;
