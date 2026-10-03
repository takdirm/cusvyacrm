import React, { lazy, useState, Suspense, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Select, Input, InputNumber, Switch, Button as AntButton, Space } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { axiosDataRead } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';

const ScooterTrackerList = lazy(() => import('./overview/ScooterTrackerList'));

const { Option } = Select;

const OIL_ELECTRICITY_STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Connected', value: 'connected' },
  { label: 'Disconnected', value: 'disconnected' },
];

const ACC_STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Low', value: 'low' },
  { label: 'High', value: 'high' },
];

const VOLTAGE_LEVEL_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'NoPower', value: 'nopower' },
  { label: 'ExtremelyLow', value: 'extremelylow' },
  { label: 'VeryLow', value: 'verylow' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'VeryHigh', value: 'veryhigh' },
];

const defaultFilters = {
  searchTerm: '',
  oilElectricityStatus: '',
  accStatus: '',
  voltageLevel: '',
};

function ScooterTracker() {
  const dispatch = useDispatch();

  const { trackers, isLoading, totalCount } = useSelector((state) => ({
    trackers: state.Service?.data?.items ? state.Service.data.items : [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 20,
  });
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(30);

  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const { current, pageSize } = state;

  const buildQueryString = (f, page, size) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', size);
    if (f.searchTerm && f.searchTerm.trim()) params.append('searchTerm', f.searchTerm.trim().toLowerCase());
    if (f.oilElectricityStatus) params.append('oilElectricityStatus', f.oilElectricityStatus);
    if (f.accStatus) params.append('accStatus', f.accStatus);
    if (f.voltageLevel) params.append('voltageLevel', f.voltageLevel);
    return params.toString();
  };

  const getData = (page = 1, size = 20, f = filters) => {
    dispatch(axiosDataRead(`${API.scooterTracker.path}?${buildQueryString(f, page, size)}`));
  };

  useEffect(() => {
    getData(1, 20, defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getData(current, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pageSize]);

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;

    const intervalMs = Number(autoRefreshSeconds) * 1000;
    if (!intervalMs || intervalMs < 5000) return undefined;

    const intervalId = setInterval(() => {
      getData(current, pageSize, filters);
    }, intervalMs);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, autoRefreshSeconds, current, pageSize, filters]);

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

  const handlePageChange = (page, size) => setState((prev) => ({ ...prev, current: page, pageSize: size }));

  const handleManualRefresh = () => {
    getData(current, pageSize, filters);
  };

  const filterSelect = (label, field, options) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
      <Select
        value={pendingFilters[field]}
        onChange={(value) => setPendingFilters((prev) => ({ ...prev, [field]: value }))}
        style={{ width: 170 }}
        size="small"
      >
        {options.map((item) => (
          <Option key={item.value} value={item.value}>
            {item.label}
          </Option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader ghost title="Scooter Tracker" />
      <Main>
        <Cards headless style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', flex: 1 }}>
              <span style={{ fontWeight: 600, marginBottom: 2 }}>
                <FeatherIcon icon="filter" size={14} style={{ marginRight: 4 }} /> Filters:
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
                <Input
                  value={pendingFilters.searchTerm}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                  onPressEnter={handleApplyFilters}
                  placeholder="Name, registration, manufacturer"
                  size="small"
                  style={{ width: 260 }}
                  allowClear
                  onClear={() => setPendingFilters((prev) => ({ ...prev, searchTerm: '' }))}
                  suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
                />
              </div>

              {filterSelect('Oil/Electricity', 'oilElectricityStatus', OIL_ELECTRICITY_STATUS_OPTIONS)}
              {filterSelect('ACC Status', 'accStatus', ACC_STATUS_OPTIONS)}
              {filterSelect('Voltage Level', 'voltageLevel', VOLTAGE_LEVEL_OPTIONS)}

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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Manual Refresh</span>
                <AntButton
                  size="small"
                  shape="circle"
                  onClick={handleManualRefresh}
                  icon={<FeatherIcon icon="refresh-cw" size={14} />}
                  loading={isLoading}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Auto Refresh</span>
                <Space size={8}>
                  <Switch checked={autoRefreshEnabled} onChange={setAutoRefreshEnabled} size="small" />
                  <span style={{ fontSize: 12, color: '#666' }}>{autoRefreshEnabled ? 'Enabled' : 'Disabled'}</span>
                </Space>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Refresh Seconds</span>
                <InputNumber
                  min={5}
                  max={600}
                  size="small"
                  style={{ width: 130 }}
                  value={autoRefreshSeconds}
                  onChange={(value) => setAutoRefreshSeconds(value || 30)}
                  disabled={!autoRefreshEnabled}
                />
              </div>
            </div>
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
                <ScooterTrackerList
                  trackers={trackers}
                  loading={isLoading}
                  currentPage={current}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              </Suspense>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default ScooterTracker;
