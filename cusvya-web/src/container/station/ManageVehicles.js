import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Spin,
  Select,
  Input,
  Button as AntButton,
  Space,
  Tag,
  Table,
  Pagination,
  Modal,
  message,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { getItem } from '../../utility/localStorageControl';
import { API } from '../../config/api';
import { VehicleCategoryOptions, getVehicleCategoryText, getVehicleTypeText } from '../../config/enum/enum';

const { Option } = Select;

const vehicleStatusTagStyles = {
  active: {
    backgroundColor: '#237804',
    borderColor: '#237804',
    color: '#ffffff',
    fontWeight: 600,
  },
  inactive: {
    backgroundColor: '#cf1322',
    borderColor: '#cf1322',
    color: '#ffffff',
    fontWeight: 600,
  },
};

function ManageVehicles() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStationId = queryParams.get('stationId') || '';

  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [vehicles, setVehicles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [changeStationModalVisible, setChangeStationModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newStationId, setNewStationId] = useState('');
  const [changeStationLoading, setChangeStationLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchStations = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/Station/paged?page=1&pageSize=1000`, getHeaders());
      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
      setStations(items);
      if (!selectedStationId && items[0]?.id) {
        setSelectedStationId(String(items[0].id));
      }
    } catch (error) {
      setStations([]);
    }
  };

  const fetchVehicles = async (
    stationId = selectedStationId,
    category = selectedCategory,
    term = searchTerm,
    currentPage = page,
  ) => {
    if (!stationId) {
      setVehicles([]);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        vehicleCategory: String(category || 1),
      });
      if (term && term.trim()) params.append('searchTerm', term.trim());

      const response = await axios.get(
        `${getApiUrl()}/api/Vehicle/by-station/${stationId}/paged?${params.toString()}`,
        getHeaders(),
      );
      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
      setVehicles(items);
      setTotalCount(response.data?.totalCount ?? items.length ?? 0);
    } catch (error) {
      setVehicles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchVehicles(selectedStationId, selectedCategory, searchTerm, 1);
      setPage(1);
    }
  }, [selectedStationId, selectedCategory]);

  useEffect(() => {
    if (selectedStationId) {
      fetchVehicles(selectedStationId, selectedCategory, searchTerm, page);
    }
  }, [page, pageSize]);

  const selectedStation = useMemo(
    () => stations.find((station) => String(station.id) === String(selectedStationId)) || null,
    [stations, selectedStationId],
  );

  const openChangeStationModal = (vehicleRecord) => {
    const currentId = vehicleRecord?.stationId ? String(vehicleRecord.stationId) : String(selectedStationId || '');
    setSelectedVehicle(vehicleRecord);
    setNewStationId(currentId);
    setChangeStationModalVisible(true);
  };

  const closeChangeStationModal = () => {
    setChangeStationModalVisible(false);
    setSelectedVehicle(null);
    setNewStationId('');
  };

  const handleChangeStation = async () => {
    const currentStation =
      stations.find((station) => String(station.id) === String(selectedVehicle?.stationId || selectedStationId)) ||
      selectedStation;

    if (!selectedVehicle?.id) {
      message.error('Vehicle not selected');
      return;
    }

    if (!newStationId) {
      message.error('Please select a new station');
      return;
    }

    if (String(currentStation?.id || selectedStationId) === String(newStationId)) {
      message.warning('Please select a different station');
      return;
    }

    try {
      setChangeStationLoading(true);
      const assignEndpoint = API.vehicle.assignStation
        .replace('{vehicleId}', String(selectedVehicle.id))
        .replace('{stationId}', String(newStationId));

      await axios.put(`${getApiUrl()}/api${assignEndpoint}`, {}, getHeaders());
      message.success('Station changed successfully');
      closeChangeStationModal();
      fetchVehicles(selectedStationId, selectedCategory, searchTerm, page);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to change station');
    } finally {
      setChangeStationLoading(false);
    }
  };

  const columns = [
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 220,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          <strong>{record.name || '-'}</strong>
          <span style={{ color: '#666' }}>UID: {record.uid || '-'}</span>
          <span style={{ color: '#666' }}>Reg: {record.registerationNumber || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Model',
      key: 'model',
      width: 180,
      render: (_, record) => <span>{record.vehicleModel?.name || '-'}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'vehicleCategory',
      key: 'vehicleCategory',
      width: 150,
      render: (v) => getVehicleCategoryText(v),
    },
    {
      title: 'Type',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 180,
      render: (v) => getVehicleTypeText(v),
    },
    {
      title: 'Status',
      key: 'status',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <Tag style={record.isActive ? vehicleStatusTagStyles.active : vehicleStatusTagStyles.inactive}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          <span>{record.vehicleListingStatus != null ? `Listing: ${record.vehicleListingStatus}` : '-'}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <AntButton type="primary" size="small" onClick={() => openChangeStationModal(record)}>
            Change Station
          </AntButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title="Manage Vehicles"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/station/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Cards headless style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Station</label>
              <Select
                value={selectedStationId || undefined}
                onChange={(val) => setSelectedStationId(val || '')}
                style={{ width: '100%' }}
                placeholder="Select station"
                allowClear
              >
                {stations.map((station) => (
                  <Option key={station.id} value={String(station.id)}>
                    {station.name}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={8}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Search</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Vehicle ID, registration no, or name"
                allowClear
                onPressEnter={() => {
                  setPage(1);
                  fetchVehicles(selectedStationId, selectedCategory, searchTerm, 1);
                }}
              />
            </Col>

            <Col xs={24} md={6}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Vehicle Category</label>
              <Select value={selectedCategory} onChange={(val) => setSelectedCategory(val)} style={{ width: '100%' }}>
                {VehicleCategoryOptions.map((option) => (
                  <Option key={option.value} value={String(option.value)}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={2}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>&nbsp;</label>
              <AntButton
                type="primary"
                icon={<FeatherIcon icon="search" size={14} />}
                onClick={() => {
                  setPage(1);
                  fetchVehicles(selectedStationId, selectedCategory, searchTerm, 1);
                }}
                block
              >
                Filter
              </AntButton>
            </Col>
          </Row>
        </Cards>

        {selectedStation && (
          <Cards title={`Vehicles at ${selectedStation.name}`} headless={false} style={{ marginTop: 16 }}>
            {loading ? (
              <div className="spin" style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                <Table
                  dataSource={vehicles}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 900 }}
                  locale={{ emptyText: 'No vehicles found for this station and category' }}
                />
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={totalCount}
                    onChange={(newPage, newSize) => {
                      setPage(newPage);
                      if (newSize !== pageSize) setPageSize(newSize);
                    }}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </>
            )}
          </Cards>
        )}
      </Main>

      <Modal
        title={`Change Station${selectedVehicle?.name ? ` - ${selectedVehicle.name}` : ''}`}
        open={changeStationModalVisible}
        onCancel={closeChangeStationModal}
        onOk={handleChangeStation}
        okText="Submit"
        confirmLoading={changeStationLoading}
        okButtonProps={{ disabled: !newStationId }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Existing Station</label>
            <Input
              value={
                stations.find(
                  (station) => String(station.id) === String(selectedVehicle?.stationId || selectedStationId),
                )?.name ||
                selectedStation?.name ||
                '-'
              }
              disabled
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>New Station</label>
            <Select
              value={newStationId || undefined}
              onChange={(val) => setNewStationId(val || '')}
              style={{ width: '100%' }}
              placeholder="Select new station"
            >
              {stations.map((station) => (
                <Option key={station.id} value={String(station.id)}>
                  {station.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ManageVehicles;
