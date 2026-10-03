import React, { lazy, useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Spin, Select, Card, InputNumber, Switch, Tooltip, message, Modal } from 'antd';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { ProjectHeader, ProjectSorting } from '../style';
import { Button } from '../../components/buttons/buttons';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { axiosDataReadPaginated } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';

import { DataService } from '../../config/dataService/dataService';

const { confirm } = Modal;
const List = lazy(() => import('./overview/List'));

function Release() {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Get Release data from Redux store
  const { Releases, Summaries, isLoading, error, totalCount } = useSelector((state) => {
    return {
      Releases: state.Service?.data?.items ? state.Service.data.items : [],
      Summaries: state.Service?.data?.summary ? state.Service.data.summary : [],
      isLoading: state.Service?.loading || false,
      error: state.Service?.error || null,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [state, setState] = useState({
    visible: false,
    selectedFilterType: null,
    current: 1,
    pageSize: 10,
    selectedReleaseStatusType: null,
    selectedCommandName: null,
    commandNameOptions: [],
    // Auto-refresh settings
    autoRefreshEnabled: false,
    autoRefreshInterval: 2, // Default 2 minutes
    lastRefreshTime: null,
    deleting: false,
  });

  const {
    selectedFilterType,
    current,
    pageSize,
    selectedReleaseStatusType,
    selectedCommandName,
    commandNameOptions,
    autoRefreshEnabled,
    autoRefreshInterval,
    lastRefreshTime,
    deleting,
  } = state;

  const getData = async (
    currentPage = 1,
    currentPageSize = 10,
    filterType = selectedFilterType,
    commandName = selectedCommandName,
    releaseStatus = selectedReleaseStatusType,
  ) => {
    if (commandName == null) {
      // Clear the data when no command is selected
      dispatch(axiosDataReadPaginated(null, currentPage, currentPageSize));
      setState((prevState) => ({
        ...prevState,
        lastRefreshTime: null,
      }));
      return;
    }

    // Build query parameters based on filter type
    let queryParams = `commandname=${commandName}&page=${currentPage}&pageSize=${currentPageSize}`;

    // Add release status filter if selected
    if (releaseStatus !== null && releaseStatus !== undefined) {
      queryParams += `&status=${releaseStatus}`;
    } else {
      queryParams += '&status=';
    }

    const endpoint = `${API.release.path}/paged?${queryParams}`;
    await dispatch(axiosDataReadPaginated(endpoint, currentPage, currentPageSize));

    // Update last refresh time
    setState((prevState) => ({
      ...prevState,
      lastRefreshTime: new Date(),
    }));
  };

  // Auto-refresh function
  const autoRefresh = useCallback(() => {
    if (selectedCommandName && autoRefreshEnabled) {
      getData(current, pageSize, selectedFilterType, selectedCommandName, selectedReleaseStatusType);
    }
  }, [current, pageSize, selectedFilterType, selectedCommandName, selectedReleaseStatusType, autoRefreshEnabled]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (autoRefreshEnabled && selectedCommandName) {
      intervalRef.current = setInterval(autoRefresh, autoRefreshInterval * 60 * 1000); // Convert minutes to milliseconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, autoRefreshEnabled, autoRefreshInterval, selectedCommandName]);

  const searchableCommandName = async (commandName) => {
    try {
      const response = await DataService.get(`${API.release.path}/search-commandnames?commandname=${commandName}`);

      // Handle different response formats
      let commandList = [];

      if (Array.isArray(response)) {
        // If response is directly an array
        commandList = response;
      } else if (response && Array.isArray(response.data)) {
        // If response has a data property that contains the array
        commandList = response.data;
      } else if (response && Array.isArray(response.items)) {
        // If response has an items property that contains the array
        commandList = response.items;
      } else {
        console.warn('Unexpected response format from search-commandnames:', response);
        commandList = [];
      }

      setState((prevState) => ({
        ...prevState,
        commandNameOptions: commandList.map((cmd) => ({
          value: typeof cmd === 'string' ? cmd : cmd.name || cmd.commandName || cmd.value,
          label: typeof cmd === 'string' ? cmd : cmd.name || cmd.commandName || cmd.label || cmd.value,
        })),
      }));
    } catch (error) {
      console.error('Error fetching command names:', error);
      setState((prevState) => ({
        ...prevState,
        commandNameOptions: [],
      }));
    }
  };

  // Handle release deletion with confirmation
  const handleDelete = async () => {
    if (!selectedCommandName) {
      message.warning('No command selected to delete');
      return;
    }

    confirm({
      title: 'Delete Releases',
      icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete all releases for command "${selectedCommandName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, deleting: true }));

          const response = await DataService.delete(`${API.release.path}/by-command/${selectedCommandName}`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('Delete Response:', response);

          message.success(`All releases for "${selectedCommandName}" deleted successfully!`);

          // Reset state and clear selection
          setState((prevState) => ({
            ...prevState,
            selectedCommandName: null,
            selectedReleaseStatusType: null,
            current: 1,
            deleting: false,
          }));

          // Clear the Redux store data
          dispatch(axiosDataReadPaginated(null, 1, pageSize));
        } catch (error) {
          console.error('Error deleting releases:', error);

          // Handle different error response formats
          let errorMessage = 'Failed to delete releases. Please try again.';

          if (error.response) {
            // Server responded with error status
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
          setState((prev) => ({ ...prev, deleting: false }));
        }
      },
      onCancel() {
        console.log('Delete cancelled');
      },
    });
  };

  // Initialize command name from query parameter
  useEffect(() => {
    const commandNameFromUrl = searchParams.get('commandname');
    if (commandNameFromUrl && commandNameFromUrl !== selectedCommandName) {
      setState((prevState) => ({
        ...prevState,
        selectedCommandName: commandNameFromUrl,
        current: 1,
      }));
    }
  }, [searchParams]);

  // Handle command name selection
  const onCommandNameSelect = (commandName) => {
    setState((prevState) => ({
      ...prevState,
      selectedCommandName: commandName,
      current: 1, // Reset to first page
      selectedReleaseStatusType: null, // Reset status filter
    }));

    // If commandName is cleared (null), reset the data
    if (!commandName) {
      dispatch(axiosDataReadPaginated(null, 1, pageSize));
    }
  };

  // Handle status filter from summary cards
  const onStatusFilter = (status) => {
    setState((prevState) => ({
      ...prevState,
      selectedReleaseStatusType: status === prevState.selectedReleaseStatusType ? null : status,
      current: 1, // Reset to first page
    }));
  };

  // Handle auto-refresh toggle
  const onAutoRefreshToggle = (checked) => {
    setState((prevState) => ({
      ...prevState,
      autoRefreshEnabled: checked,
    }));
  };

  // Handle auto-refresh interval change
  const onIntervalChange = (value) => {
    setState((prevState) => ({
      ...prevState,
      autoRefreshInterval: value || 1, // Minimum 1 minute
    }));
  };

  // Load Release data when filters change
  useEffect(() => {
    if (selectedCommandName) {
      getData(current, pageSize, selectedFilterType, selectedCommandName, selectedReleaseStatusType);
    }
  }, [selectedFilterType, current, pageSize, selectedCommandName, selectedReleaseStatusType]);

  const onShowSizeChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const onHandleChange = (current, pageSize) => {
    setState({ ...state, current, pageSize });
  };

  const onChangeFilter = (value) => {
    setState({
      ...state,
      selectedFilterType: value,
      current: 1, // Reset to first page when changing filter
    });
  };

  const handleRefresh = useCallback(() => {
    if (selectedCommandName) {
      getData(current, pageSize, selectedFilterType, selectedCommandName, selectedReleaseStatusType);
    }
  }, [current, pageSize, selectedFilterType, selectedCommandName, selectedReleaseStatusType]);

  // Get status text and color from enum
  const getStatusInfo = (status) => {
    const statusMap = {
      0: { text: 'Pending', color: '#faad14', icon: 'clock' },
      1: { text: 'Processing', color: '#1890ff', icon: 'loader' },
      2: { text: 'Completed', color: '#52c41a', icon: 'check-circle' },
      3: { text: 'Success', color: '#52c41a', icon: 'check' },
      4: { text: 'Failed', color: '#ff4d4f', icon: 'x-circle' },
    };
    return statusMap[status] || { text: 'Unknown', color: '#d9d9d9', icon: 'help-circle' };
  };

  // Format last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return '';
    return `Last: ${lastRefreshTime.toLocaleTimeString()}`;
  };

  // Render summary cards
  const renderSummaryCards = () => {
    // Don't show cards if no command is selected
    if (!selectedCommandName || !Summaries || Summaries.length === 0) return null;

    // Calculate total count from all summaries
    const totalCount = Summaries.reduce((sum, summary) => sum + summary.count, 0);

    return (
      <Row gutter={[6, 6]} style={{ marginBottom: '15px' }}>
        {/* Total Card */}
        <Col xs={7.5} sm={5} md={3.75} lg={3} key="total">
          <Card
            hoverable
            size="small"
            className={`summary-card ${selectedReleaseStatusType === null ? 'selected' : ''}`}
            style={{
              borderColor: selectedReleaseStatusType === null ? '#1890ff' : '#d9d9d9',
              borderWidth: selectedReleaseStatusType === null ? '2px' : '1px',
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

        {/* Existing Status Cards */}
        {Summaries.map((summary, index) => {
          const statusInfo = getStatusInfo(summary.status);
          const isSelected = selectedReleaseStatusType === summary.status;

          return (
            <Col xs={7.5} sm={5} md={3.75} lg={3} key={index}>
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
                onClick={() => onStatusFilter(summary.status)}
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
          title="Releases"
          subTitle={<> {Releases.length} Releases </>}
          buttons={[
            // Auto-refresh controls
            <div key="auto-refresh" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
              <Tooltip title="Enable/Disable Auto Refresh">
                <Switch
                  size="small"
                  checked={autoRefreshEnabled}
                  onChange={onAutoRefreshToggle}
                  disabled={!selectedCommandName}
                  checkedChildren={<FeatherIcon icon="refresh-cw" size={12} />}
                  unCheckedChildren={<FeatherIcon icon="pause" size={12} />}
                />
              </Tooltip>
              <Tooltip title="Auto refresh interval in minutes">
                <InputNumber
                  size="small"
                  min={1}
                  max={60}
                  value={autoRefreshInterval}
                  onChange={onIntervalChange}
                  disabled={!selectedCommandName}
                  style={{ width: '60px' }}
                  suffix="min"
                />
              </Tooltip>
              {lastRefreshTime && <span style={{ fontSize: '11px', color: '#666' }}>{formatLastRefreshTime()}</span>}
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <ProjectSorting>
              <div className="project-sort-bar">
                <div className="project-sort-nav">
                  <Select
                    showSearch
                    placeholder="Search command names..."
                    style={{ width: 300, marginRight: 16 }}
                    onSearch={searchableCommandName}
                    onSelect={onCommandNameSelect}
                    onClear={() => onCommandNameSelect(null)} // Handle clear event
                    value={selectedCommandName}
                    allowClear
                    options={commandNameOptions}
                    filterOption={false}
                    disabled={searchParams.get('commandname') !== null}
                  />
                </div>
                <div className="project-sort-group">
                  <div className="layout-style">
                    <Button
                      type="text"
                      size="small"
                      onClick={handleRefresh}
                      loading={isLoading}
                      disabled={isLoading || !selectedCommandName}
                      title="Refresh"
                    >
                      <FeatherIcon icon="refresh-cw" size={16} />
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      onClick={handleDelete}
                      loading={deleting}
                      disabled={deleting || !selectedCommandName || isLoading}
                      title="Delete all releases for this command"
                      style={{
                        color: '#ff4d4f',
                        marginLeft: '12px',
                      }}
                      danger
                    >
                      <FeatherIcon icon="trash-2" size={16} />
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
                      <List
                        filterStatus={selectedFilterType}
                        releaseStatus={selectedReleaseStatusType}
                        getData={getData}
                        selectedCommandName={selectedCommandName}
                      />
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
                      <List
                        filterStatus={selectedFilterType}
                        releaseStatus={selectedReleaseStatusType}
                        getData={getData}
                        selectedCommandName={selectedCommandName}
                      />
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

export default Release;
