import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  message,
  Spin,
} from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';

const forecastStatusTagStyles = {
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

const formatNullableValue = (value, unitLabel) => {
  if (value === null || value === undefined) {
    return 'No upper limit';
  }

  return unitLabel ? `${value} ${unitLabel}` : value;
};

function ForecastSettingsTable({
  title,
  subTitle,
  cardTitle,
  infoText,
  endpoint,
  valueField,
  valueLabel,
  rangeStartField,
  rangeStartLabel,
  rangeEndField,
  rangeEndLabel,
  rangeUnit,
  nameOptions,
  buildUpdatePayload,
}) {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const optionOrder = nameOptions?.reduce((accumulator, option, index) => {
    accumulator[option.value] = index;
    return accumulator;
  }, {});

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await DataService.get(endpoint);
      const nextItems = Array.isArray(response.data) ? response.data : [];

      if (optionOrder) {
        nextItems.sort((left, right) => {
          const leftOrder = optionOrder[left.name] ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = optionOrder[right.name] ?? Number.MAX_SAFE_INTEGER;

          if (leftOrder === rightOrder) {
            return (left.id || 0) - (right.id || 0);
          }

          return leftOrder - rightOrder;
        });
      }

      setItems(nextItems);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
      message.error(`Failed to fetch ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      [valueField]: record[valueField],
      [rangeStartField]: rangeStartField ? record[rangeStartField] : undefined,
      [rangeEndField]: rangeEndField ? record[rangeEndField] : undefined,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const closeEditModal = () => {
    form.resetFields();
    setEditingRecord(null);
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const defaultPayload = {
        name: values.name?.trim(),
        [valueField]: values[valueField],
        isActive: values.isActive ?? true,
      };

      if (rangeStartField) {
        defaultPayload[rangeStartField] = values[rangeStartField];
      }

      if (rangeEndField) {
        defaultPayload[rangeEndField] = values[rangeEndField] ?? null;
      }

      const payload = buildUpdatePayload
        ? buildUpdatePayload({ values, record: editingRecord, defaultPayload })
        : defaultPayload;

      await DataService.put(`${endpoint}/${editingRecord.id}`, payload);
      message.success(`${editingRecord.name} updated successfully`);
      closeEditModal();
      fetchData();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      console.error(`Error updating ${title}:`, error);
      message.error(error.response?.data?.message || `Failed to update ${title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  if (rangeStartField) {
    columns.push({
      title: rangeStartLabel,
      dataIndex: rangeStartField,
      key: rangeStartField,
      render: (value) => formatNullableValue(value, rangeUnit),
    });
  }

  if (rangeEndField) {
    columns.push({
      title: rangeEndLabel,
      dataIndex: rangeEndField,
      key: rangeEndField,
      render: (value) => formatNullableValue(value, rangeUnit),
    });
  }

  columns.push(
    {
      title: valueLabel,
      dataIndex: valueField,
      key: valueField,
      render: (value) => `${value}%`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag style={isActive ? forecastStatusTagStyles.active : forecastStatusTagStyles.inactive}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => openEditModal(record)}>
          Edit
        </Button>
      ),
    },
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={`Loading ${title.toLowerCase()}...`} />
      </div>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title={title}
          subTitle={subTitle}
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>{infoText}</span>
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="sliders" size={20} />
                    {cardTitle}
                  </div>
                }
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={items}
                  pagination={false}
                  locale={{ emptyText: 'No configuration found' }}
                />
              </Card>
            </Cards>
          </Col>
        </Row>

        <Modal
          title={editingRecord ? `Update ${editingRecord.name}` : 'Update Configuration'}
          open={modalOpen}
          onCancel={closeEditModal}
          onOk={handleSave}
          confirmLoading={saving}
          okText="Update"
          destroyOnClose
        >
          <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
              {nameOptions ? (
                <Select placeholder="Select name" options={nameOptions} />
              ) : (
                <Input placeholder="Enter name" />
              )}
            </Form.Item>

            {rangeStartField ? (
              <Form.Item
                name={rangeStartField}
                label={rangeStartLabel}
                rules={[
                  { required: true, message: `Please enter ${rangeStartLabel.toLowerCase()}` },
                  { type: 'number', min: 0, message: 'Value must be 0 or greater' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder={`Enter ${rangeStartLabel.toLowerCase()}`} />
              </Form.Item>
            ) : null}

            {rangeEndField ? (
              <Form.Item
                name={rangeEndField}
                label={rangeEndLabel}
                rules={[{ type: 'number', min: 0, message: 'Value must be 0 or greater' }]}
                extra="Leave empty for an open-ended range"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder={`Enter ${rangeEndLabel.toLowerCase()}`} />
              </Form.Item>
            ) : null}

            <Form.Item
              name={valueField}
              label={valueLabel}
              rules={[
                { required: true, message: `Please enter ${valueLabel.toLowerCase()}` },
                { type: 'number', min: 0, max: 100, message: 'Value must be between 0 and 100' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="Enter percentage" />
            </Form.Item>

            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Form>
        </Modal>
      </Main>
    </>
  );
}

export default ForecastSettingsTable;
