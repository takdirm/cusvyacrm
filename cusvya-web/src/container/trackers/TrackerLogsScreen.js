import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Input, InputNumber, message, Popconfirm, Row, Select, Space, Switch, Table } from 'antd';
import FeatherIcon from 'feather-icons-react';
import axios from 'axios';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { getItem } from '../../utility/localStorageControl';

const DEFAULT_PAGE_SIZE = 20;

const valueRenderer = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

function TrackerLogsScreen({ title, endpointSegment, columns, enableAutoRefresh = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [terminalOptions, setTerminalOptions] = useState([]);
  const [selectedTerminalId, setSelectedTerminalId] = useState('');

  const [currentRows, setCurrentRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enableAutoRefresh);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(30);

  const normalizeTerminalOptions = useCallback((data) => {
    const source = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    const seen = new Set();

    return source
      .map((item) => {
        if (item === null || item === undefined) return null;

        if (typeof item === 'string' || typeof item === 'number') {
          const text = String(item).trim();
          if (!text) return null;
          return {
            label: text,
            value: text,
            searchText: text,
          };
        }

        if (typeof item === 'object') {
          const terminalId = String(item.terminalId ?? item.id ?? '').trim();
          const imei = String(item.imei ?? '').trim();
          const value = terminalId || imei;

          if (!value) return null;

          const label = imei && terminalId && imei !== terminalId ? `${imei} (${terminalId})` : imei || terminalId;
          const searchText = [terminalId, imei, label].filter(Boolean).join(' ').toLowerCase();

          return {
            label,
            value,
            searchText,
          };
        }

        return null;
      })
      .filter((option) => {
        if (!option || !option.value || seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      });
  }, []);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getAuthHeaders = () => {
    const token = getItem('access_token') || getItem('authToken') || getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        title: column.title,
        dataIndex: column.key,
        key: column.key,
        render: valueRenderer,
      })),
    [columns],
  );

  const normalizeRows = useCallback(
    (items = [], type) =>
      items.map((item, index) => {
        const row = {
          id: item.id ?? `${type}-${index}`,
        };

        columns.forEach((column) => {
          const field = type === 'history' ? column.historyField : column.currentField;
          row[column.key] = item?.[field];
        });

        return row;
      }),
    [columns],
  );

  const fetchLogs = useCallback(
    async (terminalId, page = 1, size = DEFAULT_PAGE_SIZE) => {
      if (!terminalId) {
        setCurrentRows([]);
        setHistoryRows([]);
        setHistoryTotal(0);
        setHistoryPage(1);
        setHistoryPageSize(DEFAULT_PAGE_SIZE);
        return;
      }

      try {
        setLoadingLogs(true);
        const apiUrl = getApiUrl();
        const response = await axios.get(
          `${apiUrl}/api/Tracker/${terminalId}/${endpointSegment}?page=${page}&pageSize=${size}`,
          {
            headers: getAuthHeaders(),
          },
        );

        const currentData = response.data?.current || {};
        const historyData = response.data?.history || {};

        setCurrentRows(normalizeRows(currentData.items || [], 'current'));
        setHistoryRows(normalizeRows(historyData.items || [], 'history'));
        setHistoryTotal(historyData.totalCount || 0);
        setHistoryPage(historyData.page || page);
        setHistoryPageSize(historyData.pageSize || size);
      } catch (error) {
        message.error(error.response?.data?.message || 'Failed to load tracker logs');
      } finally {
        setLoadingLogs(false);
      }
    },
    [endpointSegment, normalizeRows],
  );

  const handleSearchTerm = async (overrideSearchTerm) => {
    const trimmed = String(overrideSearchTerm ?? searchTerm).trim();
    if (!trimmed) {
      message.warning('Enter search term first');
      return;
    }

    try {
      setLoadingSearch(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api/Tracker/search?searchTerm=${encodeURIComponent(trimmed)}`, {
        headers: getAuthHeaders(),
      });

      const terminals = normalizeTerminalOptions(response.data);
      setTerminalOptions(terminals);

      if (!terminals.length) {
        setSelectedTerminalId('');
        setCurrentRows([]);
        setHistoryRows([]);
        setHistoryTotal(0);
        message.info('No terminal IDs found for this search term');
        return;
      }

      const nextTerminal = terminals.some((item) => item.value === selectedTerminalId)
        ? selectedTerminalId
        : terminals[0].value;
      setSelectedTerminalId(nextTerminal);
      await fetchLogs(nextTerminal, 1, historyPageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to search terminal IDs');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleClearLogs = async () => {
    if (!selectedTerminalId) {
      message.warning('Select terminal ID first');
      return;
    }

    try {
      setClearingLogs(true);
      const apiUrl = getApiUrl();
      await axios.delete(`${apiUrl}/api/Tracker/${selectedTerminalId}/${endpointSegment}`, {
        headers: getAuthHeaders(),
      });
      message.success('Logs cleared successfully');
      await fetchLogs(selectedTerminalId, 1, historyPageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to clear logs');
    } finally {
      setClearingLogs(false);
    }
  };

  const handleHistoryTableChange = (pagination) => {
    const page = pagination?.current || 1;
    const size = pagination?.pageSize || DEFAULT_PAGE_SIZE;
    fetchLogs(selectedTerminalId, page, size);
  };

  useEffect(() => {
    if (!enableAutoRefresh || !autoRefreshEnabled || !selectedTerminalId) return undefined;

    const seconds = Number(autoRefreshSeconds);
    if (!Number.isFinite(seconds) || seconds < 5) return undefined;

    const intervalId = setInterval(() => {
      fetchLogs(selectedTerminalId, historyPage, historyPageSize);
    }, seconds * 1000);

    return () => clearInterval(intervalId);
  }, [
    autoRefreshEnabled,
    autoRefreshSeconds,
    enableAutoRefresh,
    fetchLogs,
    historyPage,
    historyPageSize,
    selectedTerminalId,
  ]);

  return (
    <>
      <PageHeader ghost title={title} />
      <Main>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards title="Search & Actions">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                <div style={{ minWidth: 280 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Search Term</div>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onPressEnter={handleSearchTerm}
                    placeholder="Enter search term"
                    suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
                  />
                </div>
                <Button type="primary" onClick={handleSearchTerm} loading={loadingSearch}>
                  Search
                </Button>

                <div style={{ minWidth: 300 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Terminal ID (IMEI)</div>
                  <Select
                    value={selectedTerminalId || undefined}
                    onChange={(value) => {
                      const nextTerminal = value || '';
                      setSelectedTerminalId(nextTerminal);
                      fetchLogs(nextTerminal, 1, historyPageSize);
                    }}
                    placeholder="Select terminal ID"
                    style={{ width: '100%' }}
                    options={terminalOptions}
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => {
                      const term = String(input || '').toLowerCase();
                      const label = String(option?.label || '').toLowerCase();
                      const value = String(option?.value || '').toLowerCase();
                      const searchText = String(option?.searchText || '').toLowerCase();
                      return label.includes(term) || value.includes(term) || searchText.includes(term);
                    }}
                    onSearch={(value) => {
                      const trimmed = String(value || '').trim();
                      setSearchTerm(trimmed);
                      if (trimmed.length >= 2) {
                        handleSearchTerm(trimmed);
                      }
                    }}
                    allowClear
                    onClear={() => {
                      setSelectedTerminalId('');
                      setCurrentRows([]);
                      setHistoryRows([]);
                      setHistoryTotal(0);
                    }}
                  />
                </div>

                <Popconfirm
                  title="Clear logs"
                  description="Are you sure you want to clear logs for this terminal?"
                  onConfirm={handleClearLogs}
                  okText="Yes"
                  cancelText="No"
                  disabled={!selectedTerminalId}
                >
                  <Button danger loading={clearingLogs} disabled={!selectedTerminalId}>
                    Clear logs
                  </Button>
                </Popconfirm>

                {enableAutoRefresh && (
                  <Space style={{ marginLeft: 'auto' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Auto Refresh</span>
                    <Switch
                      checked={autoRefreshEnabled}
                      onChange={setAutoRefreshEnabled}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      size="small"
                    />
                    <InputNumber
                      value={autoRefreshSeconds}
                      min={5}
                      max={600}
                      step={5}
                      onChange={(value) => setAutoRefreshSeconds(value || 30)}
                      disabled={!autoRefreshEnabled}
                      addonAfter="s"
                    />
                    <Button
                      onClick={() => fetchLogs(selectedTerminalId, historyPage, historyPageSize)}
                      disabled={!selectedTerminalId}
                      loading={loadingLogs}
                      icon={<FeatherIcon icon="refresh-cw" size={14} />}
                    >
                      Refresh
                    </Button>
                  </Space>
                )}
              </div>
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards title="Current">
              {!selectedTerminalId ? (
                <Alert type="info" showIcon message="Search and select a terminal ID to view current logs." />
              ) : (
                <Table
                  rowKey="id"
                  columns={tableColumns}
                  dataSource={currentRows}
                  loading={loadingLogs}
                  pagination={false}
                  scroll={{ x: true }}
                />
              )}
            </Cards>
          </Col>

          <Col xs={24}>
            <Cards title="History">
              {!selectedTerminalId ? (
                <Alert type="info" showIcon message="Search and select a terminal ID to view history logs." />
              ) : (
                <Table
                  rowKey="id"
                  columns={tableColumns}
                  dataSource={historyRows}
                  loading={loadingLogs}
                  scroll={{ x: true }}
                  pagination={{
                    current: historyPage,
                    pageSize: historyPageSize,
                    total: historyTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                  onChange={handleHistoryTableChange}
                />
              )}
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default TrackerLogsScreen;
