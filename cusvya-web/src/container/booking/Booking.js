import React, { lazy, useState, Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Input, Select } from 'antd';
import axios from 'axios';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';
import { BookingStatus, BookingType } from './bookingEnums';
import { getItem } from '../../utility/localStorageControl';
import {
  OwnershipStatus,
  OwnershipStatusOptions,
  VehicleCategory,
  VehicleCategoryOptions,
} from '../../config/enum/enum';
import { getOwnershipFulfilments } from '../ownership-fulfilment/ownershipFulfilmentService';

const BookingList = lazy(() => import('./overview/BookingList'));
const { Search } = Input;
const { Option } = Select;

function Booking() {
  const dispatch = useDispatch();
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [ownershipFulfilmentByBooking, setOwnershipFulfilmentByBooking] = useState({});

  // Get Booking data from Redux store
  const { bookings, isLoading, totalCount } = useSelector((state) => {
    return {
      bookings: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [state, setState] = useState({
    visible: false,
    current: 1,
    pageSize: 10,
    searchTerm: '',
    searchInput: '',
    customerIdFilter: '',
    vehicleIdFilter: '',
    stationNameFilter: '',
    vehicleCategoryFilter: VehicleCategory.TwoWheeler,
    ownershipStatusFilter: OwnershipStatus.CompanyOwned,
    bookingTypeFilter: undefined,
    bookingStatusFilter: undefined,
  });

  const {
    current,
    pageSize,
    searchTerm,
    searchInput,
    customerIdFilter,
    vehicleIdFilter,
    stationNameFilter,
    vehicleCategoryFilter,
    ownershipStatusFilter,
    bookingTypeFilter,
    bookingStatusFilter,
  } = state;

  const getData = async (
    currentPage = 1,
    currentPageSize = 10,
    term = searchTerm,
    type = bookingTypeFilter,
    status = bookingStatusFilter,
    vehicleCategory = vehicleCategoryFilter,
    ownershipStatus = ownershipStatusFilter,
    customerId = customerIdFilter,
    vehicleId = vehicleIdFilter,
    stationName = stationNameFilter,
  ) => {
    // Build query parameters
    let queryParams = `page=${currentPage}&pageSize=${currentPageSize}`;
    if (term) {
      queryParams += `&searchTerm=${encodeURIComponent(term)}`;
    }
    if (type !== undefined && type !== null) {
      queryParams += `&bookingType=${type}`;
    }
    if (status !== undefined && status !== null) {
      queryParams += `&bookingStatus=${status}`;
    }
    if (vehicleCategory !== undefined && vehicleCategory !== null) {
      queryParams += `&vehicleCategory=${vehicleCategory}`;
    }
    if (ownershipStatus !== undefined && ownershipStatus !== null) {
      queryParams += `&ownershipStatus=${ownershipStatus}`;
    }
    if (customerId !== undefined && customerId !== null && String(customerId).trim() !== '') {
      queryParams += `&customerId=${customerId}`;
    }
    if (vehicleId !== undefined && vehicleId !== null && String(vehicleId).trim() !== '') {
      queryParams += `&vehicleId=${vehicleId}`;
    }
    if (stationName && String(stationName).trim() !== '') {
      queryParams += `&stationName=${encodeURIComponent(String(stationName).trim())}`;
    }

    const endpoint = `${API.booking.path}/paged?${queryParams}`;
    await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));
  };

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchStations = async () => {
    try {
      setStationsLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.station.path}/paged?page=1&pageSize=500&isActive=true`, {
        headers: getHeaders(),
      });
      const data = response.data;
      setStations(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      setStations([]);
    } finally {
      setStationsLoading(false);
    }
  };

  const refreshOwnershipFulfilments = async (bookingRows = []) => {
    const ownershipBookingIds = bookingRows
      .filter((booking) => Number(booking.bookingType) === 1)
      .map((booking) => Number(booking.id));

    if (!ownershipBookingIds.length) {
      setOwnershipFulfilmentByBooking({});
      return;
    }

    try {
      const fulfilments = await getOwnershipFulfilments();
      const map = {};

      fulfilments
        .filter((item) => ownershipBookingIds.includes(Number(item.bookingId)))
        .forEach((item) => {
          const existing = map[item.bookingId];
          if (
            !existing ||
            Number(item.updatedAt ? new Date(item.updatedAt).getTime() : 0) >
              Number(existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0)
          ) {
            map[item.bookingId] = item;
          }
        });

      setOwnershipFulfilmentByBooking(map);
    } catch (error) {
      setOwnershipFulfilmentByBooking({});
    }
  };

  // Load Booking data on component mount
  useEffect(() => {
    getData(1, 10);
    fetchStations();
  }, [dispatch]);

  useEffect(() => {
    refreshOwnershipFulfilments(bookings);
  }, [bookings]);

  // Reload data when pagination changes - skip on initial mount
  useEffect(() => {
    if (current !== 1 || pageSize !== 10) {
      getData(
        current,
        pageSize,
        searchTerm,
        bookingTypeFilter,
        bookingStatusFilter,
        vehicleCategoryFilter,
        ownershipStatusFilter,
        customerIdFilter,
        vehicleIdFilter,
        stationNameFilter,
      );
    }
  }, [
    current,
    pageSize,
    searchTerm,
    bookingTypeFilter,
    bookingStatusFilter,
    vehicleCategoryFilter,
    ownershipStatusFilter,
    customerIdFilter,
    vehicleIdFilter,
    stationNameFilter,
  ]);

  const handlePageChange = (page, size) => {
    setState((prev) => ({ ...prev, current: page, pageSize: size }));
  };

  const handleSearch = (value) => {
    const term = (value || '').trim();
    setState((prev) => ({ ...prev, current: 1, searchTerm: term, searchInput: value || '' }));
    getData(
      1,
      pageSize,
      term,
      bookingTypeFilter,
      bookingStatusFilter,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setState((prev) => ({ ...prev, searchInput: value }));

    if (!value) {
      setState((prev) => ({ ...prev, current: 1, searchTerm: '' }));
      getData(
        1,
        pageSize,
        '',
        bookingTypeFilter,
        bookingStatusFilter,
        vehicleCategoryFilter,
        ownershipStatusFilter,
        customerIdFilter,
        vehicleIdFilter,
        stationNameFilter,
      );
    }
  };

  const handleBookingTypeChange = (value) => {
    setState((prev) => ({ ...prev, current: 1, bookingTypeFilter: value }));
    getData(
      1,
      pageSize,
      searchTerm,
      value,
      bookingStatusFilter,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleBookingStatusChange = (value) => {
    setState((prev) => ({ ...prev, current: 1, bookingStatusFilter: value }));
    getData(
      1,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      value,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleVehicleCategoryChange = (value) => {
    setState((prev) => ({ ...prev, current: 1, vehicleCategoryFilter: value }));
    getData(
      1,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      bookingStatusFilter,
      value,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleOwnershipStatusChange = (value) => {
    setState((prev) => ({ ...prev, current: 1, ownershipStatusFilter: value }));
    getData(
      1,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      bookingStatusFilter,
      vehicleCategoryFilter,
      value,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleCustomerIdChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setState((prev) => ({ ...prev, customerIdFilter: value }));
    if (!value) {
      getData(
        1,
        pageSize,
        searchTerm,
        bookingTypeFilter,
        bookingStatusFilter,
        vehicleCategoryFilter,
        ownershipStatusFilter,
        '',
        vehicleIdFilter,
        stationNameFilter,
      );
    }
  };

  const handleVehicleIdChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setState((prev) => ({ ...prev, vehicleIdFilter: value }));
    if (!value) {
      getData(
        1,
        pageSize,
        searchTerm,
        bookingTypeFilter,
        bookingStatusFilter,
        vehicleCategoryFilter,
        ownershipStatusFilter,
        customerIdFilter,
        '',
        stationNameFilter,
      );
    }
  };

  const handleStationNameChange = (value) => {
    const normalizedValue = value || '';
    setState((prev) => ({ ...prev, stationNameFilter: normalizedValue, current: 1 }));
    getData(
      1,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      bookingStatusFilter,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      normalizedValue,
    );
  };

  const applyOptionalFilters = () => {
    getData(
      1,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      bookingStatusFilter,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  const handleRefresh = () => {
    getData(
      current,
      pageSize,
      searchTerm,
      bookingTypeFilter,
      bookingStatusFilter,
      vehicleCategoryFilter,
      ownershipStatusFilter,
      customerIdFilter,
      vehicleIdFilter,
      stationNameFilter,
    );
  };

  return (
    <>
      <PageHeader ghost title="Bookings" />
      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Select
                    placeholder="Vehicle Category"
                    value={vehicleCategoryFilter}
                    onChange={handleVehicleCategoryChange}
                    allowClear
                    style={{ width: 170 }}
                  >
                    {VehicleCategoryOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Ownership Status"
                    value={ownershipStatusFilter}
                    onChange={handleOwnershipStatusChange}
                    style={{ width: 180 }}
                  >
                    {OwnershipStatusOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Booking Type"
                    value={bookingTypeFilter}
                    onChange={handleBookingTypeChange}
                    allowClear
                    style={{ width: 160 }}
                  >
                    {Object.keys(BookingType).map((key) => (
                      <Option key={key} value={parseInt(key, 10)}>
                        {BookingType[key]}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Booking Status"
                    value={bookingStatusFilter}
                    onChange={handleBookingStatusChange}
                    allowClear
                    style={{ width: 220 }}
                  >
                    {Object.keys(BookingStatus).map((key) => (
                      <Option key={key} value={parseInt(key, 10)}>
                        {BookingStatus[key]}
                      </Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Customer ID"
                    value={customerIdFilter}
                    onChange={handleCustomerIdChange}
                    onPressEnter={applyOptionalFilters}
                    style={{ width: 140 }}
                  />
                  <Input
                    placeholder="Vehicle ID"
                    value={vehicleIdFilter}
                    onChange={handleVehicleIdChange}
                    onPressEnter={applyOptionalFilters}
                    style={{ width: 140 }}
                  />
                  <Select
                    placeholder="Station Name"
                    value={stationNameFilter}
                    showSearch
                    allowClear
                    loading={stationsLoading}
                    optionFilterProp="children"
                    onChange={handleStationNameChange}
                    style={{ width: 200 }}
                  >
                    {stations.map((station) => (
                      <Option key={station.id} value={station.name || station.stationName || ''}>
                        {station.name || station.stationName || `Station ${station.id}`}
                      </Option>
                    ))}
                  </Select>
                  <Search
                    placeholder="Search name, phone, booking id, reg no"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onSearch={handleSearch}
                    allowClear
                    style={{ width: 280 }}
                  />
                </div>
                <Button size="small" type="default" onClick={handleRefresh}>
                  Refresh
                </Button>
              </div>
            </Cards>
          </Col>
          <Col xs={24}>
            <Cards headless>
              <Suspense
                fallback={
                  <div className="spin">
                    <Spin size="large" />
                  </div>
                }
              >
                <BookingList
                  bookings={bookings}
                  loading={isLoading}
                  currentPage={current}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  getData={getData}
                  ownershipFulfilmentByBooking={ownershipFulfilmentByBooking}
                />
              </Suspense>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default Booking;
