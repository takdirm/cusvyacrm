import React, { useEffect, useState } from 'react';
import { Row, Col, Spin, Empty, Descriptions, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import moment from 'moment';
import axios from 'axios';
import PlainLabel from '../../../components/labels/plain-label';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import { getChargingTypeText, getFuelTypeText, getVehicleTypeText } from '../../../config/enum/enum';

function CatalogueDetail() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();

  const [catalogue, setCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    const fetchCatalogue = async () => {
      setLoading(true);
      try {
        const token = getItem('access_token');
        const apiUrl = getApiUrl();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${apiUrl}/api${API.catalogue.path}/${catalogueId}`, { headers });
        setCatalogue(response.data);
      } catch (error) {
        setCatalogue(null);
      } finally {
        setLoading(false);
      }
    };

    if (catalogueId) fetchCatalogue();
  }, [catalogueId]);

  const boolTag = (value) =>
    value ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  if (loading) {
    return (
      <div className="spin" style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!catalogue) {
    return (
      <Main>
        <Empty description="Catalogue not found" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/scooter/catalogues')}>
            Back to Catalogues
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <>
      <PageHeader
        ghost
        title={`Catalogue #${catalogue.id} - ${catalogue.brand || '-'} ${catalogue.model || ''}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="white" outlined onClick={() => navigate('/admin/scooter/catalogues')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />

      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Cards title="Media" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              {catalogue.imageUrl ? (
                <img
                  src={catalogue.imageUrl}
                  alt={`${catalogue.brand || 'vehicle'} ${catalogue.model || ''}`}
                  style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 240 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 220,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FeatherIcon icon="image" size={40} color="#ccc" />
                </div>
              )}

              <Space direction="vertical" style={{ marginTop: 12 }}>
                {catalogue.videoUrl ? (
                  <a href={catalogue.videoUrl} target="_blank" rel="noopener noreferrer">
                    <FeatherIcon icon="play-circle" size={14} /> Watch Video
                  </a>
                ) : null}
                {catalogue.view360Url ? (
                  <a href={catalogue.view360Url} target="_blank" rel="noopener noreferrer">
                    <FeatherIcon icon="rotate-cw" size={14} /> 360 View
                  </a>
                ) : null}
              </Space>
            </Cards>
          </Col>

          <Col xs={24} lg={16}>
            <Cards title="Overview" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label="Summary" span={3}>
                  {catalogue.summary || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={3}>
                  {catalogue.description || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Brand">{catalogue.brand || '-'}</Descriptions.Item>
                <Descriptions.Item label="Model">{catalogue.model || '-'}</Descriptions.Item>
                <Descriptions.Item label="Year">{catalogue.year || '-'}</Descriptions.Item>
                <Descriptions.Item label="Vehicle Type">{getVehicleTypeText(catalogue.type)}</Descriptions.Item>
                <Descriptions.Item label="Fuel Type">{getFuelTypeText(catalogue.fuelType)}</Descriptions.Item>
                <Descriptions.Item label="Charging Type">
                  {getChargingTypeText(catalogue.chargingType)}
                </Descriptions.Item>
                <Descriptions.Item label="Top Speed (Kmph)">{catalogue.topSpeedKmph ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Weight (Kg)">{catalogue.weightKg ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Seat Height (Mm)">{catalogue.seatHeightMm ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Wheel Base (Mm)">{catalogue.wheelBaseMm ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Price">
                  {catalogue.price != null ? `₹${Number(catalogue.price).toLocaleString()}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Available">{boolTag(catalogue.isAvailable)}</Descriptions.Item>
              </Descriptions>
            </Cards>

            <Cards title="Technical Details" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label="Engine CC">{catalogue.engineCC ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Engine Type">{catalogue.engineType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Horse Power">{catalogue.horsePower ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Torque (Nm)">{catalogue.torqueNm ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Transmission">{catalogue.transmission || '-'}</Descriptions.Item>
                <Descriptions.Item label="Mileage (Km/L)">{catalogue.mileageKmPerL ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Motor Power (W)">{catalogue.motorPowerW ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Motor Type">{catalogue.motorType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Battery Capacity (kWh)">
                  {catalogue.batteryCapacityKWh ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Battery Type">{catalogue.batteryType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Range (Km)">{catalogue.rangeKm ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Charging Time (Hours)">
                  {catalogue.chargingTimeHours ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Fast Charging">{boolTag(catalogue.hasFastCharging)}</Descriptions.Item>
                <Descriptions.Item label="Regen Braking">{boolTag(catalogue.hasRegenerativeBraking)}</Descriptions.Item>
                <Descriptions.Item label="Smart Connectivity">
                  {boolTag(catalogue.hasSmartConnectivity)}
                </Descriptions.Item>
                <Descriptions.Item label="ABS">{boolTag(catalogue.hasABS)}</Descriptions.Item>
                <Descriptions.Item label="Electric Start">{boolTag(catalogue.hasElectricStart)}</Descriptions.Item>
                <Descriptions.Item label="Brake Type">{catalogue.brakeType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Suspension Front">{catalogue.suspensionFront || '-'}</Descriptions.Item>
                <Descriptions.Item label="Suspension Rear">{catalogue.suspensionRear || '-'}</Descriptions.Item>
              </Descriptions>
            </Cards>

            <Cards title="Dealer & Delivery" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label="Delivery Timeline">
                  {catalogue.deliveryTimeline ? moment(catalogue.deliveryTimeline).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {catalogue.createdAt ? moment(catalogue.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {catalogue.updatedAt ? moment(catalogue.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Features" span={3}>
                  {Array.isArray(catalogue.features) && catalogue.features.length ? catalogue.features.join(', ') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default CatalogueDetail;
