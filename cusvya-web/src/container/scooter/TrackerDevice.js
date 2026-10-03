import React, { lazy, useState, Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Input, Button as AntButton, Space } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { axiosDataRead } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';

const TrackerDeviceList = lazy(() => import('./overview/TrackerDeviceList'));
const CreateTrackerDevice = lazy(() => import('./overview/CreateTrackerDevice'));
const UpdateTrackerDevice = lazy(() => import('./overview/UpdateTrackerDevice'));

const defaultFilters = { searchTerm: '' };

function TrackerDevice() {
  const dispatch = useDispatch();

  const { devices, isLoading, totalCount } = useSelector((state) => ({
    devices: state.Service?.data?.items ? state.Service.data.items : [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 10,
    createModalVisible: false,
    updateModalVisible: false,
    selectedDevice: null,
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const { current, pageSize, createModalVisible, updateModalVisible, selectedDevice } = state;

  const buildQueryString = (f, page, size) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', size);
    if (f.searchTerm && f.searchTerm.trim() !== '') params.append('searchTerm', f.searchTerm.trim());
    return params.toString();
  };

  const getData = (page = 1, size = 10, f = filters) => {
    dispatch(axiosDataRead(`${API.trackerDevice.path}/paged?${buildQueryString(f, page, size)}`));
  };

  useEffect(() => {
    getData(1, 10, defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getData(current, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pageSize]);

  const handleApplyFilters = () => {
    const applied = { ...pendingFilters };
    setFilters(applied);
    setState((prev) => ({ ...prev, current: 1 }));
    getData(1, pageSize, applied);
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

  const showUpdateModal = (device) =>
    setState((prev) => ({ ...prev, updateModalVisible: true, selectedDevice: device }));

  const hideUpdateModal = () => {
    setState((prev) => ({ ...prev, updateModalVisible: false, selectedDevice: null }));
    getData(current, pageSize);
  };

  const handleDelete = () => getData(current, pageSize);

  const handlePageChange = (page, size) => setState((prev) => ({ ...prev, current: page, pageSize: size }));

  return (
    <>
      <PageHeader
        ghost
        title="Tracker Devices"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={showCreateModal}>
              + Add New TrackerDevice
            </Button>
          </div>,
        ]}
      />
      <Main>
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
                placeholder="Brand, IMEI or phone..."
                size="small"
                style={{ width: 240 }}
                allowClear
                onClear={() => setPendingFilters((prev) => ({ ...prev, searchTerm: '' }))}
                suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
              />
            </div>
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
                <TrackerDeviceList
                  devices={devices}
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
          {createModalVisible && <CreateTrackerDevice visible={createModalVisible} onCancel={hideCreateModal} />}
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          {updateModalVisible && selectedDevice && (
            <UpdateTrackerDevice
              visible={updateModalVisible}
              onCancel={hideUpdateModal}
              deviceData={selectedDevice}
              getData={() => getData(current, pageSize)}
            />
          )}
        </Suspense>
      </Main>
    </>
  );
}

export default TrackerDevice;
