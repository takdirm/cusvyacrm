import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, message, Modal, Form, Input, Switch, Space, Tag, Select } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const { TextArea } = Input;

const notificationTypeStatusTagStyles = {
  active: {
    color: '#ffffff',
    backgroundColor: '#237804',
    borderColor: '#237804',
    fontWeight: 600,
  },
  inactive: {
    color: '#ffffff',
    backgroundColor: '#cf1322',
    borderColor: '#cf1322',
    fontWeight: 600,
  },
};

function NotificationTypes() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    isActive: null,
  });

  const fetchTypes = async (page = 1, pageSize = 20, currentFilters = filters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('pageNumber', page);
      params.append('pageSize', pageSize);

      if (currentFilters.searchTerm) {
        params.append('searchTerm', currentFilters.searchTerm);
      }
      if (currentFilters.isActive !== null) {
        params.append('isActive', currentFilters.isActive);
      }

      const response = await DataService.get(`${API.notificationType.path}?${params.toString()}`);
      const data = response?.data?.data ?? response?.data ?? {};

      setTypes(data.items || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.totalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification types:', error);
      message.error('Failed to fetch notification types');
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchTypes(newPagination.current, newPagination.pageSize);
  };

  const handleFilterChange = () => {
    setPagination({ ...pagination, current: 1 });
    fetchTypes(1, pagination.pageSize, filters);
  };

  const showModal = (type = null) => {
    setEditingType(type);
    if (type) {
      form.setFieldsValue({
        code: type.code,
        name: type.name,
        description: type.description,
        isActive: type.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingType(null);
    form.resetFields();
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || null,
        isActive: values.isActive ?? true,
      };

      if (editingType) {
        await DataService.put(`${API.notificationType.path}/${editingType.id}`, payload);
        message.success('Notification type updated successfully');
      } else {
        await DataService.post(API.notificationType.path, payload);
        message.success('Notification type created successfully');
      }

      handleCancel();
      fetchTypes(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving notification type:', error);

      let errorMessage = 'Failed to save notification type';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DataService.delete(`${API.notificationType.path}/${id}`);
      message.success('Notification type deleted successfully');
      fetchTypes(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting notification type:', error);

      let errorMessage = 'Failed to delete notification type';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag style={isActive ? notificationTypeStatusTagStyles.active : notificationTypeStatusTagStyles.inactive}>
          {isActive ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FeatherIcon icon="edit" size={14} />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<FeatherIcon icon="trash-2" size={14} />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete notification type',
                content: 'Are you sure you want to delete this notification type?',
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => handleDelete(record.id),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Notification Types"
        subTitle="Manage notification types"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
          <Button key="refresh" onClick={() => fetchTypes(pagination.current, pagination.pageSize)}>
            <FeatherIcon icon="refresh-cw" size={14} /> Refresh
          </Button>,
          <Button key="add" type="primary" onClick={() => showModal()}>
            <FeatherIcon icon="plus" size={14} /> Add Type
          </Button>,
        ]}
      />
      <Main>
        {/* Filters */}
        <Cards headless>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search by code or name"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                onPressEnter={handleFilterChange}
                prefix={<FeatherIcon icon="search" size={14} />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by status"
                value={filters.isActive}
                onChange={(value) => setFilters({ ...filters, isActive: value })}
                allowClear
              >
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button type="primary" onClick={handleFilterChange} block>
                <FeatherIcon icon="filter" size={14} /> Apply Filters
              </Button>
            </Col>
          </Row>
        </Cards>

        {/* Table */}
        <Cards headless>
          <Table
            columns={columns}
            dataSource={types}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} types`,
            }}
            onChange={handleTableChange}
          />
        </Cards>
      </Main>

      {/* Create/Edit Modal */}
      <Modal
        title={editingType ? 'Edit Notification Type' : 'Create Notification Type'}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter code' },
              { max: 100, message: 'Maximum 100 characters' },
            ]}
          >
            <Input placeholder="e.g., PAYMENT_REMINDER" disabled={!!editingType} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter name' },
              { max: 200, message: 'Maximum 200 characters' },
            ]}
          >
            <Input placeholder="e.g., Payment Reminder" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description" maxLength={1000} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default NotificationTypes;
