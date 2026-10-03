import React, { lazy, useState, Suspense, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Modal, message } from 'antd';
import { Routes, Route, Link } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { ProjectHeader, ProjectSorting } from '../style';
import { AutoComplete } from '../../components/autoComplete/autoComplete';
import { Button } from '../../components/buttons/buttons';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';
import { DataService } from '../../config/dataService/dataService'; // Adjust the import based on your project structure

const List = lazy(() => import('./overview/List'));
const CreateDevice = lazy(() => import('./overview/CreateDevice'));
const UpdateDevice = lazy(() => import('./overview/UpdateDevice'));

function Device() {
  const dispatch = useDispatch();
  // Get Device data from Redux store
  const { Devices, isLoading } = useSelector((state) => {
    return {
      Devices: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
    };
  });

  const [state, setState] = useState({
    visible: false,
    selectedFilterType: null,
    current: 1,
    pageSize: 10,
    createModalVisible: false,
    updateModalVisible: false,
    selectedDevice: null,
    loading: false,
    error: null,
    hostEntries: [],
  });

  const {
    selectedFilterType,
    current,
    pageSize,
    createModalVisible,
    updateModalVisible,
    selectedDevice,
    loading,
    hostEntries,
  } = state;

  const getData = async (currentPage = 1, currentPageSize = 10, filterType = selectedFilterType) => {
    // Build query parameters based on filter type
    let queryParams = `page=${currentPage}&pageSize=${currentPageSize}`;

    if (filterType === 'isonline') queryParams += '&isOnline=true';
    else if (filterType === 'isoffline') queryParams += '&isOnline=false';
    else queryParams += '&isOnline=';

    const endpoint = `${API.device.path}/paged?${queryParams}`;
    await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));
  };

  // Refactored handleRefreshHostEntries method
  const handleRefreshHostEntries = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await DataService.post(`${API.device.path}/refresh-host-entries`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.data) {
        message.success('Host file entries refreshed successfully!');
        setState((prev) => ({ ...prev, loading: false, error: null }));
      }
    } catch (error) {
      console.error('Error refreshing host entries:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh host entries';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      message.error(errorMessage);
    }
  }, []);

  // Load Device data on component mount
  useEffect(() => {
    getData(1, 10);
  }, [dispatch]);

  // Reload data when filter changes
  useEffect(() => {
    getData(current, pageSize, selectedFilterType);
  }, [selectedFilterType, current, pageSize]);

  const onChangeFilter = (value) => {
    setState({
      ...state,
      selectedFilterType: value,
      current: 1, // Reset to first page when changing filter
    });
  };

  // Modal functions
  const showCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: true }));
  };

  const hideCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: false }));
  };

  const showUpdateModal = (Device) => {
    setState((prev) => ({
      ...prev,
      updateModalVisible: true,
      selectedDevice: Device,
    }));
  };

  const handleRefresh = useCallback(() => {
    getData(current, pageSize, selectedFilterType);
  }, [current, pageSize, selectedFilterType]);

  const hideUpdateModal = () => {
    setState((prev) => ({
      ...prev,
      updateModalVisible: false,
      selectedDevice: null,
    }));
  };

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Devices"
          subTitle={<> {Devices.length} Devices </>}
          buttons={[
            <Button key="create" type="primary" icon={<FeatherIcon icon="plus" size={16} />} onClick={showCreateModal}>
              Create Device
            </Button>,
            <Button
              key="refresh-host-file"
              type="default"
              icon={<FeatherIcon icon="file-text" size={16} />}
              onClick={handleRefreshHostEntries}
              loading={loading}
              disabled={loading}
            >
              Refresh Host Entries
            </Button>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <ProjectSorting>
              <div className="project-sort-bar">
                <div className="project-sort-nav">
                  <nav>
                    <ul>
                      <li className={state.selectedFilterType === null ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter(null)} to="#">
                          All
                        </Link>
                      </li>
                      <li className={state.selectedFilterType === 'isonline' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('isonline')} to="#">
                          Online
                        </Link>
                      </li>
                      <li className={state.selectedFilterType === 'isoffline' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('isoffline')} to="#">
                          Offline
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div className="project-sort-search">
                  <AutoComplete onSearch={() => {}} dataSource={Devices} placeholder="Search Devices" patterns />
                </div>
                <div className="project-sort-group">
                  <div className="layout-style">
                    <Button type="text" size="small" onClick={handleRefresh} loading={isLoading} disabled={isLoading}>
                      <FeatherIcon icon="refresh-cw" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </ProjectSorting>

            <div>
              <Routes>
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <div className="spin">
                          <Spin />
                        </div>
                      }
                    >
                      <List onEdit={showUpdateModal} filterStatus={state.selectedFilterType} getData={getData} />
                    </Suspense>
                  }
                />

                <Route
                  path="list"
                  element={
                    <Suspense
                      fallback={
                        <div className="spin">
                          <Spin />
                        </div>
                      }
                    >
                      <List onEdit={showUpdateModal} filterStatus={state.selectedFilterType} />
                    </Suspense>
                  }
                />
              </Routes>
            </div>
          </Col>
        </Row>

        {/* Modals */}
        <Suspense fallback={<Spin />}>
          <CreateDevice visible={createModalVisible} onCancel={hideCreateModal} />
        </Suspense>

        <Suspense fallback={<Spin />}>
          <UpdateDevice visible={updateModalVisible} onCancel={hideUpdateModal} DeviceData={selectedDevice} />
        </Suspense>
      </Main>
    </>
  );
}

export default Device;
