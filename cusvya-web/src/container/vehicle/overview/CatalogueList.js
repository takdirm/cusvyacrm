import React, { useState } from 'react';
import { Table, Pagination, Dropdown, Modal, message } from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';
import FeatherIcon from 'feather-icons-react';
import { useNavigate } from 'react-router-dom';
import PlainLabel from '../../../components/labels/plain-label';
import { Button } from '../../../components/buttons/buttons';
import CatalogueVendorsManager from './CatalogueVendorsManager';
import {
  getChargingTypeText,
  getFuelTypeText,
  getVehicleCategoryText,
  getVehicleTypeText,
} from '../../../config/enum/enum';

function CatalogueList({
  catalogues,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onManageImages,
  onDelete,
}) {
  const navigate = useNavigate();
  const [vendorManagerCatalogue, setVendorManagerCatalogue] = useState(null);

  const renderExpandableText = (value, record, title) => {
    if (!value) return '-';
    const content = String(value);
    if (content.length <= 72) return content;
    const shortText = `${content.slice(0, 72)}...`;

    return (
      <span
        role="button"
        tabIndex={0}
        style={{ color: '#1890ff', cursor: 'pointer' }}
        onClick={() =>
          Modal.info({
            title: `${title} - Catalogue #${record.id}`,
            width: 720,
            content: <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{content}</div>,
            okText: 'Close',
          })
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            Modal.info({
              title: `${title} - Catalogue #${record.id}`,
              width: 720,
              content: <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{content}</div>,
              okText: 'Close',
            });
          }
        }}
      >
        {shortText}
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
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="catalogue"
            style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 46,
              background: '#f0f0f0',
              borderRadius: 6,
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
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      width: 220,
      render: (value, record) => renderExpandableText(value, record, 'Summary'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      render: (value, record) => renderExpandableText(value, record, 'Description'),
    },
    {
      title: 'Brand / Model / Year',
      key: 'brandModelYear',
      width: 190,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>
            <strong>Brand:</strong> {record.brand || '-'}
          </span>
          <span>
            <strong>Model:</strong> {record.model || '-'}
          </span>
          <span>
            <strong>Year:</strong> {record.year || '-'}
          </span>
        </div>
      ),
    },
    {
      title: 'Vehicle Category',
      dataIndex: 'vehicleCategory',
      key: 'vehicleCategory',
      width: 140,
      render: (value) => {
        const categoryText = getVehicleCategoryText(value);
        return <PlainLabel color="blue">{categoryText !== '-' ? categoryText : (value ?? '-')}</PlainLabel>;
      },
    },
    {
      title: 'Charging / Vehicle / Fuel',
      key: 'chargingVehicleFuel',
      width: 210,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>
            <strong>Charging:</strong> {getChargingTypeText(record.chargingType)}
          </span>
          <span>
            <strong>Vehicle:</strong> {getVehicleTypeText(record.vehicleType ?? record.type)}
          </span>
          <span>
            <strong>Fuel:</strong> {getFuelTypeText(record.fuelType)}
          </span>
        </div>
      ),
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
      title: 'Ex-showroom',
      dataIndex: 'exShowroomPrice',
      key: 'exShowroomPrice',
      width: 130,
      align: 'right',
      sorter: (a, b) => (a.exShowroomPrice || 0) - (b.exShowroomPrice || 0),
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
      title: 'Licence Required',
      dataIndex: 'isLicenseRequired',
      key: 'isLicenseRequired',
      width: 130,
      align: 'center',
      render: (value) =>
        value ? (
          <PlainLabel color="warning">Required</PlainLabel>
        ) : (
          <PlainLabel color="default">Not Required</PlainLabel>
        ),
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
        const vehicleModelId = Number(record?.vehicleModelId || record?.vehicleModel?.id || 0);

        const menuItems = [
          {
            key: 'view',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="eye" size={14} />
                View
              </span>
            ),
            onClick: () => navigate(`/admin/catalogues/list/${record.id}`),
          },
          {
            key: 'manage-ownership-plan',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="link" size={14} />
                Assign Ownership Plan
              </span>
            ),
            onClick: () => navigate(`/admin/catalogues/list/${record.id}/ownership-plans`),
          },
          {
            key: 'manage-rental-plan',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="calendar" size={14} />
                Assign Rental Plan
              </span>
            ),
            onClick: () => {
              if (!vehicleModelId) {
                message.warning('Link a Vehicle Model to this catalogue first, then assign rental plans.');
                return;
              }
              navigate(`/admin/vehicle/models/${vehicleModelId}/rental-plans`);
            },
          },
          {
            key: 'vendors',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="briefcase" size={14} />
                Vendors
              </span>
            ),
            onClick: () => setVendorManagerCatalogue(record),
          },
          {
            key: 'list-vehicles',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="list" size={14} />
                List Vehicles
              </span>
            ),
            onClick: () => navigate(`/admin/catalogues/list/${record.id}/list-vehicles`),
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
          {
            key: 'manage-images',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="image" size={14} />
                Manage Varient
              </span>
            ),
            onClick: () => onManageImages(record),
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
        scroll={{ x: 2020 }}
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

      <Modal
        title={vendorManagerCatalogue ? `Manage Vendors - Catalogue #${vendorManagerCatalogue.id}` : 'Manage Vendors'}
        open={Boolean(vendorManagerCatalogue)}
        onCancel={() => setVendorManagerCatalogue(null)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {vendorManagerCatalogue && (
          <CatalogueVendorsManager catalogueId={vendorManagerCatalogue.id} title="Catalogue Vendors" />
        )}
      </Modal>
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
  onManageImages: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default CatalogueList;
