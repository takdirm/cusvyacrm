import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Pagination, Dropdown, Modal, Descriptions, Empty, InputNumber, Space, Spin, message } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { getItem } from '../../../utility/localStorageControl';

const ALARM_STATUS_MAP = {
  0: 'Normal',
  1: 'SOS',
  2: 'PowerCutAlarm',
  3: 'ShockAlarm',
  4: 'FenceInAlarm',
  5: 'FenceOutAlarm',
  14: 'FenceAlarm',
  25: 'LowBatteryAlarm',
  64: 'HighPowerVoltageAlarm',
  68: 'HarshAccelerateAlarm',
  69: 'HarshBrakingAlarm',
  70: 'HarshCurveAlarm',
  71: 'DeviceTurnOverAlarm',
  254: 'ACCOnAlarm',
  255: 'ACCOffAlarm',
};

const VOLTAGE_STATUS_MAP = {
  0: 'NoPower',
  1: 'ExtremelyLow',
  2: 'VeryLow',
  3: 'Low',
  4: 'Medium',
  5: 'High',
  6: 'VeryHigh',
};

const normalizeIdentifier = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const toPascalCase = (value) => {
  if (value == null) return '-';
  const raw = String(value).trim();
  if (!raw) return '-';
  if (/^[A-Z][A-Za-z0-9]+$/u.test(raw)) return raw;

  return raw
    .replace(/[_-]/gu, ' ')
    .split(/\s+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
};

const describeVoltage = (value) => {
  if (value == null || value === '') return '-';

  if (typeof value === 'number') {
    return VOLTAGE_STATUS_MAP[value] || `Unknown(${value})`;
  }

  const text = String(value).trim();
  if (/^\d+$/u.test(text)) {
    const numeric = Number(text);
    return VOLTAGE_STATUS_MAP[numeric] || `Unknown(${numeric})`;
  }

  return toPascalCase(text);
};

const describeAlarmStatus = (value) => {
  if (value == null || value === '') return '-';

  if (typeof value === 'number') {
    return ALARM_STATUS_MAP[value] || `UnknownAlarm(${value.toString(16).toUpperCase().padStart(2, '0')})`;
  }

  const text = String(value).trim();

  if (/^0x[\da-f]+$/iu.test(text)) {
    const parsed = Number.parseInt(text, 16);
    return ALARM_STATUS_MAP[parsed] || `UnknownAlarm(${text.replace(/^0x/iu, '').toUpperCase()})`;
  }

  if (/^\d+$/u.test(text)) {
    const parsed = Number(text);
    return ALARM_STATUS_MAP[parsed] || `UnknownAlarm(${parsed.toString(16).toUpperCase().padStart(2, '0')})`;
  }

  return toPascalCase(text);
};

const describeAccStatus = (value) => {
  if (value == null || value === '') return '-';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'high') return 'High';
  return toPascalCase(value);
};

