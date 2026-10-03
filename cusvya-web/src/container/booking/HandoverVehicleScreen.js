import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Input, message, Modal } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { API } from '../../config/api/index';
import { DataService } from '../../config/dataService/dataService';
import { VehicleListingStatus, getVehicleListingStatusText } from '../../config/enum/enum';
import { getItem } from '../../utility/localStorageControl';
import { BookingStatus } from './bookingStatus';
import { BookingType } from './bookingEnums';
import BookingSummaryCard from './HandoverBookingSummaryCard';
import VehicleAssignmentCard from './HandoverVehicleAssignmentCard';
import HandoverModal from './HandoverModal';
import VerificationModal from './HandoverVerificationModal';
import AssignmentModal from './HandoverAssignmentModal';
import { val, renderKycLabel, normalizeEnumKey } from './handoverVehicleUtils';

const { Search } = Input;

function HandoverVehicleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isBookingIdFromUrl = Boolean(id);
  const initialBookingId = String(id || location.state?.booking?.id || '').trim();

  const [bookingIdInput, setBookingIdInput] = useState(initialBookingId);
  const [activeBookingId, setActiveBookingId] = useState(initialBookingId);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [vehicles, setVehicles] = useState([]);
  const [newVehicles, setNewVehicles] = useState([]);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingNewVehicles, setLoadingNewVehicles] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [newVehiclesPage, setNewVehiclesPage] = useState(1);
  const [newVehiclesPageSize, setNewVehiclesPageSize] = useState(10);
  const [newVehiclesTotalCount, setNewVehiclesTotalCount] = useState(0);
  const [activeVehicleTab, setActiveVehicleTab] = useState('temporary');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [handoverModalVisible, setHandoverModalVisible] = useState(false);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);
  const [handoverForm] = Form.useForm();
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [selectedAssignmentVehicle, setSelectedAssignmentVehicle] = useState(null);
  const [assignmentForm] = Form.useForm();
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [customerKycLoading, setCustomerKycLoading] = useState(false);
  const [customerKyc, setCustomerKyc] = useState(null);
  const [customerKycFrontDocument, setCustomerKycFrontDocument] = useState(null);
  const [customerKycBackDocument, setCustomerKycBackDocument] = useState(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [dlModalVisible, setDlModalVisible] = useState(false);
  const [customerDlLoading, setCustomerDlLoading] = useState(false);
  const [customerDl, setCustomerDl] = useState(null);
  const [customerDlFrontDocument, setCustomerDlFrontDocument] = useState(null);
  const [customerDlBackDocument, setCustomerDlBackDocument] = useState(null);
  const [dlSubmitting, setDlSubmitting] = useState(false);
  const [isDrivingLicenseRequired, setIsDrivingLicenseRequired] = useState(false);
  const [availableAccessories, setAvailableAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [accessorySelection, setAccessorySelection] = useState({});

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

  const buildDocumentUrl = useCallback((filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `${getApiUrl()}/${String(filePath).replace(/^\/+/, '')}`;
  }, []);

  const loadDocument = useCallback(async (documentId) => {
    if (!documentId) return null;
    try {
      const response = await DataService.get(`${API.document.path}/${documentId}`);
      return response?.data || null;
    } catch (error) {
      return null;
    }
  }, []);

  const loadCustomerAadharDocuments = useCallback(async (customerIdToLoad) => {
    if (!customerIdToLoad) return { front: null, back: null };

    try {
      const response = await DataService.get(`${API.document.path}/kyc/customer/${customerIdToLoad}`);
      const docs = Array.isArray(response?.data) ? response.data : [];

      const findBySide = (side) => docs.find((doc) => Number(doc?.side) === side) || null;
      let front = findBySide(1);
      let back = findBySide(2);

      if (!front) {
        front = docs.find((doc) => /front/i.test(String(doc?.name || ''))) || docs[0] || null;
      }

      if (!back) {
        back = docs.find((doc) => /back/i.test(String(doc?.name || ''))) || (docs.length > 1 ? docs[1] : null);
      }

      return { front, back };
    } catch (error) {
      return { front: null, back: null };
    }
  }, []);

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

  const fetchAvailableAccessories = useCallback(async () => {
    try {
      setLoadingAccessories(true);
      const response = await DataService.get(API.accessorie.path);
      const data = Array.isArray(response?.data) ? response.data : [];
      setAvailableAccessories(data);
      return data;
    } catch (error) {
      setAvailableAccessories([]);
      handleApiError(error, 'Failed to load accessories');
      return [];
    } finally {
      setLoadingAccessories(false);
    }
  }, [handleApiError]);

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

  const fetchBookingAccessories = useCallback(
    async (bookingIdToLoad, masterAccessories = []) => {
      if (!bookingIdToLoad) {
        setAccessorySelection({});
        return;
      }

      try {
        const response = await DataService.get(`${API.booking.path}/${bookingIdToLoad}/accessories`);
        const assigned = Array.isArray(response?.data) ? response.data : [];
        const source = Array.isArray(masterAccessories) ? masterAccessories : [];

        const nextSelection = {};
        source.forEach((acc) => {
          nextSelection[acc.id] = {
            selected: false,
            isRental: isOwnershipBooking ? false : !acc.forSaleOnly,
          };
        });

        assigned.forEach((item) => {
          nextSelection[item.accessorieId] = {
            selected: true,
            isRental: isOwnershipBooking ? false : Boolean(item.isRental),
          };
        });

        setAccessorySelection(nextSelection);
      } catch (error) {
        setAccessorySelection({});
        handleApiError(error, 'Failed to load booking accessories');
      }
    },
    [handleApiError, isOwnershipBooking],
  );

  const assignedVehicleId = useMemo(() => {
    const idValue = booking?.vehicleId ?? booking?.vehicle?.id;
    if (idValue === undefined || idValue === null || String(idValue).trim() === '') return null;
    return Number(idValue);
  }, [booking]);

  const customerId = useMemo(() => {
    const candidates = [
      booking?.customerId,
      booking?.customerID,
      booking?.CustomerId,
      booking?.CustomerID,
      booking?.customer?.id,
      booking?.customer?.customerId,
      booking?.customer?.customerID,
      booking?.customer?.CustomerId,
      booking?.customer?.CustomerID,
    ];

    const firstDefined = candidates.find(
      (value) => value !== null && value !== undefined && String(value).trim() !== '',
    );
    if (firstDefined === undefined) return null;

    const parsed = Number(firstDefined);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [booking]);

  const customerKycStatus = useMemo(() => Number(customerKyc?.status ?? 0), [customerKyc]);
  const isCustomerKycApproved = customerKycStatus === 2;
  const isCustomerKycPending = customerKycStatus === 1;
  const customerDlStatus = useMemo(() => Number(customerDl?.status ?? 0), [customerDl]);
  const isCustomerDlApproved = customerDlStatus === 2;

  useEffect(() => {
    let disposed = false;

    const resolveDrivingLicenceRequirement = async () => {
      if (!booking) {
        if (!disposed) setIsDrivingLicenseRequired(false);
        return;
      }

      try {
        if (isRentalBooking) {
          const modelId = booking?.vehicleModelId;
          if (!modelId) {
            if (!disposed) setIsDrivingLicenseRequired(false);
            return;
          }

          const response = await axios.get(
            `${getApiUrl()}/api${API.vehicleModel.path}/${Number(modelId)}`,
            getHeaders(),
          );
          if (!disposed) {
            setIsDrivingLicenseRequired(Boolean(response?.data?.isLicenseRequired));
          }
          return;
        }

        if (isOwnershipBooking) {
          const catalogueId = booking?.vehicleCatalogueId;
          if (!catalogueId) {
            if (!disposed) setIsDrivingLicenseRequired(false);
            return;
          }

          const response = await axios.get(
            `${getApiUrl()}/api${API.catalogue.path}/${Number(catalogueId)}`,
            getHeaders(),
          );
          if (!disposed) {
            setIsDrivingLicenseRequired(Boolean(response?.data?.isLicenseRequired));
          }
          return;
        }

        if (!disposed) setIsDrivingLicenseRequired(false);
      } catch (error) {
        if (!disposed) setIsDrivingLicenseRequired(false);
      }
    };

    resolveDrivingLicenceRequirement();
    return () => {
      disposed = true;
    };
  }, [booking, isOwnershipBooking, isRentalBooking]);

  const canInitiateHandover = useMemo(() => {
    if (!booking) return false;

    const statusNumber = Number(booking?.status);
    const hasNumericStatus = !Number.isNaN(statusNumber);
    const statusText = normalizeEnumKey(BookingStatus[booking?.status] || booking?.status);
    const vehicleListingStatusValue = booking?.vehicleListingStatus ?? booking?.vehicle?.vehicleListingStatus;
    const vehicleListingStatusNumber = Number(vehicleListingStatusValue);
    const hasNumericVehicleListingStatus = !Number.isNaN(vehicleListingStatusNumber);
    const vehicleListingStatusText = normalizeEnumKey(
      hasNumericVehicleListingStatus
        ? getVehicleListingStatusText(vehicleListingStatusNumber)
        : vehicleListingStatusValue,
    );

    const isInitiatedStatus = hasNumericStatus ? statusNumber === 0 : statusText === 'initiated';
    const isVehicleReadyForPickupStatus = hasNumericStatus
      ? statusNumber === 20
      : statusText === 'vehiclereadyforpickup';
    const isOwnershipAllowedStatus = hasNumericStatus
      ? [14, 3, 15].includes(statusNumber)
      : ['temporaryvehicleassigned', 'vehicleassignpending', 'temporaryvehicleavailable'].includes(statusText);
    const isVehicleAssignedStatus = hasNumericStatus ? statusNumber === 4 : statusText === 'vehicleassigned';
    const isReservedVehicleListingStatus = hasNumericVehicleListingStatus
      ? vehicleListingStatusNumber === VehicleListingStatus.Reserved
      : vehicleListingStatusText === 'reserved';
    const isOwnershipVehicleAssignedAndReserved =
      isVehicleAssignedStatus &&
      isReservedVehicleListingStatus &&
      Boolean(booking?.isVehicleAssigned) &&
      Boolean(assignedVehicleId);

    if (isVehicleReadyForPickupStatus) return true;
    if (isRentalBooking && isInitiatedStatus) return true;
    if (isOwnershipBooking && (isOwnershipAllowedStatus || isOwnershipVehicleAssignedAndReserved)) return true;
    return false;
  }, [assignedVehicleId, booking, isOwnershipBooking, isRentalBooking]);

  const canProceedWithHandover =
    canInitiateHandover && isCustomerKycApproved && (!isDrivingLicenseRequired || isCustomerDlApproved);

  const canCancelBooking = useMemo(() => {
    if (!booking) return false;

    const statusValue = booking?.status ?? booking?.bookingStatus ?? booking?.BookingStatus;
    const statusNumber = Number(statusValue);
    const hasNumericStatus = Number.isFinite(statusNumber);
    const statusText = normalizeEnumKey(BookingStatus[statusValue] || statusValue);

    if (hasNumericStatus) {
      return [2, 19, 20].includes(statusNumber);
    }

    return ['kycpending', 'awaitingvehicle', 'vehiclereadyforpickup', 'readyforpickup'].includes(statusText);
  }, [booking]);

  const canShowReassignVehicle = useMemo(() => {
    if (!booking) return false;

    const statusNumber = Number(booking?.status);
    const hasNumericStatus = !Number.isNaN(statusNumber);
    const statusText = normalizeEnumKey(BookingStatus[booking?.status] || booking?.status);

    return hasNumericStatus
      ? [0, 3, 4, 5, 14, 15, 19].includes(statusNumber)
      : [
          'initiated',
          'vehicleassignpending',
          'vehicleassigned',
          'vehiclereturnedpending',
          'temporaryvehicleassigned',
          'temporaryvehicleavailable',
          'awaitingvehicle',
        ].includes(statusText);
  }, [booking]);

  const hideAssignCardForOwnershipVehicleAssigned = useMemo(() => {
    if (!booking) return false;

    const bookingTypeValue = booking?.bookingType;
    const statusValue = booking?.status;

    const isOwnershipType = Number(bookingTypeValue) === 1 || String(bookingTypeValue).toLowerCase() === 'ownership';

    const isVehicleAssignedStatus =
      Number(statusValue) === 4 || String(statusValue).toLowerCase() === 'vehicleassigned';

    return isOwnershipType && isVehicleAssignedStatus;
  }, [booking]);

  const fetchUnassignedVehicles = useCallback(
    async (page = 1, size = pageSize, term = searchTerm, bookingIdToLoad = activeBookingId, bookingData = booking) => {
      if (!bookingIdToLoad || !bookingData) {
        setVehicles([]);
        setTotalCount(0);
        return;
      }

      try {
        setLoadingVehicles(true);

        const isRentalType =
          Number(bookingData.bookingType) === 0 || String(bookingData.bookingType).toLowerCase() === 'rental';
        const vehicleModelIdValue = bookingData.vehicleModelId;
        const vehicleCategoryValue = bookingData.vehicleCategory;
        const stationIdParam = bookingData.stationId != null ? String(bookingData.stationId) : '';

        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('pageSize', String(size));
        query.set('stationId', stationIdParam);

        if (isRentalType) {
          query.set(
            'vehicleModelId',
            vehicleModelIdValue !== undefined &&
              vehicleModelIdValue !== null &&
              String(vehicleModelIdValue).trim() !== ''
              ? String(vehicleModelIdValue)
              : '0',
          );
        }

        if (
          vehicleCategoryValue !== undefined &&
          vehicleCategoryValue !== null &&
          String(vehicleCategoryValue).trim() !== ''
        ) {
          query.set('vehicleCategory', String(vehicleCategoryValue));
        }

        if (term) {
          query.set('searchTerm', term);
        }

        if (isOwnershipBooking) {
          query.set('newVehicleOnly', 'false');
        }

        const url = `${getApiUrl()}/api${API.booking.path}/${bookingIdToLoad}/vehicles/unassigned?${query.toString()}`;

        const response = await axios.get(url, getHeaders());
        const data = response.data || {};
        setVehicles(data.items || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setVehicles([]);
        setTotalCount(0);
        handleApiError(error, 'Failed to load unassigned vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    },
    [activeBookingId, booking, handleApiError, pageSize, searchTerm],
  );

  const fetchNewAvailableVehicles = useCallback(
    async (page = 1, size = newVehiclesPageSize, bookingIdToLoad = activeBookingId, bookingData = booking) => {
      if (!bookingIdToLoad || !bookingData || !isOwnershipBooking) {
        setNewVehicles([]);
        setNewVehiclesTotalCount(0);
        return;
      }

      const stationIdParam = bookingData.stationId != null ? String(bookingData.stationId) : '';
      if (!stationIdParam) {
        setNewVehicles([]);
        setNewVehiclesTotalCount(0);
        return;
      }

      try {
        setLoadingNewVehicles(true);
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('pageSize', String(size));
        query.set('stationId', stationIdParam);
        query.set('newVehicleOnly', 'true');
        if (bookingData.vehicleCategory !== undefined && bookingData.vehicleCategory !== null) {
          query.set('vehicleCategory', String(bookingData.vehicleCategory));
        }
        const url = `${getApiUrl()}/api${API.booking.path}/${bookingIdToLoad}/vehicles/unassigned?${query.toString()}`;
        const response = await axios.get(url, getHeaders());
        const data = response.data || {};
        setNewVehicles(data.items || []);
        setNewVehiclesTotalCount(data.totalCount || 0);
      } catch (error) {
        setNewVehicles([]);
        setNewVehiclesTotalCount(0);
        handleApiError(error, 'Failed to load new available vehicles');
      } finally {
        setLoadingNewVehicles(false);
      }
    },
    [activeBookingId, booking, handleApiError, isOwnershipBooking, newVehiclesPageSize],
  );

  useEffect(() => {
    if (!activeBookingId) return;
    fetchBooking(activeBookingId);
  }, [activeBookingId, fetchBooking]);

  useEffect(() => {
    fetchAvailableAccessories();
  }, [fetchAvailableAccessories]);

  useEffect(() => {
    if (!activeBookingId || availableAccessories.length === 0) return;
    fetchBookingAccessories(activeBookingId, availableAccessories);
  }, [activeBookingId, availableAccessories, fetchBookingAccessories]);

  useEffect(() => {
    if (!activeBookingId || !booking) return;
    fetchUnassignedVehicles(currentPage, pageSize, searchTerm, activeBookingId, booking);
  }, [activeBookingId, booking, currentPage, pageSize, searchTerm, fetchUnassignedVehicles]);

  useEffect(() => {
    if (!booking || !isOwnershipBooking || activeVehicleTab !== 'new') return;
    fetchNewAvailableVehicles(newVehiclesPage, newVehiclesPageSize, activeBookingId, booking);
  }, [
    activeBookingId,
    booking,
    isOwnershipBooking,
    activeVehicleTab,
    newVehiclesPage,
    newVehiclesPageSize,
    fetchNewAvailableVehicles,
  ]);

  useEffect(() => {
    if (isOwnershipBooking) {
      setActiveVehicleTab((prev) => (prev === 'new' || prev === 'temporary' ? prev : 'temporary'));
      return;
    }
    setActiveVehicleTab('temporary');
  }, [isOwnershipBooking]);

  const fetchCustomerKyc = useCallback(
    async (customerIdToLoad) => {
      if (!customerIdToLoad) {
        setCustomerKyc(null);
        setCustomerKycFrontDocument(null);
        setCustomerKycBackDocument(null);
        return;
      }

      try {
        setCustomerKycLoading(true);
        const response = await DataService.get(`${API.customer.path}/${customerIdToLoad}/kyc`);
        const kycData = response?.data || null;
        setCustomerKyc(kycData);

        const [frontDoc, backDoc] = await Promise.all([
          loadDocument(kycData?.aadharFrontDocumentId || kycData?.documentId),
          loadDocument(kycData?.aadharBackDocumentId),
        ]);

        if (frontDoc || backDoc) {
          setCustomerKycFrontDocument(frontDoc);
          setCustomerKycBackDocument(backDoc);
          return;
        }

        // Fallback for flows where KYC status exists but document IDs are not linked on KYC record.
        const fallbackDocs = await loadCustomerAadharDocuments(customerIdToLoad);
        setCustomerKycFrontDocument(fallbackDocs.front);
        setCustomerKycBackDocument(fallbackDocs.back);
      } catch (error) {
        setCustomerKyc(null);
        setCustomerKycFrontDocument(null);
        setCustomerKycBackDocument(null);
        handleApiError(error, 'Failed to load customer KYC');
      } finally {
        setCustomerKycLoading(false);
      }
    },
    [handleApiError, loadCustomerAadharDocuments, loadDocument],
  );

  const fetchCustomerDl = useCallback(
    async (customerIdToLoad) => {
      if (!customerIdToLoad) {
        setCustomerDl(null);
        setCustomerDlFrontDocument(null);
        setCustomerDlBackDocument(null);
        return;
      }

      try {
        setCustomerDlLoading(true);
        const response = await DataService.get(`${API.customer.path}/${customerIdToLoad}/dl`);
        const dlData = response?.data || null;
        setCustomerDl(dlData);

        const [frontDoc, backDoc] = await Promise.all([
          loadDocument(dlData?.drivingLicenceFrontDocumentId),
          loadDocument(dlData?.drivingLicenceBackDocumentId),
        ]);

        setCustomerDlFrontDocument(frontDoc);
        setCustomerDlBackDocument(backDoc);
      } catch (error) {
        setCustomerDl(null);
        setCustomerDlFrontDocument(null);
        setCustomerDlBackDocument(null);
        handleApiError(error, 'Failed to load customer Driving Licence');
      } finally {
        setCustomerDlLoading(false);
      }
    },
    [handleApiError, loadDocument],
  );

  useEffect(() => {
    if (!customerId) {
      setCustomerKyc(null);
      setCustomerKycFrontDocument(null);
      setCustomerKycBackDocument(null);
      setCustomerDl(null);
      setCustomerDlFrontDocument(null);
      setCustomerDlBackDocument(null);
      return;
    }

    fetchCustomerKyc(customerId);
    fetchCustomerDl(customerId);
  }, [customerId, fetchCustomerKyc, fetchCustomerDl]);

  const handleLoadBooking = () => {
    const normalized = String(bookingIdInput || '').trim();
    if (!normalized) {
      message.warning('Enter booking ID');
      return;
    }
    setCurrentPage(1);
    setNewVehiclesPage(1);
    setActiveBookingId(normalized);
  };

  const handleAccessoryToggle = (accessorieId, checked) => {
    setAccessorySelection((prev) => ({
      ...prev,
      [accessorieId]: {
        ...(prev[accessorieId] || { isRental: true }),
        selected: checked,
      },
    }));
  };

  const handleAccessoryModeChange = (accessorieId, modeValue) => {
    if (isOwnershipBooking) {
      setAccessorySelection((prev) => ({
        ...prev,
        [accessorieId]: {
          ...(prev[accessorieId] || { selected: true }),
          selected: true,
          isRental: false,
        },
      }));
      return;
    }

    setAccessorySelection((prev) => ({
      ...prev,
      [accessorieId]: {
        ...(prev[accessorieId] || { selected: true }),
        selected: true,
        isRental: modeValue === 'rent',
      },
    }));
  };

  const buildAccessoriesPayload = useCallback(() => {
    return availableAccessories
      .filter((acc) => accessorySelection[acc.id]?.selected)
      .map((acc) => {
        const selectedMode = accessorySelection[acc.id]?.isRental;
        return {
          accessorieId: acc.id,
          isRental: isOwnershipBooking ? false : acc.forSaleOnly ? false : Boolean(selectedMode),
        };
      });
  }, [accessorySelection, availableAccessories, isOwnershipBooking]);

  const handleSearch = (value) => {
    const term = (value || '').trim();
    setSearchInput(value || '');
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (!value) {
      setSearchTerm('');
      setCurrentPage(1);
    }
  };

  const handleAssignVehicle = async (record) => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    const newVehicleId = record?.id ?? record?.vehicleId;
    const isNewVehicle = isOwnershipBooking && activeVehicleTab === 'new';
    if (!bookingIdToUse || !newVehicleId) {
      message.warning('Vehicle selection is invalid');
      return;
    }

    setSelectedAssignmentVehicle({
      record,
      newVehicleId: Number(newVehicleId),
      isNewVehicle,
      bookingIdToUse,
    });
    setAssignmentModalVisible(true);
    assignmentForm.setFieldsValue({ notes: '' });
  };

  const closeAssignmentModal = (force = false) => {
    if (assignmentSubmitting && !force) return;
    setAssignmentModalVisible(false);
    setSelectedAssignmentVehicle(null);
    assignmentForm.resetFields();
  };

  const handleSubmitAssignVehicle = async () => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    const selectedVehicle = selectedAssignmentVehicle;
    if (!bookingIdToUse || !selectedVehicle?.newVehicleId) {
      message.warning('Vehicle selection is invalid');
      return;
    }

    try {
      const values = await assignmentForm.validateFields();
      setAssignmentSubmitting(true);
      setActionLoadingId(selectedVehicle.newVehicleId);

      await axios.patch(
        `${getApiUrl()}/api${API.booking.path}/${bookingIdToUse}/reassign-vehicle`,
        {
          newVehicleId: Number(selectedVehicle.newVehicleId),
          isNewVehicle: Boolean(selectedVehicle.isNewVehicle),
          notes: values.notes?.trim() || '',
        },
        getHeaders(),
      );

      message.success(isRentalBooking ? 'Vehicle reassigned successfully' : 'Vehicle assigned successfully');
      closeAssignmentModal(true);
      await fetchBooking(String(bookingIdToUse));
      if (isOwnershipBooking && activeVehicleTab === 'new') {
        await fetchNewAvailableVehicles(newVehiclesPage, newVehiclesPageSize, String(bookingIdToUse), booking);
      } else {
        await fetchUnassignedVehicles(currentPage, pageSize, searchTerm, String(bookingIdToUse), booking);
      }
    } catch (error) {
      if (error?.errorFields) return;
      handleApiError(error, 'Failed to assign vehicle');
    } finally {
      setAssignmentSubmitting(false);
      setActionLoadingId(null);
    }
  };

  const bookingSummary = useMemo(() => {
    const data = booking || {};
    const isRentalType = Number(data.bookingType) === 0 || String(data.bookingType).toLowerCase() === 'rental';
    const isOwnershipType = Number(data.bookingType) === 1 || String(data.bookingType).toLowerCase() === 'ownership';
    const catalogueIdValue = data.catalogueId ?? data.vehicleCatalogueId ?? data.vehicleCatalogue?.id;
    const catalogueColorNameValue =
      data.catalogueColorName ??
      data.catalogueColourName ??
      data.catalogueColor?.colorName ??
      data.catalogueColor?.ColorName ??
      data.catalogueColor?.name ??
      data.catalogueColour?.colorName ??
      data.catalogueColour?.ColorName ??
      data.catalogueColour?.name ??
      data.vehicleCatalogueColorName ??
      data.vehicleCatalogueColourName;
    return [
      { label: 'Booking ID', value: val(data.id || activeBookingId) },
      { label: 'Booking Type', value: BookingType[data.bookingType] || val(data.bookingType) },
      { label: 'Status', value: BookingStatus[data.status] || val(data.status) },
      { label: 'Customer', value: val(data.customerName) },
      { label: 'Phone Number', value: val(data.phoneNumber) },
      { label: 'Station Name', value: val(data.stationName) },
      {
        label: isRentalType ? 'Vehicle Model Name' : 'Vehicle Catalogue Name',
        value: isRentalType ? val(data.vehicleModelName) : val(data.vehicleCatalogueName),
      },
      { label: 'Catalogue ID', value: isOwnershipType ? val(catalogueIdValue) : '-' },
      { label: 'Catalogue Color Name', value: isOwnershipType ? val(catalogueColorNameValue) : '-' },
      { label: 'Vehicle Name', value: val(data.vehicleName) },
      { label: 'Vehicle Registration Number', value: val(data.vehicleRegisterationNumber) },
      { label: 'Rental Plan', value: val(data.rentalPlanName) },
      { label: 'Vehicle Assigned', value: val(data.isVehicleAssigned) },
      { label: 'Customer KYC', value: customerKycLoading ? 'Loading...' : renderKycLabel(customerKycStatus) },
      { label: 'Driving Licence', value: customerDlLoading ? 'Loading...' : renderKycLabel(customerDlStatus) },
    ];
  }, [activeBookingId, booking, customerKycLoading, customerKycStatus, customerDlLoading, customerDlStatus]);

  const bookingSummaryLeft = useMemo(
    () => bookingSummary.slice(0, Math.ceil(bookingSummary.length / 2)),
    [bookingSummary],
  );
  const bookingSummaryRight = useMemo(
    () => bookingSummary.slice(Math.ceil(bookingSummary.length / 2)),
    [bookingSummary],
  );

  const handoverSummary = useMemo(() => {
    const data = booking || {};
    return [
      { label: 'Booking ID', value: val(data.id || activeBookingId) },
      { label: 'Vehicle Model Name', value: val(data.vehicleModelName) },
      { label: 'Vehicle Name', value: val(data.vehicleName) },
      { label: 'Vehicle Registration Number', value: val(data.vehicleRegisterationNumber || data.registrationNumber) },
    ];
  }, [activeBookingId, booking]);

  const assignedAccessories = useMemo(
    () => (Array.isArray(booking?.bookingAccessories) ? booking.bookingAccessories : []),
    [booking],
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

  const defaultRegistrationNumber = useMemo(
    () =>
      String(
        booking?.vehicleRegisterationNumber || booking?.registerationNumber || booking?.registrationNumber || '',
      ).trim(),
    [booking],
  );

  useEffect(() => {
    if (!handoverModalVisible) return;
    handoverForm.setFieldsValue({
      odometerReading: undefined,
      notes: '',
      registerationNumber: defaultRegistrationNumber,
    });
  }, [defaultRegistrationNumber, handoverForm, handoverModalVisible]);

  const openHandoverModal = () => {
    if (!booking) {
      message.warning('Load booking before initiating handover');
      return;
    }
    if (!canInitiateHandover) {
      message.warning('Booking status is not eligible for handover');
      return;
    }
    if (!isCustomerKycApproved) {
      message.warning('Customer KYC must be approved before handover');
      return;
    }
    if (!assignedVehicleId) {
      message.warning('Vehicle must be assigned before initiating handover');
      return;
    }
    setHandoverModalVisible(true);
  };

  const openKycModal = () => {
    if (!customerId) {
      message.warning('Load booking before viewing KYC');
      return;
    }
    setKycModalVisible(true);
  };

  const openDlModal = () => {
    if (!customerId) {
      message.warning('Load booking before viewing Driving Licence');
      return;
    }
    setDlModalVisible(true);
  };

  const closeKycModal = () => {
    if (kycSubmitting) return;
    setKycModalVisible(false);
  };

  const closeDlModal = () => {
    if (dlSubmitting) return;
    setDlModalVisible(false);
  };

  const handleApproveKyc = async () => {
    if (!customerId) return;

    try {
      setKycSubmitting(true);
      await DataService.patch(`${API.customer.path}/${customerId}/kyc/approve`, { approve: true });
      message.success('Customer KYC approved successfully');
      await fetchCustomerKyc(customerId);
      await fetchBooking(String(booking?.id || activeBookingId));
      setKycModalVisible(false);
    } catch (error) {
      handleApiError(error, 'Failed to approve customer KYC');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleApproveDl = async () => {
    if (!customerId) return;

    try {
      setDlSubmitting(true);
      await DataService.patch(`${API.customer.path}/${customerId}/dl/approve`, { approve: true });
      message.success('Customer Driving Licence approved successfully');
      await fetchCustomerDl(customerId);
      setDlModalVisible(false);
    } catch (error) {
      handleApiError(error, 'Failed to approve customer Driving Licence');
    } finally {
      setDlSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    if (!bookingIdToUse) {
      message.warning('Booking ID is missing');
      return;
    }

    Modal.confirm({
      title: 'Cancel booking?',
      content: 'This will cancel the active booking and cannot be undone. Continue?',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'Keep Booking',
      onOk: async () => {
        try {
          await axios.post(`${getApiUrl()}/api${API.booking.path}/${bookingIdToUse}/cancel`, {}, getHeaders());
          message.success('Booking cancelled successfully');
          await fetchBooking(String(bookingIdToUse));
        } catch (error) {
          handleApiError(error, 'Failed to cancel booking');
        }
      },
    });
  };

  const closeHandoverModal = () => {
    if (handoverSubmitting) return;
    setHandoverModalVisible(false);
    handoverForm.resetFields();
  };

  const handleInitiateHandover = async () => {
    const bookingIdToUse = booking?.id || Number(activeBookingId);
    if (!bookingIdToUse) {
      message.warning('Booking ID is missing');
      return;
    }

    try {
      const values = await handoverForm.validateFields();
      const enteredOdometer = Number(values.odometerReading);
      if (!Number.isFinite(enteredOdometer) || enteredOdometer < currentOdometerReading) {
        handoverForm.setFields([
          {
            name: 'odometerReading',
            errors: [
              `Odometer reading must be equal to or greater than current odometer reading (${currentOdometerReading}).`,
            ],
          },
        ]);
        return;
      }

      if (!assignedVehicleId) {
        message.warning('Vehicle must be assigned before initiating handover');
        return;
      }

      const requestUrl = `${getApiUrl()}/api${API.booking.path}/${bookingIdToUse}/${
        isRentalBooking ? 'handover-rental' : 'handover-ownership'
      }`;

      const payload = isRentalBooking
        ? {
            notes: values.notes?.trim() || '',
            odometerReading: enteredOdometer,
            accessories: buildAccessoriesPayload(),
          }
        : {
            odometerReading: enteredOdometer,
            registerationNumber: values.registerationNumber?.trim(),
            notes: values.notes?.trim() || '',
            accessories: buildAccessoriesPayload(),
          };

      setHandoverSubmitting(true);
      await axios.patch(requestUrl, payload, getHeaders());
      message.success('Handover initiated successfully');
      closeHandoverModal();
      await fetchBooking(String(bookingIdToUse));
      await fetchBookingAccessories(String(bookingIdToUse), availableAccessories);
    } catch (error) {
      if (error?.errorFields) return;
      handleApiError(error, 'Failed to initiate handover');
    } finally {
      setHandoverSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        ghost
        title={`Handover${activeBookingId ? ` #${activeBookingId}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search
              placeholder="Search vehicle"
              value={searchInput}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              allowClear
              style={{ width: 260 }}
              disabled={!booking || (isOwnershipBooking && activeVehicleTab === 'new')}
            />
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/booking/list')}>
              <FeatherIcon icon="arrow-left" size={14} />
              Back
            </Button>
          </div>,
        ]}
      />
      <Main>
        <BookingSummaryCard
          bookingIdInput={bookingIdInput}
          setBookingIdInput={setBookingIdInput}
          isBookingIdFromUrl={isBookingIdFromUrl}
          handleLoadBooking={handleLoadBooking}
          loadingBooking={loadingBooking}
          booking={booking}
          bookingSummaryLeft={bookingSummaryLeft}
          bookingSummaryRight={bookingSummaryRight}
          customerKycStatus={customerKycStatus}
          customerDlStatus={customerDlStatus}
          isDrivingLicenseRequired={isDrivingLicenseRequired}
          openKycModal={openKycModal}
          openDlModal={openDlModal}
          openHandoverModal={openHandoverModal}
          handleCancelBooking={handleCancelBooking}
          canCancelBooking={canCancelBooking}
          canProceedWithHandover={canProceedWithHandover}
          assignedAccessories={assignedAccessories}
        />

        {canShowReassignVehicle && !hideAssignCardForOwnershipVehicleAssigned ? (
          <VehicleAssignmentCard
            activeBookingId={activeBookingId}
            booking={booking}
            isOwnershipBooking={isOwnershipBooking}
            isRentalBooking={isRentalBooking}
            activeVehicleTab={activeVehicleTab}
            setActiveVehicleTab={setActiveVehicleTab}
            vehicles={vehicles}
            newVehicles={newVehicles}
            loadingVehicles={loadingVehicles}
            loadingNewVehicles={loadingNewVehicles}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            newVehiclesPage={newVehiclesPage}
            newVehiclesPageSize={newVehiclesPageSize}
            newVehiclesTotalCount={newVehiclesTotalCount}
            setNewVehiclesPage={setNewVehiclesPage}
            setNewVehiclesPageSize={setNewVehiclesPageSize}
            actionLoadingId={actionLoadingId}
            handleAssignVehicle={handleAssignVehicle}
          />
        ) : null}

        <HandoverModal
          open={handoverModalVisible}
          onCancel={closeHandoverModal}
          onOk={handleInitiateHandover}
          confirmLoading={handoverSubmitting}
          handoverSummary={handoverSummary}
          buildDocumentUrl={buildDocumentUrl}
          customerKycFrontDocument={customerKycFrontDocument}
          customerKycBackDocument={customerKycBackDocument}
          handoverForm={handoverForm}
          currentOdometerReading={currentOdometerReading}
          isOwnershipBooking={isOwnershipBooking}
          loadingAccessories={loadingAccessories}
          availableAccessories={availableAccessories}
          accessorySelection={accessorySelection}
          handleAccessoryToggle={handleAccessoryToggle}
          handleAccessoryModeChange={handleAccessoryModeChange}
        />

        <VerificationModal
          type="kyc"
          open={kycModalVisible}
          onCancel={closeKycModal}
          approved={isCustomerKycApproved}
          submitting={kycSubmitting}
          onApprove={handleApproveKyc}
          loading={customerKycLoading}
          customerId={customerId}
          data={customerKyc}
          status={customerKycStatus}
          frontDocument={customerKycFrontDocument}
          backDocument={customerKycBackDocument}
          buildDocumentUrl={buildDocumentUrl}
        />

        <VerificationModal
          type="dl"
          open={dlModalVisible}
          onCancel={closeDlModal}
          approved={isCustomerDlApproved}
          submitting={dlSubmitting}
          onApprove={handleApproveDl}
          loading={customerDlLoading}
          customerId={customerId}
          data={customerDl}
          status={customerDlStatus}
          frontDocument={customerDlFrontDocument}
          backDocument={customerDlBackDocument}
          buildDocumentUrl={buildDocumentUrl}
        />

        <AssignmentModal
          isRentalBooking={isRentalBooking}
          open={assignmentModalVisible}
          onCancel={closeAssignmentModal}
          onOk={handleSubmitAssignVehicle}
          confirmLoading={assignmentSubmitting}
          form={assignmentForm}
        />
      </Main>
    </>
  );
}

export default HandoverVehicleScreen;
