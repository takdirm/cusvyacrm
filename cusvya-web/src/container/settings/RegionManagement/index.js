import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Spin, Card, Row, Col, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { DataService } from '../../../config/dataService/dataService';
import { API } from '../../../config/api';

const RegionManagement = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [viewingRegion, setViewingRegion] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filterActive, setFilterActive] = useState(null);

  // Fetch regions with pagination
  const fetchRegions = async (page = 1, pageSize = 10, search = '', isActive = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
      });
      if (search) params.append('search', search);
      if (isActive !== null) params.append('isActive', isActive);

      const response = await DataService.get(`${API.region.paged}?${params.toString()}`);
      const apiResponse = response?.data || {};
      setRegions(apiResponse?.data || []);
      setPagination({
        current: apiResponse?.currentPage || page,
        pageSize: apiResponse?.pageSize || pageSize,
        total: apiResponse?.totalItems || 0,
      });
    } catch (error) {
      message.error('Failed to load regions');
      console.error('Fetch regions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions(pagination.current, pagination.pageSize, searchText, filterActive);
  }, []);

  const handleTableChange = (newPagination) => {
    fetchRegions(newPagination.current, newPagination.pageSize, searchText, filterActive);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
    fetchRegions(1, pagination.pageSize, value, filterActive);
  };

  const handleFilterActive = (value) => {
    setFilterActive(value === 'all' ? null : value === 'true');
    setPagination({ ...pagination, current: 1 });
    fetchRegions(1, pagination.pageSize, searchText, value === 'all' ? null : value === 'true');
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingRegion(null);
    setIsModalVisible(true);
  };

  const handleEdit = (region) => {
    setEditingRegion(region);
    form.setFieldsValue({
      code: region.code,
      name: region.name,
      city: region.city,
      state: region.state || '',
      country: region.country || 'India',
      currencyCode: region.currencyCode || 'INR',
      timeZone: region.timeZone || 'Asia/Kolkata',
      defaultLanguageCode: region.defaultLanguageCode || 'en',
      isActive: region.isActive,
    });
    setIsModalVisible(true);
  };

  const handleView = (region) => {
    setViewingRegion(region);
    setIsViewModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await DataService.delete(`${API.region.path}/${id}`);
      message.success('Region deleted successfully');
      fetchRegions(pagination.current, pagination.pageSize, searchText, filterActive);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to delete region');
      console.error('Delete region error:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRegion) {
        await DataService.put(`${API.region.path}/${editingRegion.id}`, values);
        message.success('Region updated successfully');
      } else {
        await DataService.post(API.region.path, values);
        message.success('Region created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRegion(null);
      fetchRegions(pagination.current, pagination.pageSize, searchText, filterActive);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to save region');
      console.error('Save region error:', error);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      sorter: (a, b) => a.city.localeCompare(b.city),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 120,
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: 'Currency',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>{isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} type="text" onClick={() => handleView(record)} title="View" />
          <Button icon={<EditOutlined />} type="text" onClick={() => handleEdit(record)} title="Edit" />
          <Popconfirm
            title="Delete Region"
            description="Are you sure you want to delete this region?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} type="text" danger title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search placeholder="Search by code, name, city, or state" onSearch={handleSearch} enterButton />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select placeholder="Filter by status" onChange={handleFilterActive} style={{ width: '100%' }}>
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="true">Active</Select.Option>
              <Select.Option value="false">Inactive</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Region
            </Button>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={regions}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRegion ? 'Edit Region' : 'Add Region'}
        visible={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRegion(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Region Code"
            name="code"
            rules={[
              { required: true, message: 'Please enter region code' },
              { min: 1, max: 20, message: 'Code must be 1-20 characters' },
            ]}
          >
            <Input placeholder="e.g., BLR" />
          </Form.Item>

          <Form.Item
            label="Region Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter region name' },
              { min: 1, max: 100, message: 'Name must be 1-100 characters' },
            ]}
          >
            <Input placeholder="e.g., Bengaluru Region" />
          </Form.Item>

          <Form.Item
            label="City"
            name="city"
            rules={[
              { required: true, message: 'Please enter city' },
              { min: 1, max: 100, message: 'City must be 1-100 characters' },
            ]}
          >
            <Input placeholder="e.g., Bengaluru" />
          </Form.Item>

          <Form.Item label="State" name="state">
            <Input placeholder="e.g., Karnataka" />
          </Form.Item>

          <Form.Item label="Country" name="country">
            <Input placeholder="e.g., India" />
          </Form.Item>

          <Form.Item label="Currency Code" name="currencyCode">
            <Select>
              <Select.Option value="INR">INR (Indian Rupee)</Select.Option>
              <Select.Option value="USD">USD (US Dollar)</Select.Option>
              <Select.Option value="EUR">EUR (Euro)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Time Zone" name="timeZone">
            <Select>
              <Select.Option value="Asia/Kolkata">Asia/Kolkata (India)</Select.Option>
              <Select.Option value="Asia/Dubai">Asia/Dubai (UAE)</Select.Option>
              <Select.Option value="Asia/Bangkok">Asia/Bangkok (Thailand)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Default Language" name="defaultLanguageCode">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="hn">Hindi</Select.Option>
              <Select.Option value="kn">Kannada</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="View Region"
        visible={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingRegion(null);
        }}
        footer={null}
        width={600}
      >
        {viewingRegion && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Code:</strong> {viewingRegion.code}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Name:</strong> {viewingRegion.name}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>City:</strong> {viewingRegion.city}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>State:</strong> {viewingRegion.state}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Country:</strong> {viewingRegion.country}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Currency:</strong> {viewingRegion.currencyCode}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Time Zone:</strong> {viewingRegion.timeZone}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Default Language:</strong> {viewingRegion.defaultLanguageCode}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Status:</strong>{' '}
              <span style={{ color: viewingRegion.isActive ? '#52c41a' : '#ff4d4f' }}>
                {viewingRegion.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {viewingRegion.createdAt && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Created:</strong> {new Date(viewingRegion.createdAt).toLocaleString()}
              </div>
            )}
            {viewingRegion.updatedAt && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Updated:</strong> {new Date(viewingRegion.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegionManagement;
