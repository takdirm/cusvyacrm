import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Table,
  Pagination,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Empty,
  Switch,
} from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const { Option } = Select;

const defaultFilters = {
  searchTerm: '',
  forSaleOnly: '',
};

function AccessorieManagement() {
  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const buildQuery = useCallback((page, pageSize, currentFilters) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (currentFilters.searchTerm?.trim()) {
      params.set('searchTerm', currentFilters.searchTerm.trim());
    }
    if (currentFilters.forSaleOnly !== '') {
      params.set('forSaleOnly', currentFilters.forSaleOnly);
    }
    return params.toString();
  }, []);

  const fetchData = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
      try {
        setLoading(true);
        const query = buildQuery(page, pageSize, currentFilters);
        const response = await DataService.get(`${API.accessorie.path}/paged?${query}`);
        const data = response?.data || {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setPagination({
          current: data.page || page,
          pageSize: data.pageSize || pageSize,
          total: data.totalCount || 0,
        });
      } catch (error) {
        setItems([]);
        message.error(error?.response?.data?.message || error?.message || 'Failed to load accessories');
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, filters, pagination.current, pagination.pageSize],
  );

  useEffect(() => {
    fetchData(1, pagination.pageSize, filters);
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      description: '',
      salePrice: 0,
      rentalPricePerDay: 0,
      forSaleOnly: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      salePrice: Number(record.salePrice || 0),
      rentalPricePerDay: Number(record.rentalPricePerDay || 0),
      forSaleOnly: Boolean(record.forSaleOnly),
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  const openViewModal = (record) => {
    setViewItem(record);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewItem(null);
  };

  const saveItem = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name?.trim(),
        description: values.description?.trim() || null,
        salePrice: Number(values.salePrice || 0),
        rentalPricePerDay: Number(values.forSaleOnly ? 0 : values.rentalPricePerDay || 0),
        forSaleOnly: Boolean(values.forSaleOnly),
      };

      setSubmitting(true);
      if (editingItem?.id) {
        await DataService.put(`${API.accessorie.path}/${editingItem.id}`, payload);
        message.success('Accessory updated successfully');
      } else {
        await DataService.post(API.accessorie.path, payload);
        message.success('Accessory created successfully');
      }

      closeModal();
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || error?.message || 'Failed to save accessory');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = (record) => {
    Modal.confirm({
      title: 'Delete Accessory',
      content: `Are you sure you want to delete '${record?.name || 'this accessory'}'?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await DataService.delete(`${API.accessorie.path}/${record.id}`);
          message.success('Accessory deleted successfully');
          await fetchData(pagination.current, pagination.pageSize, filters);
        } catch (error) {
          message.error(error?.response?.data?.message || error?.message || 'Failed to delete accessory');
        }
      },
    });
  };

  const applyFilters = () => {
    const nextFilters = {
      ...pendingFilters,
      searchTerm: pendingFilters.searchTerm || '',
    };
    setFilters(nextFilters);
    fetchData(1, pagination.pageSize, nextFilters);
  };

  const resetFilters = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    fetchData(1, pagination.pageSize, defaultFilters);
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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 220,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (value) => value || '-',
      },
      {
        title: 'Sale Price',
        dataIndex: 'salePrice',
        key: 'salePrice',
        width: 130,
        render: (value) => Number(value || 0).toFixed(2),
      },
      {
        title: 'Rental / Day',
        dataIndex: 'rentalPricePerDay',
        key: 'rentalPricePerDay',
        width: 130,
        render: (value) => Number(value || 0).toFixed(2),
      },
      {
        title: 'For Sale Only',
        dataIndex: 'forSaleOnly',
        key: 'forSaleOnly',
        width: 130,
        render: (value) => (value ? 'Yes' : 'No'),
      },
      {
        title: 'Action',
        key: 'action',
        width: 260,
        fixed: 'right',
        render: (_, record) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type="default" outlined onClick={() => openViewModal(record)}>
              View
            </Button>
            <Button size="small" type="default" outlined onClick={() => openEditModal(record)}>
              Edit
            </Button>
            <Button size="small" type="danger" outlined onClick={() => deleteItem(record)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        ghost
        title="Accessories"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={openCreateModal}>
              + Add Accessory
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={16}>
          <Col xs={24} style={{ marginBottom: 16 }}>
            <Cards headless>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
                  <Input
                    value={pendingFilters.searchTerm}
                    onChange={(e) => setPendingFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                    onPressEnter={applyFilters}
                    placeholder="Name or description"
                    size="small"
                    style={{ width: 220 }}
                    allowClear
                    suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Type</span>
                  <Select
                    value={pendingFilters.forSaleOnly}
                    onChange={(value) => setPendingFilters((prev) => ({ ...prev, forSaleOnly: value }))}
                    style={{ width: 180 }}
                    size="small"
                  >
                    <Option value="">All</Option>
                    <Option value="true">For Sale Only</Option>
                    <Option value="false">Rent or Sale</Option>
                  </Select>
                </div>

                <Button size="small" type="primary" onClick={applyFilters}>
                  Apply
                </Button>
                <Button size="small" type="default" outlined onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards headless>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : items.length === 0 ? (
                <Empty description="No accessories found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <>
                  <Table rowKey="id" columns={columns} dataSource={items} pagination={false} scroll={{ x: 1000 }} />
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      showSizeChanger
                      pageSizeOptions={['10', '20', '50']}
                      onChange={(page, pageSize) => fetchData(page, pageSize, filters)}
                      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                    />
                  </div>
                </>
              )}
            </Cards>
          </Col>
        </Row>

        <Modal
          title={editingItem ? 'Edit Accessory' : 'Add Accessory'}
          open={modalVisible}
          onCancel={closeModal}
          onOk={saveItem}
          okText={editingItem ? 'Update' : 'Create'}
          confirmLoading={submitting}
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
              <Input placeholder="Accessory name" />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} placeholder="Description" />
            </Form.Item>

            <Form.Item
              label="Sale Price"
              name="salePrice"
              rules={[{ required: true, message: 'Sale price is required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => {
                const forSaleOnly = Boolean(getFieldValue('forSaleOnly'));
                return (
                  <Form.Item
                    label="Rental Price Per Day"
                    name="rentalPricePerDay"
                    rules={
                      forSaleOnly
                        ? []
                        : [{ required: true, message: 'Rental price is required for rentable accessories' }]
                    }
                  >
                    <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled={forSaleOnly} />
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item label="For Sale Only" name="forSaleOnly" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Accessory Details"
          open={viewModalVisible}
          onCancel={closeViewModal}
          onOk={closeViewModal}
          okText="Close"
          cancelButtonProps={{ style: { display: 'none' } }}
          destroyOnClose
        >
          <Table
            pagination={false}
            size="small"
            rowKey="label"
            dataSource={[
              { label: 'ID', value: viewItem?.id ?? '-' },
              { label: 'Name', value: viewItem?.name ?? '-' },
              { label: 'Description', value: viewItem?.description || '-' },
              { label: 'Sale Price', value: Number(viewItem?.salePrice || 0).toFixed(2) },
              { label: 'Rental Price Per Day', value: Number(viewItem?.rentalPricePerDay || 0).toFixed(2) },
              { label: 'For Sale Only', value: viewItem?.forSaleOnly ? 'Yes' : 'No' },
            ]}
            columns={[
              {
                title: 'Field',
                dataIndex: 'label',
                key: 'label',
                width: '40%',
                render: (text) => <strong>{text}</strong>,
              },
              {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
                width: '60%',
              },
            ]}
          />
        </Modal>
      </Main>
    </>
  );
}

export default AccessorieManagement;
