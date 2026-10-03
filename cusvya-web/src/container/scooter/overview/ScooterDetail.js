import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Descriptions, Divider, Empty } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import GoogleMapsSimple from '../../../components/maps/GoogleMapsSimple';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';

const boolTag = (val) =>
  val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

const infoItem = (label, value) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontWeight: 600, color: '#666', fontSize: 12 }}>{label}</span>
    <div style={{ fontSize: 14, marginTop: 2 }}>{value ?? '-'}</div>
  </div>
);

function ScooterDetail() {
  const { scooterId } = useParams();
  const navigate = useNavigate();
  const [scooter, setScooter] = useState(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    const fetchScooter = async () => {
      setLoading(true);
      try {
        const token = getItem('access_token');
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/api${API.scooter.path}/${scooterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScooter(response.data);
      } catch (error) {
        console.error('Failed to fetch scooter:', error);
      } finally {
        setLoading(false);
      }
    };
    if (scooterId) fetchScooter();
  }, [scooterId]);

  if (loading) {
    return (
      <div className="spin" style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!scooter) {
    return (
      <Main>
        <Empty description="Scooter not found" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/scooter/list')}>
            Back to Scooters
          </Button>
        </div>
      </Main>
    );
  }

  const hasLocation =
    scooter.lastLatitude != null &&
    scooter.lastLongitude != null &&
    parseFloat(scooter.lastLatitude) !== 0 &&
    parseFloat(scooter.lastLongitude) !== 0;

  return (
    <>
      <PageHeader
        ghost
        title={`Scooter: ${scooter.name || scooter.uID || scooterId}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="white" outlined onClick={() => navigate('/admin/scooter/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={[24, 24]}>
          {/* Left column: Image + Location Map */}
          <Col xs={24} lg={8}>
            <Cards title="Image" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              {scooter.imageUrl ? (
                <img
                  src={scooter.imageUrl}
                  alt={scooter.name}
                  style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 220 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 180,
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
              {scooter.videoUrl && (
                <a
                  href={scooter.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 12, textAlign: 'center' }}
                >
                  <FeatherIcon icon="play-circle" size={14} /> Watch Video
                </a>
              )}
            </Cards>

            <Cards
              title="Last Known Location"
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
              style={{ marginTop: 0 }}
            >
              {hasLocation ? (
                <>
                  <GoogleMapsSimple
                    latitude={scooter.lastLatitude}
                    longitude={scooter.lastLongitude}
                    height="250px"
                    zoom={15}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                    <FeatherIcon icon="map-pin" size={12} /> Lat: {scooter.lastLatitude}, Lng: {scooter.lastLongitude}
                  </div>
                </>
              ) : (
                <Empty description="No location data available" />
              )}
            </Cards>
          </Col>

          {/* Right column: Details */}
          <Col xs={24} lg={16}>
            <Cards title="Basic Information" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 0]}>
                <Col xs={12} sm={8}>
                  {infoItem('UID', scooter.uID)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Name', scooter.name)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Scooter Type',
                    scooter.scooterType?.name ? <PlainLabel color="blue">{scooter.scooterType.name}</PlainLabel> : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Manufacturer', scooter.manufacturer)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Top Speed', scooter.scooterType?.topSpeed || scooter.topSpeed || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Range', scooter.range || scooter.scooterType?.range)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Model Year', scooter.modelYear)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Condition', scooter.condition)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Km Driven', scooter.kmDriven?.toLocaleString())}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Registration No.', scooter.registerationNumber)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Chassis No.', scooter.chassisNumber)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Warranty Period', scooter.warrantyPeriod)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('GPRS IMEI ID', scooter.gPRSIMEIID)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('GPRS ID', scooter.gPRSID)}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Created At',
                    scooter.createdAt ? moment(scooter.createdAt).format('YYYY-MM-DD HH:mm') : '-',
                  )}
                </Col>
              </Row>
            </Cards>

            <Cards title="Pricing" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 0]}>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Rental Price / Day',
                    scooter.rentalPricePerDay != null ? `₹${Number(scooter.rentalPricePerDay).toLocaleString()}` : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Ownership Price',
                    scooter.ownershipPrice != null ? `₹${Number(scooter.ownershipPrice).toLocaleString()}` : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Cost Price',
                    scooter.costPrice != null ? `₹${Number(scooter.costPrice).toLocaleString()}` : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Sale Price', scooter.price != null ? `₹${Number(scooter.price).toLocaleString()}` : '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Savings', scooter.savings != null ? `₹${Number(scooter.savings).toLocaleString()}` : '-')}
                </Col>
              </Row>
            </Cards>

            {/* Scooter Type Details */}
            {scooter.scooterType && (
              <Cards title="Scooter Type Details" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                <Row gutter={[16, 0]}>
                  {scooter.scooterType.imageUrl && (
                    <Col xs={24} sm={6} style={{ marginBottom: 12 }}>
                      <img
                        src={scooter.scooterType.imageUrl}
                        alt={scooter.scooterType.name}
                        style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 120 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </Col>
                  )}
                  <Col xs={24} sm={scooter.scooterType.imageUrl ? 18 : 24}>
                    <Row gutter={[16, 0]}>
                      <Col xs={12} sm={8}>
                        {infoItem('Type Name', <PlainLabel color="blue">{scooter.scooterType.name}</PlainLabel>)}
                      </Col>
                      <Col xs={12} sm={8}>
                        {infoItem(
                          'Top Speed',
                          scooter.scooterType.topSpeed ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FeatherIcon icon="zap" size={12} color="#faad14" />
                              {scooter.scooterType.topSpeed}
                            </span>
                          ) : (
                            '-'
                          ),
                        )}
                      </Col>
                      <Col xs={12} sm={8}>
                        {infoItem(
                          'Range',
                          scooter.scooterType.range ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FeatherIcon icon="battery-charging" size={12} color="#52c41a" />
                              {scooter.scooterType.range}
                            </span>
                          ) : (
                            '-'
                          ),
                        )}
                      </Col>
                      {scooter.scooterType.rentalPriceStarts != null && (
                        <Col xs={12} sm={8}>
                          {infoItem(
                            'Rental From',
                            `₹${Number(scooter.scooterType.rentalPriceStarts).toLocaleString()}`,
                          )}
                        </Col>
                      )}
                      {scooter.scooterType.ownershipPriceStarts != null && (
                        <Col xs={12} sm={8}>
                          {infoItem(
                            'Ownership From',
                            `₹${Number(scooter.scooterType.ownershipPriceStarts).toLocaleString()}`,
                          )}
                        </Col>
                      )}
                    </Row>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <PlainLabel color={scooter.scooterType.isPetrolEngine ? 'orange' : 'default'}>
                        <FeatherIcon icon="droplet" size={10} style={{ marginRight: 4 }} />
                        {scooter.scooterType.isPetrolEngine ? 'Petrol' : 'Electric'}
                      </PlainLabel>
                      <PlainLabel color={scooter.scooterType.isLicenseRequired ? 'warning' : 'default'}>
                        <FeatherIcon icon="credit-card" size={10} style={{ marginRight: 4 }} />
                        License {scooter.scooterType.isLicenseRequired ? 'Required' : 'Not Required'}
                      </PlainLabel>
                      <PlainLabel color={scooter.scooterType.isAvailableForRental ? 'success' : 'default'}>
                        <FeatherIcon icon="calendar" size={10} style={{ marginRight: 4 }} />
                        {scooter.scooterType.isAvailableForRental ? 'Rental Available' : 'No Rental'}
                      </PlainLabel>
                      <PlainLabel color={scooter.scooterType.isAvailableForOwnership ? 'success' : 'default'}>
                        <FeatherIcon icon="home" size={10} style={{ marginRight: 4 }} />
                        {scooter.scooterType.isAvailableForOwnership ? 'Ownership Available' : 'No Ownership'}
                      </PlainLabel>
                      <PlainLabel color={scooter.scooterType.isForSale ? 'success' : 'default'}>
                        <FeatherIcon icon="tag" size={10} style={{ marginRight: 4 }} />
                        {scooter.scooterType.isForSale ? 'For Sale' : 'Not for Sale'}
                      </PlainLabel>
                      <PlainLabel color={scooter.scooterType.isNew ? 'blue' : 'default'}>
                        <FeatherIcon icon="star" size={10} style={{ marginRight: 4 }} />
                        {scooter.scooterType.isNew ? 'New' : 'Used'}
                      </PlainLabel>
                    </div>
                  </Col>
                </Row>
              </Cards>
            )}

            <Cards title="Status" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={8}>
                  {infoItem('Active', boolTag(scooter.isActive))}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Assigned', boolTag(scooter.assigned))}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Certified', boolTag(scooter.isCertified))}
                </Col>
              </Row>
            </Cards>

            {scooter.features && scooter.features.length > 0 && (
              <Cards title="Features" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {scooter.features.map((f, i) => (
                    <PlainLabel key={i} color="geekblue">
                      {f.name || f.feature || JSON.stringify(f)}
                    </PlainLabel>
                  ))}
                </div>
              </Cards>
            )}
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default ScooterDetail;
