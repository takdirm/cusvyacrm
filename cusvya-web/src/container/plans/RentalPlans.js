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

const RentalPlanList = lazy(() => import('./overview/RentalPlanList'));
const CreateRentalPlan = lazy(() => import('./overview/CreateRentalPlan'));
const UpdateRentalPlan = lazy(() => import('./overview/UpdateRentalPlan'));

const defaultFilters = { searchTerm: '' };

function RentalPlans() {
  const dispatch = useDispatch();

  const { plans, isLoading, totalCount } = useSelector((state) => ({
    plans: state.Service?.data?.items ?? [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 10,
    createVisible: false,
    updateVisible: false,
    selectedPlan: null,
  });

  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const { current, pageSize, createVisible, updateVisible, selectedPlan } = state;

  const buildQueryString = (f, page, size) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', size);
    if (f.searchTerm?.trim()) params.append('searchTerm', f.searchTerm.trim());
    return params.toString();
  };

  const getData = (page = current, size = pageSize, f = filters) => {
    dispatch(axiosDataRead(`${API.rentalPlan.path}/paged?${buildQueryString(f, page, size)}`));
  };

  useEffect(() => {
    getData(1, 10, defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    setFilters(pendingFilters);
    setState((p) => ({ ...p, current: 1 }));
    getData(1, pageSize, pendingFilters);
  };

  const handleReset = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    setState((p) => ({ ...p, current: 1 }));
    getData(1, pageSize, defaultFilters);
  };

  const handlePageChange = (page, size) => {
    setState((p) => ({ ...p, current: page, pageSize: size }));
    getData(page, size);
  };

  return (
    <>
      <PageHeader
        ghost
        title="Rental Plans"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={() => setState((p) => ({ ...p, createVisible: true }))}>
              + Add Rental Plan
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Cards headless style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <FeatherIcon icon="filter" size={14} style={{ marginBottom: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
              <Input
                value={pendingFilters.searchTerm}
                onChange={(e) => setPendingFilters((p) => ({ ...p, searchTerm: e.target.value }))}
                onPressEnter={handleApply}
                placeholder="Name, duration..."
                size="small"
                style={{ width: 220 }}
                allowClear
                suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
              />
            </div>
            <Space>
              <AntButton
                type="primary"
                size="small"
                onClick={handleApply}
                icon={<FeatherIcon icon="search" size={14} />}
              >
                Apply
              </AntButton>
              <AntButton size="small" onClick={handleReset} icon={<FeatherIcon icon="rotate-ccw" size={14} />}>
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
                <RentalPlanList
                  plans={plans}
                  loading={isLoading}
                  currentPage={current}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  onEdit={(plan) => setState((p) => ({ ...p, updateVisible: true, selectedPlan: plan }))}
                  onDelete={() => getData()}
                  getData={getData}
                />
              </Suspense>
            </Cards>
          </Col>
        </Row>

        <Suspense fallback={null}>
          {createVisible && (
            <CreateRentalPlan
              visible={createVisible}
              onCancel={() => {
                setState((p) => ({ ...p, createVisible: false }));
                getData();
              }}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {updateVisible && selectedPlan && (
            <UpdateRentalPlan
              visible={updateVisible}
              planData={selectedPlan}
              onCancel={() => {
                setState((p) => ({ ...p, updateVisible: false, selectedPlan: null }));
                getData();
              }}
              getData={getData}
            />
          )}
        </Suspense>
      </Main>
    </>
  );
}

export default RentalPlans;
