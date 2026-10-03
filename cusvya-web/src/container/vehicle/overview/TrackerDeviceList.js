import React, { useCallback } from 'react';
import { Table, Pagination, Dropdown, Modal } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

function TrackerDeviceList({
  devices,
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

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.trackerDevice.path,
          id,
          getData: () => getData(currentPage, pageSize),
        }),
      );
      onDelete();
    },
    [dispatch, currentPage, pageSize, getData, onDelete],
  );

  const formatIstDateTime = (value) => {
    if (!value) return '-';
    const m = moment.utc(value);
    if (!m.isValid()) return '-';
    return `${m.utcOffset(330).format('YYYY-MM-DD HH:mm:ss')} IST`;
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
      title: 'Brand',
      dataIndex: 'brandName',
      key: 'brandName',
      width: 160,
      render: (value) => value || '-',
    },
    {
      title: 'IMEI',
      dataIndex: 'imei',
      key: 'imei',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: 160,
      render: (value) => value || '-',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: 'Model Number',
      dataIndex: 'modelNumber',
      key: 'modelNumber',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: 'Plan Expiry (IST)',
      dataIndex: 'planExpiryDate',
      key: 'planExpiryDate',
      width: 190,
      render: (value) => formatIstDateTime(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 110,
      align: 'center',
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
            key: 'delete',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} />
                Delete
              </span>
            ),
            onClick: () =>
              Modal.confirm({
                title: 'Delete Tracker Device',
                content: `Are you sure you want to delete IMEI ${record.imei}?`,
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
        dataSource={devices}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1360 }}
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

TrackerDeviceList.propTypes = {
  devices: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default TrackerDeviceList;
