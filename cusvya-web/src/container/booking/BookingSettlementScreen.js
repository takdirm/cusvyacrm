import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Table, Spin, Empty, Input, message, Modal, Form, InputNumber, Checkbox } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { API } from '../../config/api/index';
import { getItem } from '../../utility/localStorageControl';
import { DataService } from '../../config/dataService/dataService';
import { BookingStatus, BookingType } from './bookingEnums';

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

const val = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

const normalizeEnumKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

function BookingSettlementScreen({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isRentalMode = mode === 'rental';
  const isBookingIdFromUrl = Boolean(id);
  const initialBookingId = String(id || location.state?.booking?.id || '').trim();

  const [bookingIdInput, setBookingIdInput] = useState(initialBookingId);
  const [activeBookingId, setActiveBookingId] = useState(initialBookingId);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [closureQuotation, setClosureQuotation] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingClosure, setLoadingClosure] = useState(false);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [settlementSubmitting, setSettlementSubmitting] = useState(false);
  const [bookingDocuments, setBookingDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [settlementForm] = Form.useForm();
  const [bookingAccessories, setBookingAccessories] = useState([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [updatingAccessories, setUpdatingAccessories] = useState(false);

  const screenTitle = isRentalMode ? 'Vehicle Return' : 'Ownership Transfer';

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

  const handleApiError = useCallback((error, fallbackMessage) => {
    const statusCode = Number(error?.response?.status);
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error.response.data : null) ||
      error?.message ||
      fallbackMessage;

    if (statusCode === 400 || /status code 400/i.test(error?.message || '')) {
      message.destroy();
      Modal.error({
        title: 'Errored',
        content: errorMessage,
      });
      return;
    }

    message.error(errorMessage);
  }, []);

  const isOwnershipBooking = useMemo(() => {
    const typeValue = booking?.bookingType;
    if (typeValue === undefined || typeValue === null) return false;
    if (Number(typeValue) === 1) return true;
    const normalized = String(typeValue).toLowerCase();
    return normalized === 'ownership' || normalized === String(BookingType[1]).toLowerCase();
  }, [booking]);

  const isRentalBooking = useMemo(() => {
    const typeValue = booking?.bookingType;
    if (typeValue === undefined || typeValue === null) return false;
    if (Number(typeValue) === 0) return true;
    const normalized = String(typeValue).toLowerCase();
    return normalized === 'rental' || normalized === String(BookingType[0]).toLowerCase();
  }, [booking]);

  const isExpectedBookingType = isRentalMode ? isRentalBooking : isOwnershipBooking;

  const isCompletedBookingStatus = useMemo(() => {
    const statusNumber = Number(booking?.status);
    if (!Number.isNaN(statusNumber)) return statusNumber === 7;
    return normalizeEnumKey(BookingStatus[booking?.status] || booking?.status) === 'completed';
  }, [booking]);

  const isEligibleForDocumentActions = useMemo(() => {
    const statusNumber = Number(booking?.status);
    if (!Number.isNaN(statusNumber)) return [7, 9, 16].includes(statusNumber);
    const normalized = normalizeEnumKey(BookingStatus[booking?.status] || booking?.status);
    return ['completed', 'cancelled', 'earlysettlementcompleted'].includes(normalized);
  }, [booking]);

  const isOwnershipCompleted = !isRentalMode && isCompletedBookingStatus;
  const isEarlySettlementCompleted = isRentalMode && Number(booking?.status) === 16;
  const isSettlementDisabled = isOwnershipCompleted || isEarlySettlementCompleted;

  const fetchBooking = useCallback(
    async (bookingIdToLoad) => {
      if (!bookingIdToLoad) return;
      try {
        setLoadingBooking(true);
        const response = await axios.get(`${getApiUrl()}/api${API.booking.path}/${bookingIdToLoad}`, getHeaders());
        setBooking(response.data || null);
      } catch (error) {
        setBooking(null);
        handleApiError(error, 'Failed to load booking details');
      } finally {
        setLoadingBooking(false);
      }
    },
    [handleApiError],
  );

  const fetchClosureQuotation = useCallback(
    async (bookingIdToLoad) => {
      if (!bookingIdToLoad) {
        setClosureQuotation(null);
        return;
      }
      try {
        setLoadingClosure(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.booking.path}/${bookingIdToLoad}/closure-quotation`,
          getHeaders(),
        );
        setClosureQuotation(response.data || null);
      } catch (error) {
        setClosureQuotation(null);
        handleApiError(error, 'Failed to load closure quotation');
      } finally {
        setLoadingClosure(false);
      }
    },
    [handleApiError],
  );

  const fetchBookingAccessories = useCallback(
    async (bookingIdToLoad) => {
      if (!bookingIdToLoad) {
        setBookingAccessories([]);
        return;
      }

      try {
        setAccessoriesLoading(true);
        const response = await DataService.get(`${API.booking.path}/${bookingIdToLoad}/accessories`);
        setBookingAccessories(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        setBookingAccessories([]);
        handleApiError(error, 'Failed to load booking accessories');
      } finally {
        setAccessoriesLoading(false);
      }
    },
    [handleApiError],
  );

  const refreshBookingDocuments = useCallback(
    async (bookingIdToLoad) => {
      if (!bookingIdToLoad) {
        setBookingDocuments([]);
        return;
      }

      try {
        setDocumentsLoading(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.document.path}/booking/${bookingIdToLoad}`,
          getHeaders(),
        );
        setBookingDocuments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setBookingDocuments([]);
        handleApiError(error, 'Failed to load booking documents');
      } finally {
        setDocumentsLoading(false);
      }
    },
    [handleApiError],
  );

  useEffect(() => {
    if (!activeBookingId) return;
    fetchBooking(activeBookingId);
    fetchClosureQuotation(activeBookingId);
    fetchBookingAccessories(activeBookingId);
  }, [activeBookingId, fetchBooking, fetchClosureQuotation, fetchBookingAccessories]);

  useEffect(() => {
    if (!activeBookingId || !isEligibleForDocumentActions) {
      setBookingDocuments([]);
      return;
    }

    refreshBookingDocuments(activeBookingId);
  }, [activeBookingId, isEligibleForDocumentActions, refreshBookingDocuments]);

  useEffect(() => {
    if (!settlementModalVisible) return;
    settlementForm.setFieldsValue({
      odometerReading: undefined,
      notes: '',
    });
  }, [settlementForm, settlementModalVisible]);

  const handleLoadBooking = () => {
    const normalized = String(bookingIdInput || '').trim();
    if (!normalized) {
      message.warning('Enter booking ID');
      return;
    }
    setActiveBookingId(normalized);
  };

  const bookingSummary = useMemo(() => {
    const data = booking || {};
    return [
      { label: 'Booking ID', value: val(data.id || activeBookingId) },
      { label: 'Booking Type', value: BookingType[data.bookingType] || val(data.bookingType) },
      { label: 'Status', value: BookingStatus[data.status] || val(data.status) },
      { label: 'Customer', value: val(data.customerName) },
      { label: 'Phone Number', value: val(data.phoneNumber) },
      { label: 'Station Name', value: val(data.stationName) },
      {
        label:
          Number(data.bookingType) === 0 || String(data.bookingType).toLowerCase() === 'rental'
            ? 'Vehicle Model Name'
            : 'Vehicle Catalogue Name',
        value:
          Number(data.bookingType) === 0 || String(data.bookingType).toLowerCase() === 'rental'
            ? val(data.vehicleModelName)
            : val(data.vehicleCatalogueName),
      },
      { label: 'Vehicle Name', value: val(data.vehicleName) },
      { label: 'Vehicle Registration Number', value: val(data.vehicleRegisterationNumber || data.registrationNumber) },
      { label: 'Plan Name', value: val(data.rentalPlanName || data.ownershipPlanName) },
    ];
  }, [activeBookingId, booking]);

  const bookingSummaryLeft = useMemo(() => bookingSummary.slice(0, 5), [bookingSummary]);
  const bookingSummaryRight = useMemo(() => bookingSummary.slice(5, 10), [bookingSummary]);

  const closureCommonRows = useMemo(() => {
    const data = closureQuotation || {};
    return [
      { label: 'Booking ID', value: val(data.bookingId) },
      { label: 'Booking Type', value: BookingType[data.bookingType] || val(data.bookingType) },
      { label: 'Booking Status', value: BookingStatus[data.bookingStatus] || val(data.bookingStatus) },
      { label: 'Plan Name', value: val(data.planName) },
      { label: 'Customer Name', value: val(data.customerName) },
      { label: 'Customer Phone', value: val(data.customerPhone) },
      { label: 'Total Arrears Amount', value: val(data.totalArrearsAmount) },
      { label: 'Total Accessories Charges', value: val(data.totalAccessoriesCharges) },
    ];
  }, [closureQuotation]);

  const closureSpecificRows = useMemo(() => {
    if (!closureQuotation) return [];
    if (isRentalMode) {
      const rental = closureQuotation.rental || {};
      return [
        { label: 'Total Days', value: val(rental.totalDays) },
        { label: 'Price Per Day', value: val(rental.pricePerDay) },
        { label: 'Total Amount Paid', value: val(rental.totalAmountPaid) },
        { label: 'Vehicle Utilized Days', value: val(rental.totalVehicleUtilizedDays) },
        { label: 'Vehicle Utilized Amount', value: val(rental.totalVehicleUtilizedAmount) },
        { label: 'Vehicle UnUtilized Amount', value: val(rental.totalAmountToDeposit) },
        { label: 'Total Arrears Amount', value: val(rental.totalArrearsAmount) },
        { label: 'Security Amount', value: val(rental.securityAmount) },
        { label: 'Total Amount', value: val(rental.totalAmount) },
        { label: 'Total Settlement Amount', value: val(rental.totalSettlementAmount) },
      ];
    }

    const ownership = closureQuotation.ownership || {};
    return [
      { label: 'Total Rental Paid', value: val(ownership.totalRentalPaid) },
      { label: 'Completed Repayments', value: val(ownership.completedRepayments) },
      { label: 'Security Amount', value: val(ownership.securityAmount) },
      { label: 'Booking Fee Paid', value: val(ownership.bookingFeePaid) },
      { label: 'Total Arrears Amount', value: val(ownership.totalArrearsAmount) },
      { label: 'Weekly Amount', value: val(ownership.weeklyAmount) },
      { label: 'Monthly Amount', value: val(ownership.monthlyAmount) },
      { label: 'Price Per Day', value: val(ownership.pricePerDay) },
      { label: 'Total Amount Paid', value: val(ownership.totalAmountPaid) },
      { label: 'Vehicle Utilized Days', value: val(ownership.totalVehicleUtilizedDays) },
      { label: 'Vehicle Utilized Amount', value: val(ownership.totalVehicleUtilizedAmount) },
      { label: 'Total Settlement Amount', value: val(ownership.totalSettlementAmount) },
    ];
  }, [closureQuotation, isRentalMode]);

  const pendingArrears = useMemo(
    () => (Array.isArray(closureQuotation?.pendingArrears) ? closureQuotation.pendingArrears : []),
    [closureQuotation],
  );

  const totalSettlementAmount = useMemo(() => {
    if (!closureQuotation) return undefined;
    if (isRentalMode) return closureQuotation?.rental?.totalSettlementAmount;
    return closureQuotation?.ownership?.totalSettlementAmount;
  }, [closureQuotation, isRentalMode]);

  const summaryColumns = [
    {
      title: 'Field',
      dataIndex: 'label',
      key: 'label',
      width: '45%',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '55%',
    },
  ];

  const settlementSummaryRows = useMemo(
    () => [
      { label: 'Plan Name', value: val(closureQuotation?.planName) },
      { label: 'Customer Name', value: val(closureQuotation?.customerName) },
      { label: 'Total Settlement Amount', value: val(totalSettlementAmount) },
    ],
    [closureQuotation, totalSettlementAmount],
  );

  const currentOdometerReading = useMemo(() => {
    const candidates = [
      booking?.currentOdometerReading,
      booking?.vehicleCurrentOdometerReading,
      booking?.vehicle?.currentOdometerReading,
      booking?.alternateVehicle?.currentOdometerReading,
    ];

    const firstDefined = candidates.find((value) => value !== null && value !== undefined && value !== '');
    const parsed = Number(firstDefined);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [booking]);

  const openSettlementModal = () => {
    if (!booking || !closureQuotation) {
      message.warning('Load booking and closure quotation before processing settlement');
      return;
    }
    if (!isExpectedBookingType) {
      message.warning(
        isRentalMode ? 'This screen supports only rental bookings' : 'This screen supports only ownership bookings',
      );
      return;
    }
    if (isSettlementDisabled) {
      message.warning('Process Settlement is disabled for the current booking status');
      return;
    }
    setSettlementModalVisible(true);
  };

  const closeSettlementModal = () => {
    if (settlementSubmitting) return;
    setSettlementModalVisible(false);
    settlementForm.resetFields();
  };

  const handleProcessSettlement = async () => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    if (!bookingIdToUse) {
      message.warning('Booking ID is missing');
      return;
    }

    try {
      const values = await settlementForm.validateFields();
      const enteredOdometer = Number(values.odometerReading);
      if (!Number.isFinite(enteredOdometer) || enteredOdometer < currentOdometerReading) {
        settlementForm.setFields([
          {
            name: 'odometerReading',
            errors: [
              `Odometer reading must be equal to or greater than current odometer reading (${currentOdometerReading}).`,
            ],
          },
        ]);
        return;
      }

      Modal.confirm({
        title: 'Confirm Settlement',
        content: 'Are you sure you want to process settlement?',
        okText: 'Yes, Process',
        cancelText: 'No',
        onOk: async () => {
          try {
            const rentedAccessories = bookingAccessories.filter((x) => x.isRental);
            const pendingReturns = rentedAccessories.filter((x) => !x.isReturned && !x.isLost);
            if (pendingReturns.length > 0) {
              message.warning('Please mark all rented accessories as returned or lost before settlement');
              return;
            }

            const statusNumber = Number(booking?.status);
            const statusText = normalizeEnumKey(BookingStatus[booking?.status] || booking?.status);

            const isPendingRentalReturn = Number.isNaN(statusNumber)
              ? statusText === 'vehiclereturnedpending'
              : statusNumber === 5;
            const isPendingOwnershipTransfer = Number.isNaN(statusNumber)
              ? statusText === 'ownershiptransferpending'
              : statusNumber === 17;

            const endpoint = isRentalMode ? 'rental-return' : 'ownership-transfer';
            const payload = isRentalMode
              ? {
                  actionRental: isPendingRentalReturn ? 0 : 1,
                  notes: values.notes?.trim() || '',
                  odometerReading: enteredOdometer,
                  accessoryReturns: rentedAccessories.map((x) => ({
                    accessorieId: x.accessorieId,
                    isReturned: Boolean(x.isReturned),
                    isLost: Boolean(x.isLost),
                  })),
                }
              : {
                  actionOwnership: isPendingOwnershipTransfer ? 0 : 1,
                  notes: values.notes?.trim() || '',
                  odometerReading: enteredOdometer,
                  accessoryReturns: rentedAccessories.map((x) => ({
                    accessorieId: x.accessorieId,
                    isReturned: Boolean(x.isReturned),
                    isLost: Boolean(x.isLost),
                  })),
                };

            setSettlementSubmitting(true);
            await axios.patch(
              `${getApiUrl()}/api${API.booking.path}/${bookingIdToUse}/${endpoint}`,
              payload,
              getHeaders(),
            );
            message.success('Settlement processed successfully');
            closeSettlementModal();
            await fetchBooking(String(bookingIdToUse));
            await fetchClosureQuotation(String(bookingIdToUse));
            await refreshBookingDocuments(String(bookingIdToUse));
            await fetchBookingAccessories(String(bookingIdToUse));
          } catch (error) {
            handleApiError(error, 'Failed to process settlement');
          } finally {
            setSettlementSubmitting(false);
          }
        },
      });
    } catch (error) {
      if (error?.errorFields) return;
      handleApiError(error, 'Failed to process settlement');
    }
  };

  const toggleAccessoryReturnState = (accessorieId, field, checked) => {
    setBookingAccessories((prev) =>
      prev.map((item) => {
        if (item.accessorieId !== accessorieId) return item;
        if (!item.isRental) return item;

        if (field === 'isReturned') {
          return {
            ...item,
            isReturned: checked,
            isLost: checked ? false : item.isLost,
          };
        }

        return {
          ...item,
          isLost: checked,
          isReturned: checked ? false : item.isReturned,
        };
      }),
    );
  };

  const saveAccessoryStatuses = async () => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    if (!bookingIdToUse) {
      message.warning('Booking ID is missing');
      return;
    }

    try {
      setUpdatingAccessories(true);
      const updates = bookingAccessories
        .filter((x) => x.isRental)
        .map((x) => ({
          accessorieId: x.accessorieId,
          isReturned: Boolean(x.isReturned),
          isLost: Boolean(x.isLost),
        }));

      await DataService.put(`${API.booking.path}/${bookingIdToUse}/accessories/returns`, updates);
      message.success('Accessory status updated');
      await fetchBookingAccessories(String(bookingIdToUse));
      await fetchClosureQuotation(String(bookingIdToUse));
    } catch (error) {
      handleApiError(error, 'Failed to update accessory status');
    } finally {
      setUpdatingAccessories(false);
    }
  };

  const handleDownloadDocument = async (documentId, originalFileName) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.document.path}/${documentId}/download`, {
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
      handleApiError(error, 'Failed to download document');
    }
  };

  const handlePrintDocument = async (documentId) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.document.path}/${documentId}/download`, {
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
      handleApiError(error, 'Failed to print document');
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
          await axios.delete(`${apiUrl}/api${API.document.path}/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Document deleted successfully');
          await refreshBookingDocuments(String(booking?.id || activeBookingId));
        } catch (error) {
          handleApiError(error, 'Failed to delete document');
        } finally {
          setDeletingDocumentId(null);
        }
      },
    });
  };

  return (
    <>
      <PageHeader
        ghost
        title={`${screenTitle}${activeBookingId ? ` #${activeBookingId}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/booking/list')}>
              <FeatherIcon icon="arrow-left" size={14} />
              Back
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={16}>
          <Col xs={24} style={{ marginBottom: 16 }}>
            <Cards
              headless={false}
              title={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={bookingIdInput}
                      onChange={(e) => setBookingIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter Booking ID"
                      style={{ width: 180 }}
                      disabled={isBookingIdFromUrl}
                      onPressEnter={handleLoadBooking}
                    />
                    {!isBookingIdFromUrl ? (
                      <Button
                        type="primary"
                        onClick={handleLoadBooking}
                        style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}
                      >
                        Load
                      </Button>
                    ) : null}
                  </div>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      color: '#1f2937',
                    }}
                  >
                    Booking Summary
                  </span>
                </div>
              }
            >
              {loadingBooking ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : booking ? (
                <>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Table
                        rowKey="label"
                        dataSource={bookingSummaryLeft}
                        columns={summaryColumns}
                        pagination={false}
                        size="small"
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Table
                        rowKey="label"
                        dataSource={bookingSummaryRight}
                        columns={summaryColumns}
                        pagination={false}
                        size="small"
                      />
                    </Col>
                  </Row>
                  {!isExpectedBookingType ? (
                    <div style={{ marginTop: 12, color: '#cf1322', fontWeight: 500 }}>
                      {isRentalMode
                        ? 'Loaded booking is not Rental. Vehicle Return is enabled only for Rental booking type.'
                        : 'Loaded booking is not Ownership. Ownership Transfer is enabled only for Ownership booking type.'}
                    </div>
                  ) : null}
                </>
              ) : (
                <Empty description="Enter booking ID to load details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Closure Quotation</span>
                  <Button
                    type="primary"
                    onClick={openSettlementModal}
                    disabled={!booking || !closureQuotation || !isExpectedBookingType || isSettlementDisabled}
                    style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}
                  >
                    Process Settlement
                  </Button>
                </div>
              }
              headless={false}
            >
              {loadingClosure ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : closureQuotation ? (
                <>
                  <Row gutter={16}>
                    <Col xs={24} md={12} style={{ marginBottom: 12 }}>
                      <Table
                        rowKey="label"
                        dataSource={closureCommonRows}
                        columns={summaryColumns}
                        pagination={false}
                        size="small"
                      />
                    </Col>
                    <Col xs={24} md={12} style={{ marginBottom: 12 }}>
                      <Table
                        rowKey="label"
                        dataSource={closureSpecificRows}
                        columns={summaryColumns}
                        pagination={false}
                        size="small"
                      />
                    </Col>
                  </Row>

                  <Cards title="Pending Arrears" headless={false} style={{ marginTop: 8 }}>
                    <Table
                      rowKey={(record, index) => `${record?.arrearsId || index}`}
                      dataSource={pendingArrears}
                      pagination={false}
                      locale={{ emptyText: 'No pending arrears' }}
                      columns={[
                        {
                          title: 'Arrears ID',
                          dataIndex: 'arrearsId',
                          key: 'arrearsId',
                          width: 120,
                          render: (value) => val(value),
                        },
                        {
                          title: 'Type',
                          dataIndex: 'arrearsType',
                          key: 'arrearsType',
                          render: (value) => val(value),
                        },
                        {
                          title: 'Amount',
                          dataIndex: 'amount',
                          key: 'amount',
                          width: 140,
                          render: (value) => val(value),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          width: 140,
                          render: (value) => val(value),
                        },
                      ]}
                    />
                  </Cards>
                </>
              ) : (
                <Empty description="Load booking to view closure quotation" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Cards>
          </Col>

          <Col xs={24} style={{ marginTop: 16 }}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span>Assigned Accessories</span>
                  <Button
                    size="small"
                    type="primary"
                    onClick={saveAccessoryStatuses}
                    loading={updatingAccessories}
                    disabled={!booking || bookingAccessories.length === 0}
                  >
                    Update Return Status
                  </Button>
                </div>
              }
              headless={false}
            >
              {accessoriesLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Spin />
                </div>
              ) : bookingAccessories.length === 0 ? (
                <Empty description="No accessories assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  rowKey={(record, index) => `${record.accessorieId}-${index}`}
                  pagination={false}
                  dataSource={bookingAccessories}
                  columns={[
                    { title: 'Accessory', dataIndex: 'accessorieName', key: 'accessorieName' },
                    {
                      title: 'Mode',
                      key: 'mode',
                      render: (_, row) => (row.isRental ? 'Rent' : 'Sold'),
                    },
                    {
                      title: 'Charge',
                      dataIndex: 'currentCharge',
                      key: 'currentCharge',
                      render: (value) => val(value),
                    },
                    {
                      title: 'Returned',
                      key: 'returned',
                      width: 120,
                      render: (_, row) => (
                        <Checkbox
                          checked={Boolean(row.isReturned)}
                          disabled={!row.isRental}
                          onChange={(e) => toggleAccessoryReturnState(row.accessorieId, 'isReturned', e.target.checked)}
                        />
                      ),
                    },
                    {
                      title: 'Lost',
                      key: 'lost',
                      width: 100,
                      render: (_, row) => (
                        <Checkbox
                          checked={Boolean(row.isLost)}
                          disabled={!row.isRental}
                          onChange={(e) => toggleAccessoryReturnState(row.accessorieId, 'isLost', e.target.checked)}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </Cards>
          </Col>

          {isEligibleForDocumentActions ? (
            <Col xs={24} style={{ marginTop: 16 }}>
              <Cards
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Booking Documents</span>
                    <Button
                      size="small"
                      type="default"
                      outlined
                      onClick={() => refreshBookingDocuments(String(booking?.id || activeBookingId))}
                    >
                      Refresh
                    </Button>
                  </div>
                }
                headless={false}
              >
                {documentsLoading ? (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <Spin />
                  </div>
                ) : bookingDocuments.length === 0 ? (
                  <Empty description="No booking documents found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Row gutter={[16, 16]}>
                    {bookingDocuments.map((doc) => (
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
                            <Button
                              size="small"
                              type="default"
                              outlined
                              onClick={() => handleDownloadDocument(doc.id, doc.originalFileName)}
                            >
                              Download
                            </Button>
                            <Button size="small" type="default" outlined onClick={() => handlePrintDocument(doc.id)}>
                              Print
                            </Button>
                            <Button
                              size="small"
                              type="danger"
                              outlined
                              loading={deletingDocumentId === doc.id}
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Cards>
            </Col>
          ) : null}
        </Row>

        <Modal
          title="Process Settlement"
          open={settlementModalVisible}
          onCancel={closeSettlementModal}
          onOk={handleProcessSettlement}
          okText="Process Settlement"
          confirmLoading={settlementSubmitting}
          destroyOnClose
        >
          <Table
            rowKey="label"
            dataSource={settlementSummaryRows}
            columns={summaryColumns}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Form form={settlementForm} layout="vertical">
            <div style={{ marginBottom: 10, fontWeight: 600, color: '#1f2937' }}>
              Current Odometer Reading: {currentOdometerReading}
            </div>
            <Form.Item
              label="Odometer Reading"
              name="odometerReading"
              rules={[
                { required: true, message: 'Odometer reading is required' },
                { type: 'number', min: 0, message: 'Odometer reading cannot be negative' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null || value === '') return Promise.resolve();
                    if (Number(value) < currentOdometerReading) {
                      return Promise.reject(
                        new Error(
                          `Odometer reading must be equal to or greater than current odometer reading (${currentOdometerReading}).`,
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={currentOdometerReading}
                placeholder={`Enter odometer reading (min ${currentOdometerReading})`}
              />
            </Form.Item>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} placeholder="Add notes" />
            </Form.Item>
          </Form>
        </Modal>
      </Main>
    </>
  );
}

BookingSettlementScreen.propTypes = {
  mode: PropTypes.oneOf(['rental', 'ownership']).isRequired,
};

export default BookingSettlementScreen;
