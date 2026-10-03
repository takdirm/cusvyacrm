import React from 'react';
import { Table, Pagination, Dropdown, Modal } from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';
import FeatherIcon from 'feather-icons-react';
import { useNavigate } from 'react-router-dom';
import PlainLabel from '../../../components/labels/plain-label';
import { Button } from '../../../components/buttons/buttons';
import { getChargingTypeText, getFuelTypeText, getVehicleTypeText } from '../../../config/enum/enum';

function CatalogueList({ catalogues, loading, currentPage, pageSize, totalCount, onPageChange, onEdit, onDelete }) {
  const navigate = useNavigate();

  const renderSummary = (value, record) => {
    if (!value) return '-';
    const summary = String(value);
    if (summary.length <= 28) return summary;
    const shortSummary = `${summary.slice(0, 28)}...`;

    return (
      <span
        role="button"
        tabIndex={0}
        style={{ color: '#1890ff', cursor: 'pointer' }}
        onClick={() =>
          Modal.info({
            title: `Summary - Catalogue #${record.id}`,
            width: 720,
            content: <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{summary}</div>,
            okText: 'Close',
          })
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            Modal.info({
              title: `Summary - Catalogue #${record.id}`,
              width: 720,
              content: <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{summary}</div>,
              okText: 'Close',
            });
          }
        }}
      >
        {shortSummary}
      </span>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      width: 220,
      render: (value, record) => renderSummary(value, record),
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="catalogue"
            style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 40,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FeatherIcon icon="image" size={16} color="#ccc" />
          </div>
        ),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      width: 90,
      align: 'center',
      sorter: (a, b) => (a.year || 0) - (b.year || 0),
    },
    {
      title: 'Vehicle Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value) => <PlainLabel color="blue">{getVehicleTypeText(value)}</PlainLabel>,
    },
    {
      title: 'Fuel Type',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 120,
      render: (value) => getFuelTypeText(value),
    },
    {
      title: 'Charging',
      dataIndex: 'chargingType',
      key: 'chargingType',
      width: 120,
      render: (value) => getChargingTypeText(value),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (value) => (value != null ? `₹${Number(value).toLocaleString()}` : '-'),
    },
    {
      title: 'Available',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      width: 100,
      align: 'center',
      render: (value) =>
        value ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="red">No</PlainLabel>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="eye" size={14} />
                View
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/catalogues/${record.id}`),
          },
          {
            key: 'manage-plan',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="link" size={14} />
                Manage Plan
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/catalogues/${record.id}/ownership-plans`),
          },
          {
            key: 'manage-scooters',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="truck" size={14} />
                Manage New Scooter
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/catalogues/${record.id}/scooters`),
          },
          {
            key: 'edit',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="edit" size={14} />
                Edit
              </span>
            ),
            onClick: () => onEdit(record),
          },
          { type: 'divider' },
          {
            key: 'delete',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} />
                Delete
              </span>
            ),
            onClick: () =>
              Modal.confirm({
                title: 'Delete Catalogue',
                content: `Are you sure you want to delete catalogue #${record.id}?`,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => onDelete(record),
              }),
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              type="white"
              outlined
              style={{ padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Actions
              <FeatherIcon icon="chevron-down" size={13} />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={catalogues}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 1500 }}
      />
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total) => `Total ${total} catalogues`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>
    </>
  );
}

CatalogueList.propTypes = {
  catalogues: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CatalogueList;
