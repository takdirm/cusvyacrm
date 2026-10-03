import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Table, Button, Input, Select, Tag, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import moment from 'moment';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api';
import { NotificationChannelLabels, getNotificationChannelOptions } from '../../config/enum/notificationEnums';

const { Option } = Select;

function NotificationLogs() {
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    channel: null,
    notificationTemplateId: null,
    searchTerm: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchTemplates = async () => {
    try {
      const response = await DataService.get(`${API.notification.path}/templates`);
      const data = response?.data?.data ?? response?.data ?? [];
      setTemplates(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Error fetching notification templates for logs filter:', error);
      setTemplates([]);
    }
  };

  const fetchLogs = async (page = 1, pageSize = 20, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('pageNumber', String(page));
      params.append('pageSize', String(pageSize));

      if (currentFilters.channel != null) {
        params.append('channel', String(currentFilters.channel));
      }
      if (currentFilters.notificationTemplateId != null) {
        params.append('notificationTemplateId', String(currentFilters.notificationTemplateId));
      }
      if (currentFilters.searchTerm && currentFilters.searchTerm.trim()) {
        params.append('searchTerm', currentFilters.searchTerm.trim());
      }

      const response = await DataService.get(`${API.notification.path}/paginated?${params.toString()}`);
      const data = response?.data?.data ?? response?.data ?? {};
      const items = data.items || [];

      setLogs(items);
      setPagination({
        current: data.page > 0 ? data.page : page,
        pageSize: data.pageSize || pageSize,
        total: data.totalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      message.error(error.response?.data?.message || 'Failed to load notification logs');
      setLogs([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchLogs(1, 20, filters);
  }, []);

  const handleApplyFilters = () => {
    fetchLogs(1, pagination.pageSize, filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      channel: null,
      notificationTemplateId: null,
      searchTerm: '',
    };
    setFilters(resetFilters);
    fetchLogs(1, pagination.pageSize, resetFilters);
  };

  const templateLookup = useMemo(() => {
    const lookup = new Map();
    templates.forEach((template) => {
      lookup.set(template.id, template.name || template.templateCode || `Template #${template.id}`);
    });
    return lookup;
  }, [templates]);

  const getCustomerFullName = (record) => {
    if (record.customerName && String(record.customerName).trim()) {
      return record.customerName;
    }

    const firstName = record.customerFirstName || record.firstName || '';
    const lastName = record.customerLastName || record.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || '-';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Template',
      key: 'template',
      width: 220,
      render: (_, record) => {
        const templateName =
          templateLookup.get(record.notificationTemplateId) || `Template #${record.notificationTemplateId || '-'}`;
        return (
          <div style={{ display: 'grid', gap: 4 }}>
            <span>{templateName}</span>
            <span style={{ color: '#888' }}>ID: {record.notificationTemplateId ?? '-'}</span>
          </div>
        );
      },
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 140,
      render: (channel) => <Tag color="purple">{NotificationChannelLabels[channel] || channel || '-'}</Tag>,
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 220,
      render: (_, record) => getCustomerFullName(record),
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 220,
      render: (value) => value || '-',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      width: 220,
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: 'Sent',
      dataIndex: 'isSent',
      key: 'isSent',
      width: 90,
      align: 'center',
      render: (value) => (value ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>),
    },
    {
      title: 'Read',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 90,
      align: 'center',
      render: (value) => (value ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      width: 320,
      ellipsis: true,
      render: (value) => value || '-',
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Notification Logs"
        buttons={[
          <Button key="refresh" onClick={() => fetchLogs(pagination.current, pagination.pageSize, filters)}>
            <FeatherIcon icon="refresh-cw" size={14} /> Refresh
          </Button>,
        ]}
      />
      <Main>
        <Cards headless>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Search logs"
                value={filters.searchTerm}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                onPressEnter={handleApplyFilters}
                prefix={<FeatherIcon icon="search" size={14} />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by template"
                value={filters.notificationTemplateId}
                onChange={(value) => setFilters((prev) => ({ ...prev, notificationTemplateId: value }))}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                allowClear
              >
                {templates.map((template) => (
                  <Option key={template.id} value={template.id}>
                    {template.name || template.templateCode || `Template #${template.id}`}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by channel"
                value={filters.channel}
                onChange={(value) => setFilters((prev) => ({ ...prev, channel: value }))}
                allowClear
              >
                {getNotificationChannelOptions().map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={3}>
              <Button type="primary" onClick={handleApplyFilters} block>
                <FeatherIcon icon="filter" size={14} /> Apply
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8} lg={3}>
              <Button onClick={handleResetFilters} block>
                <FeatherIcon icon="rotate-ccw" size={14} /> Reset
              </Button>
            </Col>
          </Row>
        </Cards>

        <Cards headless>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1800 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Total ${total} logs`,
            }}
            onChange={(pager) => {
              fetchLogs(pager.current, pager.pageSize, filters);
            }}
          />
        </Cards>
      </Main>
    </>
  );
}

export default NotificationLogs;
