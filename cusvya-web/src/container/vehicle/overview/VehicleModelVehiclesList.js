import React, { useCallback, useEffect, useState } from 'react';
import { Table, Pagination, Row, Col, Spin, Empty, message } from 'antd';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import {
  getVehicleCategoryText,
  getVehicleTypeText,
  getVehicleListingStatusText,
  getOwnershipStatusText,
} from '../../../config/enum/enum';

function VehicleModelVehiclesList() {
  const { modelId } = useParams();
  const navigate = useNavigate();

  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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

  const fetchModel = useCallback(async () => {
    try {
      setLoadingModel(true);
      const response = await axios.get(`${getApiUrl()}/api${API.vehicleModel.path}/${modelId}`, getHeaders());
      setModel(response.data || null);
    } catch {
      setModel(null);
    } finally {
      setLoadingModel(false);
    }
  }, [modelId]);

  const fetchVehicles = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setLoadingVehicles(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.vehicle.path}/paged?page=${page}&pageSize=${size}&vehicleModelId=${modelId}`,
          getHeaders(),
        );
        const data = response.data || {};
        setVehicles(data.items || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setVehicles([]);
        setTotalCount(0);
        message.error(error.response?.data?.message || 'Failed to load vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    },
    [modelId, currentPage, pageSize],
  );

  useEffect(() => {
    if (!modelId) return;
    fetchModel();
  }, [modelId, fetchModel]);

  useEffect(() => {
    if (!modelId) return;
    fetchVehicles(currentPage, pageSize);
  }, [modelId, currentPage, pageSize, fetchVehicles]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left',
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 220,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <strong>{record.name || '-'}</strong>
          <span style={{ color: '#666' }}>Reg No: {record.registerationNumber || '-'}</span>
          <span style={{ color: '#666' }}>Chassis: {record.chassisNumber || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Category & Type',
      key: 'categoryType',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>Category: {getVehicleCategoryText(record.vehicleCategory)}</span>
          <span>Type: {getVehicleTypeText(record.vehicleType)}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 190,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>Listing: {getVehicleListingStatusText(record.vehicleListingStatus)}</span>
          <span>Ownership: {getOwnershipStatusText(record.ownershipStatus)}</span>
        </div>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      align: 'right',
      render: (value) => (value != null ? `Rs ${Number(value).toLocaleString()}` : '-'),
    },
    {
      title: 'Model Year',
      dataIndex: 'modelYear',
      key: 'modelYear',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (value) => (value ? 'Yes' : 'No'),
    },
  ];

  if (!loadingModel && !model) {
    return (
      <Main>
        <PageHeader
          ghost
          title="List Vehicles"
          buttons={[
            <div key="1" className="page-header-actions">
              <Button size="small" type="default" outlined onClick={() => navigate('/admin/vehicle/models')}>
                <FeatherIcon icon="arrow-left" size={14} /> Back
              </Button>
            </div>,
          ]}
        />
        <Cards headless>
          <Empty description="Vehicle model not found" />
        </Cards>
      </Main>
    );
  }

  return (
    <>
      <PageHeader
        ghost
        title={`List Vehicles${model?.name ? ` - ${model.name}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/vehicle/models')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards headless>
              {loadingModel ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <div style={{ marginBottom: 12, color: '#666' }}>
                  Model ID: {model?.id || modelId} | Total Vehicles: {totalCount}
                </div>
              )}

              <Table
                rowKey="id"
                columns={columns}
                dataSource={vehicles}
                loading={loadingVehicles}
                pagination={false}
                scroll={{ x: 1100 }}
                className="table-responsive"
              />

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={['10', '20', '50', '100']}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} vehicles`}
                />
              </div>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default VehicleModelVehiclesList;
