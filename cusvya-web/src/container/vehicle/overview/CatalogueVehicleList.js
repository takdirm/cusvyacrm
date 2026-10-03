import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Table, Pagination, Descriptions, Empty, Spin, message } from 'antd';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { getVehicleTypeText, getFuelTypeText, getChargingTypeText } from '../../../config/enum/enum';

function CatalogueVehicleList() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();

  const [catalogue, setCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
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

  const fetchCatalogue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api${API.catalogue.path}/${catalogueId}`, getHeaders());
      setCatalogue(response.data || null);
    } catch {
      setCatalogue(null);
    } finally {
      setLoading(false);
    }
  }, [catalogueId]);

  const fetchVehicles = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setVehiclesLoading(true);
        const response = await axios.get(
          `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/vehicles?page=${page}&pageSize=${size}`,
          getHeaders(),
        );
        const data = response.data || {};
        setVehicles(data.items || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setVehicles([]);
        setTotalCount(0);
        message.error(error.response?.data?.message || 'Failed to load catalogue vehicles');
      } finally {
        setVehiclesLoading(false);
      }
    },
    [catalogueId, currentPage, pageSize],
  );

  useEffect(() => {
    if (!catalogueId) return;
    fetchCatalogue();
  }, [catalogueId, fetchCatalogue]);

  useEffect(() => {
    if (!catalogueId) return;
    fetchVehicles(currentPage, pageSize);
  }, [catalogueId, currentPage, fetchVehicles, pageSize]);

  const catalogueSummary = useMemo(() => {
    if (!catalogue) return [];
    return [
      { label: 'Summary', value: catalogue.summary || '-' },
      { label: 'Brand', value: catalogue.brand || '-' },
      { label: 'Model', value: catalogue.model || '-' },
      { label: 'Year', value: catalogue.year || '-' },
      { label: 'Vehicle Type', value: getVehicleTypeText(catalogue.type) },
      { label: 'Fuel Type', value: getFuelTypeText(catalogue.fuelType) },
      { label: 'Charging Type', value: getChargingTypeText(catalogue.chargingType) },
      { label: 'Price', value: catalogue.price != null ? `Rs ${Number(catalogue.price).toLocaleString()}` : '-' },
      { label: 'Available', value: catalogue.isAvailable ? 'Yes' : 'No' },
    ];
  }, [catalogue]);

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
          <span style={{ fontWeight: 600 }}>{record.name || '-'}</span>
          <span style={{ color: '#666' }}>Model: {record.vehicleModel?.name || record.vehicleModelId || '-'}</span>
          <span style={{ color: '#666' }}>Reg No: {record.registerationNumber || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Category & Type',
      key: 'categoryType',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 4 }}>
          <span>Category: {record.vehicleCategory ?? '-'}</span>
          <span>Type: {record.vehicleType ?? '-'}</span>
        </div>
      ),
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
      render: (value) => value || '-',
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
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (value) =>
        value ? (
          <img
            src={value}
            alt="vehicle"
            style={{ width: 54, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'Model Year',
      dataIndex: 'modelYear',
      key: 'modelYear',
      width: 110,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: 'Bike Condition',
      dataIndex: 'bikeCondition',
      key: 'bikeCondition',
      width: 130,
      render: (value) => value ?? '-',
    },
    {
      title: 'Warranty',
      dataIndex: 'warrantyPeriod',
      key: 'warrantyPeriod',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: 'Chassis Number',
      dataIndex: 'chassisNumber',
      key: 'chassisNumber',
      width: 160,
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

  if (!loading && !catalogue) {
    return (
      <Main>
        <PageHeader
          ghost
          title="Catalogue Vehicles"
          buttons={[
            <div key="1" className="page-header-actions">
              <Button size="small" type="default" outlined onClick={() => navigate('/admin/catalogues/list')}>
                <FeatherIcon icon="arrow-left" size={14} /> Back
              </Button>
            </div>,
          ]}
        />
        <Cards headless>
          <Empty description="Catalogue not found" />
        </Cards>
      </Main>
    );
  }

  return (
    <>
      <PageHeader
        ghost
        title="List Vehicles"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/catalogues/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards title="Catalogue Summary" headless={false}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                  {catalogueSummary.map((item) => (
                    <Descriptions.Item key={item.label} label={item.label}>
                      {item.value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              )}
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards title="Vehicles" headless={false}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={vehicles}
                loading={vehiclesLoading}
                pagination={false}
                scroll={{ x: 1500 }}
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

export default CatalogueVehicleList;
