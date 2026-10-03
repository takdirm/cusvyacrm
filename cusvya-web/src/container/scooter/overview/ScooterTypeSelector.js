import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Spin, Empty, Typography } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { getItem } from '../../../utility/localStorageControl';
import { API } from '../../../config/api/index';

const { Text } = Typography;

function ScooterTypeSelector({ visible, onCancel, onSelect, selectedTypeId }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  useEffect(() => {
    if (visible) {
      fetchTypes();
    }
  }, [visible]);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.scooterType.path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setTypes(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to load scooter types:', error);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const boolBadge = (val, label, icon) => (
    <PlainLabel
      color={val ? 'success' : 'default'}
      style={{ fontSize: 11, marginBottom: 4, marginRight: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}
    >
      <FeatherIcon icon={icon} size={10} />
      {label}
    </PlainLabel>
  );

  return (
    <Modal
      title={
        <span>
          <FeatherIcon icon="layers" size={16} style={{ marginRight: 8 }} />
          Select Scooter Type
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={960}
      styles={{ body: { maxHeight: 540, overflowY: 'auto', padding: '16px 24px' } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#888' }}>Loading scooter types...</div>
        </div>
      ) : types.length === 0 ? (
        <Empty description="No scooter types found. Please create a Scooter Type first." />
      ) : (
        <Row gutter={[16, 16]}>
          {types.map((type) => {
            const isSelected = selectedTypeId === type.id;
            return (
              <Col xs={24} sm={12} md={8} key={type.id}>
                <Card
                  hoverable
                  onClick={() => onSelect(type)}
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    borderRadius: 8,
                    background: isSelected ? '#e6f7ff' : '#fff',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                      <PlainLabel color="blue" icon={<FeatherIcon icon="check" size={10} />}>
                        Selected
                      </PlainLabel>
                    </div>
                  )}

                  {type.imageUrl && (
                    <img
                      src={type.imageUrl}
                      alt={type.name}
                      style={{
                        width: '100%',
                        height: 110,
                        objectFit: 'cover',
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}

                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{type.name}</div>

                  {(type.topSpeed || type.range) && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13, color: '#555' }}>
                      {type.topSpeed && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FeatherIcon icon="zap" size={12} color="#faad14" />
                          <Text style={{ fontSize: 12 }}>{type.topSpeed}</Text>
                        </span>
                      )}
                      {type.range && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FeatherIcon icon="battery-charging" size={12} color="#52c41a" />
                          <Text style={{ fontSize: 12 }}>{type.range}</Text>
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {boolBadge(type.isPetrolEngine, 'Petrol', 'droplet')}
                    {boolBadge(type.isLicenseRequired, 'License Req.', 'credit-card')}
                    {boolBadge(type.isAvailableForRental, 'Rental', 'calendar')}
                    {boolBadge(type.isAvailableForOwnership, 'Ownership', 'home')}
                    {boolBadge(type.isForSale, 'For Sale', 'tag')}
                    {boolBadge(type.isNew, 'New', 'star')}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Modal>
  );
}

ScooterTypeSelector.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedTypeId: PropTypes.number,
};

export default ScooterTypeSelector;
