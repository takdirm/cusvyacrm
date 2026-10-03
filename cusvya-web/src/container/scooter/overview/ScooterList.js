import React, { useCallback, useState } from 'react';
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
import LocationModal from '../../../components/modals/LocationModal';
import EngineIgnitionModal from '../../../components/modals/EngineIgnitionModal';

function ScooterList({
  scooters,
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
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocationScooter, setSelectedLocationScooter] = useState(null);
  const [ignitionModalVisible, setIgnitionModalVisible] = useState(false);
  const [selectedIgnitionScooter, setSelectedIgnitionScooter] = useState(null);

  const handleLocationOpen = useCallback((record) => {
    setSelectedLocationScooter(record);
    setLocationModalVisible(true);
  }, []);

  const handleLocationClose = () => {
    setLocationModalVisible(false);
    setSelectedLocationScooter(null);
  };

  const handleIgnitionOpen = useCallback((record) => {
    setSelectedIgnitionScooter(record);
    setIgnitionModalVisible(true);
  }, []);

  const handleIgnitionClose = () => {
    setIgnitionModalVisible(false);
    setSelectedIgnitionScooter(null);
  };

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.scooter.path,
          id,
          getData: () => getData(currentPage, pageSize),
        }),
      );
      onDelete();
    },
    [dispatch, currentPage, pageSize, getData, onDelete],
  );

  const boolTag = (val) =>
    val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  const stackRow = (label, value) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: '#666', fontSize: 12 }}>{label}</span>
      <span>{value ?? '-'}</span>
    </div>
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      sorter: (a, b) => a.id - b.id,
      fixed: 'left',
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="scooter"
            style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 36,
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
      title: 'Name',
      key: 'name',
      width: 180,
      sorter: (a, b) => a.name?.localeCompare(b.name),
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Name', record.name || '-')}
          {stackRow('Year', record.modelYear || '-')}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'scooterType',
      key: 'scooterType',
      width: 130,
      render: (type) => (type?.name ? <PlainLabel color="blue">{type.name}</PlainLabel> : '-'),
    },
    {
      title: 'Specifications',
      key: 'specifications',
      width: 190,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Manufacturer', record.manufacturer || '-')}
          {stackRow('Top Speed', record.scooterType?.topSpeed || '-')}
          {stackRow('Km Driven', record.kmDriven != null ? record.kmDriven.toLocaleString() : '-')}
        </div>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.costPrice - b.costPrice,
      render: (v) => (v != null ? `₹${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: 'Reg No.',
      dataIndex: 'registerationNumber',
      key: 'registerationNumber',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: 'Tracker Assigned',
      key: 'trackerAssigned',
      width: 130,
      align: 'center',
      render: (_, record) => boolTag(Boolean(record.trackerDevice?.id || record.gPRSID || record.gPRSIMEIID)),
    },
    {
      title: 'IsAssigned',
      key: 'isAssigned',
      width: 100,
      align: 'center',
      render: (_, record) => boolTag(Boolean(record.isAssigned ?? record.assigned)),
    },
    {
      title: 'Services',
      key: 'services',
      width: 170,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Rental', boolTag(record.scooterType?.isAvailableForRental))}
          {stackRow('Ownership', boolTag(record.scooterType?.isAvailableForOwnership))}
          {stackRow('Sale', boolTag(record.scooterType?.isForSale))}
        </div>
      ),
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
      width: 100,
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
            onClick: () => navigate(`/admin/scooter/detail/${record.id}`),
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
            key: 'tracker',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="navigation" size={14} />
                Manage Tracker
              </span>
            ),
            onClick: () => navigate(`/admin/scooter/manage-tracker/${record.id}`),
          },
          {
            key: 'location',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="map-pin" size={14} />
                Location
              </span>
            ),
            onClick: () => handleLocationOpen(record),
          },
          {
            key: 'ignition',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="power" size={14} />
                Vehicle Ignition
              </span>
            ),
            onClick: () => handleIgnitionOpen(record),
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
                title: 'Delete Scooter',
                content: `Are you sure you want to delete "${record.name || `#${record.id}`}"?`,
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
        dataSource={scooters}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1950 }}
        size="middle"
      />
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total) => `Total ${total} scooters`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>

      <LocationModal
        visible={locationModalVisible}
        onCancel={handleLocationClose}
        scooter={selectedLocationScooter}
        scooterId={selectedLocationScooter?.id}
      />

      <EngineIgnitionModal
        visible={ignitionModalVisible}
        onCancel={handleIgnitionClose}
        scooterId={selectedIgnitionScooter?.id}
        title={
          selectedIgnitionScooter
            ? `Vehicle Ignition - ${selectedIgnitionScooter.name || `#${selectedIgnitionScooter.id}`}`
            : undefined
        }
      />
    </>
  );
}

ScooterList.propTypes = {
  scooters: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default ScooterList;
