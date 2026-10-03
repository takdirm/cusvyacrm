import React, { useCallback, useState } from 'react';
import { Table, Pagination, message, Dropdown, Menu, Modal } from 'antd';
import axios from 'axios';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { BookingStatus, BookingStatusColors } from '../bookingStatus';
import { BookingType } from '../bookingEnums';
import { getVehicleCategoryText } from '../../../config/enum/enum';
import LocationModal from '../../../components/modals/LocationModal';
import EngineIgnitionModal from '../../../components/modals/EngineIgnitionModal';
import { getItem } from '../../../utility/localStorageControl';
import { getAvailableOwnershipActions, getOwnershipActionLabel } from '../ownershipActionHelper';

const val = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

const GroupItem = ({ label, value }) => (
  <div>
    <strong>{label}:</strong> {value}
  </div>
);

const renderVerificationLabel = (status) => {
  const numericStatus = Number(status);
  if (numericStatus === 2) return <PlainLabel color="success">Approved</PlainLabel>;
  if (numericStatus === 1) return <PlainLabel color="warning">Pending Approval</PlainLabel>;
  return <PlainLabel color="red">Not Initiated</PlainLabel>;
};

GroupItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
};

const vendorActionKeys = new Set(['assignVendor', 'confirmVendor', 'markNotInStock', 'dispatch', 'deliver']);

