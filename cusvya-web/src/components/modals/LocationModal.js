import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Descriptions, Empty, InputNumber, Space, Spin, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import moment from 'moment';
import { Button } from '../buttons/buttons';
import { getItem } from '../../utility/localStorageControl';
import PropTypes from 'prop-types';

function LocationModal({ visible, onCancel, scooter, vehicle, scooterId, vehicleId, title }) {
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(30);

  // Support both old and new prop names
  const actualVehicle = vehicle || scooter;
  const actualVehicleId = vehicleId || scooterId;

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getAuthHeaders = () => {
    const token = getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeIdentifier = (value) => {
    if (value == null) return null;
    const normalized = String(value).trim();
    return normalized || null;
  };

  const formatUtcToIst = (value) => {
    if (!value) return '-';
    const parsed = moment.utc(value);
    if (!parsed.isValid()) return value;
    return `${parsed.utcOffset(330).format('YYYY-MM-DD HH:mm:ss')} IST`;
  };

  const formatSummaryLabel = (key) =>
    key
      .replace(/Utc$/u, ' UTC')
      .replace(/([A-Z])/gu, ' $1')
      .replace(/^./u, (char) => char.toUpperCase())
      .trim();

  const formatSummaryValue = (key, value) => {
    if (value == null || value === '') return '-';
    if (key.toLowerCase().endsWith('utc')) return formatUtcToIst(value);
    if (key === 'latitude' || key === 'longitude') {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) return numericValue.toFixed(7);
    }
    return String(value);
  };

  const fetchTelemetry = useCallback(async (targetVehicleId) => {
    if (!targetVehicleId) return;

    try {
      setTelemetryLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Vehicle/telemetry/current?vehicleId=${targetVehicleId}`, {
        headers: getAuthHeaders(),
      });
      setTelemetry(response.data || null);
    } catch (error) {
      setTelemetry(null);
      message.error(error.response?.data?.message || 'Failed to load vehicle telemetry');
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  const telemetryIdentifier = useMemo(() => {
    const candidates = [
      telemetry?.heartbeatCurrent?.terminalId,
      telemetry?.heartbeatCurrent?.imei,
      telemetry?.locationCurrent?.terminalId,
      telemetry?.locationCurrent?.imei,
      actualVehicle?.trackerDevice?.imei,
      actualVehicle?.gPRSIMEIID,
    ];

    return candidates.map(normalizeIdentifier).find(Boolean) || null;
  }, [actualVehicle, telemetry]);

  useEffect(() => {
    if (!visible || !actualVehicleId) return undefined;

    fetchTelemetry(actualVehicleId);

    const intervalMs = Number(refreshIntervalSeconds) * 1000;
    if (!intervalMs || intervalMs < 5000) return undefined;

    const intervalId = setInterval(() => {
      fetchTelemetry(actualVehicleId);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [fetchTelemetry, visible, refreshIntervalSeconds, actualVehicleId]);

  const handleClose = () => {
    setTelemetry(null);
    onCancel();
  };

  const heartbeatEntries = useMemo(() => {
    if (!telemetry?.heartbeatCurrent) return [];
    return Object.entries(telemetry.heartbeatCurrent).filter(([key]) => key !== 'rawHex');
  }, [telemetry]);

  const locationEntries = useMemo(() => {
    if (!telemetry?.locationCurrent) return [];
    return Object.entries(telemetry.locationCurrent).filter(([key]) => key !== 'rawHex');
  }, [telemetry]);

  const latitude = Number(telemetry?.locationCurrent?.latitude);
  const longitude = Number(telemetry?.locationCurrent?.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const formattedLatitude = hasLocation ? latitude.toFixed(7) : null;
  const formattedLongitude = hasLocation ? longitude.toFixed(7) : null;
  const coordinateQuery = hasLocation ? `${formattedLatitude},${formattedLongitude}` : null;
  const googleMapEmbedUrl = hasLocation
    ? `https://www.google.com/maps?output=embed&z=20&t=m&ll=${coordinateQuery}&q=${coordinateQuery}`
    : null;
  const googleMapExternalUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateQuery)}`
    : null;

  return (
    <Modal
      title={title || `Vehicle Location - ${actualVehicle?.name || `#${actualVehicleId}`}`}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <span style={{ fontWeight: 600 }}>Auto refresh every</span>
          <InputNumber
            min={5}
            max={300}
            value={refreshIntervalSeconds}
            onChange={(value) => setRefreshIntervalSeconds(value || 30)}
          />
          <span>seconds</span>
          <Button size="small" type="primary" onClick={() => fetchTelemetry(actualVehicleId)}>
            Refresh Now
          </Button>
        </Space>
      </div>

      {telemetryLoading ? (
        <div className="spin" style={{ minHeight: 260 }}>
          <Spin size="large" />
        </div>
      ) : telemetry ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            {hasLocation ? (
              <>
                <iframe
                  title="Vehicle Location Map"
                  src={googleMapEmbedUrl}
                  style={{ width: '100%', height: 360, border: '1px solid #d9d9d9', borderRadius: 8 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <FeatherIcon icon="map-pin" size={12} /> Lat: {formattedLatitude}, Lng: {formattedLongitude}
                  {googleMapExternalUrl && (
                    <a href={googleMapExternalUrl} target="_blank" rel="noopener noreferrer">
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </>
            ) : (
              <Empty description="No live location data available" />
            )}
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} title="Vehicle Summary">
            <Descriptions.Item label="Vehicle ID">{telemetry.vehicleId || actualVehicleId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Tracker IMEI">{telemetryIdentifier || '-'}</Descriptions.Item>
            <Descriptions.Item label="Last Location Time">
              {formatUtcToIst(telemetry?.locationCurrent?.locationTimeUtc)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} title="Heartbeat Data">
            {heartbeatEntries.length ? (
              heartbeatEntries.map(([key, value]) => (
                <Descriptions.Item key={key} label={formatSummaryLabel(key)}>
                  {formatSummaryValue(key, value)}
                </Descriptions.Item>
              ))
            ) : (
              <Descriptions.Item label="Heartbeat">No heartbeat data available</Descriptions.Item>
            )}
          </Descriptions>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} title="Location Data">
            {locationEntries.length ? (
              locationEntries.map(([key, value]) => (
                <Descriptions.Item key={key} label={formatSummaryLabel(key)}>
                  {formatSummaryValue(key, value)}
                </Descriptions.Item>
              ))
            ) : (
              <Descriptions.Item label="Location">No location data available</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ) : (
        <Empty description="No telemetry available for this vehicle" />
      )}
    </Modal>
  );
}

LocationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  scooter: PropTypes.object, // For backward compatibility
  vehicle: PropTypes.object,
  scooterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // For backward compatibility
  vehicleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
};

export default LocationModal;
