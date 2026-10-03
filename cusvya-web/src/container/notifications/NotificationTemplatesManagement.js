import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Table,
  Button,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Card,
  Dropdown,
  Typography,
} from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import {
  NotificationChannel,
  NotificationChannelLabels,
  getNotificationChannelOptions,
  TargetAudience,
  TargetAudienceLabels,
  getTargetAudienceOptions,
} from '../../config/enum/notificationEnums';

const { TextArea } = Input;
const { Option } = Select;
const { Paragraph } = Typography;

const notificationTemplateTagStyles = {
  notificationType: {
    color: '#ffffff',
    backgroundColor: '#0958d9',
    borderColor: '#0958d9',
    fontWeight: 600,
  },
  channel: {
    color: '#ffffff',
    backgroundColor: '#531dab',
    borderColor: '#531dab',
    fontWeight: 600,
  },
  targetAudience: {
    color: '#ffffff',
    backgroundColor: '#006d75',
    borderColor: '#006d75',
    fontWeight: 600,
  },
  language: {
    color: '#ffffff',
    backgroundColor: '#595959',
    borderColor: '#595959',
    fontWeight: 600,
  },
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
  error: {
    color: '#ffffff',
    backgroundColor: '#cf1322',
    borderColor: '#cf1322',
    fontWeight: 600,
  },
};

