import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Table,
  Pagination,
  Spin,
  Empty,
  message,
  Modal,
  Form,
  InputNumber,
  Alert,
  Divider,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import PlainLabel from '../../components/labels/plain-label';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { API } from '../../config/api/index';
import { BookingStatus, BookingStatusColors, PaymentType, PaymentStatus, PaymentStatusColors } from './bookingEnums';
import { getItem } from '../../utility/localStorageControl';

const { Search } = Input;
const { Option } = Select;

const val = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const formatMoney = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '-';
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const SummaryItem = ({ label, value, color }) => (
  <div style={{ padding: '8px 10px', border: '1px solid #f0f0f0', borderRadius: 6 }}>
    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{label}</div>
    <div style={{ fontWeight: 600, color: color || 'inherit' }}>{value}</div>
  </div>
);

function BookingPayments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [bookingLoading, setBookingLoading] = useState(!location.state?.booking);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState(undefined);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // New states for arrears and payment creation
  const [pendingArrears, setPendingArrears] = useState(null);
  const [arrearsLoading, setArrearsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [createPaymentModalVisible, setCreatePaymentModalVisible] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${getItem('access_token')}`,
    },
  });

  const fetchBooking = useCallback(async () => {
    if (location.state?.booking) {
      return;
    }
    try {
      setBookingLoading(true);
      const response = await axios.get(`${getApiUrl()}/api${API.booking.path}/${id}`, getHeaders());
      setBooking(response.data || null);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load booking details');
    } finally {
      setBookingLoading(false);
    }
  }, [id, location.state]);

  const fetchPendingArrears = useCallback(async () => {
    if (!booking?.customerId) return;
    try {
      setArrearsLoading(true);
      const response = await axios.get(
        `${getApiUrl()}/api${API.arrears.customerPending}/${booking.customerId}/pending`,
        getHeaders(),
      );
      setPendingArrears(response.data?.data || null);
    } catch (error) {
      console.error('Failed to load pending arrears:', error);
      setPendingArrears(null);
    } finally {
      setArrearsLoading(false);
    }
  }, [booking?.customerId]);

  const fetchWalletBalance = useCallback(async () => {
    if (!booking?.customerId) return;
    try {
      setWalletLoading(true);
      const response = await axios.get(
        `${getApiUrl()}/api${API.wallet.balance}/${booking.customerId}/balance`,
        getHeaders(),
      );
      setWalletBalance(response.data?.data?.balance || response.data?.balance || 0);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  }, [booking?.customerId]);

  const fetchPayments = useCallback(
    async (
      page = currentPage,
      size = pageSize,
      type = paymentTypeFilter,
      status = paymentStatusFilter,
      term = searchTerm,
    ) => {
      try {
        setLoading(true);
        let queryParams = `page=${page}&pageSize=${size}`;
        if (status !== undefined && status !== null) {
          queryParams += `&status=${status}`;
        }
        if (type !== undefined && type !== null) {
          queryParams += `&paymentType=${type}`;
        }
        if (term) {
          queryParams += `&searchTerm=${encodeURIComponent(term)}`;
        }

        const response = await axios.get(
          `${getApiUrl()}/api${API.payment.path}/booking/${id}/paged?${queryParams}`,
          getHeaders(),
        );
        const data = response.data || {};
        setPayments(Array.isArray(data.items) ? data.items : []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        setPayments([]);
        setTotalCount(0);
        message.error(error?.response?.data?.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, id, pageSize, paymentStatusFilter, paymentTypeFilter, searchTerm],
  );

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (booking) {
      fetchPendingArrears();
      fetchWalletBalance();
    }
  }, [booking, fetchPendingArrears, fetchWalletBalance]);

  useEffect(() => {
    fetchPayments(currentPage, pageSize, paymentTypeFilter, paymentStatusFilter, searchTerm);
  }, [currentPage, pageSize, paymentTypeFilter, paymentStatusFilter, searchTerm, fetchPayments]);

  const handlePaymentTypeChange = (value) => {
    setCurrentPage(1);
    setPaymentTypeFilter(value);
  };

  const handlePaymentStatusChange = (value) => {
    setCurrentPage(1);
    setPaymentStatusFilter(value);
  };

  const handleSearch = (value) => {
    setCurrentPage(1);
    setSearchTerm((value || '').trim());
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (!value) {
      setCurrentPage(1);
      setSearchTerm('');
    }
  };

  const isOwnershipBooking = useMemo(() => {
    return booking?.bookingType === 1 || booking?.bookingType === 'Ownership';
  }, [booking]);

  const totalPendingAmount = useMemo(() => {
    return pendingArrears?.totalPendingAmount || 0;
  }, [pendingArrears]);

  const nextPaymentAmount = useMemo(() => {
    // You may need to get this from booking API - using a placeholder
    return booking?.nextPaymentAmount || 0;
  }, [booking]);

  const calculateTotalAmount = useCallback(() => {
    let total = nextPaymentAmount;
    if (totalPendingAmount > 0) {
      total += totalPendingAmount;
    }
    // Don't let wallet balance go negative
    const maxWalletDeduction = Math.min(walletBalance, total);
    return {
      totalBeforeWallet: total,
      walletDeduction: maxWalletDeduction,
      totalAfterWallet: Math.max(0, total - maxWalletDeduction),
    };
  }, [nextPaymentAmount, totalPendingAmount, walletBalance]);

  const paymentBreakdown = calculateTotalAmount();

  const openCreatePaymentModal = () => {
    form.resetFields();
    form.setFieldsValue({
      repaymentAmount: nextPaymentAmount,
      arrearsAmount: totalPendingAmount,
      walletBalance: walletBalance,
      walletDeduction: Math.min(walletBalance, nextPaymentAmount + totalPendingAmount),
      totalAmount: paymentBreakdown.totalAfterWallet,
    });
    setCreatePaymentModalVisible(true);
  };

  const closeCreatePaymentModal = () => {
    setCreatePaymentModalVisible(false);
    form.resetFields();
  };

  const confirmArrear = async (transactionId) => {
    try {
      await axios.put(
        `${getApiUrl()}/api${API.arrears.confirm}/${transactionId}/confirm`,
        {
          transactionId,
          dueDate: null,
          confirmationNotes: 'Automatically confirmed after payment',
        },
        getHeaders(),
      );
    } catch (error) {
      console.error(`Failed to confirm arrear ${transactionId}:`, error);
      throw error;
    }
  };

  const handleCreatePayment = async (values) => {
    try {
      setCreatingPayment(true);

      const createdPayments = [];

      // Create Repayment if booking is ownership and there's a next payment amount
      if (isOwnershipBooking && nextPaymentAmount > 0) {
        const repaymentPayload = {
          bookingId: parseInt(id),
          paymentAmount: nextPaymentAmount,
          paymentType: 3, // RecurringPayment/Repayment
          paymentStatus: 0, // Pending
          paymentMethod: values.paymentMethod || 'Online',
          transactionId: `REP-${Date.now()}`,
        };

        const repaymentResponse = await axios.post(
          `${getApiUrl()}/api${API.payment.path}/repayment`,
          repaymentPayload,
          getHeaders(),
        );

        if (repaymentResponse.data) {
          createdPayments.push(repaymentResponse.data);
        }
      }

      // Create Arrears Payment if there are pending arrears
      if (totalPendingAmount > 0) {
        const arrearsPayload = {
          bookingId: parseInt(id),
          arrearsAmount: totalPendingAmount,
          currentPaymentAmount: totalPendingAmount,
        };

        const arrearsResponse = await axios.post(
          `${getApiUrl()}/api${API.payment.path}/arrears`,
          arrearsPayload,
          getHeaders(),
        );

        if (arrearsResponse.data) {
          createdPayments.push(arrearsResponse.data);
        }
      }

      // Confirm all created payments
      for (const payment of createdPayments) {
        await axios.put(`${getApiUrl()}/api${API.payment.path}/${payment.id}/confirm`, {}, getHeaders());
      }

      // Confirm all pending arrears
      if (pendingArrears?.pendingArrears && pendingArrears.pendingArrears.length > 0) {
        for (const arrear of pendingArrears.pendingArrears) {
          await confirmArrear(arrear.transactionId);
        }
      }

      message.success('Payment created and confirmed successfully');
      closeCreatePaymentModal();

      // Refresh data
      fetchPayments();
      fetchPendingArrears();
      fetchWalletBalance();
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data || 'Failed to create payment';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create payment');
    } finally {
      setCreatingPayment(false);
    }
  };

  const bookingSummary = useMemo(
    () => [
      { label: 'Booking ID', value: val(booking?.id) },
      { label: 'Customer', value: `${booking?.firstName || ''} ${booking?.lastName || ''}`.trim() || '-' },
      { label: 'Phone', value: val(booking?.phoneNumber) },
      { label: 'Booking Type', value: val(booking?.bookingType) },
      {
        label: 'Status',
        value: (
          <PlainLabel color={BookingStatusColors[booking?.status] || 'default'}>
            {BookingStatus[booking?.status] || val(booking?.status)}
          </PlainLabel>
        ),
      },
      { label: 'Total Price', value: formatMoney(booking?.totalPriceWithGST ?? booking?.totalPrice) },
      { label: 'Scooter', value: val(booking?.scooterName) },
      { label: 'Created At', value: formatDate(booking?.createdAt) },
    ],
    [booking],
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right',
      render: (value) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{formatMoney(value)}</span>,
    },
    {
      title: 'Wallet Used',
      dataIndex: 'walletAmountUsed',
      key: 'walletAmountUsed',
      width: 140,
      align: 'right',
      render: (value) => <span style={{ color: '#cf1322', fontWeight: 500 }}>{formatMoney(value)}</span>,
    },
    {
      title: 'Gateway Amount',
      dataIndex: 'gatewayAmount',
      key: 'gatewayAmount',
      width: 140,
      align: 'right',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatMoney(value)}</span>,
    },
    {
      title: 'Payment Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 160,
      render: (value) => PaymentType[value] || `Unknown (${value})`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => (
        <PlainLabel color={PaymentStatusColors[value] || 'default'}>
          {PaymentStatus[value] || `Unknown (${value})`}
        </PlainLabel>
      ),
    },
    {
      title: 'Initiated At',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
      width: 200,
      render: (value) => formatDate(value),
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 220,
      render: (value) => val(value),
    },
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 120,
      render: (value) => val(value),
    },
  ];

  const hasPaymentDue = nextPaymentAmount > 0 || totalPendingAmount > 0;

  return (
    <>
      <PageHeader
        ghost
        title={`Booking Payments${id ? ` #${id}` : ''}`}
        buttons={[
          <div key="1" className="page-header-actions" style={{ display: 'flex', gap: '10px' }}>
            {hasPaymentDue && (
              <Button
                size="small"
                type="primary"
                onClick={openCreatePaymentModal}
                disabled={bookingLoading || arrearsLoading || walletLoading}
              >
                <FeatherIcon icon="credit-card" size={14} /> Create Payment
              </Button>
            )}
            <Button size="small" type="default" outlined onClick={() => navigate('/admin/booking/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back to List
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={16}>
          <Col xs={24} style={{ marginBottom: 16 }}>
            <Cards title="Booking Summary">
              {bookingLoading ? (
                <div className="spin">
                  <Spin />
                </div>
              ) : !booking ? (
                <Empty description="Booking details not available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  {bookingSummary.map((item) => (
                    <SummaryItem key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              )}
            </Cards>
          </Col>

          {/* Payment Breakdown Card */}
          {booking && (
            <Col xs={24} style={{ marginBottom: 16 }}>
              <Cards title="Payment Breakdown">
                {arrearsLoading || walletLoading ? (
                  <div className="spin">
                    <Spin />
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {isOwnershipBooking && (
                      <SummaryItem label="Next Repayment Amount" value={`₹${formatMoney(nextPaymentAmount)}`} />
                    )}
                    <SummaryItem
                      label="Pending Arrears"
                      value={`₹${formatMoney(totalPendingAmount)}`}
                      color={totalPendingAmount > 0 ? '#cf1322' : undefined}
                    />
                    <SummaryItem
                      label="Wallet Balance"
                      value={`₹${formatMoney(walletBalance)}`}
                      color={walletBalance > 0 ? '#52c41a' : undefined}
                    />
                    <SummaryItem
                      label="Total Amount Due"
                      value={`₹${formatMoney(paymentBreakdown.totalBeforeWallet)}`}
                      color="#1890ff"
                    />
                    {paymentBreakdown.walletDeduction > 0 && (
                      <SummaryItem
                        label="Wallet Deduction"
                        value={`-₹${formatMoney(paymentBreakdown.walletDeduction)}`}
                        color="#52c41a"
                      />
                    )}
                    <SummaryItem
                      label="Amount to Pay"
                      value={`₹${formatMoney(paymentBreakdown.totalAfterWallet)}`}
                      color="#722ed1"
                    />
                  </div>
                )}
              </Cards>
            </Col>
          )}

          <Col xs={24}>
            <Cards title="Payments" headless={false}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Select
                    placeholder="Payment Type"
                    value={paymentTypeFilter}
                    onChange={handlePaymentTypeChange}
                    allowClear
                    style={{ minWidth: 190 }}
                  >
                    {Object.keys(PaymentType).map((key) => (
                      <Option key={key} value={parseInt(key, 10)}>
                        {PaymentType[key]}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Payment Status"
                    value={paymentStatusFilter}
                    onChange={handlePaymentStatusChange}
                    allowClear
                    style={{ minWidth: 180 }}
                  >
                    {Object.keys(PaymentStatus).map((key) => (
                      <Option key={key} value={parseInt(key, 10)}>
                        {PaymentStatus[key]}
                      </Option>
                    ))}
                  </Select>
                </div>

                <Search
                  placeholder="Search by Transaction ID or Amount"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onSearch={handleSearch}
                  allowClear
                  style={{ width: 320, maxWidth: '100%' }}
                />
              </div>

              <Table
                className="table-responsive"
                dataSource={payments}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={false}
                locale={{ emptyText: <Empty description="No payments found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                scroll={{ x: 1200 }}
              />

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={['10', '20', '50', '100']}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                />
              </div>
            </Cards>
          </Col>
        </Row>
      </Main>

      {/* Create Payment Modal */}
      <Modal
        title="Create Payment"
        open={createPaymentModalVisible}
        onCancel={closeCreatePaymentModal}
        footer={null}
        width={600}
      >
        <Alert
          message="Payment Summary"
          description={
            <div>
              {isOwnershipBooking && nextPaymentAmount > 0 && (
                <div>Repayment Amount: ₹{formatMoney(nextPaymentAmount)}</div>
              )}
              {totalPendingAmount > 0 && <div>Arrears Amount: ₹{formatMoney(totalPendingAmount)}</div>}
              <div>Wallet Balance: ₹{formatMoney(walletBalance)}</div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ fontWeight: 600 }}>Total Amount: ₹{formatMoney(paymentBreakdown.totalAfterWallet)}</div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleCreatePayment}>
          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="Select payment method">
              <Option value="Online">Online</Option>
              <Option value="Cash">Cash</Option>
              <Option value="Card">Card</Option>
              <Option value="UPI">UPI</Option>
              <Option value="Wallet">Wallet</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={closeCreatePaymentModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={creatingPayment}>
                Create & Confirm Payment
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default BookingPayments;
