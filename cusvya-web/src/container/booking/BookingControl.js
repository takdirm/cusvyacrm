import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, DatePicker, Form, Input, Modal, Select, Space, Switch, Table, Tag, message } from 'antd';
import moment from 'moment';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { API } from '../../config/api';
import { DataService } from '../../config/dataService/dataService';
import { VehicleCategory, VehicleCategoryOptions } from '../../config/enum/enum';
import { BookingControlStatus, BookingType } from './bookingEnums';

const bookingTagStyles = {
  [BookingControlStatus[0]]: {
    backgroundColor: '#389e0d',
    borderColor: '#389e0d',
    color: '#ffffff',
    fontWeight: 600,
  },
  [BookingControlStatus[1]]: {
    backgroundColor: '#cf1322',
    borderColor: '#cf1322',
    color: '#ffffff',
    fontWeight: 600,
  },
};

const activeTagStyles = {
  active: {
    backgroundColor: '#1677ff',
    borderColor: '#1677ff',
    color: '#ffffff',
    fontWeight: 600,
  },
  hidden: {
    backgroundColor: '#595959',
    borderColor: '#595959',
    color: '#ffffff',
    fontWeight: 600,
  },
};

const bookingTypeOptions = [
  { value: 0, label: BookingType[0] },
  { value: 1, label: BookingType[1] },
];

const bookingControlOptions = [
  { value: 0, label: BookingControlStatus[0] },
  { value: 1, label: BookingControlStatus[1] },
];

function BookingControl() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form] = Form.useForm();

  const vehicleCategoryLabelByValue = useMemo(() => {
    return VehicleCategoryOptions.reduce((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, []);

  const loadControls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await DataService.get(API.bookingControl.path);
      const data = Array.isArray(response?.data) ? response.data : [];
      setRows(data);
    } catch (error) {
      message.error('Failed to load booking controls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadControls();
  }, [loadControls]);

  const openCreate = () => {
    setEditingRow(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      vehicleCategory: VehicleCategory.TwoWheeler,
      bookingType: 0,
      booking: 1,
      isActive: false,
      closedUntil: null,
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    form.setFieldsValue({
      name: row.name,
      vehicleCategory: Number(row.vehicleCategory),
      bookingType: Number(row.bookingType),
      booking: Number(row.booking),
      isActive: !!row.isActive,
      closedUntil: row.closedUntil ? moment(row.closedUntil) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = {
      name: values.name,
      vehicleCategory: Number(values.vehicleCategory),
      bookingType: Number(values.bookingType),
      booking: Number(values.booking),
      isActive: !!values.isActive,
      closedUntil: values.booking === 1 && values.closedUntil ? values.closedUntil.toISOString() : null,
    };

    try {
      setSaving(true);

      if (editingRow?.id) {
        await DataService.put(`${API.bookingControl.path}/${editingRow.id}`, payload);
        message.success('Booking control updated successfully');
      } else {
        await DataService.post(API.bookingControl.path, payload);
        message.success('Booking control created successfully');
      }

      setModalOpen(false);
      setEditingRow(null);
      form.resetFields();
      await loadControls();
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : null);
      message.error(apiMessage || 'Failed to save booking control');
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
    {
      title: 'Vehicle Category',
      dataIndex: 'vehicleCategory',
      key: 'vehicleCategory',
      render: (value) => vehicleCategoryLabelByValue[Number(value)] || value,
    },
    {
      title: 'Booking Type',
      dataIndex: 'bookingType',
      key: 'bookingType',
      render: (value) => BookingType[Number(value)] || value,
    },
    {
      title: 'Booking',
      dataIndex: 'booking',
      key: 'booking',
      render: (value) => {
        const label = BookingControlStatus[Number(value)] || value;
        return <Tag style={bookingTagStyles[label] || activeTagStyles.hidden}>{label}</Tag>;
      },
    },
    {
      title: 'Is Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => (
        <Tag style={value ? activeTagStyles.active : activeTagStyles.hidden}>{value ? 'Active' : 'Hidden'}</Tag>
      ),
    },
    {
      title: 'Closed Until',
      dataIndex: 'closedUntil',
      key: 'closedUntil',
      render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdatedAt',
      key: 'lastUpdatedAt',
      render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button type="link" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Booking Control"
        buttons={[
          <Button key="new" type="primary" onClick={openCreate}>
            Add Control
          </Button>,
        ]}
      />
      <Main>
        <Cards headless>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Alert
              type="info"
              showIcon
              message="Booking Control decides whether HomeTab cards are hidden, open for booking, or closed with a blocked state in mobile app."
            />
            <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 12 }} />
          </Space>
        </Cards>
      </Main>

      <Modal
        title={editingRow ? 'Edit Booking Control' : 'Add Booking Control'}
        open={modalOpen}
        onCancel={() => {
          if (saving) {
            return;
          }
          setModalOpen(false);
          setEditingRow(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okButtonProps={{ loading: saving }}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ booking: 1, isActive: false }}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 200, message: 'Name should be at most 200 characters' },
            ]}
          >
            <Input placeholder="Example: Two Wheeler - Rental" />
          </Form.Item>

          <Form.Item
            label="Vehicle Category"
            name="vehicleCategory"
            rules={[{ required: true, message: 'Vehicle category is required' }]}
          >
            <Select options={VehicleCategoryOptions} />
          </Form.Item>

          <Form.Item
            label="Booking Type"
            name="bookingType"
            rules={[{ required: true, message: 'Booking type is required' }]}
          >
            <Select options={bookingTypeOptions} />
          </Form.Item>

          <Form.Item
            label="Booking Status"
            name="booking"
            rules={[{ required: true, message: 'Booking status is required' }]}
          >
            <Select options={bookingControlOptions} />
          </Form.Item>

          <Form.Item label="Is Active" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, next) => prev.booking !== next.booking} noStyle>
            {({ getFieldValue }) =>
              Number(getFieldValue('booking')) === 1 ? (
                <Form.Item label="Closed Until" name="closedUntil">
                  <DatePicker showTime style={{ width: '100%' }} placeholder="Optional close-until date" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default BookingControl;
