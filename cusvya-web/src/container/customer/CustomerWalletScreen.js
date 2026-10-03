import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Pagination,
  Spin,
  Select,
  Input,
  Button,
  message,
  Dropdown,
  Tag,
  Statistic,
  Descriptions,
} from 'antd';
import FeatherIcon from 'feather-icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';
import {
  WalletTransactionType,
  WalletTransactionTypeLabels,
  WalletTransactionTypeColors,
  WalletEntryType,
  WalletEntryTypeColors,
  WalletTransactionStatus,
  WalletTransactionStatusColors,
} from '../../config/enum/walletEnums';
import PlainLabel from '../../components/labels/plain-label';

const { Option } = Select;
const { Search } = Input;

function CustomerWalletScreen() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: false,
    walletSummary: null,
    transactions: [],
    customerDetails: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    statusFilter: undefined,
    transactionTypeFilter: undefined,
    entryTypeFilter: undefined,
  });

  const {
    loading,
    walletSummary,
    transactions,
    customerDetails,
    totalCount,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    transactionTypeFilter,
    entryTypeFilter,
  } = state;

  // Fetch customer details
  const getCustomerDetails = async () => {
    try {
      const response = await DataService.get(`${API.customer.path}/${customerId}`);
      const customerData = response?.data?.data ?? response?.data ?? null;
      setState((prev) => ({ ...prev, customerDetails: customerData }));
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  // Fetch wallet transactions and summary
  const getWalletTransactions = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));

        const params = new URLSearchParams({
          page: page,
          pageSize: size,
        });

        if (statusFilter !== undefined && statusFilter !== null && statusFilter !== '') {
          params.append('status', statusFilter);
        }

        if (transactionTypeFilter !== undefined && transactionTypeFilter !== null && transactionTypeFilter !== '') {
          params.append('transactionType', transactionTypeFilter);
        }

        if (entryTypeFilter !== undefined && entryTypeFilter !== null && entryTypeFilter !== '') {
          params.append('entryType', entryTypeFilter);
        }

        if (searchTerm) {
          params.append('searchTerm', searchTerm);
        }

        const response = await DataService.get(
          `${API.customer.path}/${customerId}/wallet-transactions?${params.toString()}`,
        );
        const data = response?.data?.data ?? response?.data ?? {};

        setState((prev) => ({
          ...prev,
          walletSummary: data.walletSummary ?? prev.walletSummary,
          transactions: data.transactions?.items ?? [],
          totalCount: data.transactions?.totalCount ?? 0,
          loading: false,
        }));
      } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        message.error('Failed to fetch wallet transactions');
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [customerId, currentPage, pageSize, statusFilter, transactionTypeFilter, entryTypeFilter, searchTerm],
  );

  useEffect(() => {
    if (customerId) {
      getCustomerDetails();
      getWalletTransactions();
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      getWalletTransactions(1, pageSize);
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [statusFilter, transactionTypeFilter, entryTypeFilter, searchTerm]);

  const handlePageChange = (page, size) => {
    setState((prev) => ({ ...prev, currentPage: page, pageSize: size }));
    getWalletTransactions(page, size);
  };

  const handleSearch = (value) => {
    setState((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleStatusFilterChange = (value) => {
    setState((prev) => ({ ...prev, statusFilter: value }));
  };

  const handleTransactionTypeFilterChange = (value) => {
    setState((prev) => ({ ...prev, transactionTypeFilter: value }));
  };

  const handleEntryTypeFilterChange = (value) => {
    setState((prev) => ({ ...prev, entryTypeFilter: value }));
  };

  const handleReset = () => {
    setState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: undefined,
      transactionTypeFilter: undefined,
      entryTypeFilter: undefined,
      currentPage: 1,
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Reference No',
      dataIndex: 'referenceNo',
      key: 'referenceNo',
      width: 200,
      render: (v) => v || '-',
    },
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 150,
      render: (v) => (
        <PlainLabel color={WalletTransactionTypeColors[v] || 'default'}>
          {WalletTransactionType[v] || `Unknown (${v})`}
        </PlainLabel>
      ),
    },
    {
      title: 'Entry',
      dataIndex: 'entryType',
      key: 'entryType',
      width: 100,
      align: 'center',
      render: (v) => (
        <PlainLabel color={WalletEntryTypeColors[v] || 'default'}>{WalletEntryType[v] || `Unknown (${v})`}</PlainLabel>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v) => (
        <PlainLabel color={WalletTransactionStatusColors[v] || 'default'}>
          {WalletTransactionStatus[v] || `Unknown (${v})`}
        </PlainLabel>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (v, record) => {
        const isCredit = record.entryType === 0;
        return (
          <span style={{ color: isCredit ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
            {isCredit ? '+' : '-'}₹{(v || 0).toFixed(2)}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Balance Before',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 130,
      align: 'right',
      render: (v) => `₹${(v || 0).toFixed(2)}`,
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 130,
      align: 'right',
      render: (v) => `₹${(v || 0).toFixed(2)}`,
    },
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: 'Gateway Txn ID',
      dataIndex: 'paymentGatewayTransactionId',
      key: 'paymentGatewayTransactionId',
      width: 200,
      render: (v) => v || '-',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 250,
      render: (v) => v || '-',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Processed At',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 160,
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title={
          customerDetails ? `Wallet - ${customerDetails.firstName} ${customerDetails.lastName}` : 'Customer Wallet'
        }
        buttons={[
          <Button
            key="payments"
            size="default"
            type="white"
            onClick={() => navigate(`/admin/customer/${customerId}/payments`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FeatherIcon icon="credit-card" size={14} />
            Payments
          </Button>,
          <Button
            key="arrears"
            size="default"
            type="white"
            onClick={() => navigate(`/admin/customer/${customerId}/arrears`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FeatherIcon icon="alert-triangle" size={14} />
            Arrears
          </Button>,
          <Button
            key="back"
            size="default"
            type="white"
            onClick={() => navigate('/admin/customer/list')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FeatherIcon icon="arrow-left" size={14} />
            Back to Customers
          </Button>,
        ]}
      />
      <Main>
        <ProjectHeader>
          <Cards headless>
            <Row gutter={[16, 16]}>
              {/* Wallet Summary Card */}
              {walletSummary && (
                <Col xs={24}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FeatherIcon icon="credit-card" size={20} />
                        <span>Wallet Summary</span>
                        {walletSummary.isActive ? (
                          <PlainLabel color="green">Active</PlainLabel>
                        ) : (
                          <PlainLabel color="red">Inactive</PlainLabel>
                        )}
                      </div>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Current Balance"
                          value={`₹${(walletSummary.balance || 0).toFixed(2)}`}
                          valueStyle={{ color: '#3f8600', fontWeight: 700 }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Pending Withdrawal"
                          value={`₹${(walletSummary.pendingWithdrawalAmount || 0).toFixed(2)}`}
                          valueStyle={{ color: walletSummary.pendingWithdrawalAmount > 0 ? '#faad14' : '#595959' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Wallet ID" value={walletSummary.id} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Customer ID" value={walletSummary.customerId} />
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: '16px' }}>
                      <Col xs={24} md={12}>
                        <Descriptions size="small" column={1} bordered>
                          <Descriptions.Item label="Created At">
                            {walletSummary.createdAt
                              ? moment(walletSummary.createdAt).format('YYYY-MM-DD HH:mm:ss')
                              : '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Last Updated">
                            {walletSummary.updatedAt
                              ? moment(walletSummary.updatedAt).format('YYYY-MM-DD HH:mm:ss')
                              : '-'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}

              {/* Filters */}
              <Col xs={24}>
                <Card title="Transaction Filters">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Search
                        placeholder="Search reference, gateway ID..."
                        allowClear
                        onSearch={handleSearch}
                        value={searchTerm}
                        onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Select
                        placeholder="Transaction Status"
                        style={{ width: '100%' }}
                        allowClear
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                      >
                        {Object.keys(WalletTransactionStatus).map((key) => (
                          <Option key={key} value={parseInt(key)}>
                            {WalletTransactionStatus[key]}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Select
                        placeholder="Transaction Type"
                        style={{ width: '100%' }}
                        allowClear
                        value={transactionTypeFilter}
                        onChange={handleTransactionTypeFilterChange}
                      >
                        {Object.keys(WalletTransactionType).map((key) => (
                          <Option key={key} value={parseInt(key)}>
                            {WalletTransactionType[key]}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                      <Select
                        placeholder="Entry Type"
                        style={{ width: '100%' }}
                        allowClear
                        value={entryTypeFilter}
                        onChange={handleEntryTypeFilterChange}
                      >
                        {Object.keys(WalletEntryType).map((key) => (
                          <Option key={key} value={parseInt(key)}>
                            {WalletEntryType[key]}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                      <Button type="default" onClick={handleReset} style={{ width: '100%' }}>
                        <FeatherIcon icon="refresh-cw" size={14} style={{ marginRight: '8px' }} />
                        Reset
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Transactions Table */}
              <Col xs={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FeatherIcon icon="list" size={20} />
                      <span>Wallet Transactions ({totalCount})</span>
                    </div>
                  }
                >
                  <Spin spinning={loading}>
                    <Table
                      className="table-responsive"
                      dataSource={transactions}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 2000 }}
                    />
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalCount}
                        onChange={handlePageChange}
                        showSizeChanger
                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                        pageSizeOptions={['10', '20', '50', '100']}
                      />
                    </div>
                  </Spin>
                </Card>
              </Col>
            </Row>
          </Cards>
        </ProjectHeader>
      </Main>
    </>
  );
}

export default CustomerWalletScreen;
