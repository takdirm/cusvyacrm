import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Empty, Input, Popconfirm, Row, Select, Spin, Statistic, Table, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import {
  OwnershipFulfilmentStatus,
  OwnershipFulfilmentStatusStyles,
  FulfilmentSourceStyles,
  FulfilmentSource,
} from './ownershipFulfilmentStatus';
import { deleteOwnershipFulfilment, getOwnershipFulfilments } from './ownershipFulfilmentService';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const normalise = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

function OwnershipFulfilmentList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [sourceFilter, setSourceFilter] = useState(undefined);
  const [catalogueFilter, setCatalogueFilter] = useState(undefined);
  const [colourFilter, setColourFilter] = useState(undefined);
  const [vendorFilter, setVendorFilter] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await getOwnershipFulfilments();
      setItems(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to load fulfilment queue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      setDeletingId(recordId);
      await deleteOwnershipFulfilment(recordId);
      setItems((prev) => prev.filter((item) => Number(item.id) !== Number(recordId)));
      message.success('Fulfilment record deleted successfully');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to delete fulfilment record');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const searchTerm = normalise(search);
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        [
          item.id,
          item.bookingId,
          item.catalogueName,
          item.catalogueColorName,
          item.vehicleId,
          item.activeVendorProcurement?.vendorName,
          item.activeVendorProcurement?.vendorOrderNumber,
        ]
          .map(normalise)
          .some((value) => value.includes(searchTerm));
      const matchesStatus =
        statusFilter === undefined || statusFilter === null || Number(item.fulfilmentStatus) === Number(statusFilter);
      const matchesSource =
        sourceFilter === undefined || sourceFilter === null || Number(item.fulfilmentSource) === Number(sourceFilter);
      const matchesCatalogue =
        !catalogueFilter || normalise(item.catalogueName || item.catalogueId).includes(normalise(catalogueFilter));
      const matchesColour =
        !colourFilter || normalise(item.catalogueColorName || item.catalogueColorId).includes(normalise(colourFilter));
      const matchesVendor =
        !vendorFilter ||
        normalise(item.activeVendorProcurement?.vendorName || item.activeVendorProcurement?.vendorId).includes(
          normalise(vendorFilter),
        );
      return matchesSearch && matchesStatus && matchesSource && matchesCatalogue && matchesColour && matchesVendor;
    });
  }, [items, search, statusFilter, sourceFilter, catalogueFilter, colourFilter, vendorFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      awaitingVendor: 0,
      inTransit: 0,
      vehicleReceived: 0,
      preparing: 0,
      readyForPickup: 0,
      completed: 0,
    };

    items.forEach((item) => {
      const status = Number(item.fulfilmentStatus);
      if (status === 0) counts.pending += 1;
      if (status === 1 && Number(item.fulfilmentSource) === 1) counts.awaitingVendor += 1;
      if (status === 3) counts.inTransit += 1;
      if (status === 5) counts.vehicleReceived += 1;
      if (status === 6) counts.preparing += 1;
      if (status === 7) counts.readyForPickup += 1;
      if (status === 9) counts.completed += 1;
    });

    return counts;
  }, [items]);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: 'Booking', dataIndex: 'bookingId', width: 110 },
    {
      title: 'Catalogue',
      dataIndex: 'catalogueName',
      render: (_, record) => record.catalogueName || `#${record.catalogueId}`,
    },
    {
      title: 'Colour',
      dataIndex: 'catalogueColorName',
      render: (_, record) => record.catalogueColorName || `#${record.catalogueColorId}`,
    },
    {
      title: 'Source',
      dataIndex: 'fulfilmentSource',
      render: (value) => {
        const sourceLabel = FulfilmentSource[Number(value)] || value;
        return <Tag style={FulfilmentSourceStyles[Number(value)] || FulfilmentSourceStyles.default}>{sourceLabel}</Tag>;
      },
    },
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_, record) => record.activeVendorProcurement?.vendorName || '-',
    },
    {
      title: 'Status',
      dataIndex: 'fulfilmentStatus',
      render: (value) => {
        const statusKey = Number(value);
        return (
          <Tag style={OwnershipFulfilmentStatusStyles[statusKey] || OwnershipFulfilmentStatusStyles.default}>
            {OwnershipFulfilmentStatus[statusKey] || value}
          </Tag>
        );
      },
    },
    { title: 'Vehicle', dataIndex: 'vehicleId', render: (value) => value || '-' },
    { title: 'Expected Delivery', dataIndex: 'expectedDeliveryDate', render: (value) => formatDate(value) },
    { title: 'Updated', dataIndex: 'updatedAt', render: (value) => formatDate(value) },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="primary" size="small" onClick={() => navigate(`/admin/order-fulfilment/detail/${record.id}`)}>
            Open
          </Button>
          <Popconfirm
            title="Delete fulfilment record"
            description="Are you sure you want to delete this fulfilment record?"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" loading={deletingId === record.id}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Order Fulfilment"
        buttons={[
          <div key="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button icon={<FeatherIcon icon="refresh-cw" size={14} />} onClick={loadItems}>
              Refresh
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Pending" value={statusCounts.pending} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Awaiting Vendor" value={statusCounts.awaitingVendor} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="In Transit" value={statusCounts.inTransit} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Vehicle Received" value={statusCounts.vehicleReceived} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Preparing" value={statusCounts.preparing} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Ready For Pickup" value={statusCounts.readyForPickup} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title="Completed" value={statusCounts.completed} />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search booking, customer, catalogue, vehicle or vendor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              placeholder="Filter by source"
              value={sourceFilter}
              onChange={setSourceFilter}
              style={{ width: '100%' }}
              options={Object.entries(FulfilmentSource).map(([value, label]) => ({ value: Number(value), label }))}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              options={Object.entries(OwnershipFulfilmentStatus).map(([value, label]) => ({
                value: Number(value),
                label,
              }))}
            />
          </Col>
          <Col xs={12} md={4}>
            <Input
              placeholder="Catalogue"
              value={catalogueFilter}
              onChange={(e) => setCatalogueFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Input
              placeholder="Colour"
              value={colourFilter}
              onChange={(e) => setColourFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Input
              placeholder="Vendor"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Cards headless>
          {loading ? (
            <div className="spin">
              <Spin size="large" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Empty description="No ownership fulfilment records found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredItems}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1100 }}
            />
          )}
        </Cards>
      </Main>
    </>
  );
}

export default OwnershipFulfilmentList;
