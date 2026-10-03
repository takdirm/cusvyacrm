import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, message, Modal, Form, Input, Select, Switch, Space, Popconfirm, Tag } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import {
  NotificationType,
  NotificationTypeLabels,
  getNotificationTypeOptions,
  NotificationChannel,
  NotificationChannelLabels,
  getNotificationChannelOptions,
} from '../../config/enum/notificationEnums';

const { TextArea } = Input;
const { Option } = Select;

function NotificationTemplates() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNotificationType, setFilterNotificationType] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  const fetchTemplates = async (page = 1, size = 20, search = '', notifType = '', channel = '') => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('pageNumber', page);
      params.append('pageSize', size);
      if (search) params.append('searchTerm', search);
      if (notifType !== '') params.append('notificationType', notifType);
      if (channel !== '') params.append('channel', channel);

      const response = await DataService.get(`${API.notification.templates}?${params.toString()}`);
      const data = response?.data?.data ?? response?.data ?? {};

      setTemplates(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching templates:', error);

      // Check if it's a 401 or 404 error (endpoint not available)
      if (error.response?.status === 401 || error.response?.status === 404) {
        message.warning('Notification Templates endpoint is not available. Please contact your administrator.');
      } else {
        message.error('Failed to fetch notification templates');
      }

      // Set empty data to prevent UI from breaking
      setTemplates([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(currentPage, pageSize, searchTerm, filterNotificationType, filterChannel);
  }, [currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTemplates(1, pageSize, searchTerm, filterNotificationType, filterChannel);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterNotificationType('');
    setFilterChannel('');
    setCurrentPage(1);
    fetchTemplates(1, pageSize, '', '', '');
  };

  const showModal = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      form.setFieldsValue({
        templateCode: template.templateCode,
        name: template.name,
        notificationType: template.notificationType,
        channel: template.channel,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
        targetAudience: template.targetAudience,
        description: template.description,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const payload = {
        templateCode: values.templateCode,
        name: values.name,
        notificationType: values.notificationType,
        channel: values.channel,
        subject: values.subject || '',
        body: values.body,
        isActive: values.isActive ?? true,
        targetAudience: values.targetAudience || '',
        description: values.description || '',
      };

      if (editingTemplate) {
        await DataService.put(`${API.notification.template}/${editingTemplate.id}`, payload);
        message.success('Template updated successfully');
      } else {
        await DataService.post(API.notification.template, payload);
        message.success('Template created successfully');
      }

      handleCancel();
      fetchTemplates(currentPage, pageSize, searchTerm, filterNotificationType, filterChannel);
    } catch (error) {
      console.error('Error saving template:', error);

      let errorMessage = 'Failed to save template';
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
      await DataService.delete(`${API.notification.template}/${id}`);
      message.success('Template deleted successfully');
      fetchTemplates(currentPage, pageSize, searchTerm, filterNotificationType, filterChannel);
    } catch (error) {
      console.error('Error deleting template:', error);

      let errorMessage = 'Failed to delete template';
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
      title: 'Template Code',
      dataIndex: 'templateCode',
      key: 'templateCode',
      width: 150,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'notificationType',
      key: 'notificationType',
      width: 150,
      render: (type) => <Tag color="blue">{NotificationTypeLabels[type]}</Tag>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel) => <Tag color="green">{NotificationChannelLabels[channel]}</Tag>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (isActive ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>),
    },
    {
      title: 'Target Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 150,
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
          <Popconfirm
            title="Delete template"
            description="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger size="small" icon={<FeatherIcon icon="trash-2" size={14} />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Notification Templates"
        subTitle="Manage notification templates for various channels"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
          <Button key="add" type="primary" onClick={() => showModal()}>
            <FeatherIcon icon="plus" size={14} /> Add Template
          </Button>,
        ]}
      />
      <Main>
        {/* Filter Bar */}
        <Cards headless style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600, marginBottom: 2 }}>
              <FeatherIcon icon="filter" size={14} style={{ marginRight: 4 }} /> Filters:
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                placeholder="Search templates..."
                size="small"
                style={{ width: 220 }}
                allowClear
                suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Notification Type</span>
              <Select
                value={filterNotificationType}
                onChange={setFilterNotificationType}
                style={{ width: 180 }}
                size="small"
                allowClear
              >
                <Option value="">All</Option>
                {getNotificationTypeOptions().map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Channel</span>
              <Select value={filterChannel} onChange={setFilterChannel} style={{ width: 150 }} size="small" allowClear>
                <Option value="">All</Option>
                {getNotificationChannelOptions().map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>

            <Space>
              <Button type="primary" size="small" onClick={handleSearch} icon={<FeatherIcon icon="search" size={14} />}>
                Apply
              </Button>
              <Button size="small" onClick={handleReset} icon={<FeatherIcon icon="rotate-ccw" size={14} />}>
                Reset
              </Button>
            </Space>
          </div>
        </Cards>

        {/* Table */}
        <Cards headless>
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} templates`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </Cards>
      </Main>

      {/* Create/Edit Modal */}
      <Modal
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="templateCode"
                label="Template Code"
                rules={[{ required: true, message: 'Please enter template code' }]}
              >
                <Input placeholder="e.g., PAYMENT_SUCCESS" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter template name' }]}>
                <Input placeholder="Template name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="notificationType"
                label="Notification Type"
                rules={[{ required: true, message: 'Please select notification type' }]}
              >
                <Select placeholder="Select notification type">
                  {getNotificationTypeOptions().map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="Channel" rules={[{ required: true, message: 'Please select channel' }]}>
                <Select placeholder="Select channel">
                  {getNotificationChannelOptions().map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subject" label="Subject">
            <Input placeholder="Email subject or message title" />
          </Form.Item>

          <Form.Item name="body" label="Body" rules={[{ required: true, message: 'Please enter template body' }]}>
            <TextArea rows={6} placeholder="Template body with placeholders like {{customerName}}" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="targetAudience" label="Target Audience">
                <Input placeholder="e.g., Customers, Admins" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description of this template" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default NotificationTemplates;
