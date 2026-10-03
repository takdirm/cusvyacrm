import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Pagination, Spin, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import { useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import PropTypes, { string } from 'prop-types';
import { ProjectList, ProjectPagination } from '../../style';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Button } from '../../../components/buttons/buttons';
import { getJobStatusText, getJobStatusColor } from '../../../config/enum/enum';

function QueueLists({ filterStatus, getData }) {
  // Get Queue data from Redux store
  const { Queues, isLoading, error, totalCount } = useSelector((state) => {
    return {
      Queues: state.Service?.data?.items ? state.Service.data.items : [],
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
  });

  const { current, pageSize, modalVisible, modalTitle, modalContent, modalStatus } = state;

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

  // Load Queue data on component mount
  useEffect(() => {
    getData(current, pageSize);
  }, []);

  // Reload data when pagination changes
  useEffect(() => {
    getData(current, pageSize);
  }, [current, pageSize]);

  const onShowSizeChange = (currentPage, currentPageSize) => {
    setState({ ...state, current: currentPage, pageSize: currentPageSize });
  };

  const onHandleChange = (currentPage, currentPageSize) => {
    setState({ ...state, current: currentPage, pageSize: currentPageSize });
  };

  const handleRefresh = () => {
    getData(current, pageSize);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusIcons = {
      0: 'play-circle',
      1: 'clock',
      2: 'check-circle',
      3: 'x-circle',
      4: 'slash',
    };
    return statusIcons[status] || 'help-circle';
  };

  // Get status background color based on status
  const getStatusBgColor = (status) => {
    const statusBgColors = {
      0: '#e6f7ff', // Initiated - Light Blue
      1: '#fff7e6', // Pending - Light Orange
      2: '#f6ffed', // Success - Light Green
      3: '#fff2f0', // Errored - Light Red
      4: '#f5f5f5', // Cancelled - Light Gray
    };
    return statusBgColors[status] || '#fafafa';
  };

  // Queue data source for table
  const getQueueDataSource = () => {
    const dataSource = [];

    if (Queues.length) {
      Queues.forEach((queue) => {
        const { id, commandName, computerName, status, createdAt, updatedAt, errorMessage } = queue;

        // Function to truncate error message
        const truncateErrorMessage = (message, maxLength = 50) => {
          if (!message) return null;
          if (message.length <= maxLength) return message;
          return `${message.substring(0, maxLength)}...`;
        };

        const statusColor = getJobStatusColor(status);
        const statusText = getJobStatusText(status);

        dataSource.push({
          key: id,
          job: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: getStatusBgColor(status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${statusColor}`,
                }}
              >
                <FeatherIcon icon={getStatusIcon(status)} size={24} style={{ color: statusColor }} />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{commandName || 'Unknown Job'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>ID: {id}</div>
              </div>
            </div>
          ),
          computer: (
            <div style={{ fontSize: '13px', fontWeight: '500' }}>
              <FeatherIcon icon="monitor" size={12} style={{ marginRight: '4px' }} />
              {computerName || 'N/A'}
            </div>
          ),
          status: (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: getStatusBgColor(status),
                border: `2px solid ${statusColor}`,
                fontWeight: '600',
                fontSize: '13px',
                color: statusColor,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              <FeatherIcon icon={getStatusIcon(status)} size={16} />
              <span>{statusText}</span>
            </div>
          ),
          timestamps: (
            <div>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>Created:</span>{' '}
                <span style={{ fontWeight: '500' }}>{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#666' }}>Updated:</span>{' '}
                <span style={{ fontWeight: '500' }}>{updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          ),
          error: errorMessage ? (
            <div
              style={{
                fontSize: '12px',
                color: '#ff4d4f',
                maxWidth: '200px',
                wordWrap: 'break-word',
                cursor: errorMessage.length > 50 ? 'pointer' : 'default',
              }}
              title={errorMessage}
              onClick={() => {
                if (errorMessage.length > 50) {
                  showStatusModal('Error Details', errorMessage, 'error');
                }
              }}
            >
              {truncateErrorMessage(errorMessage)}
            </div>
          ) : (
            <span style={{ color: '#999' }}>-</span>
          ),
          action: (
            <div className="table-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Button
                type="default"
                size="small"
                onClick={() => {
                  showStatusModal(
                    `Job Details - ${commandName}`,
                    `Command Name: ${commandName}\nComputer: ${computerName}\nStatus: ${statusText}\nCreated: ${createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}\nUpdated: ${updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}${errorMessage ? `\nError: ${errorMessage}` : ''}`,
                    status === 2 ? 'success' : status === 3 ? 'error' : 'info',
                  );
                }}
                icon={<FeatherIcon icon="eye" size={14} />}
              >
                View
              </Button>
            </div>
          ),
        });
      });
    }

    return dataSource;
  };

  // Queue table columns
  const getQueueColumns = () => [
    {
      title: 'Job',
      dataIndex: 'job',
      key: 'job',
      width: '25%',
    },
    {
      title: 'Computer',
      dataIndex: 'computer',
      key: 'computer',
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
    },
    {
      title: 'Timestamps',
      dataIndex: 'timestamps',
      key: 'timestamps',
      width: '23%',
    },
    {
      title: 'Error Message',
      dataIndex: 'error',
      key: 'error',
      width: '15%',
    },
    {
      title: 'Actions',
      dataIndex: 'action',
      key: 'action',
      width: '10%',
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
          {isLoading && Queues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>Loading Queue...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FeatherIcon icon="alert-circle" size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />
              <p style={{ color: '#ff4d4f', fontSize: '16px' }}>
                Error loading Queue: {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
              </p>
              <Button type="primary" onClick={handleRefresh} style={{ marginTop: '16px' }}>
                <FeatherIcon icon="refresh-cw" size={16} style={{ marginRight: '8px' }} />
                Retry
              </Button>
            </div>
          ) : Queues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FeatherIcon icon="inbox" size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
              <p style={{ color: '#999', fontSize: '16px' }}>No jobs in queue</p>
              <Button type="primary" onClick={handleRefresh} style={{ marginTop: '16px' }}>
                <FeatherIcon icon="refresh-cw" size={16} style={{ marginRight: '8px' }} />
                Refresh
              </Button>
            </div>
          ) : (
            <Cards headless>
              <ProjectList>
                <div className="table-responsive">
                  <Table
                    pagination={false}
                    dataSource={getQueueDataSource()}
                    columns={getQueueColumns()}
                    scroll={{ x: 1200 }}
                  />
                </div>
              </ProjectList>
            </Cards>
          )}
        </Col>

        <Col xs={24} className="pb-30">
          {Queues.length > 0 && (
            <ProjectPagination>
              <Pagination
                onChange={onHandleChange}
                showSizeChanger
                onShowSizeChange={onShowSizeChange}
                pageSize={pageSize}
                current={current}
                total={totalCount}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} jobs`}
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

QueueLists.propTypes = {
  filterStatus: string,
  getData: PropTypes.func,
};

export default QueueLists;
