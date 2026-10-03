import React, { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Link, Routes, Route } from 'react-router-dom';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Main } from '../styled';
import { ProjectHeader, ProjectSorting } from '../style';
import { AutoComplete } from '../../components/autoComplete/autoComplete';
import { Button } from '../../components/buttons/buttons';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';

const List = lazy(() => import('./overview/List'));
const CreateUser = lazy(() => import('./overview/CreateUser'));
const UpdateUser = lazy(() => import('./overview/UpdateUser'));

function UserList() {
  const dispatch = useDispatch();

  // Get user data from Redux store
  const { users, isLoading, totalCount } = useSelector((state) => {
    return {
      users: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [state, setState] = useState({
    selectedFilterType: null,
    current: 1,
    pageSize: 10,
    createModalVisible: false,
    updateModalVisible: false,
    selectedUser: null,
  });

  const { selectedFilterType, current, pageSize, createModalVisible, updateModalVisible, selectedUser } = state;

  // Get user data with pagination and filters
  const getData = useCallback(
    async (currentPage = current, currentPageSize = pageSize, filterType = selectedFilterType) => {
      // Build query parameters based on filter type
      let queryParams = `page=${currentPage}&pageSize=${currentPageSize}`;

      if (filterType === 'active') queryParams += '&isActive=true';
      else if (filterType === 'inactive') queryParams += '&isActive=false';

      const endpoint = `${API.user.path}/paginated?${queryParams}`;
      await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));
    },
    [current, pageSize, selectedFilterType, dispatch],
  );

  // Load user data on component mount
  useEffect(() => {
    getData(1, 10);
  }, []);

  // Reload data when filter changes
  useEffect(() => {
    getData(1, 10, selectedFilterType); // Reset to page 1 when filter changes
  }, [selectedFilterType]);

  const onShowSizeChange = (current, pageSize) => {
    setState((prev) => ({ ...prev, current, pageSize }));
    getData(current, pageSize);
  };

  const onHandleChange = (current, pageSize) => {
    setState((prev) => ({ ...prev, current, pageSize }));
    getData(current, pageSize);
  };

  const onChangeFilter = (value) => {
    setState((prev) => ({
      ...prev,
      selectedFilterType: value,
      current: 1, // Reset to first page when changing filter
    }));
  };

  // Modal functions
  const showCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: true }));
  };

  const hideCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: false }));
  };

  const showUpdateModal = (user) => {
    setState((prev) => ({
      ...prev,
      updateModalVisible: true,
      selectedUser: user,
    }));
  };

  const hideUpdateModal = () => {
    setState((prev) => ({
      ...prev,
      updateModalVisible: false,
      selectedUser: null,
    }));
  };

  const handleRefresh = () => {
    getData(current, pageSize);
  };

  const handleCreateSuccess = () => {
    hideCreateModal();
    getData(1, pageSize); // Refresh and go to first page
  };

  const handleUpdateSuccess = () => {
    hideUpdateModal();
    getData(current, pageSize); // Refresh current page
  };

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Users"
          subTitle={<>{totalCount} users</>}
          buttons={[
            <Button key="create" type="primary" size="default" onClick={showCreateModal}>
              <FeatherIcon icon="user-plus" size={16} style={{ marginRight: '8px' }} />
              Create User
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
                      <li className={selectedFilterType === null ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter(null)} to="#">
                          All
                        </Link>
                      </li>
                      <li className={selectedFilterType === 'active' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('active')} to="#">
                          Active
                        </Link>
                      </li>
                      <li className={selectedFilterType === 'inactive' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('inactive')} to="#">
                          Inactive
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div className="project-sort-search">
                  <AutoComplete onSearch={() => {}} dataSource={users} placeholder="Search users" patterns />
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
                      <List
                        onEdit={showUpdateModal}
                        filterStatus={selectedFilterType}
                        getData={getData}
                        current={current}
                        pageSize={pageSize}
                        onShowSizeChange={onShowSizeChange}
                        onHandleChange={onHandleChange}
                      />
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
                      <List
                        onEdit={showUpdateModal}
                        filterStatus={selectedFilterType}
                        getData={getData}
                        current={current}
                        pageSize={pageSize}
                        onShowSizeChange={onShowSizeChange}
                        onHandleChange={onHandleChange}
                      />
                    </Suspense>
                  }
                />
              </Routes>
            </div>
          </Col>
        </Row>

        {/* Modals */}
        <Suspense fallback={<Spin />}>
          <CreateUser visible={createModalVisible} onCancel={hideCreateModal} onSuccess={handleCreateSuccess} />
        </Suspense>

        <Suspense fallback={<Spin />}>
          <UpdateUser
            visible={updateModalVisible}
            onCancel={hideUpdateModal}
            userData={selectedUser}
            onSuccess={handleUpdateSuccess}
          />
        </Suspense>
      </Main>
    </>
  );
}

export default UserList;
