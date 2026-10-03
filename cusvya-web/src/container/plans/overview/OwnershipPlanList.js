import React, { useCallback } from 'react';
import { Table, Pagination, Dropdown, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

function OwnershipPlanList({
  plans,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onManagePricing,
  onDelete,
  getData,
}) {
  const dispatch = useDispatch();

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.ownershipPlan.path,
          id,
          getData: () => getData(),
        }),
      );
      onDelete();
    },
    [dispatch, getData, onDelete],
  );

  const boolTag = (val) =>
    val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 65, fixed: 'left', sorter: (a, b) => a.id - b.id },
    {
      title: 'Tenure',
      dataIndex: 'tenure',
      key: 'tenure',
      width: 140,
      sorter: (a, b) => a.tenure?.localeCompare(b.tenure),
    },
    {
      title: 'Tenure (Months)',
      dataIndex: 'tenureInMonths',
      key: 'tenureInMonths',
      width: 130,
      align: 'center',
    },
    {
      title: 'Tenure (Weeks)',
      dataIndex: 'tenureInWeeks',
      key: 'tenureInWeeks',
      width: 120,
      align: 'center',
      render: (v) => v ?? '-',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (v) => (v ? <PlainLabel color="purple">{v}</PlainLabel> : '-'),
    },
    {
      title: 'Badge',
      dataIndex: 'badge',
      key: 'badge',
      width: 100,
      render: (v) => (v ? <PlainLabel color="geekblue">{v}</PlainLabel> : '-'),
    },
    {
      title: 'Popular',
      dataIndex: 'isPopular',
      key: 'isPopular',
      width: 80,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center',
      render: (v) =>
        v ? <PlainLabel color="success">Active</PlainLabel> : <PlainLabel color="red">Inactive</PlainLabel>,
    },
    {
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
      width: 90,
      align: 'center',
      render: (v) =>
        v?.length ? <PlainLabel color="blue">{v.length} items</PlainLabel> : <PlainLabel color="default">0</PlainLabel>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (d) => (d ? moment(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 125,
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
            key: 'manage-pricing',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="dollar-sign" size={14} />
                Manage Pricing
              </span>
            ),
            onClick: () => onManagePricing(record),
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
                title: 'Delete Ownership Plan',
                content: `Are you sure you want to delete "${record.tenure || `#${record.id}`}"?`,
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
    <>
      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1200 }}
        size="middle"
      />
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          onShowSizeChange={onPageChange}
          showSizeChanger
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
          pageSizeOptions={['10', '20', '50']}
        />
      </div>
    </>
  );
}

OwnershipPlanList.propTypes = {
  plans: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onManagePricing: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default OwnershipPlanList;
