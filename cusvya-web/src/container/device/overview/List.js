import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Pagination, Spin, Modal, message } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import PropTypes, { string } from 'prop-types';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { ProjectList, ProjectPagination } from '../../style';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Button } from '../../../components/buttons/buttons';
import { Dropdown } from '../../../components/dropdown/dropdown';
import { DataService } from '../../../config/dataService/dataService';

function DeviceLists({ onEdit, filterStatus, getData }) {
  const dispatch = useDispatch();
  // Get Device data from Redux store
  const { Devices, isLoading, error, totalCount } = useSelector((state) => {
    return {
      Devices: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
      error: state.Service?.error || null,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [state, setState] = useState({
    visible: false,
    selectedFilterType: filterStatus,
    current: 1,
    pageSize: 10,
    modalVisible: false,
    modalTitle: '',
    modalContent: '',
    modalStatus: 'info',
    actionLoading: false,
  });

  const { selectedFilterType, current, pageSize, modalVisible, modalTitle, modalContent, modalStatus } = state;

  // Show status modal
  const showStatusModal = (title, content, status) => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalTitle: title,
      modalContent: content,
      modalStatus: status,
    }));
  };

  // Close status modal
  const handleModalClose = () => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      modalTitle: '',
      modalContent: '',
      modalStatus: 'info',
    }));
  };

  // Handle device deletion
  const handleDelete = useCallback(
    (DeviceId) => {
      Modal.confirm({
        title: 'Delete Device',
        icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
        content: 'Are you sure you want to delete this device? This action cannot be undone.',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: () => {
          dispatch(
            axiosDataDelete({
              path: API.device.path,
              id: DeviceId,
              getData: () => getData(current, pageSize, selectedFilterType),
            }),
          );
        },
      });
    },
    [dispatch, current, pageSize, selectedFilterType, getData],
  );

  const handlePing = async (computerName) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      const response = await DataService.post(
        `${API.tools.path}/${API.tools.ping}?computerName=${computerName}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      if (response.data.isSuccess) {
        showStatusModal('Ping Success', response.data.message || `Successfully pinged ${computerName}`, 'success');
        message.success(`${computerName}: ${response.data.message}`);
      } else {
        showStatusModal('Ping Failed', response.data.message, 'error');
        message.error('Ping failed');
      }
    } catch (error) {
      console.error('Error pinging device:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to ping device';
      showStatusModal('Ping Error', errorMessage, 'error');
      message.error('Error occurred while pinging');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  const handleShutdown = async (computerName) => {
    Modal.confirm({
      title: 'Shutdown Computer',
      icon: <FeatherIcon icon="power" size={20} style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to shutdown ${computerName}?`,
      okText: 'Shutdown',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, actionLoading: true }));

          const response = await DataService.post(
            `${API.tools.path}/${API.tools.shutdown}?computerName=${computerName}`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          );
          if (response.data.isSuccess) {
            showStatusModal(
              'Shutdown Success',
              response.data.message || `Successfully initiated shutdown for ${computerName}`,
              'success',
            );
            message.success(`Shutdown initiated for ${computerName}`);
          } else {
            showStatusModal('Shutdown Failed', response.data.message || `Failed to shutdown ${computerName}`, 'error');
            message.error('Shutdown failed');
          }
        } catch (error) {
          console.error('Error shutting down device:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to shutdown device';
          showStatusModal('Shutdown Error', errorMessage, 'error');
          message.error('Error occurred while shutting down');
        } finally {
          setState((prev) => ({ ...prev, actionLoading: false }));
        }
      },
    });
  };

  const handleRestart = async (computerName) => {
    Modal.confirm({
      title: 'Restart Computer',
      icon: <FeatherIcon icon="refresh-cw" size={20} style={{ color: '#fa8c16' }} />,
      content: `Are you sure you want to restart ${computerName}?`,
      okText: 'Restart',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, actionLoading: true }));

          const response = await DataService.post(
            `${API.tools.path}/${API.tools.restart}?computerName=${computerName}`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          );

          if (response.data.isSuccess) {
            showStatusModal(
              'Restart Success',
              response.data.message || `Successfully initiated restart for ${computerName}`,
              'success',
            );
            message.success(`Restart initiated for ${computerName}`);
          } else {
            showStatusModal('Restart Failed', response.data.message || `Failed to restart ${computerName}`, 'error');
            message.error('Restart failed');
          }
        } catch (error) {
          console.error('Error restarting device:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to restart device';
          showStatusModal('Restart Error', errorMessage, 'error');
          message.error('Error occurred while restarting');
        } finally {
          setState((prev) => ({ ...prev, actionLoading: false }));
        }
      },
    });
  };

  const handleWakeOnLan = async (computerName) => {
    Modal.confirm({
      title: 'Wake On LAN',
      icon: <FeatherIcon icon="zap" size={20} style={{ color: '#52c41a' }} />,
      content: `Send Wake-On-LAN magic packet to ${computerName}?`,
      okText: 'Wake Up',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, actionLoading: true }));

          const response = await DataService.post(
            `${API.tools.path}/wake-on-lan?computerName=${computerName}`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          );

          if (response.data.isSuccess) {
            showStatusModal(
              'Wake On LAN Success',
              response.data.message || `Successfully sent Wake-On-LAN packet to ${computerName}`,
              'success',
            );
            message.success(`Wake-On-LAN packet sent to ${computerName}`);
          } else {
            showStatusModal('Wake On LAN Failed', response.data.message || `Failed to wake ${computerName}`, 'error');
            message.error('Wake On LAN failed');
          }
        } catch (error) {
          console.error('Error sending Wake-On-LAN packet:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to send Wake-On-LAN packet';
          showStatusModal('Wake On LAN Error', errorMessage, 'error');
          message.error('Error occurred while sending Wake-On-LAN packet');
        } finally {
          setState((prev) => ({ ...prev, actionLoading: false }));
        }
      },
    });
  };

  // Load Device data on component mount
  useEffect(() => {
    getData(current, pageSize);
  }, [dispatch]);

  // Reload data when pagination changes
  useEffect(() => {
    getData(current, pageSize);
  }, [current, pageSize]);

  const onShowSizeChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const onHandleChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const handleRefresh = () => {
    getData(current, pageSize);
  };

  // Device data source for table
  const getDeviceDataSource = () => {
    const dataSource = [];

    if (Devices.length) {
      // Fix Line 284: Use forEach instead of map when not returning a new array
      Devices.forEach((device) => {
        const { id, computerName, ipAddress, uid, macAddress, isOnline } = device;

        // Dropdown menu items
        const getActionMenu = (device) => (
          <ul className="atbd-dropdown__nav">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePing(device.computerName);
                }}
              >
                <FeatherIcon icon="activity" size={14} />
                <span>Ping</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleWakeOnLan(device.computerName);
                }}
              >
                <FeatherIcon icon="zap" size={14} style={{ color: '#52c41a' }} />
                <span>Wake On LAN</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleShutdown(device.computerName);
                }}
              >
                <FeatherIcon icon="power" size={14} style={{ color: '#ff4d4f' }} />
                <span>Shutdown</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleRestart(device.computerName);
                }}
              >
                <FeatherIcon icon="refresh-cw" size={14} style={{ color: '#fa8c16' }} />
                <span>Restart</span>
              </a>
            </li>
            <li className="atbd-dropdown__nav__divider" />
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(device);
                }}
              >
                <FeatherIcon icon="edit" size={14} style={{ color: '#1890ff' }} />
                <span>Edit</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(id);
                }}
                style={{ color: '#ff4d4f' }}
              >
                <FeatherIcon icon="trash-2" size={14} />
                <span>Delete</span>
              </a>
            </li>
          </ul>
        );

        dataSource.push({
          key: id,
          device: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: isOnline ? '#f6ffed' : '#fff2f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${isOnline ? '#52c41a' : '#ff4d4f'}`,
                }}
              >
                <FeatherIcon icon="monitor" size={24} style={{ color: isOnline ? '#52c41a' : '#ff4d4f' }} />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{computerName || 'Unknown Device'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>UID: {uid || 'N/A'}</div>
              </div>
            </div>
          ),
          network: (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                <FeatherIcon icon="globe" size={12} style={{ marginRight: '4px' }} />
                {ipAddress || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <FeatherIcon icon="wifi" size={12} style={{ marginRight: '4px' }} />
                {macAddress || 'N/A'}
              </div>
            </div>
          ),
          status: (
            <PlainLabel
              color={isOnline ? 'success' : 'error'}
              style={{
                fontWeight: '500',
                fontSize: '12px',
                padding: '4px 12px',
                border: 'none',
                backgroundColor: isOnline ? '#f6ffed' : '#fff2f0',
                color: isOnline ? '#52c41a' : '#ff4d4f',
              }}
            >
              <FeatherIcon icon={isOnline ? 'wifi' : 'wifi-off'} size={12} style={{ marginRight: '4px' }} />
              {isOnline ? 'Online' : 'Offline'}
            </PlainLabel>
          ),
          uid: <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#333' }}>{uid || 'N/A'}</div>,
          action: (
            <div className="table-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Dropdown content={getActionMenu(device)} trigger="click">
                <Button type="default" size="small" style={{ padding: '4px 12px' }}>
                  <FeatherIcon icon="more-vertical" size={16} />
                </Button>
              </Dropdown>
            </div>
          ),
        });
      });
    }

    return dataSource;
  };

  // Device table columns
  const getDeviceColumns = () => [
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      width: '30%',
    },
    {
      title: 'Network Info',
      dataIndex: 'network',
      key: 'network',
      width: '25%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: '15%',
    },
    {
      title: 'Actions',
      dataIndex: 'action',
      key: 'action',
      width: '15%',
      align: 'center',
    },
  ];

  // Get modal icon based on status
  const getModalIcon = () => {
    switch (modalStatus) {
      case 'success':
        return <FeatherIcon icon="check-circle" size={24} style={{ color: '#52c41a' }} />;
      case 'error':
        return <FeatherIcon icon="x-circle" size={24} style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <FeatherIcon icon="alert-triangle" size={24} style={{ color: '#fa8c16' }} />;
      default:
        return <FeatherIcon icon="info" size={24} style={{ color: '#1890ff' }} />;
    }
  };

  return (
    <>
      <Row gutter={25}>
        <Col xs={24}>
          {isLoading && Devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>Loading Devices...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'red' }}>
                Error loading Devices: {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
              </p>
              <Button type="primary" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          ) : (
            <Cards headless>
              <ProjectList>
                <div className="table-responsive">
                  <Table
                    pagination={false}
                    dataSource={getDeviceDataSource()}
                    columns={getDeviceColumns()}
                    scroll={{ x: 1000 }}
                  />
                </div>
              </ProjectList>
            </Cards>
          )}
        </Col>

        <Col xs={24} className="pb-30">
          {Devices.length > 0 && (
            <ProjectPagination>
              <Pagination
                onChange={onHandleChange}
                showSizeChanger
                onShowSizeChange={onShowSizeChange}
                pageSize={pageSize}
                current={current}
                total={totalCount}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} Devices`}
                showQuickJumper
                pageSizeOptions={['10', '20', '50', '100']}
              />
            </ProjectPagination>
          )}
        </Col>
      </Row>

      {/* Status Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getModalIcon()}
            <span>{modalTitle}</span>
          </div>
        }
        open={modalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: modalStatus === 'success' ? '#f6ffed' : modalStatus === 'error' ? '#fff2f0' : '#f0f5ff',
            borderRadius: '8px',
            border: `1px solid ${modalStatus === 'success' ? '#b7eb8f' : modalStatus === 'error' ? '#ffccc7' : '#91d5ff'}`,
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{modalContent}</p>
        </div>
      </Modal>
    </>
  );
}

DeviceLists.propTypes = {
  filterStatus: string,
  onEdit: PropTypes.func,
  getData: PropTypes.func,
};

export default DeviceLists;
