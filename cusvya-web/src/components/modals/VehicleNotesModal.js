import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Table, Empty, Spin, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import PropTypes from 'prop-types';
import { API } from '../../config/api/index';
import { getItem } from '../../utility/localStorageControl';

function VehicleNotesModal({ visible, onCancel, vehicle, vehicleId, title }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const actualVehicle = vehicle || null;
  const actualVehicleId = vehicleId || vehicle?.id;

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeNotes = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.notes)) return payload.notes;
    if (typeof payload?.notes === 'string') {
      try {
        const parsedNotes = JSON.parse(payload.notes);
        if (Array.isArray(parsedNotes)) return parsedNotes;
      } catch (error) {
        return [];
      }
    }
    if (Array.isArray(payload?.entries)) return payload.entries;
    return [];
  };

  const fetchNotes = useCallback(async (targetVehicleId) => {
    if (!targetVehicleId) return;

    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const endpoint = API.vehicle.notes.replace('{vehicleId}', targetVehicleId);
      const response = await axios.get(`${apiUrl}/api${endpoint}`, {
        headers: getHeaders(),
      });
      setNotes(normalizeNotes(response.data));
    } catch (error) {
      setNotes([]);
      message.error(error.response?.data?.message || 'Failed to load vehicle notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || !actualVehicleId) return undefined;
    fetchNotes(actualVehicleId);
    return undefined;
  }, [actualVehicleId, fetchNotes, visible]);

  const handleClose = () => {
    setNotes([]);
    onCancel();
  };

  const columns = useMemo(
    () => [
      {
        title: 'Action',
        dataIndex: 'Action',
        key: 'Action',
        width: 180,
        render: (value) => value || '-',
      },
      {
        title: 'Notes',
        dataIndex: 'Notes',
        key: 'Notes',
        render: (value) => value || '-',
      },
      {
        title: 'Updated At',
        dataIndex: 'UpdatedAt',
        key: 'UpdatedAt',
        width: 190,
        render: (value) => (value ? moment(value).format('YYYY-MM-DD HH:mm') : '-'),
      },
    ],
    [],
  );

  return (
    <Modal
      title={title || `Vehicle Notes - ${actualVehicle?.name || `#${actualVehicleId}`}`}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      {loading ? (
        <div className="spin" style={{ minHeight: 220 }}>
          <Spin size="large" />
        </div>
      ) : notes.length ? (
        <Table
          className="table-responsive"
          rowKey={(record, index) => `${record?.Action || 'note'}-${record?.UpdatedAt || index}`}
          dataSource={notes}
          columns={columns}
          pagination={false}
          size="small"
        />
      ) : (
        <Empty description="No notes found" />
      )}
    </Modal>
  );
}

VehicleNotesModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  vehicle: PropTypes.object,
  vehicleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
};

export default VehicleNotesModal;
