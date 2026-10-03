import React, { lazy, useState, Suspense, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Card, Modal, message } from 'antd';
import { Routes, Route, Link } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { ProjectHeader, ProjectSorting } from '../style';
import { AutoComplete } from '../../components/autoComplete/autoComplete';
import { Button } from '../../components/buttons/buttons';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';
import { jobStatus, getJobStatusText, getJobStatusColor } from '../../config/enum/enum';
import { DataService } from '../../config/dataService/dataService';

const List = lazy(() => import('./overview/List'));

function Queue() {
  const dispatch = useDispatch();
  // Get Queue data from Redux store
  const { Queues, Summaries, isLoading } = useSelector((state) => {
    return {
      Queues: state.Service?.data?.items ? state.Service.data.items : [],
      Summaries: state.Service?.data?.summary ? state.Service.data.summary : [],
      isLoading: state.Service?.loading || false,
    };
  });

  const [state, setState] = useState({
    visible: false,
    selectedFilterType: null,
    selectedJobStatusType: null,
    current: 1,
    pageSize: 10,
    lastRefreshTime: null,
    clearAllLoading: false,
  });

  const { selectedFilterType, current, pageSize, selectedJobStatusType, lastRefreshTime, clearAllLoading } = state;

  const getData = async (
    currentPage = 1,
    currentPageSize = 10,
    filterType = selectedFilterType,
    jobStatusFilter = selectedJobStatusType,
  ) => {
    // Build query parameters based on filter type
    let queryParams = `page=${currentPage}&pageSize=${currentPageSize}`;
    console.log(jobStatusFilter);
    // Add job status filter if selected
    if (jobStatusFilter !== null && jobStatusFilter !== undefined) {
      queryParams += `&status=${jobStatusFilter}`;
    } else {
      queryParams += '&status=';
    }

    // Add additional filters if needed
    if (filterType === 'recent') queryParams += '&recent=true';
    else if (filterType === 'failed') queryParams += '&failed=true';

    const endpoint = `${API.queue.path}/paged?${queryParams}`;
    await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));

    // Update last refresh time
    setState((prevState) => ({
      ...prevState,
      lastRefreshTime: new Date(),
    }));
  };

  // Handle status filter from summary cards
  const onStatusFilter = (status) => {
    setState((prevState) => ({
      ...prevState,
      selectedJobStatusType: status === prevState.selectedJobStatusType ? null : status,
      current: 1, // Reset to first page
    }));
  };

  const handleClearAll = async () => {
    Modal.confirm({
      title: 'Clear All Jobs',
      icon: <FeatherIcon icon="trash-2" size={20} style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to clear all jobs from the queue?</p>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fff2f0',
              borderRadius: '4px',
              border: '1px solid #ffccc7',
              marginTop: '12px',
            }}
          >
            <FeatherIcon icon="alert-triangle" size={14} style={{ color: '#ff4d4f', marginRight: '8px' }} />
            <strong>Warning:</strong> This action cannot be undone. All jobs will be permanently removed from the queue.
          </div>
        </div>
      ),
      okText: 'Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, clearAllLoading: true }));

          const response = await DataService.delete(`${API.queue.path}/clear-all`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('Clear All Response:', response);

          message.success('All jobs cleared successfully!');

          // Refresh the data after successful clear
          await getData(current, pageSize, selectedFilterType, selectedJobStatusType);
        } catch (error) {
          console.error('Error clearing jobs:', error);

          let errorMessage = 'Failed to clear jobs. Please try again.';

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
          setState((prev) => ({ ...prev, clearAllLoading: false }));
        }
      },
    });
  };

  // Load Queue data when filters change
  useEffect(() => {
    getData(current, pageSize, selectedFilterType, selectedJobStatusType);
  }, [selectedFilterType, current, pageSize, selectedJobStatusType]);

  const onChangeFilter = (value) => {
    setState({
      ...state,
      selectedFilterType: value,
      current: 1, // Reset to first page when changing filter
    });
  };

  const handleRefresh = useCallback(() => {
    getData(current, pageSize, selectedFilterType, selectedJobStatusType);
  }, [current, pageSize, selectedFilterType, selectedJobStatusType]);

  // Get status info based on status code using enum
  const getStatusInfo = (status) => {
    const statusText = getJobStatusText(status);
    const statusColor = getJobStatusColor(status);

    // Map Ant Design colors to our color scheme and icons
    const statusMap = {
      [jobStatus.initiated]: { color: '#faad14', bgColor: '#fff7e6', icon: 'play-circle' }, // Orange - Initiated
      [jobStatus.pending]: { color: '#1890ff', bgColor: '#e6f7ff', icon: 'clock' }, // Cyan/Blue - Pending
      [jobStatus.success]: { color: '#52c41a', bgColor: '#f6ffed', icon: 'check-circle' }, // Blue/Green - Success
      [jobStatus.errored]: { color: '#ff4d4f', bgColor: '#fff2f0', icon: 'x-circle' }, // Red - Errored
    };

    const colorInfo = statusMap[status] || { color: '#d9d9d9', bgColor: '#f5f5f5', icon: 'help-circle' };

    return {
      text: statusText,
      antdColor: statusColor, // Keep original Ant Design color for compatibility
      ...colorInfo,
    };
  };

  // Format last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return '';
    return `Last: ${lastRefreshTime.toLocaleTimeString()}`;
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!Summaries || Summaries.length === 0) return null;

    // Calculate total count from all summaries
    const totalCount = Summaries.reduce((sum, summary) => sum + summary.count, 0);

    return (
      <Row gutter={[6, 6]} style={{ marginBottom: '15px' }}>
        {/* Total Card */}
        <Col xs={7.5} sm={5} md={3.75} lg={3} key="total">
          <Card
            hoverable
            size="small"
            className={`summary-card ${selectedJobStatusType === null ? 'selected' : ''}`}
            style={{
              borderColor: selectedJobStatusType === null ? '#1890ff' : '#d9d9d9',
              borderWidth: selectedJobStatusType === null ? '2px' : '1px',
              cursor: 'pointer',
              minHeight: '56px',
              width: '100%',
              maxWidth: '112px',
            }}
            bodyStyle={{
              padding: '5px 7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => onStatusFilter(null)}
          >
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
                <FeatherIcon icon="layers" size={12} style={{ color: '#1890ff', marginRight: '3px' }} />
                <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>Total</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff', lineHeight: 1 }}>{totalCount}</div>
            </div>
          </Card>
        </Col>

        {/* Status Cards - Loop through jobStatus enum */}
        {Object.entries(jobStatus).map(([key, value]) => {
          // Find the summary for this status
          const summary = Summaries.find((s) => s.status === value);
          if (!summary) return null; // Skip if no data for this status

          const statusInfo = getStatusInfo(value);
          const isSelected = selectedJobStatusType === value;

          return (
            <Col xs={7.5} sm={5} md={3.75} lg={3} key={key}>
              <Card
                hoverable
                size="small"
                className={`summary-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderColor: isSelected ? statusInfo.color : '#d9d9d9',
                  borderWidth: isSelected ? '2px' : '1px',
                  cursor: 'pointer',
                  minHeight: '56px',
                  width: '100%',
                  maxWidth: '112px',
                }}
                bodyStyle={{
                  padding: '5px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => onStatusFilter(value)}
              >
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
                    <FeatherIcon
                      icon={statusInfo.icon}
                      size={12}
                      style={{ color: statusInfo.color, marginRight: '3px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>{statusInfo.text}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: statusInfo.color, lineHeight: 1 }}>
                    {summary.count}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Job Queue"
          subTitle={<> {Queues.length} Jobs </>}
          buttons={[
            // Refresh info
            lastRefreshTime && (
              <span key="refresh-time" style={{ fontSize: '11px', color: '#666', marginRight: '16px' }}>
                {formatLastRefreshTime()}
              </span>
            ),
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <ProjectSorting>
              <div className="project-sort-bar">
                <div className="project-sort-nav">
                  <nav>
                    <ul>
                      <li className={selectedFilterType === null ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter(null)} to="#">
                          All
                        </Link>
                      </li>
                      <li className={selectedFilterType === 'recent' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('recent')} to="#">
                          Recent
                        </Link>
                      </li>
                      <li className={selectedFilterType === 'failed' ? 'active' : 'deactivate'}>
                        <Link onClick={() => onChangeFilter('failed')} to="#">
                          Failed
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div className="project-sort-search">
                  <AutoComplete onSearch={() => {}} dataSource={Queues} placeholder="Search Jobs" patterns />
                </div>
                <div className="project-sort-group">
                  <div className="layout-style">
                    <Button
                      type="text"
                      size="small"
                      onClick={handleClearAll}
                      loading={clearAllLoading}
                      disabled={clearAllLoading || isLoading}
                      title="Clear All Jobs"
                      style={{ marginRight: '8px' }}
                    >
                      <FeatherIcon icon="trash-2" size={16} style={{ color: '#ff4d4f' }} />
                    </Button>
                    <Button type="text" size="small" onClick={handleRefresh} loading={isLoading} disabled={isLoading}>
                      <FeatherIcon icon="refresh-cw" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </ProjectSorting>
            {/* Summary Cards */}
            {renderSummaryCards()}

            <div>
              <Routes>
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <div className="spin">
                          <Spin />
                        </div>
                      }
                    >
                      <List filterStatus={selectedFilterType} jobStatus={selectedJobStatusType} getData={getData} />
                    </Suspense>
                  }
                />

                <Route
                  path="list"
                  element={
                    <Suspense
                      fallback={
                        <div className="spin">
                          <Spin />
                        </div>
                      }
                    >
                      <List filterStatus={selectedFilterType} jobStatus={selectedJobStatusType} getData={getData} />
                    </Suspense>
                  }
                />
              </Routes>
            </div>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default Queue;
