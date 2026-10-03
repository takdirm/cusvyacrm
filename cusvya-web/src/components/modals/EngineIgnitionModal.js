import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Spin, message, Descriptions, Radio, Space, Alert } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { Button } from '../buttons/buttons';
import { getItem } from '../../utility/localStorageControl';
import PropTypes from 'prop-types';
import { API } from '../../config/api/index';

// Engine Override enum values
const ENGINE_OVERRIDE = {
  SYSTEM: 0,
  ENGINE_ON: 1,
  ENGINE_OFF: 2,
};

const ENGINE_OVERRIDE_LABELS = {
  [ENGINE_OVERRIDE.SYSTEM]: 'System (Automated Control)',
  [ENGINE_OVERRIDE.ENGINE_ON]: 'Engine On (Force On)',
  [ENGINE_OVERRIDE.ENGINE_OFF]: 'Engine Off (Force Off)',
};

const ENGINE_STATUS_COLORS = {
  ON: '#52c41a',
  OFF: '#ff4d4f',
  UNKNOWN: '#faad14',
};

function EngineIgnitionModal({ visible, onCancel, scooterId, vehicleId, title }) {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [engineData, setEngineData] = useState(null);
  const [selectedOverride, setSelectedOverride] = useState(ENGINE_OVERRIDE.SYSTEM);
  const targetVehicleId = vehicleId || scooterId;

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

  const fetchEngineStatus = useCallback(async () => {
    if (!targetVehicleId) return;

    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const endpoint = API.vehicle.engineStatus.replace('{vehicleId}', targetVehicleId);
      const response = await axios.get(`${apiUrl}/api${endpoint}`, {
        headers: getAuthHeaders(),
      });

      const data = response.data || {};
      setEngineData(data);
      setSelectedOverride(data.currentEngineOverride ?? ENGINE_OVERRIDE.SYSTEM);
    } catch (error) {
      console.error('Error fetching engine status:', error);
      message.error(error.response?.data?.message || 'Failed to load engine status');
      setEngineData(null);
    } finally {
      setLoading(false);
    }
  }, [targetVehicleId]);

  useEffect(() => {
    if (visible && targetVehicleId) {
      fetchEngineStatus();
    }
  }, [visible, targetVehicleId, fetchEngineStatus]);

  const handleUpdateOverride = async () => {
    if (!targetVehicleId) return;

    try {
      setUpdating(true);
      const apiUrl = getApiUrl();

      const payload = {
        vehicleId: Number(targetVehicleId),
        engineOverride: selectedOverride,
      };

      await axios.post(`${apiUrl}/api${API.vehicle.engineOverride}`, payload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      message.success('Engine override updated successfully');

      // Refresh the engine status after update
      await fetchEngineStatus();
    } catch (error) {
      console.error('Error updating engine override:', error);
      message.error(error.response?.data?.message || 'Failed to update engine override');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setEngineData(null);
    setSelectedOverride(ENGINE_OVERRIDE.SYSTEM);
    onCancel();
  };

  const getStatusColor = (status) => {
    if (!status) return ENGINE_STATUS_COLORS.UNKNOWN;
    return ENGINE_STATUS_COLORS[status.toUpperCase()] || ENGINE_STATUS_COLORS.UNKNOWN;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FeatherIcon icon="power" size={20} />
          <span>{title || `Vehicle Ignition - Vehicle #${targetVehicleId}`}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      {loading ? (
        <div
          className="spin"
          style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Spin size="large" />
        </div>
      ) : engineData ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <Alert
            message="Engine Status Information"
            description="View the current engine status and modify the override settings to control automated engine control."
            type="info"
            showIcon
          />

          <Descriptions bordered size="middle" column={1}>
            <Descriptions.Item label="Vehicle ID">{engineData.id || targetVehicleId}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Name">
              {engineData.vehicleName || engineData.scooterName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Registration Number">
              {engineData.registerationNumber || engineData.registrationNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Current Engine Status">
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: getStatusColor(engineData.currentEngineStatus),
                }}
              >
                {engineData.currentEngineStatus || 'UNKNOWN'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Current Override Setting">
              <span style={{ fontWeight: 500 }}>
                {ENGINE_OVERRIDE_LABELS[engineData.currentEngineOverride] || 'Unknown'}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <div
            style={{
              padding: 16,
              background: '#fafafa',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
            }}
          >
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 14 }}>Update Engine Override</div>
            <Radio.Group
              value={selectedOverride}
              onChange={(e) => setSelectedOverride(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={ENGINE_OVERRIDE.SYSTEM}>
                  <div>
                    <div style={{ fontWeight: 500 }}>System (Automated Control)</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Engine control follows business rules automatically
                    </div>
                  </div>
                </Radio>
                <Radio value={ENGINE_OVERRIDE.ENGINE_ON}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Engine On (Force On)</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Override automated rules and force engine to stay on
                    </div>
                  </div>
                </Radio>
                <Radio value={ENGINE_OVERRIDE.ENGINE_OFF}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Engine Off (Force Off)</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Override automated rules and force engine to stay off
                    </div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <Button
              size="default"
              type="default"
              onClick={fetchEngineStatus}
              disabled={updating}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FeatherIcon icon="refresh-cw" size={14} />
              Refresh Status
            </Button>
            <Space>
              <Button size="default" type="default" onClick={handleClose} disabled={updating}>
                Cancel
              </Button>
              <Button
                size="default"
                type="primary"
                onClick={handleUpdateOverride}
                loading={updating}
                disabled={updating || selectedOverride === engineData.currentEngineOverride}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FeatherIcon icon="save" size={14} />
                Update Override
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <FeatherIcon icon="alert-circle" size={48} color="#ff4d4f" />
          <div style={{ marginTop: 16, fontSize: 16, color: '#666' }}>No engine status data available</div>
        </div>
      )}
    </Modal>
  );
}

EngineIgnitionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  scooterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  vehicleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
};

export default EngineIgnitionModal;
