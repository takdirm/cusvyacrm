import React, { useEffect, useMemo, useState } from 'react';
import { Descriptions, Empty, Spin, Row, Col } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { getVehicleCategoryText, getVehicleServiceTypeText } from '../../../config/enum/enum';

function VehicleModelDetail() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [vehicleModel, setVehicleModel] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchVehicleModel = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${getApiUrl()}/api${API.vehicleModel.path}/${modelId}`, getHeaders());
        setVehicleModel(response.data || null);
      } catch {
        setVehicleModel(null);
      } finally {
        setLoading(false);
      }
    };

    if (modelId) fetchVehicleModel();
  }, [modelId]);

  const modelTitle = useMemo(() => {
    if (!vehicleModel) return 'Vehicle Model Details';
    return `Vehicle Model #${vehicleModel.id} - ${vehicleModel.name || '-'}`;
  }, [vehicleModel]);

  if (!loading && !vehicleModel) {
    return (
      <Main>
        <PageHeader
          ghost
          title="Vehicle Model Details"
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
        title={modelTitle}
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/vehicle/models')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards title="Model Details" headless={false}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                  <Descriptions.Item label="ID">{vehicleModel.id}</Descriptions.Item>
                  <Descriptions.Item label="Name">{vehicleModel.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Description">{vehicleModel.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Vehicle Category">
                    {getVehicleCategoryText(vehicleModel.vehicleCategory)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service Type">
                    {getVehicleServiceTypeText(vehicleModel.vehicleServiceType)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Is New">{vehicleModel.isNew ? 'Yes' : 'No'}</Descriptions.Item>
                  <Descriptions.Item label="Petrol Engine">
                    {vehicleModel.isPetrolEngine ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="License Required">
                    {vehicleModel.isLicenseRequired ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Top Speed">{vehicleModel.topSpeed || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Range">{vehicleModel.range || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Base Price">
                    {vehicleModel.basePrice != null ? `Rs ${Number(vehicleModel.basePrice).toLocaleString()}` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Rental Price Starts">
                    {vehicleModel.rentalPriceStarts != null
                      ? `Rs ${Number(vehicleModel.rentalPriceStarts).toLocaleString()}`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ownership Price Starts">
                    {vehicleModel.ownershipPriceStarts != null
                      ? `Rs ${Number(vehicleModel.ownershipPriceStarts).toLocaleString()}`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Vehicle Count">{vehicleModel.vehicleCount ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="Active">{vehicleModel.isActive ? 'Yes' : 'No'}</Descriptions.Item>
                  <Descriptions.Item label="Image URL">{vehicleModel.imageUrl || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Video URL">{vehicleModel.videoUrl || '-'}</Descriptions.Item>
                </Descriptions>
              )}
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default VehicleModelDetail;