const buildGoogleMapsUrl = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const coordinates = `${lat.toFixed(7)},${lng.toFixed(7)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
};

const LABEL_STYLES = {
  success: { color: '#ffffff', backgroundColor: '#237804', border: '1px solid #237804' },
  warning: { color: '#ffffff', backgroundColor: '#ad4e00', border: '1px solid #ad4e00' },
  error: { color: '#ffffff', backgroundColor: '#cf1322', border: '1px solid #cf1322' },
  default: { color: 'rgba(0, 0, 0, 0.88)', backgroundColor: '#fafafa', border: '1px solid #d9d9d9' },
  blue: { color: '#ffffff', backgroundColor: '#0958d9', border: '1px solid #0958d9' },
};

const renderLabel = (text, tone = 'default') => {
  const style = LABEL_STYLES[tone] || LABEL_STYLES.default;
  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        padding: '0 7px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
};

function VehicleTrackerList({ trackers, loading, currentPage, pageSize, totalCount, onPageChange }) {
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocationVehicle, setSelectedLocationVehicle] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(30);
  const [commandLoading, setCommandLoading] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getAuthHeaders = () => {
    const token = getItem('access_token') || getItem('authToken') || localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    if (key === 'alarmStatus') return describeAlarmStatus(value);
    if (key === 'voltageLevel') return describeVoltage(value);
    if (key === 'accStatus') return describeAccStatus(value);
    return String(value);
  };

  const fetchTelemetry = useCallback(async (vehicleId) => {
    if (!vehicleId) return;

    try {
      setTelemetryLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Vehicle/telemetry/current?vehicleId=${vehicleId}`, {
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

  const handleLocationOpen = useCallback(
    (record) => {
      setSelectedLocationVehicle(record);
      setLocationModalVisible(true);
      setTelemetry(null);
      fetchTelemetry(record.vehicleId);
    },
    [fetchTelemetry],
  );

  const handleLocationClose = () => {
    setLocationModalVisible(false);
    setSelectedLocationVehicle(null);
    setTelemetry(null);
    setCommandLoading(null);
  };

  const telemetryIdentifier = useMemo(() => {
    const candidates = [
      telemetry?.heartbeatCurrent?.terminalId,
      telemetry?.heartbeatCurrent?.imei,
      telemetry?.locationCurrent?.terminalId,
      telemetry?.locationCurrent?.imei,
      selectedLocationVehicle?.terminalId,
      selectedLocationVehicle?.imei,
      selectedLocationVehicle?.gPRSID,
    ];

    return candidates.map(normalizeIdentifier).find(Boolean) || null;
  }, [selectedLocationVehicle, telemetry]);

  const handleEngineCommand = useCallback(
    async (action) => {
      const identifier = telemetryIdentifier;

      if (!identifier) {
        message.warning('No tracker identifier available for this vehicle');
        return;
      }

      try {
        setCommandLoading(action);
        const apiUrl = getApiUrl();
        const commandUrl = `${apiUrl}/api/Gprs/commands/engine/${action}`;
        const requestAttempts = [
          { method: 'get', withAuth: true },
          { method: 'get', withAuth: false },
          { method: 'post', withAuth: true },
          { method: 'post', withAuth: false },
        ];

        let response;
        let lastError;

        for (const attempt of requestAttempts) {
          try {
            response = await axios.request({
              method: attempt.method,
              url: commandUrl,
              params: { identifier },
              data: null,
              ...(attempt.withAuth ? { headers: getAuthHeaders() } : {}),
            });
            break;
          } catch (attemptError) {
            lastError = attemptError;
            const statusCode = attemptError.response?.status;
            const canRetry = statusCode == null || [401, 403, 405].includes(statusCode);

            if (!canRetry) throw attemptError;
          }
        }

        if (!response) throw lastError;

        message.success(response.data?.message || `Engine ${action === 'on' ? 'on' : 'off'} command accepted`);
      } catch (error) {
        message.error(error.response?.data?.message || `Failed to send engine ${action} command`);
      } finally {
        setCommandLoading(null);
      }
    },
    [telemetryIdentifier],
  );

  useEffect(() => {
    if (!locationModalVisible || !selectedLocationVehicle?.vehicleId) return undefined;

    const intervalMs = Number(refreshIntervalSeconds) * 1000;
    if (!intervalMs || intervalMs < 5000) return undefined;

    const intervalId = setInterval(() => {
      fetchTelemetry(selectedLocationVehicle.vehicleId);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [fetchTelemetry, locationModalVisible, refreshIntervalSeconds, selectedLocationVehicle]);

  const heartbeatEntries = useMemo(() => {
    if (!telemetry?.heartbeatCurrent) return [];
    return Object.entries(telemetry.heartbeatCurrent).filter(([key]) => key !== 'rawHex');
  }, [telemetry]);

  const locationEntries = useMemo(() => {
    if (!telemetry?.locationCurrent) return [];
    return Object.entries(telemetry.locationCurrent).filter(([key]) => key !== 'rawHex');
  }, [telemetry]);

  const latitude = Number(telemetry?.locationCurrent?.latitude ?? selectedLocationVehicle?.latitude);
  const longitude = Number(telemetry?.locationCurrent?.longitude ?? selectedLocationVehicle?.longitude);
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

  const renderHealthTag = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'green') return renderLabel('Green', 'success');
    if (normalized === 'yellow' || normalized === 'orange') return renderLabel(toPascalCase(value), 'warning');
    if (normalized === 'red') return renderLabel('Red', 'error');
    return renderLabel(toPascalCase(value), 'default');
  };

  const renderStatusTag = (value) => {
    const text = toPascalCase(value);
    const normalized = text.toLowerCase();

    if (normalized.includes('on') || normalized.includes('connected') || normalized.includes('active')) {
      return renderLabel(text, 'success');
    }
    if (normalized.includes('off') || normalized.includes('disconnect') || normalized.includes('deactivated')) {
      return renderLabel(text, 'default');
    }
    if (normalized.includes('low') || normalized.includes('alarm')) {
      return renderLabel(text, 'warning');
    }
    return renderLabel(text, 'blue');
  };

  const columns = [
    {
      title: 'Vehicle ID',
      dataIndex: 'vehicleId',
      key: 'vehicleId',
      width: 90,
      fixed: 'left',
    },
    {
      title: 'Reg No.',
      dataIndex: 'registerationNumber',
      key: 'registerationNumber',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: 'Speed (km/h)',
      dataIndex: 'speedKmh',
      key: 'speedKmh',
      width: 100,
      align: 'right',
      render: (value) => (value == null ? '-' : Number(value).toFixed(0)),
    },
    {
      title: 'Oil/Electricity',
      dataIndex: 'oilElectricityStatus',
      key: 'oilElectricityStatus',
      width: 130,
      render: (value) => renderStatusTag(value),
    },
    {
      title: 'GPS',
      dataIndex: 'gpsTrackingStatus',
      key: 'gpsTrackingStatus',
      width: 95,
      render: (value) => renderStatusTag(value),
    },
    {
      title: 'Alarm',
      dataIndex: 'alarmStatus',
      key: 'alarmStatus',
      width: 150,
      render: (value) => renderStatusTag(describeAlarmStatus(value)),
    },
    {
      title: 'Charge',
      dataIndex: 'chargeStatus',
      key: 'chargeStatus',
      width: 95,
      render: (value) => renderStatusTag(value),
    },
    {
      title: 'ACC',
      dataIndex: 'accStatus',
      key: 'accStatus',
      width: 95,
      render: (value) => renderStatusTag(describeAccStatus(value)),
    },
    {
      title: 'Device',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      width: 120,
      render: (value) => renderStatusTag(value),
    },
    {
      title: 'Voltage',
      dataIndex: 'voltageLevel',
      key: 'voltageLevel',
      width: 120,
      render: (value) => renderStatusTag(describeVoltage(value)),
    },
    {
      title: 'GSM',
      dataIndex: 'gsmSignalLevel',
      key: 'gsmSignalLevel',
      width: 120,
      render: (value) => renderStatusTag(value),
    },
    {
      title: 'Location Time',
      dataIndex: 'locationTimeUtc',
      key: 'locationTimeUtc',
      width: 165,
      render: (value) => formatUtcToIst(value),
    },
    {
      title: 'Heartbeat Time',
      dataIndex: 'heartbeatReceivedAtUtc',
      key: 'heartbeatReceivedAtUtc',
      width: 165,
      render: (value) => formatUtcToIst(value),
    },
    {
      title: 'Health',
      dataIndex: 'healthColor',
      key: 'healthColor',
      width: 90,
      render: (value) => renderHealthTag(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const quickMapUrl = buildGoogleMapsUrl(record.latitude, record.longitude);
        const menuItems = [
          {
            key: 'location',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="map-pin" size={14} />
                Location
              </span>
            ),
            onClick: () => handleLocationOpen(record),
          },
          {
            key: 'open-map',
            disabled: !quickMapUrl,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="external-link" size={14} />
                Open in Google Maps
              </span>
            ),
            onClick: () => {
              if (quickMapUrl) {
                window.open(quickMapUrl, '_blank', 'noopener,noreferrer');
              }
            },
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              type="white"
              outlined
              style={{ padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Actions
              <FeatherIcon icon="chevron-down" size={13} />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={trackers}
        rowKey={(record) => `${record.vehicleId}-${record.locationReceivedAtUtc || 'na'}`}
        loading={loading}
        pagination={false}
        scroll={{ x: 2300 }}
        size="middle"
      />

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total) => `Total ${total} vehicles`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>

      <Modal
        title={
          selectedLocationVehicle
            ? `Vehicle Location - ${selectedLocationVehicle.name || `#${selectedLocationVehicle.vehicleId}`}`
            : 'Vehicle Location'
        }
        open={locationModalVisible}
        onCancel={handleLocationClose}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Space wrap>
            <span style={{ fontWeight: 600 }}>Auto refresh every</span>
            <InputNumber
              min={5}
              max={300}
              value={refreshIntervalSeconds}
              onChange={(value) => setRefreshIntervalSeconds(value || 30)}
            />
            <span>seconds</span>
            <Button size="small" type="primary" onClick={() => fetchTelemetry(selectedLocationVehicle?.vehicleId)}>
              Refresh Now
            </Button>
          </Space>

          <Space wrap>
            <Button
              size="small"
              type="danger"
              outlined
              onClick={() => handleEngineCommand('off')}
              loading={commandLoading === 'off'}
              disabled={!telemetryIdentifier}
            >
              Engine Off
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => handleEngineCommand('on')}
              loading={commandLoading === 'on'}
              disabled={!telemetryIdentifier}
            >
              Engine On
            </Button>
          </Space>
        </div>

        {telemetryLoading ? (
          <div className="spin" style={{ minHeight: 260 }}>
            <Spin size="large" />
          </div>
        ) : (
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
                  <div
                    style={{ marginTop: 8, fontSize: 12, color: '#666', display: 'flex', gap: 12, flexWrap: 'wrap' }}
                  >
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
              <Descriptions.Item label="Vehicle ID">{selectedLocationVehicle?.vehicleId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Registration">
                {selectedLocationVehicle?.registerationNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tracker IMEI">{telemetryIdentifier || '-'}</Descriptions.Item>
              <Descriptions.Item label="ACC Status">
                {describeAccStatus(selectedLocationVehicle?.accStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="Alarm Status">
                {describeAlarmStatus(selectedLocationVehicle?.alarmStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="Voltage Level">
                {describeVoltage(selectedLocationVehicle?.voltageLevel)}
              </Descriptions.Item>
            </Descriptions>

            {telemetry ? (
              <>
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
              </>
            ) : (
              <Empty description="No telemetry available for this vehicle" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

VehicleTrackerList.propTypes = {
  trackers: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default VehicleTrackerList;
