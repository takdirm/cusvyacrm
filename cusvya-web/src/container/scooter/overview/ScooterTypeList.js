import React, { useCallback } from 'react';
import { Table, Pagination, Dropdown, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

const boolTag = (val) => (val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>);

function ScooterTypeList({
  types,
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

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.scooterType.path,
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (url) =>
        url ? (
          <img src={url} alt="type" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
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
        ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (v) => <strong>{v || '-'}</strong>,
    },
    {
      title: 'Top Speed',
      dataIndex: 'topSpeed',
      key: 'topSpeed',
      width: 110,
      render: (v) => v || '-',
    },
    {
      title: 'Range',
      dataIndex: 'range',
      key: 'range',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: 'Petrol',
      dataIndex: 'isPetrolEngine',
      key: 'isPetrolEngine',
      width: 80,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'License Req.',
      dataIndex: 'isLicenseRequired',
      key: 'isLicenseRequired',
      width: 110,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Rental',
      dataIndex: 'isAvailableForRental',
      key: 'isAvailableForRental',
      width: 80,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Ownership',
      dataIndex: 'isAvailableForOwnership',
      key: 'isAvailableForOwnership',
      width: 100,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'For Sale',
      dataIndex: 'isForSale',
      key: 'isForSale',
      width: 85,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Is New',
      dataIndex: 'isNew',
      key: 'isNew',
      width: 75,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Rental From',
      dataIndex: 'rentalPriceStarts',
      key: 'rentalPriceStarts',
      width: 120,
      render: (v) => (v != null ? `₹${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: 'Own. From',
      dataIndex: 'ownershipPriceStarts',
      key: 'ownershipPriceStarts',
      width: 120,
      render: (v) => (v != null ? `₹${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: 'Base Price',
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 120,
      render: (v) => (v != null ? `₹${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: 'Scooters',
      dataIndex: 'scooterCount',
      key: 'scooterCount',
      width: 90,
      align: 'center',
      render: (v) => <PlainLabel color="blue">{v ?? 0}</PlainLabel>,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (v) => <PlainLabel color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</PlainLabel>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 155,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
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
            key: 'rental-plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="calendar" size={14} />
                Rental Plans
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/types/${record.id}/rental-plans`),
          },
          {
            key: 'ownership-plans',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="briefcase" size={14} />
                Ownership Plans
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/types/${record.id}/ownership-plans`),
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
                title: 'Delete Scooter Type',
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
        dataSource={types}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1700 }}
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

ScooterTypeList.propTypes = {
  types: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default ScooterTypeList;
