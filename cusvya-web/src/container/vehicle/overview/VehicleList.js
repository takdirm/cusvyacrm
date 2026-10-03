import React, { useCallback, useState } from 'react';
import { Table, Pagination, Dropdown, Modal, message } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import axios from 'axios';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import LocationModal from '../../../components/modals/LocationModal';
import EngineIgnitionModal from '../../../components/modals/EngineIgnitionModal';
import VehicleNotesModal from '../../../components/modals/VehicleNotesModal';
import {
  getVehicleListingStatusText,
  getVehicleCategoryText,
  getVehicleTypeText,
  getOwnershipStatusText,
} from '../../../config/enum/enum';

const VEHICLE_DOCUMENT_TYPES = [
  { value: 3, label: 'Vehicle Registration' },
  { value: 4, label: 'Pollution Certificate' },
  { value: 5, label: 'Insurance' },
  { value: 6, label: 'Battery Warranty Card' },
  { value: 99, label: 'Others' },
];

const DOCUMENT_SIDE_OPTIONS = [
  { value: 1, label: 'Front' },
  { value: 2, label: 'Back' },
];

function VehicleList({
  vehicles,
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
  const [selectedLocationVehicle, setSelectedLocationVehicle] = useState(null);
  const [ignitionModalVisible, setIgnitionModalVisible] = useState(false);
  const [selectedIgnitionVehicle, setSelectedIgnitionVehicle] = useState(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedNotesVehicle, setSelectedNotesVehicle] = useState(null);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [selectedDocumentVehicle, setSelectedDocumentVehicle] = useState(null);
  const [docType, setDocType] = useState(3);
  const [docSide, setDocSide] = useState(1);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  const handleLocationOpen = useCallback((record) => {
    setSelectedLocationVehicle(record);
    setLocationModalVisible(true);
  }, []);

  const handleLocationClose = () => {
    setLocationModalVisible(false);
    setSelectedLocationVehicle(null);
  };

  const handleIgnitionOpen = useCallback((record) => {
    setSelectedIgnitionVehicle(record);
    setIgnitionModalVisible(true);
  }, []);

  const handleIgnitionClose = () => {
    setIgnitionModalVisible(false);
    setSelectedIgnitionVehicle(null);
  };

  const handleNotesOpen = useCallback((record) => {
    setSelectedNotesVehicle(record);
    setNotesModalVisible(true);
  }, []);

  const handleNotesClose = () => {
    setNotesModalVisible(false);
    setSelectedNotesVehicle(null);
  };

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

  const handleDocumentsOpen = useCallback((record) => {
    setSelectedDocumentVehicle(record);
    setDocType(3);
    setDocSide(1);
    setDocName('');
    setDocDescription('');
    setDocFile(null);
    setDocumentsModalVisible(true);
  }, []);

  const handleDocumentsClose = () => {
    if (docUploading) return;
    setDocumentsModalVisible(false);
    setSelectedDocumentVehicle(null);
  };

  const handleDocFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setDocFile(null);
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes((selected.type || '').toLowerCase())) {
      message.error('Only PDF, JPEG and PNG files are allowed');
      event.target.value = '';
      setDocFile(null);
      return;
    }

    setDocFile(selected);
  };

  const handleUploadDocument = async () => {
    if (!selectedDocumentVehicle?.id) {
      message.error('Vehicle is required');
      return;
    }

    if (!docFile) {
      message.error('Please choose a file to upload');
      return;
    }

    if (Number(docType) === 99 && !docName.trim()) {
      message.error('Document Name is required when Document Type is Others');
      return;
    }

    const documentTypeLabel =
      VEHICLE_DOCUMENT_TYPES.find((item) => item.value === Number(docType))?.label || 'Document';
    const effectiveName = Number(docType) === 99 ? docName.trim() : documentTypeLabel;

    try {
      setDocUploading(true);
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('documentType', Number(docType));
      formData.append('side', Number(docSide));
      formData.append('name', effectiveName);
      formData.append('description', docDescription?.trim() || '');
      formData.append('file', docFile);

      await axios.post(`${apiUrl}/api${API.document.path}/vehicle/${selectedDocumentVehicle.id}`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Vehicle document uploaded successfully');
      handleDocumentsClose();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to upload vehicle document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.vehicle.path,
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
      title: 'Vehicle ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => Number(a.id || 0) - Number(b.id || 0),
      render: (id) => <strong>#{id}</strong>,
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (url) => {
        const resolvedUrl = resolveMediaUrl(url);

        return resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt="vehicle"
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
        );
      },
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
          {stackRow('UID', record.uid || '-')}
        </div>
      ),
    },
    {
      title: 'Registration & Chassis',
      key: 'registrationAndChassis',
      width: 210,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Reg. No.', record.registerationNumber || record.registrationNumber || '-')}
          {stackRow('Chassis No.', record.chassisNumber || '-')}
        </div>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      width: 130,
      render: (model) => (model?.name ? <PlainLabel color="blue">{model.name}</PlainLabel> : '-'),
    },
    {
      title: 'Station',
      key: 'station',
      width: 170,
      render: (_, record) => {
        const stationId = record.stationId ?? record.station?.id;
        const stationName = record.stationName ?? record.station?.name ?? '-';

        return (
          <div style={{ display: 'grid', gap: 6 }}>
            {stackRow('Station ID', stationId ?? '-')}
            {stackRow('Station Name', stationName)}
          </div>
        );
      },
    },
    {
      title: 'Catalogue',
      key: 'catalogue',
      width: 170,
      render: (_, record) => {
        const catalogueId = record.vehicleCatalogueId ?? record.catalogueId ?? record.vehicleCatalogue?.id;
        const catalogueName =
          record.vehicleCatalogueSummary ??
          record.vehicleCatalogueName ??
          record.vehicleCatalogue?.summary ??
          record.catalogue?.summary ??
          '-';
        const colourName =
          record.catalogueColor?.colorName ??
          record.catalogueColor?.name ??
          record.catalogueColorName ??
          record.catalogueColorId ??
          '-';

        return (
          <div style={{ display: 'grid', gap: 6 }}>
            {stackRow('Catalogue ID', catalogueId ?? '-')}
            {stackRow('Name', catalogueName)}
            {stackRow('Colour', colourName)}
          </div>
        );
      },
    },
    {
      title: 'Category',
      key: 'categoryType',
      width: 210,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Category', getVehicleCategoryText(record.vehicleCategory))}
          {stackRow('Type', getVehicleTypeText(record.vehicleType))}
          {stackRow('Manufacturer', record.manufacturer || '-')}
        </div>
      ),
    },
    {
      title: 'CostPrice',
      key: 'pricing',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Cost', record.costPrice != null ? `₹${Number(record.costPrice).toLocaleString()}` : '-')}
        </div>
      ),
    },
    {
      title: 'Listing',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Listing', getVehicleListingStatusText(record.vehicleListingStatus))}
          {stackRow('Ownership', getOwnershipStatusText(record.ownershipStatus))}
        </div>
      ),
    },
    {
      title: 'Tracker',
      key: 'tracker',
      width: 170,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          {stackRow('Tracker', boolTag(Boolean(record.trackerDevice?.id)))}
          {stackRow('IMEI', record.trackerDevice?.imei || '-')}
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
            onClick: () => navigate(`/admin/vehicle/detail/${record.id}`),
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
            onClick: () => navigate(`/admin/vehicle/manage-tracker/${record.id}`),
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
          {
            key: 'notes',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="file-text" size={14} />
                Notes
              </span>
            ),
            onClick: () => handleNotesOpen(record),
          },
          {
            key: 'documents',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="paperclip" size={14} />
                Documents
              </span>
            ),
            onClick: () => handleDocumentsOpen(record),
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
                title: 'Delete Vehicle',
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
        dataSource={vehicles}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 2480 }}
        size="middle"
      />
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total) => `Total ${total} vehicles`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>

      <LocationModal
        visible={locationModalVisible}
        onCancel={handleLocationClose}
        vehicle={selectedLocationVehicle}
        vehicleId={selectedLocationVehicle?.id}
      />

      <EngineIgnitionModal
        visible={ignitionModalVisible}
        onCancel={handleIgnitionClose}
        vehicleId={selectedIgnitionVehicle?.id}
        title={
          selectedIgnitionVehicle
            ? `Vehicle Ignition - ${selectedIgnitionVehicle.name || `#${selectedIgnitionVehicle.id}`}`
            : undefined
        }
      />

      <VehicleNotesModal
        visible={notesModalVisible}
        onCancel={handleNotesClose}
        vehicle={selectedNotesVehicle}
        vehicleId={selectedNotesVehicle?.id}
        title={
          selectedNotesVehicle
            ? `Vehicle Notes - ${selectedNotesVehicle.name || `#${selectedNotesVehicle.id}`}`
            : undefined
        }
      />

      <Modal
        open={documentsModalVisible}
        onCancel={handleDocumentsClose}
        onOk={handleUploadDocument}
        okText="Upload"
        confirmLoading={docUploading}
        title={
          selectedDocumentVehicle
            ? `Upload Documents - ${selectedDocumentVehicle.name || `#${selectedDocumentVehicle.id}`}`
            : 'Upload Documents'
        }
        destroyOnClose
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Type</label>
            <select
              value={docType}
              onChange={(event) => setDocType(Number(event.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            >
              {VEHICLE_DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {Number(docType) === 99 && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Name</label>
              <input
                type="text"
                value={docName}
                onChange={(event) => setDocName(event.target.value)}
                placeholder="Enter custom document name"
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Side</label>
            <select
              value={docSide}
              onChange={(event) => setDocSide(Number(event.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            >
              {DOCUMENT_SIDE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Description (Optional)</label>
            <textarea
              value={docDescription}
              onChange={(event) => setDocDescription(event.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Choose File (PDF/JPEG/PNG)</label>
            <input type="file" accept=".pdf,.jpeg,.jpg,.png" onChange={handleDocFileChange} />
            {docFile && <div style={{ marginTop: 8, color: '#666' }}>Selected: {docFile.name}</div>}
          </div>
        </div>
      </Modal>
    </>
  );
}

VehicleList.propTypes = {
  vehicles: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default VehicleList;
