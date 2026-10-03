import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Dropdown, Form, Input, Modal, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import { getItem } from '../../utility/localStorageControl';

const { TextArea } = Input;

const documentTypeOptions = [
  { label: 'Aadhar', value: 1 },
  { label: 'Driving Licence', value: 2 },
  { label: 'Vehicle Registration', value: 3 },
  { label: 'Pollution Certificate', value: 4 },
  { label: 'Insurance', value: 5 },
  { label: 'Battery Warranty Card', value: 6 },
  { label: 'Ownership Transfer Certificate', value: 7 },
  { label: 'Non Objection Certificate', value: 8 },
  { label: 'Others', value: 99 },
];

const getDocumentTypeLabel = (value) => documentTypeOptions.find((x) => x.value === Number(value))?.label || 'N/A';

const templateTagStyles = {
  documentType: {
    backgroundColor: '#0958d9',
    borderColor: '#0958d9',
    color: '#ffffff',
    fontWeight: 600,
  },
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

function DocumentTemplatesManagement() {
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [placeholderOptions, setPlaceholderOptions] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState('');
  const [generatedPreviewLoading, setGeneratedPreviewLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'SCOOTR MOBILITY PRIVATE LIMITED',
    companyLogo: '',
    authorisedSignatory: '',
    address: 'No. 123, 1st Floor, 5th Main, 2nd Cross,',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560093',
    gstNumber: '29ABCDE1234F1Z5',
    email: 'support@scootr.in',
    phoneNumber: '+91 98765 43210',
    website: 'www.scootr.in',
    supportEmail: 'support@scootr.in',
    supportPhoneNumber: '+91 98765 43210',
    supportWhatsAppNumber: '+91 98765 43210',
    businessHoursStart: '09:00',
    businessHoursEnd: '20:00',
  });

  const [mappingParameters, setMappingParameters] = useState([]);

  const [filters, setFilters] = useState({
    searchTerm: '',
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchPlaceholderProperties = async () => {
    try {
      const response = await DataService.get(API.documentTemplate.placeholderProperties);
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
      console.error('Error fetching placeholder properties:', error);
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

      const response = await DataService.get(`${API.documentTemplate.paginated}?${params.toString()}`);
      const data = response?.data?.data ?? response?.data ?? {};

      setTemplates(data.items || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.totalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching document templates:', error);
      message.error('Failed to fetch document templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await DataService.get(API.company.settingsGet);
      const data = response?.data?.data ?? response?.data ?? {};
      setCompanySettings({
        companyName: data.companyName || 'SCOOTR MOBILITY PRIVATE LIMITED',
        companyLogo: data.companyLogo || '',
        authorisedSignatory: data.authorisedSignatory || data.AuthorisedSignatory || '',
        address: data.address || 'No. 123, 1st Floor, 5th Main, 2nd Cross,',
        city: data.city || 'Bengaluru',
        state: data.state || 'Karnataka',
        country: data.country || 'India',
        pincode: data.pincode || '560093',
        gstNumber: data.gstNumber || data.GSTNumber || '29ABCDE1234F1Z5',
        email: data.email || 'support@scootr.in',
        phoneNumber: data.phoneNumber || '+91 98765 43210',
        website: data.website || 'www.scootr.in',
        supportEmail: data.supportEmail || 'support@scootr.in',
        supportPhoneNumber: data.supportPhoneNumber || '+91 98765 43210',
        supportWhatsAppNumber: data.supportWhatsAppNumber || '+91 98765 43210',
        businessHoursStart: data.businessHoursStart || '09:00',
        businessHoursEnd: data.businessHoursEnd || '20:00',
      });
    } catch (error) {
      console.error('Error fetching company settings for letterhead:', error);
    }
  };

  useEffect(() => {
    fetchPlaceholderProperties();
    fetchTemplates();
    fetchCompanySettings();
  }, []);

  const handleFilterApply = () => {
    const next = { ...pagination, current: 1 };
    setPagination(next);
    fetchTemplates(1, next.pageSize, filters);
  };

  const handleTableChange = (nextPagination) => {
    fetchTemplates(nextPagination.current, nextPagination.pageSize, filters);
  };

  const showCreateEditModal = (template = null) => {
    setEditingTemplate(template);

    if (template) {
      form.setFieldsValue({
        displayName: template.displayName,
        description: template.description,
        templateCode: template.templateCode,
        subject: template.subject,
        body: template.body,
        documentType: template.documentType,
        active: template.active,
      });
      setMappingParameters(template.mappingParameters || []);
    } else {
      form.resetFields();
      form.setFieldsValue({ active: true });
      setMappingParameters([]);
    }

    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    setMappingParameters([]);
    form.resetFields();
  };

  const addMappingParameter = () => {
    setMappingParameters((prev) => [...prev, { parameterName: '', placeHolder: '', description: '' }]);
  };

  const removeMappingParameter = (index) => {
    setMappingParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMappingParameter = (index, field, value) => {
    setMappingParameters((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const saveTemplate = async (values) => {
    try {
      setSaving(true);

      const payload = {
        displayName: values.displayName,
        description: values.description || null,
        templateCode: values.templateCode,
        subject: values.subject || null,
        body: values.body || null,
        documentType: values.documentType ?? null,
        active: values.active ?? true,
        mappingParameters: mappingParameters
          .filter((p) => p.parameterName && p.placeHolder)
          .map((p) => ({
            id: p.id || 0,
            parameterName: p.parameterName,
            placeHolder: p.placeHolder,
            description: p.description || null,
          })),
      };

      if (editingTemplate) {
        await DataService.put(`${API.documentTemplate.path}/${editingTemplate.id}`, payload);
        message.success('Document template updated successfully');
      } else {
        await DataService.post(API.documentTemplate.path, payload);
        message.success('Document template created successfully');
      }

      handleModalCancel();
      fetchTemplates(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      console.error('Error saving document template:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to save document template';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await DataService.delete(`${API.documentTemplate.path}/${id}`);
      message.success('Document template deleted successfully');
      fetchTemplates(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      console.error('Error deleting document template:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete document template';
      message.error(msg);
    }
  };

  const openPreviewModal = (template) => {
    setPreviewTemplate(template);
    previewForm.resetFields();

    const mapped = (template.mappingParameters || []).reduce((acc, item) => {
      acc[item.parameterName] = '';
      return acc;
    }, {});

    previewForm.setFieldsValue({
      bookingId: undefined,
      customerId: undefined,
      vehicleId: undefined,
      parameterValues: mapped,
    });

    setPreviewVisible(true);
  };

  const closePreviewModal = () => {
    if (generatedPreviewUrl) {
      window.URL.revokeObjectURL(generatedPreviewUrl);
    }

    setPreviewVisible(false);
    setPreviewTemplate(null);
    setGeneratedPreviewUrl('');
    previewForm.resetFields();
  };

  const getApiUrl = () => {
    const value = window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || '';
    return value.endsWith('/') ? value.slice(0, -1) : value;
  };

  const getBearerHeader = () => {
    const token = getItem('access_token') || getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const previewGeneratedTemplate = async (values) => {
    if (!previewTemplate?.templateCode) {
      message.error('Template code is missing for generated preview');
      return;
    }

    const bookingId = values?.bookingId ? Number(values.bookingId) : 0;
    if (!bookingId) {
      message.error('Booking ID is required for generated template preview');
      return;
    }

    try {
      setGeneratedPreviewLoading(true);

      const parameterValues = {};
      const formMap = values?.parameterValues || {};
      Object.entries(formMap).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim() !== '') {
          parameterValues[key] = val;
        }
      });

      const payload = {
        bookingId,
        templateCode: previewTemplate.templateCode,
        customerId: values?.customerId ? Number(values.customerId) : null,
        vehicleId: values?.vehicleId ? Number(values.vehicleId) : null,
        parameterValues,
      };

      const apiUrl = getApiUrl();
      const downloadResponse = await axios.post(`${apiUrl}${API.documentTemplate.previewBookingDocumentPdf}`, payload, {
        headers: getBearerHeader(),
        responseType: 'blob',
      });

      const sourceBlob =
        downloadResponse.data instanceof Blob ? downloadResponse.data : new Blob([downloadResponse.data]);
      const pdfBytes = await sourceBlob.arrayBuffer();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      if (generatedPreviewUrl) {
        window.URL.revokeObjectURL(generatedPreviewUrl);
      }

      setGeneratedPreviewUrl(blobUrl);
      message.success('Generated PDF preview is ready');
    } catch (error) {
      console.error('Error generating template preview PDF:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to generate PDF preview';
      message.error(msg);
    } finally {
      setGeneratedPreviewLoading(false);
    }
  };

  const getCompanyLogoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const apiBase = (window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || '')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;

    return apiBase ? `${apiBase}${normalizedPath}` : normalizedPath;
  };

  const getTodayDate = () =>
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getLetterheadAddress = () => {
    const parts = [
      companySettings.address,
      `${companySettings.city || ''}${companySettings.city && companySettings.state ? ', ' : ''}${companySettings.state || ''}`,
      `${companySettings.country || 'India'}${companySettings.pincode ? ' - ' + companySettings.pincode : ''}`,
    ].filter(Boolean);

    return parts.join(', ');
  };

  const getCompanyBranding = () => {
    const companyName = companySettings.companyName || 'SCOOTR MOBILITY PRIVATE LIMITED';
    const gstNo = companySettings.gstNumber || '29ABCDE1234F1Z5';
    const logoUrl = getCompanyLogoUrl(companySettings.companyLogo);

    return {
      companyName,
      gstNo,
      logoUrl,
      address: getLetterheadAddress(),
      website: companySettings.website || 'www.scootr.in',
      email: companySettings.supportEmail || companySettings.email || 'support@scootr.in',
      phone: companySettings.supportPhoneNumber || companySettings.phoneNumber || '+91 98765 43210',
      hours: `${companySettings.businessHoursStart || '09:00'} - ${companySettings.businessHoursEnd || '20:00'}`,
    };
  };

  const getInlinePdfViewUrl = (url) => {
    if (!url) return '';
    // Hide built-in browser PDF controls where supported.
    return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  };

  const columns = useMemo(
    () => [
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
        title: 'Display Name',
        dataIndex: 'displayName',
        key: 'displayName',
        width: 220,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },
      {
        title: 'Document Type',
        dataIndex: 'documentType',
        key: 'documentType',
        width: 210,
        render: (value) => <Tag style={templateTagStyles.documentType}>{getDocumentTypeLabel(value)}</Tag>,
      },
      {
        title: 'Active',
        dataIndex: 'active',
        key: 'active',
        width: 110,
        render: (active) => (
          <Tag style={active ? templateTagStyles.active : templateTagStyles.inactive}>{active ? 'Yes' : 'No'}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
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
              onClick: () => showCreateEditModal(record),
            },
            {
              key: 'preview',
              label: (
                <span>
                  <FeatherIcon icon="eye" size={14} style={{ marginRight: 8 }} />
                  Preview Document
                </span>
              ),
              onClick: () => openPreviewModal(record),
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
                  content: 'Are you sure you want to delete this document template?',
                  okText: 'Yes',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => deleteTemplate(record.id),
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
    ],
    [pagination],
  );

  return (
    <>
      <PageHeader
        ghost
        title="Document Templates"
        subTitle="Manage printable document letter templates"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
          <Button key="refresh" onClick={() => fetchTemplates(pagination.current, pagination.pageSize, filters)}>
            <FeatherIcon icon="refresh-cw" size={14} /> Refresh
          </Button>,
          <Button key="add" type="primary" onClick={() => showCreateEditModal()}>
            <FeatherIcon icon="plus" size={14} /> Add Template
          </Button>,
        ]}
      />

      <Main>
        <Cards headless>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={18} md={8}>
              <Input
                placeholder="Search by code, name, description"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                onPressEnter={handleFilterApply}
                prefix={<FeatherIcon icon="search" size={14} />}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Button type="primary" onClick={handleFilterApply} block>
                <FeatherIcon icon="filter" size={14} /> Apply
              </Button>
            </Col>
          </Row>
        </Cards>

        <Cards headless>
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} templates`,
            }}
            onChange={handleTableChange}
          />
        </Cards>
      </Main>

      <Modal
        title={editingTemplate ? 'Edit Document Template' : 'Create Document Template'}
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={980}
      >
        <Form form={form} layout="vertical" onFinish={saveTemplate}>
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
                <Input placeholder="e.g., OWNERSHIP_TRANSFER_LETTER" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="Display Name"
                rules={[
                  { required: true, message: 'Please enter display name' },
                  { max: 200, message: 'Maximum 200 characters' },
                ]}
              >
                <Input placeholder="Friendly template name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subject" label="Subject" rules={[{ max: 500, message: 'Maximum 500 characters' }]}>
            <Input placeholder="Letter subject (supports placeholders like {{1}})" />
          </Form.Item>

          <Form.Item name="documentType" label="Document Type">
            <Select allowClear placeholder="Optional: link template to a document type" options={documentTypeOptions} />
          </Form.Item>

          <Form.Item name="body" label="Body">
            <TextArea rows={8} placeholder="Letter body (supports placeholders like {{1}}, {{2}})" />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ max: 1000, message: 'Maximum 1000 characters' }]}>
            <TextArea rows={3} placeholder="Brief description" />
          </Form.Item>

          <Form.Item name="active" label="Active" valuePropName="checked" initialValue>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mapping Parameters</span>
                <Button size="small" type="dashed" onClick={addMappingParameter}>
                  <FeatherIcon icon="plus" size={14} /> Add Parameter
                </Button>
              </div>
            }
            size="small"
          >
            {mappingParameters.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 16 }}>
                No mapping parameter defined. Click "Add Parameter" to add one.
              </p>
            ) : (
              mappingParameters.map((mapping, index) => (
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
                      onClick={() => removeMappingParameter(index)}
                    />
                  }
                >
                  <Row gutter={8}>
                    <Col span={6}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Parameter Name</div>
                      <Input
                        value={mapping.parameterName}
                        onChange={(e) => updateMappingParameter(index, 'parameterName', e.target.value)}
                        placeholder="e.g., {{1}}"
                        size="small"
                      />
                    </Col>
                    <Col span={10}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>PlaceHolder</div>
                      <Select
                        value={mapping.placeHolder || undefined}
                        showSearch
                        allowClear
                        size="small"
                        placeholder="e.g., Booking_BookingNo"
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(value) => updateMappingParameter(index, 'placeHolder', value)}
                        options={placeholderOptions}
                        notFoundContent="No placeholder found"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Description</div>
                      <Input
                        value={mapping.description}
                        onChange={(e) => updateMappingParameter(index, 'description', e.target.value)}
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

      <Modal
        title={`Preview Template${previewTemplate ? ` - ${previewTemplate.displayName}` : ''}`}
        open={previewVisible}
        onCancel={closePreviewModal}
        width={1200}
        footer={[
          <Button key="cancel" onClick={closePreviewModal}>
            Close
          </Button>,
          <Button
            key="previewPdf"
            type="primary"
            loading={generatedPreviewLoading}
            onClick={async () => {
              try {
                const values = await previewForm.validateFields();
                await previewGeneratedTemplate(values);
              } catch {
                // Form validation errors are shown by Ant Form.
              }
            }}
          >
            <FeatherIcon icon="file-text" size={14} /> Preview Generated PDF
          </Button>,
        ]}
      >
        <Row gutter={20}>
          <Col xs={24} lg={10}>
            <Form form={previewForm} layout="vertical">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="bookingId" label="Booking ID">
                    <Input type="number" placeholder="Optional" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="customerId" label="Customer ID">
                    <Input type="number" placeholder="Optional" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="vehicleId" label="Vehicle ID">
                    <Input type="number" placeholder="Optional" />
                  </Form.Item>
                </Col>
              </Row>

              <Card size="small" title="Parameter Values" style={{ maxHeight: 440, overflow: 'auto' }}>
                {(previewTemplate?.mappingParameters || []).length === 0 ? (
                  <div style={{ color: '#777' }}>No mapping parameters in this template.</div>
                ) : (
                  (previewTemplate?.mappingParameters || []).map((mapping) => (
                    <Form.Item
                      key={mapping.id || mapping.parameterName}
                      name={['parameterValues', mapping.parameterName]}
                      label={`${mapping.parameterName} (${mapping.placeHolder})`}
                    >
                      <Input placeholder={mapping.description || 'Enter value'} />
                    </Form.Item>
                  ))
                )}
              </Card>
            </Form>
          </Col>

          <Col xs={24} lg={14}>
            <div
              style={{
                background: '#f5f5f5',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: 12,
                minHeight: 700,
              }}
            >
              {generatedPreviewUrl ? (
                <embed
                  title="Generated template preview"
                  src={getInlinePdfViewUrl(generatedPreviewUrl)}
                  type="application/pdf"
                  style={{ width: '100%', minHeight: 680, border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 680,
                    color: '#777',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #e8e8e8',
                  }}
                >
                  Enter the required values and click “Preview Generated PDF”.
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal>
    </>
  );
}

export default DocumentTemplatesManagement;
