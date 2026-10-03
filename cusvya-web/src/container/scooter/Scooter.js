import React, { lazy, useState, Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Select, Input, Button as AntButton, Space } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { axiosDataRead } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';
import { getItem } from '../../utility/localStorageControl';

const ScooterList = lazy(() => import('./overview/ScooterList'));
const CreateScooter = lazy(() => import('./overview/CreateScooter'));
const UpdateScooter = lazy(() => import('./overview/UpdateScooter'));

const { Option } = Select;

const BOOL_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

const defaultFilters = {
  isActive: '',
  isAvailableForRental: '',
  isAvailableForOwnership: '',
  isForSale: '',
  isNew: '',
  scooterTypeId: '',
  searchTerm: '',
};

function Scooter() {
  const dispatch = useDispatch();
  const [scooterTypes, setScooterTypes] = useState([]);

  const { scooters, isLoading, totalCount } = useSelector((state) => ({
    scooters: state.Service?.data?.items ? state.Service.data.items : [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 10,
    createModalVisible: false,
    updateModalVisible: false,
    selectedScooter: null,
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const { current, pageSize, createModalVisible, updateModalVisible, selectedScooter } = state;

  const buildQueryString = (f, page, size) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', size);
    if (f.isActive !== '') params.append('isActive', f.isActive);
    if (f.isAvailableForRental !== '') params.append('isAvailableForRental', f.isAvailableForRental);
    if (f.isAvailableForOwnership !== '') params.append('isAvailableForOwnership', f.isAvailableForOwnership);
    if (f.isForSale !== '') params.append('isForSale', f.isForSale);
    if (f.isNew !== '') params.append('isNew', f.isNew);
    if (f.scooterTypeId !== '') params.append('scooterTypeId', f.scooterTypeId);
    if (f.searchTerm && f.searchTerm.trim() !== '') params.append('searchTerm', f.searchTerm.trim());
    return params.toString();
  };

  const fetchScooterTypes = async () => {
    try {
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
      const token = getItem('access_token');
      const response = await axios.get(`${apiUrl}/api${API.scooterType.path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setScooterTypes(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setScooterTypes([]);
    }
  };

  const getData = async (page = 1, size = 10, f = filters) => {
    const endpoint = `${API.scooter.path}/paged?${buildQueryString(f, page, size)}`;
    await dispatch(axiosDataRead(endpoint));
  };

  useEffect(() => {
    getData(1, 10, defaultFilters);
    fetchScooterTypes();
  }, [dispatch]);

  useEffect(() => {
    if (current !== 1 || pageSize !== 10) {
      getData(current, pageSize);
    }
  }, [current, pageSize]);

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setState((prev) => ({ ...prev, current: 1 }));
    getData(1, pageSize, pendingFilters);
  };

  const handleResetFilters = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    setState((prev) => ({ ...prev, current: 1 }));
    getData(1, pageSize, defaultFilters);
  };

  const showCreateModal = () => setState((prev) => ({ ...prev, createModalVisible: true }));

  const hideCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: false }));
    getData(current, pageSize);
  };

  const showUpdateModal = (scooter) =>
    setState((prev) => ({ ...prev, updateModalVisible: true, selectedScooter: scooter }));

  const hideUpdateModal = () => {
    setState((prev) => ({ ...prev, updateModalVisible: false, selectedScooter: null }));
    getData(current, pageSize);
  };

  const handleDelete = () => getData(current, pageSize);

  const handlePageChange = (page, size) => setState((prev) => ({ ...prev, current: page, pageSize: size }));

  const filterSelect = (label, field, options) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
      <Select
        value={pendingFilters[field]}
        onChange={(val) => setPendingFilters((prev) => ({ ...prev, [field]: val }))}
        style={{ width: 130 }}
        size="small"
      >
        {options.map((o) => (
          <Option key={o.value} value={o.value}>
            {o.label}
          </Option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader
        ghost
        title="Scooters"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={showCreateModal}>
              + Add New Scooter
            </Button>
          </div>,
        ]}
      />
      <Main>
        {/* Filter Bar */}
        <Cards headless style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600, marginBottom: 2 }}>
              <FeatherIcon icon="filter" size={14} style={{ marginRight: 4 }} /> Filters:
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
              <Input
                value={pendingFilters.searchTerm}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                onPressEnter={handleApplyFilters}
                placeholder="Name, reg no, chassis..."
                size="small"
                style={{ width: 200 }}
                allowClear
                onClear={() => setPendingFilters((prev) => ({ ...prev, searchTerm: '' }))}
                suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Scooter Type</span>
              <Select
                value={pendingFilters.scooterTypeId || undefined}
                onChange={(val) => setPendingFilters((prev) => ({ ...prev, scooterTypeId: val ?? '' }))}
                style={{ width: 170 }}
                size="small"
                allowClear
                placeholder="All types"
              >
                {scooterTypes.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </div>

            {filterSelect('Active', 'isActive', BOOL_OPTIONS)}
            {filterSelect('For Rental', 'isAvailableForRental', BOOL_OPTIONS)}
            {filterSelect('For Ownership', 'isAvailableForOwnership', BOOL_OPTIONS)}
            {filterSelect('For Sale', 'isForSale', BOOL_OPTIONS)}
            {filterSelect('Is New', 'isNew', BOOL_OPTIONS)}

            <Space>
              <AntButton
                type="primary"
                size="small"
                onClick={handleApplyFilters}
                icon={<FeatherIcon icon="search" size={14} />}
              >
                Apply
              </AntButton>
              <AntButton size="small" onClick={handleResetFilters} icon={<FeatherIcon icon="rotate-ccw" size={14} />}>
                Reset
              </AntButton>
            </Space>
          </div>
        </Cards>

        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Suspense
                fallback={
                  <div className="spin">
                    <Spin size="large" />
                  </div>
                }
              >
                <ScooterList
                  scooters={scooters}
                  loading={isLoading}
                  currentPage={current}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  onEdit={showUpdateModal}
                  onDelete={handleDelete}
                  getData={getData}
                />
              </Suspense>
            </Cards>
          </Col>
        </Row>

        <Suspense fallback={<div>Loading...</div>}>
          {createModalVisible && <CreateScooter visible={createModalVisible} onCancel={hideCreateModal} />}
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          {updateModalVisible && selectedScooter && (
            <UpdateScooter
              visible={updateModalVisible}
              onCancel={hideUpdateModal}
              scooterData={selectedScooter}
              getData={() => getData(current, pageSize)}
            />
          )}
        </Suspense>
      </Main>
    </>
  );
}

export default Scooter;