const normalizeStatusToken = (value) =>
  String(value ?? '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();

const bookingStatusReverseMap = Object.entries(BookingStatus).reduce((acc, [key, label]) => {
  acc[normalizeStatusToken(label)] = Number(key);
  return acc;
}, {});

const resolveBookingStatusMeta = (status) => {
  if (status === null || status === undefined || status === '') {
    return { label: '-', color: 'default', numeric: null };
  }

  const numeric = Number(status);
  if (!Number.isNaN(numeric) && BookingStatus[numeric] !== undefined) {
    return {
      label: BookingStatus[numeric],
      color: BookingStatusColors[numeric] || 'default',
      numeric,
    };
  }

  const reverseNumeric = bookingStatusReverseMap[normalizeStatusToken(status)];
  if (reverseNumeric !== undefined) {
    return {
      label: BookingStatus[reverseNumeric],
      color: BookingStatusColors[reverseNumeric] || 'default',
      numeric: reverseNumeric,
    };
  }

  return { label: String(status), color: 'default', numeric: null };
};

function BookingList({
  bookings,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  getData,
  ownershipFulfilmentByBooking,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ignitionModalVisible, setIgnitionModalVisible] = useState(false);
  const [selectedIgnitionBooking, setSelectedIgnitionBooking] = useState(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedNotesBooking, setSelectedNotesBooking] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState([]);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [selectedDocumentsBooking, setSelectedDocumentsBooking] = useState(null);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${getItem('access_token')}`,
    },
  });

  const handleLocationOpen = useCallback((record) => {
    setSelectedBooking(record);
    setLocationModalVisible(true);
  }, []);

  const handleLocationClose = () => {
    setLocationModalVisible(false);
    setSelectedBooking(null);
  };

  const handleIgnitionOpen = useCallback((record) => {
    setSelectedIgnitionBooking(record);
    setIgnitionModalVisible(true);
  }, []);

  const handleIgnitionClose = () => {
    setIgnitionModalVisible(false);
    setSelectedIgnitionBooking(null);
  };

  const handleNotesOpen = useCallback(async (record) => {
    setSelectedNotesBooking(record);
    setNotesModalVisible(true);
    setNotesLoading(true);
    setBookingNotes([]);

    try {
      const response = await axios.get(`${getApiUrl()}/api${API.booking.path}/${record.id}/notes`, getHeaders());
      const notes = Array.isArray(response.data) ? response.data : [];
      setBookingNotes(notes);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Failed to load booking notes';
      message.error(errorMessage);
      setBookingNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const handleNotesClose = () => {
    setNotesModalVisible(false);
    setSelectedNotesBooking(null);
    setBookingNotes([]);
    setNotesLoading(false);
  };

  const handleDocumentsOpen = useCallback((record) => {
    setSelectedDocumentsBooking(record);
    setDocName('');
    setDocDescription('');
    setDocFile(null);
    setDocumentsModalVisible(true);
  }, []);

  const handleDocumentsClose = () => {
    if (docUploading) return;
    setDocumentsModalVisible(false);
    setSelectedDocumentsBooking(null);
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
    if (!selectedDocumentsBooking?.id) {
      message.error('Booking is required');
      return;
    }

    if (!docName.trim()) {
      message.error('Document Name is required');
      return;
    }

    if (!docFile) {
      message.error('Please choose a file to upload');
      return;
    }

    try {
      setDocUploading(true);
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('documentType', 99);
      formData.append('side', 1);
      formData.append('name', docName.trim());
      formData.append('description', docDescription?.trim() || '');
      formData.append('file', docFile);

      await axios.post(`${apiUrl}/api${API.document.path}/booking/${selectedDocumentsBooking.id}`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Booking document uploaded successfully');
      handleDocumentsClose();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to upload booking document');
    } finally {
      setDocUploading(false);
    }
  };

  const isOwnershipBooking = (record) => {
    const typeValue = record?.bookingType;
    if (typeValue === undefined || typeValue === null) return false;
    if (Number(typeValue) === 1) return true;
    const normalized = String(typeValue).toLowerCase();
    return normalized === 'ownership';
  };

  const isRentalBooking = (record) => {
    const typeValue = record?.bookingType;
    if (typeValue === undefined || typeValue === null) return false;
    if (Number(typeValue) === 0) return true;
    const normalized = String(typeValue).toLowerCase();
    return normalized === 'rental';
  };

  const handleDelete = useCallback(
    (bookingId) => {
      message.destroy();
      dispatch(
        axiosDataDelete({
          path: API.booking.path,
          id: bookingId,
          getData: () => getData(currentPage, pageSize),
        }),
      );
    },
    [dispatch, currentPage, pageSize, getData],
  );

  const confirmDelete = useCallback(
    (bookingId) => {
      Modal.confirm({
        title: 'Are you sure you want to delete this booking?',
        okText: 'Yes',
        cancelText: 'No',
        okType: 'danger',
        onOk: () => handleDelete(bookingId),
      });
    },
    [handleDelete],
  );

  const hasRentalRows = bookings.some((booking) => isRentalBooking(booking));
  const hasOwnershipRows = bookings.some((booking) => isOwnershipBooking(booking));

  const navigateToFulfilment = (record, fulfilment) => {
    if (fulfilment?.id) {
      navigate(`/admin/order-fulfilment/detail/${fulfilment.id}`, { state: { fulfilment, booking: record } });
      return;
    }

    navigate(`/admin/order-fulfilment/booking/${record.id}`, { state: { booking: record } });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Type',
      dataIndex: 'bookingType',
      key: 'bookingType',
      width: 110,
      align: 'center',
      render: (bookingType) => {
        const bookingTypeLabel =
          BookingType[bookingType] ||
          (Number(bookingType) === 1 ? 'Ownership' : Number(bookingType) === 0 ? 'Rental' : '-');
        return <PlainLabel color={Number(bookingType) === 1 ? 'cyan' : 'blue'}>{bookingTypeLabel}</PlainLabel>;
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 230,
      render: (_, record) => (
        <div>
          <GroupItem label="CID" value={val(record.customerId)} />
          <GroupItem
            label="Name"
            value={
              `${record.firstName || ''} ${record.lastName || ''}`.trim()
                ? `${record.firstName || ''} ${record.lastName || ''}`.trim()
                : '-'
            }
          />
          <GroupItem
            label="Contact"
            value={`${val(record.phoneNumber)} | DL: ${record.hasDrivingLicense ? 'Yes' : 'No'}`}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>KYC:</span>
            {renderVerificationLabel(record.customerKycStatus)}
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>DL:</span>
            {renderVerificationLabel(record.customerDLStatus)}
          </div>
        </div>
      ),
    },
    {
      title: 'Station',
      key: 'station',
      width: 190,
      render: (_, record) => (
        <div>
          <GroupItem label="ID" value={val(record.stationId)} />
          <GroupItem label="Name" value={val(record.stationName)} />
        </div>
      ),
    },
    {
      title: 'Vehicle Category',
      dataIndex: 'vehicleCategory',
      key: 'vehicleCategory',
      width: 140,
      align: 'center',
      render: (vehicleCategory) => getVehicleCategoryText(vehicleCategory),
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 180,
      render: (_, record) => (
        <div>
          <GroupItem label="ID" value={val(record.vehicleId)} />
          <GroupItem label="Model" value={val(record.vehicleModelName)} />
          <GroupItem label="Name" value={val(record.vehicleName)} />
          <GroupItem
            label="Reg"
            value={val(record.vehicleRegisterationNumber || record.registerationNumber || record.registrationNumber)}
          />
          <GroupItem label="Assigned" value={record.isVehicleAssigned ? 'Yes' : 'No'} />
        </div>
      ),
    },
    ...(hasRentalRows
      ? [
          {
            title: 'Rental',
            key: 'rental',
            width: 200,
            render: (_, record) =>
              isRentalBooking(record) ? (
                <div>
                  <GroupItem label="Plan ID" value={val(record.rentalPlanId)} />
                  <GroupItem label="Plan" value={val(record.rentalPlanName)} />
                  <GroupItem label="KM" value={val(record.kmLimit)} />
                </div>
              ) : (
                '-'
              ),
          },
        ]
      : []),
    ...(hasOwnershipRows
      ? [
          {
            title: 'Ownership',
            key: 'ownership',
            width: 210,
            render: (_, record) =>
              isOwnershipBooking(record) ? (
                <div>
                  <GroupItem label="Plan ID" value={val(record.ownershipPlanId)} />
                  <GroupItem label="Plan" value={val(record.ownershipPlanName)} />
                </div>
              ) : (
                '-'
              ),
          },
          {
            title: 'Catalogue',
            key: 'catalogue',
            width: 190,
            render: (_, record) =>
              isOwnershipBooking(record) && record.vehicleCatalogueId != null ? (
                <div>
                  <GroupItem label="ID" value={val(record.vehicleCatalogueId)} />
                  <GroupItem label="Name" value={val(record.vehicleCatalogueName)} />
                </div>
              ) : (
                '-'
              ),
          },
        ]
      : []),
    {
      title: 'Pricing',
      key: 'pricing',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <div>
          <GroupItem label="Base" value={val(record.totalPrice)} />
          <GroupItem label="GST" value={val(record.gstAmount)} />
          <GroupItem label="Total" value={val(record.totalPriceWithGST)} />
        </div>
      ),
    },
    {
      title: 'Fees And Payments',
      key: 'feesAndPayments',
      width: 190,
      align: 'right',
      render: (_, record) => (
        <div>
          <GroupItem label="Security" value={val(record.securityAmount)} />
          <GroupItem label="Booking Fee" value={val(record.bookingFee)} />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => {
        const statusMeta = resolveBookingStatusMeta(status);
        return <PlainLabel color={statusMeta.color}>{statusMeta.label}</PlainLabel>;
      },
      filters: Object.keys(BookingStatus).map((key) => ({
        text: BookingStatus[key],
        value: parseInt(key),
      })),
      onFilter: (value, record) => resolveBookingStatusMeta(record.status).numeric === Number(value),
    },
    {
      title: 'Dates',
      key: 'dates',
      width: 190,
      render: (_, record) => (
        <div>
          <GroupItem
            label="Book"
            value={record.bookingDate ? moment(record.bookingDate).format('YYYY-MM-DD HH:mm') : '-'}
          />
          <GroupItem
            label={isRentalBooking(record) ? 'Plan Expiry' : 'Plan Maturity'}
            value={
              isRentalBooking(record)
                ? record.planExpiryDate
                  ? moment(record.planExpiryDate).format('YYYY-MM-DD HH:mm')
                  : '-'
                : record.planMaturityDate
                  ? moment(record.planMaturityDate).format('YYYY-MM-DD HH:mm')
                  : '-'
            }
          />
        </div>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (time) => (time ? moment(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (text, record) => {
        // Determine if Track Vehicle should be enabled
        const hasVehicleId = record.vehicleId != null && record.vehicleId !== '';
        const hasAlternateVehicleId = record.alternateVehicleId != null && record.alternateVehicleId !== '';
        const canTrackVehicle = hasVehicleId || hasAlternateVehicleId;
        const fulfilment = ownershipFulfilmentByBooking?.[record.id] || null;
        const ownershipActions = isOwnershipBooking(record)
          ? getAvailableOwnershipActions(record, fulfilment).filter((action) => action !== 'viewFulfilment')
          : [];
        const primaryOwnershipAction = ownershipActions.find((action) => action !== 'cancel') || ownershipActions[0];
        const isBackroomFlow = Number(fulfilment?.fulfilmentSource) === 0;

        return (
          <Dropdown
            trigger={['click']}
            getPopupContainer={(triggerNode) => triggerNode?.ownerDocument?.body || document.body}
            overlay={
              <Menu triggerSubMenuAction="click" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Menu.Item
                  key="vehicle-handover"
                  onClick={() => navigate(`/admin/booking/handover/${record.id}`, { state: { booking: record } })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FeatherIcon icon="truck" size={14} />
                  Vehilce Handover
                </Menu.Item>
                <Menu.Item
                  key="vehicle-return"
                  disabled={!isRentalBooking(record)}
                  onClick={() =>
                    isRentalBooking(record) &&
                    navigate(`/admin/booking/vehicle-return/${record.id}`, { state: { booking: record } })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: !isRentalBooking(record) ? '#d9d9d9' : undefined,
                  }}
                >
                  <FeatherIcon icon="rotate-ccw" size={14} />
                  Vehicle Return
                </Menu.Item>
                <Menu.Item
                  key="ownership-transfer"
                  disabled={!isOwnershipBooking(record)}
                  onClick={() =>
                    isOwnershipBooking(record) &&
                    navigate(`/admin/booking/ownership-transfer/${record.id}`, { state: { booking: record } })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: !isOwnershipBooking(record) ? '#d9d9d9' : undefined,
                  }}
                >
                  <FeatherIcon icon="repeat" size={14} />
                  Ownership Transfer
                </Menu.Item>
                {isOwnershipBooking(record) && (
                  <>
                    <Menu.Divider />
                    <Menu.SubMenu
                      key={`ownership-fulfilment-${record.id}`}
                      title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FeatherIcon icon="clipboard" size={14} />
                          Ownership Fulfilment
                        </span>
                      }
                    >
                      <Menu.Item
                        key={`order-fulfilment-${record.id}`}
                        onClick={() => navigateToFulfilment(record, fulfilment)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <FeatherIcon icon="clipboard" size={14} />
                        {fulfilment?.id ? 'View Order Fulfilment' : 'Create Order Fulfilment'}
                      </Menu.Item>
                      {primaryOwnershipAction && (
                        <Menu.Item
                          key={`order-fulfilment-next-${record.id}`}
                          onClick={() => navigateToFulfilment(record, fulfilment)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <FeatherIcon icon="play" size={14} />
                          {`Next: ${getOwnershipActionLabel(primaryOwnershipAction)}`}
                        </Menu.Item>
                      )}
                      {isBackroomFlow && (
                        <Menu.Item key={`order-fulfilment-backroom-${record.id}`} disabled>
                          Backroom source: vendor actions hidden
                        </Menu.Item>
                      )}
                      {isBackroomFlow &&
                        ownershipActions
                          .filter((action) => !vendorActionKeys.has(action))
                          .map((action) => (
                            <Menu.Item key={`order-fulfilment-action-${record.id}-${action}`} disabled>
                              {getOwnershipActionLabel(action)}
                            </Menu.Item>
                          ))}
                    </Menu.SubMenu>
                  </>
                )}
                <Menu.Divider />
                <Menu.SubMenu
                  key={`booking-actions-${record.id}`}
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FeatherIcon icon="folder" size={14} />
                      Booking Actions
                    </span>
                  }
                >
                  <Menu.Item
                    key={`documents-${record.id}`}
                    onClick={() => handleDocumentsOpen(record)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <FeatherIcon icon="paperclip" size={14} />
                    Documents
                  </Menu.Item>
                  <Menu.Item
                    key={`notes-${record.id}`}
                    onClick={() => handleNotesOpen(record)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <FeatherIcon icon="file-text" size={14} />
                    Notes
                  </Menu.Item>
                  <Menu.Item
                    key={`view-${record.id}`}
                    onClick={() => navigate(`/admin/booking/detail/${record.id}`, { state: { booking: record } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <FeatherIcon icon="eye" size={14} />
                    View
                  </Menu.Item>
                  <Menu.Item
                    key={`delete-${record.id}`}
                    danger
                    onClick={() => confirmDelete(record.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <FeatherIcon icon="trash-2" size={14} />
                    Delete
                  </Menu.Item>
                </Menu.SubMenu>
                <Menu.Divider />
                <Menu.Item
                  key="track-vehicle"
                  disabled={!canTrackVehicle}
                  onClick={() => canTrackVehicle && handleLocationOpen(record)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: !canTrackVehicle ? '#d9d9d9' : undefined,
                  }}
                >
                  <FeatherIcon icon="map-pin" size={14} />
                  Track Vehicle
                </Menu.Item>
                <Menu.Item
                  key="vehicle-ignition"
                  disabled={!canTrackVehicle}
                  onClick={() => canTrackVehicle && handleIgnitionOpen(record)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: !canTrackVehicle ? '#d9d9d9' : undefined,
                  }}
                >
                  <FeatherIcon icon="power" size={14} />
                  Vehicle Ignition
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small" type="light" outlined style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FeatherIcon icon="more-vertical" size={14} />
              Actions
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
        dataSource={bookings}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 2400 }}
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

      {selectedBooking && (
        <LocationModal
          visible={locationModalVisible}
          onCancel={handleLocationClose}
          vehicle={{
            id: selectedBooking.vehicleId || selectedBooking.alternateVehicleId,
            name: selectedBooking.vehicleName || 'Unknown',
            gPRSIMEIID: selectedBooking.gPRSIMEIID,
            gPRSID: selectedBooking.gPRSID,
          }}
          vehicleId={selectedBooking.vehicleId || selectedBooking.alternateVehicleId}
          title={`Track Vehicle - Booking #${selectedBooking.id}`}
        />
      )}

      {selectedIgnitionBooking && (
        <EngineIgnitionModal
          visible={ignitionModalVisible}
          onCancel={handleIgnitionClose}
          scooterId={
            selectedIgnitionBooking.scooterId ||
            selectedIgnitionBooking.alternateScooterId ||
            selectedIgnitionBooking.vehicleId ||
            selectedIgnitionBooking.alternateVehicleId
          }
          title={`Vehicle Ignition - Booking #${selectedIgnitionBooking.id}`}
        />
      )}

      <Modal
        title={`Notes - Booking #${selectedNotesBooking?.id || ''}`}
        open={notesModalVisible}
        onCancel={handleNotesClose}
        footer={null}
        width={820}
        destroyOnClose
      >
        <Table
          rowKey={(record, index) => `${record.updatedAt || ''}-${record.action || ''}-${index}`}
          dataSource={bookingNotes}
          loading={notesLoading}
          pagination={false}
          locale={{ emptyText: notesLoading ? 'Loading notes...' : 'No notes found' }}
          columns={[
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              width: 180,
              render: (value) => val(value),
            },
            {
              title: 'Notes',
              dataIndex: 'notes',
              key: 'notes',
              render: (value) => val(value),
            },
            {
              title: 'Updated At',
              dataIndex: 'updatedAt',
              key: 'updatedAt',
              width: 200,
              render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm') : '-'),
            },
          ]}
        />
      </Modal>

      <Modal
        open={documentsModalVisible}
        onCancel={handleDocumentsClose}
        onOk={handleUploadDocument}
        okText="Upload"
        confirmLoading={docUploading}
        title={
          selectedDocumentsBooking
            ? `Upload Booking Document - #${selectedDocumentsBooking.id}`
            : 'Upload Booking Document'
        }
        destroyOnClose
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Type</label>
            <input
              type="text"
              value="Others"
              disabled
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Name</label>
            <input
              type="text"
              value={docName}
              onChange={(event) => setDocName(event.target.value)}
              placeholder="Enter document name"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
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
    </div>
  );
}

BookingList.propTypes = {
  bookings: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
  ownershipFulfilmentByBooking: PropTypes.object,
};

BookingList.defaultProps = {
  ownershipFulfilmentByBooking: {},
};

export default BookingList;
