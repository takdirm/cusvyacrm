import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Col, Descriptions, Empty, Input, message, Row, Select, Space, Spin, Table, Pagination } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Button } from '../../../components/buttons/buttons';
import { Main } from '../../styled';
import { API } from '../../../config/api/index';
import { getItem, getSelectedRegion } from '../../../utility/localStorageControl';

function ManageTracker() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const [trackers, setTrackers] = useState([]);
  const [loadingTrackers, setLoadingTrackers] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [trackerFilter, setTrackerFilter] = useState('unassigned');
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);

  const [assignLoading, setAssignLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const vehicleIdNum = useMemo(() => Number(vehicleId), [vehicleId]);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getAuthHeaders = () => {
    const token = getItem('access_token');
    const selectedRegion = getSelectedRegion();
    const headers = { Authorization: `Bearer ${token}` };
    if (selectedRegion?.code) {
      headers['X-Region-Code'] = selectedRegion.code;
    }
    return headers;
  };

  const fetchVehicle = async () => {
    try {
      setLoadingVehicle(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.vehicle.path}/${vehicleId}`, {
        headers: getAuthHeaders(),
      });
      const data = response.data;
      setVehicle(data);
      setSelectedTrackerId(data?.trackerDevice?.id || null);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoadingVehicle(false);
    }
  };

  const fetchTrackers = async (page = 1, size = 10, search = searchTerm, filter = trackerFilter) => {
    try {
      setLoadingTrackers(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pageSize', size);
      params.append('unassignedOnly', String(filter === 'unassigned'));
      if (search && search.trim()) params.append('searchTerm', search.trim());

      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.trackerDevice.path}/paged?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      setTrackers(response.data?.items || []);
      setTotalCount(response.data?.totalCount || 0);
      setCurrent(response.data?.page || page);
      setPageSize(response.data?.pageSize || size);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load tracker devices');
      setTrackers([]);
      setTotalCount(0);
    } finally {
      setLoadingTrackers(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
    fetchTrackers(1, 10, '', trackerFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const handleApplySearch = () => {
    const value = pendingSearchTerm.trim();
    setSearchTerm(value);
    fetchTrackers(1, pageSize, value, trackerFilter);
  };

  const handleFilterChange = (value) => {
    setTrackerFilter(value);
    fetchTrackers(1, pageSize, searchTerm, value);
  };

  const handleResetSearch = () => {
    setPendingSearchTerm('');
    setSearchTerm('');
    fetchTrackers(1, pageSize, '', trackerFilter);
  };

  const handlePageChange = (page, size) => {
    fetchTrackers(page, size, searchTerm, trackerFilter);
  };

  const handleAssignTracker = async () => {
    if (!selectedTrackerId) {
      message.warning('Select a tracker device first');
      return;
    }

    try {
      setAssignLoading(true);
      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/api${API.vehicle.path}/${vehicleId}/assign-tracker/${selectedTrackerId}`, null, {
        headers: getAuthHeaders(),
      });
      message.success('Tracker assigned successfully');
      await fetchVehicle();
      await fetchTrackers(current, pageSize, searchTerm, trackerFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign tracker');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveTracker = async () => {
    try {
      setRemoveLoading(true);
      const apiUrl = getApiUrl();
      await axios.put(`${apiUrl}/api${API.vehicle.path}/${vehicleId}/remove-tracker`, null, {
        headers: getAuthHeaders(),
      });
      message.success('Tracker removed successfully');
      await fetchVehicle();
      await fetchTrackers(current, pageSize, searchTerm, trackerFilter);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to remove tracker');
    } finally {
      setRemoveLoading(false);
    }
  };

  const selectedTracker = trackers.find((item) => item.id === selectedTrackerId);
  const assignedTrackerId = vehicle?.trackerDevice?.id || null;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Brand',
      dataIndex: 'brandName',
      key: 'brandName',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'IMEI',
      dataIndex: 'imei',
      key: 'imei',
      width: 220,
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
    },
    {
      title: 'Model Number',
      dataIndex: 'modelNumber',
      key: 'modelNumber',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'Current Assignment',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
      width: 170,
      render: (value) => {
        if (!value) return <PlainLabel color="default">Unassigned</PlainLabel>;
        if (value === vehicleIdNum) return <PlainLabel color="green">This Vehicle</PlainLabel>;
        return <PlainLabel color="orange">Vehicle #{value}</PlainLabel>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title={`Manage Tracker${vehicle?.name ? ` - ${vehicle.name}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="white" outlined onClick={() => navigate('/admin/vehicle/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back to Vehicles
            </Button>
          </div>,
        ]}
      />
      <Main>
        {loadingVehicle ? (
          <div className="spin">
            <Spin size="large" />
          </div>
        ) : vehicle ? (
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Cards title="Vehicle & Assigned Tracker">
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                  <Descriptions.Item label="Vehicle ID">{vehicle.id}</Descriptions.Item>
                  <Descriptions.Item label="Name">{vehicle.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Registration No.">{vehicle.registerationNumber || '-'}</Descriptions.Item>
                </Descriptions>

                {vehicle.trackerDevice ? (
                  <Alert
                    style={{ marginTop: 12 }}
                    message={`Assigned Tracker: ${vehicle.trackerDevice.imei}`}
                    description={
                      <Space size={16} wrap>
                        <span>Brand: {vehicle.trackerDevice.brandName || '-'}</span>
                        <span>Phone: {vehicle.trackerDevice.phoneNumber || '-'}</span>
                        <span>Model: {vehicle.trackerDevice.modelNumber || '-'}</span>
                        <Button
                          size="small"
                          type="danger"
                          outlined
                          onClick={handleRemoveTracker}
                          loading={removeLoading}
                        >
                          Remove
                        </Button>
                      </Space>
                    }
                    type="info"
                    showIcon
                  />
                ) : (
                  <Alert
                    style={{ marginTop: 12 }}
                    type="warning"
                    message="No tracker assigned to this vehicle"
                    showIcon
                  />
                )}
              </Cards>
            </Col>

            <Col xs={24}>
              <Cards title="Select Tracker Device">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Search by IMEI or Phone Number</span>
                    <Input
                      placeholder="Enter IMEI or phone number"
                      value={pendingSearchTerm}
                      onChange={(e) => setPendingSearchTerm(e.target.value)}
                      onPressEnter={handleApplySearch}
                      allowClear
                      style={{ width: 280 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Tracker Filter</span>
                    <Select
                      value={trackerFilter}
                      onChange={handleFilterChange}
                      style={{ width: 190 }}
                      options={[
                        { label: 'All Trackers', value: 'all' },
                        { label: 'Unassigned Only', value: 'unassigned' },
                      ]}
                    />
                  </div>
                  <Button size="small" type="primary" onClick={handleApplySearch}>
                    Search
                  </Button>
                  <Button size="small" type="white" outlined onClick={handleResetSearch}>
                    Reset
                  </Button>
                  <Button
                    size="small"
                    type="success"
                    onClick={handleAssignTracker}
                    loading={assignLoading}
                    disabled={
                      !selectedTrackerId ||
                      (assignedTrackerId != null && selectedTrackerId === assignedTrackerId) ||
                      !selectedTracker ||
                      (selectedTracker.vehicleId != null && selectedTracker.vehicleId !== vehicleIdNum)
                    }
                  >
                    Assign
                  </Button>
                </div>

                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={trackers}
                  loading={loadingTrackers}
                  pagination={false}
                  rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedTrackerId ? [selectedTrackerId] : [],
                    onChange: (selectedRowKeys) => setSelectedTrackerId(selectedRowKeys[0] || null),
                    getCheckboxProps: (record) => ({
                      disabled: record.vehicleId != null && record.vehicleId !== vehicleIdNum,
                    }),
                  }}
                  scroll={{ x: 1100 }}
                />

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Pagination
                    current={current}
                    pageSize={pageSize}
                    total={totalCount}
                    onChange={handlePageChange}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50', '100']}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                  />
                </div>
              </Cards>
            </Col>
          </Row>
        ) : (
          <Empty description="Vehicle not found" />
        )}
      </Main>
    </>
  );
}

export default ManageTracker;
