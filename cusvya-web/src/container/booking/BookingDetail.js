import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Empty, Spin, message, Modal } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import PlainLabel from '../../components/labels/plain-label';
import { BookingStatus } from './bookingStatus';
import { BookingType } from './bookingEnums';
import { getVehicleCategoryText } from '../../config/enum/enum';
import { getItem } from '../../utility/localStorageControl';
import { getAvailableOwnershipActions, getOwnershipActionLabel } from './ownershipActionHelper';
import { getOwnershipFulfilments } from '../ownership-fulfilment/ownershipFulfilmentService';

const BOOKING_DOCUMENT_TYPES = {
  7: 'Ownership Transfer Certificate',
  8: 'Non Objection Certificate',
  99: 'Others',
};

const getDocumentTypeText = (documentType) => BOOKING_DOCUMENT_TYPES[Number(documentType)] || `Type ${documentType}`;

const getDocumentSideText = (side) => {
  const value = Number(side);
  if (value === 1) return 'Front';
  if (value === 2) return 'Back';
  return 'Unknown';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

const formatBookingStatus = (value) => BookingStatus[value] || formatValue(value);
const formatBookingType = (value) => BookingType[value] || formatValue(value);
const formatVehicleCategory = (value) => getVehicleCategoryText(value);
const formatVerificationStatus = (value) => {
  const numericValue = Number(value);
  if (numericValue === 2) return <PlainLabel color="success">Approved</PlainLabel>;
  if (numericValue === 1) return <PlainLabel color="warning">Pending Approval</PlainLabel>;
  return <PlainLabel color="red">Not Initiated</PlainLabel>;
};

const FieldGroup = ({ title, fields, data }) => (
  <Cards title={title} headless={false}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {fields.map((field) => (
        <div key={field.key} style={{ padding: '8px 10px', border: '1px solid #f0f0f0', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{field.label}</div>
          <div style={{ fontWeight: 600 }}>
            {field.formatter ? field.formatter(data[field.key]) : formatValue(data[field.key])}
          </div>
        </div>
      ))}
    </div>
  </Cards>
);

function BookingDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [ownershipFulfilment, setOwnershipFulfilment] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!id) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/api/Booking/${id}`, {
          headers: getHeaders(),
        });
        setBooking(response.data || null);
      } catch (error) {
        message.error(error.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const refreshDocuments = async (bookingId) => {
    if (!bookingId) {
      setDocuments([]);
      return;
    }

    try {
      setDocumentsLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Document/booking/${bookingId}`, {
        headers: getHeaders(),
      });
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setDocuments([]);
      message.error(error.response?.data?.message || 'Failed to load booking documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    const bookingId = booking?.id || id;
    if (!bookingId) return;
    refreshDocuments(bookingId);
  }, [booking?.id, id]);

  const handleDownloadDocument = async (documentId, originalFileName) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Document/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = originalFileName || `document_${documentId}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to download document');
    }
  };

  const handlePrintDocument = async (documentId) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Document/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const sourceBlob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const pdfBytes = await sourceBlob.arrayBuffer();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const iframe = window.document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            iframe.remove();
          }, 10000);
        }
      };

      iframe.onerror = () => {
        window.URL.revokeObjectURL(blobUrl);
        iframe.remove();
        message.error('Failed to load document for printing');
      };

      iframe.src = blobUrl;
      window.document.body.appendChild(iframe);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to print document');
    }
  };

  const handleDeleteDocument = (documentId) => {
    Modal.confirm({
      title: 'Delete Document',
      content: 'Are you sure you want to delete this document?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeletingDocumentId(documentId);
          const token = getItem('access_token');
          const apiUrl = getApiUrl();
          await axios.delete(`${apiUrl}/api/Document/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Document deleted successfully');
          await refreshDocuments(booking?.id || id);
        } catch (error) {
          message.error(error?.response?.data?.message || error?.message || 'Failed to delete document');
        } finally {
          setDeletingDocumentId(null);
        }
      },
    });
  };

  const isRentalBooking =
    Number(booking?.bookingType) === 0 || String(booking?.bookingType || '').toLowerCase() === 'rental';
  const isOwnershipBooking =
    Number(booking?.bookingType) === 1 || String(booking?.bookingType || '').toLowerCase() === 'ownership';
  const bookingIdForActions = booking?.id || id;

  useEffect(() => {
    const loadOwnershipFulfilment = async () => {
      if (!isOwnershipBooking || !bookingIdForActions) {
        setOwnershipFulfilment(null);
        return;
      }

      try {
        const fulfilments = await getOwnershipFulfilments();
        const matched = (Array.isArray(fulfilments) ? fulfilments : []).find(
          (item) => Number(item.bookingId) === Number(bookingIdForActions),
        );
        setOwnershipFulfilment(matched || null);
      } catch (error) {
        setOwnershipFulfilment(null);
      }
    };

    loadOwnershipFulfilment();
  }, [isOwnershipBooking, bookingIdForActions]);

  const ownershipActions = useMemo(() => {
    if (!isOwnershipBooking) return [];
    return getAvailableOwnershipActions(booking, ownershipFulfilment).filter((action) => action !== 'viewFulfilment');
  }, [booking, ownershipFulfilment, isOwnershipBooking]);

  const ownershipPrimaryAction = useMemo(
    () => ownershipActions.find((action) => action !== 'cancel') || ownershipActions[0],
    [ownershipActions],
  );

  const ownershipIsBackroom = Number(ownershipFulfilment?.fulfilmentSource) === 0;

  const navigateToOrderFulfilment = () => {
    if (!isOwnershipBooking) return;
    if (ownershipFulfilment?.id) {
      navigate(`/admin/order-fulfilment/detail/${ownershipFulfilment.id}`, {
        state: { fulfilment: ownershipFulfilment, booking },
      });
      return;
    }
    navigate(`/admin/order-fulfilment/booking/${bookingIdForActions}`, { state: { booking } });
  };

  const sections = [
    {
      title: 'Booking',
      fields: [
        { key: 'id', label: 'Booking ID' },
        { key: 'bookingType', label: 'Booking Type', formatter: formatBookingType },
        { key: 'status', label: 'Status', formatter: formatBookingStatus },
      ],
    },
    {
      title: 'Customer',
      fields: [
        { key: 'customerId', label: 'Customer ID' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'phoneNumber', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'customerKycStatus', label: 'KYC Status', formatter: formatVerificationStatus },
        { key: 'customerDLStatus', label: 'Driving Licence Status', formatter: formatVerificationStatus },
        { key: 'hasDrivingLicense', label: 'Driving License' },
      ],
    },
    {
      title: 'Station & Vehicle',
      fields: [
        { key: 'stationId', label: 'Station ID' },
        { key: 'stationName', label: 'Station Name' },
        { key: 'vehicleId', label: 'Vehicle ID' },
        { key: 'alternateVehicleId', label: 'Alternate Vehicle ID' },
        { key: 'vehicleName', label: 'Vehicle Name' },
        { key: 'alternateVehicleName', label: 'Alternate Vehicle Name' },
        { key: 'vehicleRegisterationNumber', label: 'Vehicle Registration' },
        { key: 'vehicleModelId', label: 'Vehicle Model ID' },
        { key: 'vehicleModelName', label: 'Vehicle Model Name' },
        { key: 'vehicleCategory', label: 'Vehicle Category', formatter: formatVehicleCategory },
        { key: 'isUsedVehicle', label: 'Used Vehicle' },
        { key: 'isVehicleAssigned', label: 'Vehicle Assigned' },
      ],
    },
    {
      title: 'Plans',
      fields: [
        { key: 'rentalPlanId', label: 'Rental Plan ID' },
        { key: 'rentalPlanName', label: 'Rental Plan Name' },
        { key: 'rentalPlanDetailId', label: 'Rental Plan Detail ID' },
        { key: 'kmLimit', label: 'KM Limit' },
        { key: 'ownershipPlanId', label: 'Ownership Plan ID' },
        { key: 'ownershipPlanName', label: 'Ownership Plan Name' },
        { key: 'vehicleCatalogueId', label: 'Vehicle Catalogue ID' },
        { key: 'vehicleCatalogueName', label: 'Vehicle Catalogue Name' },
      ],
    },
    {
      title: 'Pricing',
      fields: [
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'totalPriceWithGST', label: 'Total With GST' },
        { key: 'gstAmount', label: 'GST Amount' },
        { key: 'securityAmount', label: 'Security Amount' },
        { key: 'bookingFee', label: 'Booking Fee' },
        { key: 'pricePerDay', label: 'Price Per Day' },
        { key: 'extraKMAccrued', label: 'Extra KM Accrued' },
        { key: 'extraKMDriven', label: 'Extra KM Driven' },
        { key: 'kmDriven', label: 'KM Driven' },
      ],
    },
    {
      title: 'Ownership Pricing & Repayments',
      fields: [
        { key: 'bikePrice', label: 'Bike Price' },
        { key: 'maintenanceCost', label: 'Maintenance Cost' },
        { key: 'insuranceCost', label: 'Insurance Cost' },
        { key: 'serviceCharges', label: 'Service Charges' },
        { key: 'lastPaymentAmount', label: 'Last Payment Amount' },
        { key: 'nextPaymentAmount', label: 'Next Payment Amount' },
        { key: 'repaymentAmount', label: 'Repayment Amount' },
        { key: 'arrearsAmount', label: 'Arrears Amount' },
        { key: 'paymentFrequency', label: 'Payment Frequency' },
        { key: 'totalRepayments', label: 'Total Repayments' },
        { key: 'pendingRepayments', label: 'Pending Repayments' },
        { key: 'completedRepayments', label: 'Completed Repayments' },
      ],
    },
    {
      title: 'Dates',
      fields: [
        { key: 'vehicleAssignedDate', label: 'Vehicle Assigned Date', formatter: formatDate },
        { key: 'nextPaymentDate', label: 'Next Payment Date', formatter: formatDate },
        { key: 'bookingDate', label: 'Booking Date', formatter: formatDate },
        { key: 'startDate', label: 'Start Date', formatter: formatDate },
        { key: 'endDate', label: 'End Date', formatter: formatDate },
        { key: 'planMaturityDate', label: 'Plan Maturity Date', formatter: formatDate },
        { key: 'planExpiryDate', label: 'Plan Expiry Date', formatter: formatDate },
        { key: 'estimatedDelivaryDate', label: 'Estimated Delivery Date', formatter: formatDate },
        { key: 'durationInDays', label: 'Duration (Days)' },
      ],
    },
    {
      title: 'Audit',
      fields: [
        { key: 'completedAt', label: 'Completed At', formatter: formatDate },
        { key: 'cancelledAt', label: 'Cancelled At', formatter: formatDate },
        { key: 'cancellationReason', label: 'Cancellation Reason' },
        { key: 'createdAt', label: 'Created At', formatter: formatDate },
        { key: 'lastUpdatedAt', label: 'Last Updated At', formatter: formatDate },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title={`Booking Details${id ? ` #${id}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate(`/admin/booking/handover/${bookingIdForActions}`, { state: { booking } })}
              style={{
                background: '#1890ff',
                border: '1px solid #1890ff',
                color: '#fff',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FeatherIcon icon="truck" size={14} />
              Vehilce Handover
            </button>
            <button
              type="button"
              onClick={() =>
                isRentalBooking &&
                navigate(`/admin/booking/vehicle-return/${bookingIdForActions}`, { state: { booking } })
              }
              disabled={!isRentalBooking}
              style={{
                background: isRentalBooking ? '#13c2c2' : '#f5f5f5',
                border: isRentalBooking ? '1px solid #13c2c2' : '1px solid #d9d9d9',
                color: isRentalBooking ? '#fff' : '#bfbfbf',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: isRentalBooking ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FeatherIcon icon="rotate-ccw" size={14} />
              Vehicle Return
            </button>
            <button
              type="button"
              onClick={() =>
                isOwnershipBooking &&
                navigate(`/admin/booking/ownership-transfer/${bookingIdForActions}`, { state: { booking } })
              }
              disabled={!isOwnershipBooking}
              style={{
                background: isOwnershipBooking ? '#722ed1' : '#f5f5f5',
                border: isOwnershipBooking ? '1px solid #722ed1' : '1px solid #d9d9d9',
                color: isOwnershipBooking ? '#fff' : '#bfbfbf',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: isOwnershipBooking ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FeatherIcon icon="repeat" size={14} />
              Ownership Transfer
            </button>
            <button
              type="button"
              onClick={navigateToOrderFulfilment}
              disabled={!isOwnershipBooking}
              style={{
                background: isOwnershipBooking ? '#fa8c16' : '#f5f5f5',
                border: isOwnershipBooking ? '1px solid #fa8c16' : '1px solid #d9d9d9',
                color: isOwnershipBooking ? '#fff' : '#bfbfbf',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: isOwnershipBooking ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FeatherIcon icon="clipboard" size={14} />
              {ownershipFulfilment?.id ? 'View Order Fulfilment' : 'Create Order Fulfilment'}
            </button>
            {isOwnershipBooking && ownershipPrimaryAction && (
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#595959',
                  background: '#fafafa',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FeatherIcon icon="activity" size={14} />
                {`Next: ${getOwnershipActionLabel(ownershipPrimaryAction)}`}
                {ownershipIsBackroom ? ' (Backroom flow)' : ''}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/admin/booking/list')}
              style={{
                background: 'none',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FeatherIcon icon="arrow-left" size={14} />
              Back to List
            </button>
          </div>,
        ]}
      />
      <Main>
        {loading ? (
          <Cards headless>
            <div className="spin">
              <Spin size="large" />
            </div>
          </Cards>
        ) : !booking ? (
          <Cards headless>
            <Empty
              description="Booking details are not available. Open details from the booking list."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Cards>
        ) : (
          <Row gutter={16}>
            {sections.map((section) => (
              <Col xs={24} key={section.title} style={{ marginBottom: 16 }}>
                <FieldGroup title={section.title} fields={section.fields} data={booking} />
              </Col>
            ))}
            <Col xs={24} style={{ marginBottom: 16 }}>
              <Cards
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Booking Documents</span>
                    <button
                      type="button"
                      onClick={() => refreshDocuments(booking?.id || id)}
                      style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        padding: '4px 10px',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                }
                headless={false}
              >
                {documentsLoading ? (
                  <div className="spin">
                    <Spin size="default" />
                  </div>
                ) : documents.length === 0 ? (
                  <Empty description="No booking documents found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Row gutter={[16, 16]}>
                    {documents.map((doc) => (
                      <Col xs={24} md={12} lg={8} key={doc.id}>
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {doc.name || getDocumentTypeText(doc.documentType)}
                          </div>
                          <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                            Type: {getDocumentTypeText(doc.documentType)} | Side: {getDocumentSideText(doc.side)}
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 10 }}>
                            Uploaded: {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-'}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(doc.id, doc.originalFileName)}
                              style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: 6,
                                padding: '4px 8px',
                                background: '#fff',
                              }}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintDocument(doc.id)}
                              style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: 6,
                                padding: '4px 8px',
                                background: '#fff',
                              }}
                            >
                              Print
                            </button>
                            <button
                              type="button"
                              disabled={deletingDocumentId === doc.id}
                              onClick={() => handleDeleteDocument(doc.id)}
                              style={{
                                border: '1px solid #ffccc7',
                                borderRadius: 6,
                                padding: '4px 8px',
                                background: '#fff1f0',
                                color: '#cf1322',
                                cursor: deletingDocumentId === doc.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {deletingDocumentId === doc.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Cards>
            </Col>
          </Row>
        )}
      </Main>
    </>
  );
}

export default BookingDetail;
