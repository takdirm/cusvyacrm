import React, { lazy, useState, Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin } from 'antd';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';

const StationList = lazy(() => import('./overview/StationList'));
const CreateStation = lazy(() => import('./overview/CreateStation'));
const UpdateStation = lazy(() => import('./overview/UpdateStation'));

function Station() {
  const dispatch = useDispatch();

  const { stations, isLoading, totalCount } = useSelector((state) => ({
    stations: state.Service?.data?.items ? state.Service.data.items : [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 10,
    createModalVisible: false,
    updateModalVisible: false,
    selectedStation: null,
  });

  const { current, pageSize, createModalVisible, updateModalVisible, selectedStation } = state;

  const getData = async (currentPage = 1, currentPageSize = 10) => {
    const endpoint = `${API.station.path}/paged?page=${currentPage}&pageSize=${currentPageSize}`;
    await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));
  };

  useEffect(() => {
    getData(1, 10);
  }, [dispatch]);

  useEffect(() => {
    if (current !== 1 || pageSize !== 10) {
      getData(current, pageSize);
    }
  }, [current, pageSize]);

  const showCreateModal = () => setState((prev) => ({ ...prev, createModalVisible: true }));

  const hideCreateModal = () => {
    setState((prev) => ({ ...prev, createModalVisible: false }));
    getData(current, pageSize);
  };

  const showUpdateModal = (station) => {
    setState((prev) => ({ ...prev, updateModalVisible: true, selectedStation: station }));
  };

  const hideUpdateModal = () => {
    setState((prev) => ({ ...prev, updateModalVisible: false, selectedStation: null }));
    getData(current, pageSize);
  };

  const handleDelete = () => getData(current, pageSize);

  const handlePageChange = (page, size) => {
    setState((prev) => ({ ...prev, current: page, pageSize: size }));
  };

  return (
    <>
      <PageHeader
        ghost
        title="Stations"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={showCreateModal}>
              + Add New Station
            </Button>
          </div>,
        ]}
      />
      <Main>
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
                <StationList
                  stations={stations}
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
          {createModalVisible && <CreateStation visible={createModalVisible} onCancel={hideCreateModal} />}
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          {updateModalVisible && selectedStation && (
            <UpdateStation
              visible={updateModalVisible}
              onCancel={hideUpdateModal}
              stationData={selectedStation}
              getData={() => getData(current, pageSize)}
            />
          )}
        </Suspense>
      </Main>
    </>
  );
}

export default Station;
