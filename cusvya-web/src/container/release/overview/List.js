import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Pagination, Spin, Checkbox, Modal, message } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import { useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { API } from '../../../config/api/index';
import { ProjectList, ProjectPagination } from '../../style';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Button } from '../../../components/buttons/buttons';
import { Dropdown } from '../../../components/dropdown/dropdown';
import { DataService } from '../../../config/dataService/dataService';
import { getReleaseStatusColor, getReleaseStatusText, getReleaseTypeText } from '../../../config/enum/enum';

function ReleaseLists({ filterStatus, releaseStatus: selectedReleaseStatus, getData, selectedCommandName }) {
  // Get Release data from Redux store
  const { Releases, isLoading, error, totalCount } = useSelector((state) => {
    return {
      Releases: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
      error: state.Service?.error || null,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [state, setState] = useState({
    visible: false,
    current: 1,
    pageSize: 10,
    selectedRowKeys: [],
    selectedComputerNames: [],
    selectAll: false,
    retriggerLoading: false,
    modalVisible: false,
    modalTitle: '',
    modalContent: '',
    modalStatus: 'info',
    actionLoading: false,
  });

  const {
    current,
    pageSize,
    selectedRowKeys,
    selectedComputerNames,
    selectAll,
    retriggerLoading,
    modalVisible,
    modalTitle,
    modalContent,
    modalStatus,
  } = state;

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

  // Load Release data on component mount and when pagination changes
  useEffect(() => {
    if (selectedCommandName) {
      getData(current, pageSize);
    }
  }, [current, pageSize, selectedCommandName]);

  // Reset selections when data changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      selectedRowKeys: [],
      selectedComputerNames: [],
      selectAll: false,
    }));
  }, [Releases]);

  const onShowSizeChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const onHandleChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const handleRefresh = () => {
    if (selectedCommandName) {
      getData(current, pageSize);
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (releaseId, computerName, checked) => {
    setState((prev) => {
      let newSelectedRowKeys = [...prev.selectedRowKeys];
      let newSelectedComputerNames = [...prev.selectedComputerNames];

      if (checked) {
        if (!newSelectedRowKeys.includes(releaseId)) {
          newSelectedRowKeys.push(releaseId);
          newSelectedComputerNames.push(computerName);
        }
      } else {
        newSelectedRowKeys = newSelectedRowKeys.filter((key) => key !== releaseId);
        newSelectedComputerNames = newSelectedComputerNames.filter((name) => name !== computerName);
      }

      // Check if all rows are selected
      const allSelected = Releases.length > 0 && newSelectedRowKeys.length === Releases.length;

      return {
        ...prev,
        selectedRowKeys: newSelectedRowKeys,
        selectedComputerNames: newSelectedComputerNames,
        selectAll: allSelected,
      };
    });
  };

  // Handle select all checkbox change
  const handleSelectAllChange = (checked) => {
    if (checked) {
      const allRowKeys = Releases.map((release) => release.id);
      const allComputerNames = Releases.map((release) => release.device?.computerName).filter(Boolean);

      setState((prev) => ({
        ...prev,
        selectedRowKeys: allRowKeys,
        selectedComputerNames: allComputerNames,
        selectAll: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        selectedRowKeys: [],
        selectedComputerNames: [],
        selectAll: false,
      }));
    }
  };

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

  // Handle retrigger
  const handleRetrigger = async () => {
    if (selectedComputerNames.length === 0) {
      message.warning('Please select at least one computer to retrigger');
      return;
    }

    if (!selectedCommandName) {
      message.error('Command name is required');
      return;
    }

    Modal.confirm({
      title: 'Retrigger Confirmation',
      icon: <FeatherIcon icon="refresh-cw" size={20} style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <p>Are you sure you want to retrigger the following computers?</p>
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#f0f5ff',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <p style={{ marginBottom: '8px', fontWeight: '500' }}>
              <strong>Command:</strong> {selectedCommandName}
            </p>
            <p style={{ marginBottom: '8px', fontWeight: '500' }}>
              <strong>Selected Computers ({selectedComputerNames.length}):</strong>
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
              {selectedComputerNames.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
      ),
      okText: 'Retrigger',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, retriggerLoading: true }));

          const payload = {
            commandName: selectedCommandName,
            computerNames: selectedComputerNames,
          };

          console.log('Retrigger Payload:', payload);

          const response = await DataService.post(`${API.Planner.path}/trigger-bycomputers`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('Retrigger Response:', response);

          if (response && (response.status === 200 || response.statusCode === 200)) {
            message.success('Retrigger successful!');

            // Reset selections after successful retrigger
            setState((prev) => ({
              ...prev,
              selectedRowKeys: [],
              selectedComputerNames: [],
              selectAll: false,
            }));

            // Refresh the data
            handleRefresh();
          } else {
            message.error(response.message || 'Retrigger failed');
          }
        } catch (error) {
          console.error('Error retriggering:', error);

          let errorMessage = 'Failed to retrigger. Please try again.';

          if (error.response) {
            if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.data && typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.statusText) {
              errorMessage = `Error: ${error.response.statusText}`;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          message.error(errorMessage);
        } finally {
          setState((prev) => ({ ...prev, retriggerLoading: false }));
        }
      },
    });
  };

  // Get status icon based on release status
  const getStatusIcon = (status) => {
    switch (status) {
      case 0: // Pending
        return 'clock';
      case 1: // Processing
        return 'loader';
      case 2: // Completed
        return 'check-circle';
      case 3: // Success
        return 'check-circle';
      case 4: // Failed
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  // Get background color for status
  const getStatusBgColor = (status) => {
    switch (status) {
      case 0: // Pending
        return '#fff7e6';
      case 1: // Processing
        return '#e6f7ff';
      case 2: // Completed
        return '#f6ffed';
      case 3: // Success
        return '#f6ffed';
      case 4: // Failed
        return '#fff2f0';
      default:
        return '#f5f5f5';
    }
  };

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

  // Release data source for table
  const getReleaseDataSource = () => {
    const dataSource = [];

    if (Releases.length) {
      Releases.map((release) => {
        const { id, commandName, releaseType: releaseTypeValue, status, message, device, lastUpdatedTime } = release;

        const computerName = device?.computerName || 'Unknown';
        const statusColor = getReleaseStatusColor(status);
        const statusText = getReleaseStatusText(status);
        const statusIcon = getStatusIcon(status);
        const statusBgColor = getStatusBgColor(status);

        // Dropdown menu items
        const getActionMenu = (release) => (
          <ul className="atbd-dropdown__nav">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePing(release.device?.computerName);
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
                  handleShutdown(release.device?.computerName);
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
                  handleRestart(release.device?.computerName);
                }}
              >
                <FeatherIcon icon="refresh-cw" size={14} style={{ color: '#fa8c16' }} />
                <span>Restart</span>
              </a>
            </li>
          </ul>
        );

        return dataSource.push({
          key: id,
          select: (
            <Checkbox
              checked={selectedRowKeys.includes(id)}
              onChange={(e) => handleCheckboxChange(id, computerName, e.target.checked)}
            />
          ),
          command: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: statusBgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${statusColor}`,
                }}
              >
                <FeatherIcon icon="terminal" size={24} style={{ color: statusColor }} />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{commandName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Type: {getReleaseTypeText(releaseTypeValue)}</div>
              </div>
            </div>
          ),
          device: device ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: device.isOnline ? '#f6ffed' : '#fff2f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${device.isOnline ? '#52c41a' : '#ff4d4f'}`,
                }}
              >
                <FeatherIcon icon="monitor" size={16} style={{ color: device.isOnline ? '#52c41a' : '#ff4d4f' }} />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{computerName}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  <FeatherIcon icon="globe" size={10} style={{ marginRight: '4px' }} />
                  {device.ipAddress}
                </div>
              </div>
            </div>
          ) : (
            <span style={{ color: '#999' }}>No Device</span>
          ),
          status: (
            <PlainLabel
              style={{
                fontWeight: '500',
                fontSize: '12px',
                padding: '4px 12px',
                border: 'none',
                backgroundColor: statusBgColor,
                color: statusColor,
              }}
            >
              <FeatherIcon icon={statusIcon} size={12} style={{ marginRight: '4px' }} />
              {statusText}
            </PlainLabel>
          ),
          lastUpdated: (
            <div style={{ fontSize: '12px' }}>
              {lastUpdatedTime ? (
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>
                    <FeatherIcon icon="clock" size={12} style={{ marginRight: '4px' }} />
                    {new Date(lastUpdatedTime).toLocaleDateString()}
                  </div>
                  <div style={{ color: '#999', fontSize: '11px' }}>
                    {new Date(lastUpdatedTime).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <span style={{ color: '#999' }}>-</span>
              )}
            </div>
          ),
          message: (
            <div style={{ maxWidth: '200px' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: status === 4 ? '#ff4d4f' : '#333',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                }}
                title={message}
              >
                {message && message.length > 50 ? `${message.substring(0, 50)}...` : message || 'No message'}
              </div>
            </div>
          ),
          actions: (
            <div className="table-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Dropdown content={getActionMenu(release)} trigger="click">
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

  // Release table columns
  const getReleaseColumns = () => [
    {
      title: (
        <Checkbox
          checked={selectAll}
          indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < Releases.length}
          onChange={(e) => handleSelectAllChange(e.target.checked)}
        >
          Select All
        </Checkbox>
      ),
      dataIndex: 'select',
      key: 'select',
      width: '8%',
    },
    {
      title: 'Command',
      dataIndex: 'command',
      key: 'command',
      width: '20%',
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      width: '20%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: '12%',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      width: '18%',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: '8%',
      align: 'center',
    },
  ];

  // Show message when no command is selected
  if (!selectedCommandName) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <FeatherIcon icon="search" size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
        <h3 style={{ color: '#999' }}>Select a Command</h3>
        <p style={{ color: '#666' }}>Please select a command name from the dropdown to view releases.</p>
      </div>
    );
  }

  return (
    <>
      {/* Action Bar */}
      {selectedRowKeys.length > 0 && (
        <Row gutter={25} style={{ marginBottom: '16px' }}>
          <Col xs={24}>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#e6f7ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '14px', color: '#1890ff' }}>
                <FeatherIcon icon="check-square" size={16} style={{ marginRight: '8px' }} />
                {selectedRowKeys.length} computer{selectedRowKeys.length > 1 ? 's' : ''} selected
              </span>
              <Button
                type="primary"
                onClick={handleRetrigger}
                loading={retriggerLoading}
                icon={<FeatherIcon icon="refresh-cw" size={16} />}
              >
                Re Trigger
              </Button>
            </div>
          </Col>
        </Row>
      )}

      <Row gutter={25}>
        <Col xs={24}>
          {isLoading && Releases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>Loading Releases...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'red' }}>
                Error loading Releases: {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
              </p>
              <Button type="primary" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          ) : Releases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FeatherIcon icon="inbox" size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
              <h3 style={{ color: '#999' }}>No Releases Found</h3>
              <p style={{ color: '#666' }}>
                No releases found for command "{selectedCommandName}".
                {filterStatus || selectedReleaseStatus !== null ? ' Try adjusting your filters.' : ''}
              </p>
            </div>
          ) : (
            <Cards headless>
              <ProjectList>
                <div className="table-responsive">
                  <Table
                    pagination={false}
                    dataSource={getReleaseDataSource()}
                    columns={getReleaseColumns()}
                    scroll={{ x: 1200 }}
                  />
                </div>
              </ProjectList>
            </Cards>
          )}
        </Col>

        <Col xs={24} className="pb-30">
          {Releases.length > 0 && (
            <ProjectPagination>
              <Pagination
                onChange={onHandleChange}
                showSizeChanger
                onShowSizeChange={onShowSizeChange}
                pageSize={pageSize}
                current={current}
                total={totalCount}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} Releases`}
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

ReleaseLists.propTypes = {
  filterStatus: PropTypes.string,
  getData: PropTypes.func,
  releaseStatus: PropTypes.number,
  selectedCommandName: PropTypes.string,
};

export default ReleaseLists;