function NotificationTemplatesManagement() {
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testingTemplate, setTestingTemplate] = useState(null);
  const [parameterMappings, setParameterMappings] = useState([]);
  const [placeholderOptions, setPlaceholderOptions] = useState([]);
  const [testParameters, setTestParameters] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    notificationTypeId: null,
    channel: null,
  });

  const fetchNotificationTypes = async () => {
    try {
      const response = await DataService.get(`${API.notificationType.path}?pageSize=100&isActive=true`);
      const data = response?.data?.data ?? response?.data ?? {};
      setNotificationTypes(data.items || []);
    } catch (error) {
      console.error('Error fetching notification types:', error);
    }
  };

  const fetchPlaceholderProperties = async () => {
    try {
      const response = await DataService.get(API.notification.placeholderProperties);
      const data = response?.data ?? response ?? {};

      const grouped = Object.entries(data || {})
        .map(([entity, properties]) => {
          const values = Array.isArray(properties) ? properties : [];
          return {
            label: entity,
            options: values
              .map((property) => `${entity}_${property}`)
              .sort((a, b) => a.localeCompare(b))
              .map((value) => ({ label: value, value })),
          };
        })
        .filter((group) => group.options.length > 0);

      setPlaceholderOptions(grouped);
    } catch (error) {
      console.error('Error fetching notification placeholder properties:', error);
      setPlaceholderOptions([]);
    }
  };

  const fetchTemplates = async (page = 1, pageSize = 20, currentFilters = filters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('pageNumber', page);
      params.append('pageSize', pageSize);

      if (currentFilters.searchTerm) {
        params.append('searchTerm', currentFilters.searchTerm);
      }
      if (currentFilters.notificationTypeId) {
        params.append('notificationTypeId', currentFilters.notificationTypeId);
      }
      if (currentFilters.channel !== null) {
        params.append('channel', currentFilters.channel);
      }

      const response = await DataService.get(`${API.notificationTemplate.paginated}?${params.toString()}`);
      const data = response?.data?.data ?? response?.data ?? {};

      // Parse parameterMappings from JSON string to array
      const parsedTemplates = (data.items || []).map((template) => {
        let parsedMappings = [];
        if (template.parameterMappings) {
          try {
            parsedMappings = JSON.parse(template.parameterMappings);
            if (!Array.isArray(parsedMappings)) {
              parsedMappings = [];
            }
          } catch (e) {
            console.warn('Failed to parse parameterMappings for template:', template.id, e);
            parsedMappings = [];
          }
        }
        return {
          ...template,
          parameterMappings: parsedMappings,
        };
      });

      setTemplates(parsedTemplates);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.totalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      message.error('Failed to fetch notification templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationTypes();
    fetchPlaceholderProperties();
    fetchTemplates();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchTemplates(newPagination.current, newPagination.pageSize);
  };

  const handleFilterChange = () => {
    setPagination({ ...pagination, current: 1 });
    fetchTemplates(1, pagination.pageSize, filters);
  };

  const showModal = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      setSelectedChannel(template.channel);
      form.resetFields();
      form.setFieldsValue({
        notificationTypeId: template.notificationTypeId,
        channel: template.channel,
        targetAudience: template.targetAudience,
        languageCode: template.languageCode,
        templateCode: template.templateCode,
        name: template.name,
        subject: template.subject,
        body: template.body,
        description: template.description,
        isActive: template.isActive,
      });
      setParameterMappings(template.parameterMappings || []);
    } else {
      setSelectedChannel(2); // Default to App
      form.resetFields();
      form.setFieldsValue({ isActive: true, languageCode: 'en', channel: 2 });
      setParameterMappings([]);
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    setSelectedChannel(null);
    form.resetFields();
    setParameterMappings([]);
  };

  const handleModalOk = async () => {
    try {
      // Validate all fields except conditionally hidden ones
      const values = await form.validateFields();
      handleSave(values);
    } catch (errorInfo) {
      // Filter out validation errors for fields that should be hidden based on current channel
      const currentChannel = form.getFieldValue('channel');
      const filteredErrors = errorInfo.errorFields?.filter((field) => {
        const fieldName = field.name[0];

        // Allow body validation errors only for specific channels
        if (fieldName === 'body') {
          return (
            currentChannel === NotificationChannel.App ||
            currentChannel === NotificationChannel.Email ||
            currentChannel === NotificationChannel.AppAndEmail ||
            currentChannel === NotificationChannel.AppAndWhatsApp ||
            currentChannel === NotificationChannel.ALL
          );
        }

        // Allow subject validation errors only for email-related channels
        if (fieldName === 'subject') {
          return (
            currentChannel === NotificationChannel.Email ||
            currentChannel === NotificationChannel.AppAndEmail ||
            currentChannel === NotificationChannel.ALL
          );
        }

        return true; // Keep all other validation errors
      });

      if (filteredErrors && filteredErrors.length > 0) {
        console.error('Validation Failed:', filteredErrors);
      } else {
        // If no relevant validation errors, submit anyway
        const values = form.getFieldsValue();
        handleSave(values);
      }
    }
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const payload = {
        id: editingTemplate?.id || 0,
        notificationTypeId: values.notificationTypeId,
        channel: values.channel,
        targetAudience: values.targetAudience,
        languageCode: values.languageCode || null,
        templateCode: values.templateCode,
        name: values.name,
        subject: values.subject || null,
        body: values.body || null,
        description: values.description || null,
        isActive: values.isActive ?? true,
        parameterMappings: parameterMappings.length > 0 ? JSON.stringify(parameterMappings) : null,
      };

      if (editingTemplate) {
        await DataService.put(`${API.notificationTemplate.path}/${editingTemplate.id}`, payload);
        message.success('Notification template updated successfully');
      } else {
        await DataService.post(API.notificationTemplate.upsert, payload);
        message.success('Notification template created successfully');
      }

      handleCancel();
      fetchTemplates(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving notification template:', error);

      let errorMessage = 'Failed to save notification template';
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
      await DataService.delete(`${API.notificationTemplate.path}/${id}`);
      message.success('Notification template deleted successfully');
      fetchTemplates(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting notification template:', error);

      let errorMessage = 'Failed to delete notification template';
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

  const addParameterMapping = () => {
    setParameterMappings([...parameterMappings, { parameterName: '', placeholderValue: '', description: '' }]);
  };

  const removeParameterMapping = (index) => {
    const newMappings = [...parameterMappings];
    newMappings.splice(index, 1);
    setParameterMappings(newMappings);
  };

  const updateParameterMapping = (index, field, value) => {
    const newMappings = [...parameterMappings];
    newMappings[index][field] = value;
    setParameterMappings(newMappings);
  };

  const showTestModal = (template) => {
    setTestingTemplate(template);
    testForm.resetFields();

    if (template.parameterMappings && template.parameterMappings.length > 0) {
      const initialParams = template.parameterMappings.map((mapping) => ({
        key: mapping.placeholderValue || mapping.parameterName || '',
        value: '',
      }));
      setTestParameters(initialParams);
    } else {
      setTestParameters([
        { key: 'additionalProp1', value: '' },
        { key: 'additionalProp2', value: '' },
        { key: 'additionalProp3', value: '' },
      ]);
    }

    setTestModalVisible(true);
  };

  const handleTestCancel = () => {
    setTestModalVisible(false);
    setTestingTemplate(null);
    testForm.resetFields();
    setTestParameters([]);
  };

  const handleTestParameterChange = (index, field, value) => {
    const updatedParams = [...testParameters];
    updatedParams[index][field] = value;
    setTestParameters(updatedParams);
  };

  const addTestParameter = () => {
    setTestParameters([...testParameters, { key: '', value: '' }]);
  };

  const removeTestParameter = (index) => {
    const updatedParams = testParameters.filter((_, i) => i !== index);
    setTestParameters(updatedParams);
  };

  const handleTestMessage = async (values) => {
    try {
      setTesting(true);

      // Build placeholders object from test parameters
      const placeholders = {};
      testParameters.forEach((param) => {
        if (param.key && param.value) {
          placeholders[param.key] = param.value;
        }
      });

      const payload = {
        phoneNumber: values.phoneNumber || null,
        emailAddress: values.emailAddress || null,
        customerId: values.customerId ? Number(values.customerId) : null,
        bookingId: values.bookingId ? Number(values.bookingId) : null,
        scooterId: values.scooterId ? Number(values.scooterId) : null,
        catalogeId: values.catalogeId ? Number(values.catalogeId) : null,
        stationId: values.stationId ? Number(values.stationId) : null,
        placeholders: Object.keys(placeholders).length > 0 ? placeholders : null,
      };

      const templateCode = testingTemplate.templateCode;
      await DataService.post(`/NotificationTest/test-template-by-code/${templateCode}`, payload);

      message.success('Test message sent successfully!');
      handleTestCancel();
    } catch (error) {
      console.error('Error sending test message:', error);

      const responseData = error.response?.data;
      const normalizedError = {
        success: false,
        message: 'Failed to send test message. Please try again.',
        statusCode: error.response?.status || 500,
      };

      if (responseData && typeof responseData === 'object') {
        Object.assign(normalizedError, {
          success: responseData.success ?? false,
          message: responseData.message || normalizedError.message,
          templateCode: responseData.templateCode || testingTemplate?.templateCode || 'N/A',
          channel: responseData.channel || testingTemplate?.channel || 'N/A',
          recipient: responseData.recipient || 'N/A',
          errorMessage: responseData.errorMessage || responseData.error || 'N/A',
          externalMessageId: responseData.externalMessageId || 'N/A',
          notificationId: responseData.notificationId || 'N/A',
          sentAt: responseData.sentAt || 'N/A',
          statusCode: responseData.statusCode || error.response?.status || 500,
        });
      } else if (typeof error.response?.data === 'string') {
        normalizedError.message = error.response.data;
      } else if (error.message) {
        normalizedError.message = error.message;
      }

      setErrorDetails(normalizedError);
      setErrorModalVisible(true);
    } finally {
      setTesting(false);
    }
  };

  const closeErrorModal = () => {
    setErrorModalVisible(false);
    setErrorDetails(null);
  };

  const renderErrorDetails = () => {
    if (!errorDetails) return null;

    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <strong>Success:</strong> {errorDetails.success ? 'Yes' : 'No'}
          </Col>
          <Col span={12}>
            <strong>Status Code:</strong>{' '}
            <Tag style={notificationTemplateTagStyles.error}>{errorDetails.statusCode}</Tag>
          </Col>
          <Col span={12}>
            <strong>Template Code:</strong> {errorDetails.templateCode || 'N/A'}
          </Col>
          <Col span={12}>
            <strong>Channel:</strong> {errorDetails.channel || 'N/A'}
          </Col>
          <Col span={12}>
            <strong>Recipient:</strong> {errorDetails.recipient || 'N/A'}
          </Col>
          <Col span={12}>
            <strong>Notification ID:</strong> {errorDetails.notificationId || 'N/A'}
          </Col>
          <Col span={12}>
            <strong>External Message ID:</strong> {errorDetails.externalMessageId || 'N/A'}
          </Col>
          <Col span={12}>
            <strong>Sent At:</strong> {errorDetails.sentAt || 'N/A'}
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <strong>Message:</strong>
          <Paragraph
            style={{
              background: '#fff2e8',
              border: '1px solid #ffbb96',
              padding: 12,
              borderRadius: 4,
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {errorDetails.message}
          </Paragraph>
        </div>

        <div style={{ marginTop: 16 }}>
          <strong>Error:</strong>
          <Paragraph
            style={{
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              padding: 12,
              borderRadius: 4,
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            {errorDetails.errorMessage || 'No additional error details provided.'}
          </Paragraph>
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Template Code',
      dataIndex: 'templateCode',
      key: 'templateCode',
      width: 180,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Notification Type',
      dataIndex: 'notificationTypeEntity',
      key: 'notificationTypeEntity',
      width: 180,
      render: (entity) => <Tag style={notificationTemplateTagStyles.notificationType}>{entity?.name || 'N/A'}</Tag>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel) => (
        <Tag style={notificationTemplateTagStyles.channel}>{NotificationChannelLabels[channel]}</Tag>
      ),
    },
    {
      title: 'Target Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 140,
      render: (audience) => (
        <Tag style={notificationTemplateTagStyles.targetAudience}>{TargetAudienceLabels[audience]}</Tag>
      ),
    },
    {
      title: 'Language',
      dataIndex: 'languageCode',
      key: 'languageCode',
      width: 100,
      render: (lang) => <Tag style={notificationTemplateTagStyles.language}>{lang?.toUpperCase() || 'N/A'}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Tag style={isActive ? notificationTemplateTagStyles.active : notificationTemplateTagStyles.inactive}>
          {isActive ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            label: (
              <span>
                <FeatherIcon icon="edit" size={14} style={{ marginRight: 8 }} />
                Edit
              </span>
            ),
            onClick: () => showModal(record),
          },
          {
            key: 'test',
            label: (
              <span>
                <FeatherIcon icon="send" size={14} style={{ marginRight: 8 }} />
                Test Message
              </span>
            ),
            onClick: () => showTestModal(record),
          },
          {
            key: 'delete',
            label: (
              <span style={{ color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} style={{ marginRight: 8 }} />
                Delete
              </span>
            ),
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: 'Delete template',
                content: 'Are you sure you want to delete this notification template?',
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => handleDelete(record.id),
              });
            },
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="primary" size="small">
              Actions <FeatherIcon icon="chevron-down" size={14} style={{ marginLeft: 4 }} />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Notification Templates"
        subTitle="Manage email and app notification templates"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
          <Button key="refresh" onClick={() => fetchTemplates(pagination.current, pagination.pageSize)}>
            <FeatherIcon icon="refresh-cw" size={14} /> Refresh
          </Button>,
          <Button key="add" type="primary" onClick={() => showModal()}>
            <FeatherIcon icon="plus" size={14} /> Add Template
          </Button>,
        ]}
      />
      <Main>
        {/* Filters */}
        <Cards headless>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search templates"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                onPressEnter={handleFilterChange}
                prefix={<FeatherIcon icon="search" size={14} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by type"
                value={filters.notificationTypeId}
                onChange={(value) => setFilters({ ...filters, notificationTypeId: value })}
                allowClear
              >
                {notificationTypes.map((type) => (
                  <Option key={type.id} value={type.id}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by channel"
                value={filters.channel}
                onChange={(value) => setFilters({ ...filters, channel: value })}
                allowClear
              >
                {getNotificationChannelOptions().map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
            dataSource={templates}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} templates`,
            }}
            onChange={handleTableChange}
          />
        </Cards>
      </Main>

      {/* Create/Edit Modal */}
      <Modal
        title={editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={handleModalOk}
        confirmLoading={saving}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="notificationTypeId"
                label="Notification Type"
                rules={[{ required: true, message: 'Please select notification type' }]}
              >
                <Select placeholder="Select notification type">
                  {notificationTypes.map((type) => (
                    <Option key={type.id} value={type.id}>
                      {type.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="Channel" rules={[{ required: true, message: 'Please select channel' }]}>
                <Select
                  placeholder="Select channel"
                  onChange={(value) => {
                    setSelectedChannel(value);
                    // Clear conditional fields and their validation when channel changes
                    form.resetFields(['subject', 'body']);
                  }}
                >
                  {getNotificationChannelOptions().map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetAudience"
                label="Target Audience"
                rules={[{ required: true, message: 'Please select target audience' }]}
              >
                <Select placeholder="Select target audience">
                  {getTargetAudienceOptions().map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="languageCode"
                label="Language Code"
                rules={[{ max: 10, message: 'Maximum 10 characters' }]}
              >
                <Input placeholder="e.g., en, en_US" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="templateCode"
                label="Template Code"
                rules={[
                  { required: true, message: 'Please enter template code' },
                  { max: 100, message: 'Maximum 100 characters' },
                ]}
              >
                <Input placeholder="e.g., BOOKING_CONFIRMATION" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Display Name"
                rules={[
                  { required: true, message: 'Please enter display name' },
                  { max: 200, message: 'Maximum 200 characters' },
                ]}
              >
                <Input placeholder="Friendly name" />
              </Form.Item>
            </Col>
          </Row>

          {/* Conditional Fields Based on Channel */}
          {/* Email Channel: Show Subject (required) and Body (required) */}
          {(selectedChannel === NotificationChannel.Email ||
            selectedChannel === NotificationChannel.AppAndEmail ||
            selectedChannel === NotificationChannel.ALL) && (
            <Form.Item
              name="subject"
              label="Subject"
              preserve={false}
              rules={[
                {
                  validator: (_, value) => {
                    const currentChannel = form.getFieldValue('channel');
                    // Only require subject for Email, AppAndEmail, and ALL channels
                    if (
                      currentChannel === NotificationChannel.Email ||
                      currentChannel === NotificationChannel.AppAndEmail ||
                      currentChannel === NotificationChannel.ALL
                    ) {
                      if (!value || value.trim() === '') {
                        return Promise.reject(new Error('Subject is required for email channel'));
                      }
                      if (value.length > 500) {
                        return Promise.reject(new Error('Maximum 500 characters'));
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Email subject" />
            </Form.Item>
          )}

          {/* App or Email: Show Body (required) */}
          {(selectedChannel === NotificationChannel.App ||
            selectedChannel === NotificationChannel.Email ||
            selectedChannel === NotificationChannel.AppAndEmail ||
            selectedChannel === NotificationChannel.AppAndWhatsApp ||
            selectedChannel === NotificationChannel.ALL) && (
            <Form.Item name="body" label="Body" preserve={false}>
              <TextArea rows={5} placeholder="Template body/content" />
            </Form.Item>
          )}

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description" maxLength={1000} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Parameter Mappings</span>
                <Button size="small" type="dashed" onClick={addParameterMapping}>
                  <FeatherIcon icon="plus" size={14} /> Add Parameter
                </Button>
              </div>
            }
            size="small"
            style={{ marginTop: 16 }}
          >
            {parameterMappings.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 16 }}>
                No parameter mappings defined. Click "Add Parameter" to add one.
              </p>
            ) : (
              parameterMappings.map((mapping, index) => (
                <Card
                  key={index}
                  size="small"
                  type="inner"
                  style={{ marginBottom: 8 }}
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<FeatherIcon icon="trash-2" size={14} />}
                      onClick={() => removeParameterMapping(index)}
                    />
                  }
                >
                  <Row gutter={8}>
                    <Col span={8}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Parameter Name</div>
                      <Input
                        value={mapping.parameterName}
                        onChange={(e) => updateParameterMapping(index, 'parameterName', e.target.value)}
                        placeholder="e.g., {{customerName}}"
                        size="small"
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Placeholder Value</div>
                      <Select
                        value={mapping.placeholderValue || undefined}
                        showSearch
                        allowClear
                        size="small"
                        placeholder="e.g., Booking_NextPaymentAmount"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(value) => updateParameterMapping(index, 'placeholderValue', value)}
                        options={placeholderOptions}
                        notFoundContent={'No matching placeholder found'}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Description</div>
                      <Input
                        value={mapping.description}
                        onChange={(e) => updateParameterMapping(index, 'description', e.target.value)}
                        placeholder="Description"
                        size="small"
                      />
                    </Col>
                  </Row>
                </Card>
              ))
            )}
          </Card>
        </Form>
      </Modal>

      {/* Test Message Modal */}
      <Modal
        title={
          <div>
            <FeatherIcon icon="send" size={18} style={{ marginRight: 8 }} />
            Test Message - {testingTemplate?.name}
          </div>
        }
        open={testModalVisible}
        onCancel={handleTestCancel}
        onOk={() => testForm.submit()}
        confirmLoading={testing}
        width={600}
      >
        {testingTemplate && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 4 }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <strong>Template:</strong> {testingTemplate.templateCode}
              </Col>
              <Col span={12}>
                <strong>Channel:</strong>{' '}
                <Tag style={notificationTemplateTagStyles.channel}>
                  {NotificationChannelLabels[testingTemplate.channel]}
                </Tag>
              </Col>
            </Row>
          </div>
        )}

        <Form form={testForm} layout="vertical" onFinish={handleTestMessage}>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: 'Phone number is required' }]}
          >
            <Input placeholder="e.g., 919902844772" />
          </Form.Item>

          <Form.Item name="emailAddress" label="Email Address">
            <Input placeholder="e.g., test@example.com" type="email" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerId" label="Customer ID">
                <Input placeholder="Optional" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bookingId" label="Booking ID">
                <Input placeholder="Optional" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="scooterId" label="Scooter ID">
                <Input placeholder="Optional" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="catalogeId" label="Catalogue ID">
                <Input placeholder="Optional" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stationId" label="Station ID">
                <Input placeholder="Optional" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Placeholders
              <Button size="small" type="link" onClick={addTestParameter}>
                + Add
              </Button>
            </label>
            {testParameters.map((param, index) => (
              <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Input
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => handleTestParameterChange(index, 'key', e.target.value)}
                  style={{ width: 150 }}
                />
                <Input
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => handleTestParameterChange(index, 'value', e.target.value)}
                  style={{ width: 200 }}
                />
                {testParameters.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<FeatherIcon icon="x" size={14} />}
                    onClick={() => removeTestParameter(index)}
                  />
                )}
              </Space>
            ))}
          </div>
        </Form>
      </Modal>

      {/* Error Details Modal */}
      <Modal
        title={
          <div style={{ color: '#ff4d4f' }}>
            <FeatherIcon icon="alert-circle" size={18} style={{ marginRight: 8 }} />
            Test Message Error
          </div>
        }
        open={errorModalVisible}
        onCancel={closeErrorModal}
        footer={[
          <Button key="close" type="primary" onClick={closeErrorModal}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {renderErrorDetails()}
      </Modal>
    </>
  );
}

export default NotificationTemplatesManagement;
