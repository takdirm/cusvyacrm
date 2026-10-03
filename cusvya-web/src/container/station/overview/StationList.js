import React, { useCallback } from 'react';
import { Table, Pagination, Popconfirm, Dropdown, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

const stationStatusTagStyles = {
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

function StationList({
  stations,
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
    (stationId) => {
      dispatch(
        axiosDataDelete({
          path: API.station.path,
          id: stationId,
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
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a, b) => a.name?.localeCompare(b.name),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 220,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      render: (phone) => phone || '-',
    },
    {
      title: 'Open Time',
      dataIndex: 'openTime',
      key: 'openTime',
      width: 110,
      render: (t) => (t ? t.substring(0, 5) : '-'),
    },
    {
      title: 'Close Time',
      dataIndex: 'closeTime',
      key: 'closeTime',
      width: 110,
      render: (t) => (t ? t.substring(0, 5) : '-'),
    },
    {
      title: 'City',
      dataIndex: 'cityCode',
      key: 'cityCode',
      width: 120,
      render: (cityCode) => cityCode || '-',
      filters: [
        { text: 'Bangalore', value: 'BANGALORE' },
        { text: 'Mumbai', value: 'MUMBAI' },
        { text: 'Delhi', value: 'DELHI' },
      ],
      onFilter: (value, record) => record.cityCode === value,
    },
    {
      title: 'Scooters',
      dataIndex: 'availableScooters',
      key: 'availableScooters',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.availableScooters - b.availableScooters,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (isActive) => (
        <PlainLabel style={isActive ? stationStatusTagStyles.active : stationStatusTagStyles.inactive}>
          {isActive ? 'Active' : 'Inactive'}
        </PlainLabel>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => (date ? moment(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const menuItems = [
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
            key: 'manage-vehicle',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="truck" size={14} />
                Manage Vehicle
              </span>
            ),
            onClick: () => navigate(`/admin/station/manage-vehicles?stationId=${record.id}`),
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
                title: 'Delete Station',
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
              type="primary"
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
        dataSource={stations}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1520 }}
        size="middle"
      />
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total) => `Total ${total} stations`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>
    </>
  );
}

StationList.propTypes = {
  stations: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default StationList;
