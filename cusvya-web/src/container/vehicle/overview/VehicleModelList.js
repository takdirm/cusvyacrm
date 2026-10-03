import React, { useCallback } from 'react';
import { Table, Pagination, Dropdown, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { getVehicleCategoryText, getVehicleServiceTypeText } from '../../../config/enum/enum';

function VehicleModelList({
  models = [],
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onDelete,
  getData,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    if (/^(https?:)?\/\//i.test(trimmedUrl) || trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('blob:')) {
      return trimmedUrl;
    }

    const baseUrl = getApiUrl();
    return trimmedUrl.startsWith('/') ? `${baseUrl}${trimmedUrl}` : `${baseUrl}/${trimmedUrl}`;
  };

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.vehicleModel.path,
          id,
          getData: () => getData(currentPage, pageSize),
        }),
      );
      onDelete();
    },
    [dispatch, currentPage, pageSize, getData, onDelete],
  );

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (url) => {
        const resolvedUrl = resolveMediaUrl(url);

        return resolvedUrl ? (
          <img src={resolvedUrl} alt="model" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FeatherIcon icon="image" size={20} color="#bbb" />
          </div>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 260,
      render: (_, record) => (
        <div style={{ lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600 }}>{record.name || '-'}</div>
          <div style={{ color: '#666' }}>Top Speed: {record.topSpeed || '-'}</div>
          <div style={{ color: '#666' }}>Range: {record.range || '-'}</div>
        </div>
      ),
    },
    {
      title: 'VehicleCategory',
      dataIndex: 'vehicleCategory',
      key: 'vehicleCategory',
      width: 160,
      render: (v) => getVehicleCategoryText(v),
    },
    {
      title: 'EngineType',
      dataIndex: 'isPetrolEngine',
      key: 'isPetrolEngine',
      width: 120,
      render: (v) => (v ? 'Petrol' : 'Electric / Other'),
    },
    {
      title: 'Service',
      dataIndex: 'vehicleServiceType',
      key: 'vehicleServiceType',
      width: 180,
      render: (v) => getVehicleServiceTypeText(v),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 220,
      render: (_, record) => (
        <div style={{ lineHeight: 1.6 }}>
          <div>Base: {record.basePrice != null ? `₹${Number(record.basePrice).toLocaleString()}` : '-'}</div>
          <div>
            Rental: {record.rentalPriceStarts != null ? `₹${Number(record.rentalPriceStarts).toLocaleString()}` : '-'}
          </div>
          <div>
            Ownership:{' '}
            {record.ownershipPriceStarts != null ? `₹${Number(record.ownershipPriceStarts).toLocaleString()}` : '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'VehicleCount',
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 120,
      align: 'center',
      render: (v) => <PlainLabel color="blue">{v ?? 0}</PlainLabel>,
    },
    {
      title: 'IsActive',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (v) => <PlainLabel color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</PlainLabel>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
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
            onClick: () => navigate(`/admin/vehicle/models/${record.id}/detail`),
          },
          {
            key: 'rental-plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="calendar" size={14} />
                Rental Plans
              </span>
            ),
            onClick: () => navigate(`/admin/vehicle/models/${record.id}/rental-plans`),
          },
          {
            key: 'ownership-plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="briefcase" size={14} />
                Ownership Plans
              </span>
            ),
            onClick: () => navigate(`/admin/vehicle/models/${record.id}/ownership-plans`),
          },
          {
            key: 'list-vehicles',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="list" size={14} />
                List Vehicles
              </span>
            ),
            onClick: () => navigate(`/admin/vehicle/models/${record.id}/vehicles`),
          },
          { type: 'divider' },
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
            key: 'delete',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} />
                Delete
              </span>
            ),
            onClick: () =>
              Modal.confirm({
                title: 'Delete Vehicle Model',
                content: `Are you sure you want to delete "${record.name}"?`,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => handleDelete(record.id),
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
    <div>
      <Table
        className="table-responsive"
        dataSource={models}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1300 }}
      />
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>
    </div>
  );
}

VehicleModelList.propTypes = {
  models: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default VehicleModelList;
