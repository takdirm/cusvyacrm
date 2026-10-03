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
  Modal,
  Dropdown,
  Tag,
  Statistic,
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
import { PaymentType, PaymentStatus, PaymentStatusColors } from '../booking/bookingEnums';
import PlainLabel from '../../components/labels/plain-label';

const { Option } = Select;
const { Search } = Input;

function CustomerPaymentScreen() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: false,
    payments: [],
    customerDetails: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    statusFilter: undefined,
    paymentTypeFilter: undefined,
    actionLoading: false,
    updateStatusModalVisible: false,
    selectedPayment: null,
    selectedStatus: undefined,
  });

  const {
    loading,
    payments,
    customerDetails,
    totalCount,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    paymentTypeFilter,
    actionLoading,
    updateStatusModalVisible,
    selectedPayment,
    selectedStatus,
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

  // Fetch payments list
  const getPayments = useCallback(
    async (page = currentPage, size = pageSize) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));

        const params = new URLSearchParams({
          page: page,
          pageSize: size,
        });

        if (statusFilter !== undefined && statusFilter !== null && statusFilter !== '') {
          params.append('paymentStatus', statusFilter);
        }

        if (paymentTypeFilter !== undefined && paymentTypeFilter !== null && paymentTypeFilter !== '') {
          params.append('paymentType', paymentTypeFilter);
        }

        if (searchTerm) {
          params.append('searchTerm', searchTerm);
        }

        const response = await DataService.get(`${API.customer.path}/${customerId}/payments?${params.toString()}`);
        const data = response?.data?.data ?? response?.data ?? {};

        setState((prev) => ({
          ...prev,
          payments: data.items ?? [],
          totalCount: data.totalCount ?? 0,
          loading: false,
        }));
      } catch (error) {
        console.error('Error fetching payments:', error);
        message.error('Failed to fetch payments');
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [customerId, currentPage, pageSize, statusFilter, paymentTypeFilter, searchTerm],
  );

  useEffect(() => {
    if (customerId) {
      getCustomerDetails();
      getPayments();
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      getPayments(1, pageSize);
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [statusFilter, paymentTypeFilter, searchTerm]);

  const handlePageChange = (page, size) => {
    setState((prev) => ({ ...prev, currentPage: page, pageSize: size }));
    getPayments(page, size);
  };

  const handleSearch = (value) => {
    setState((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleStatusFilterChange = (value) => {
    setState((prev) => ({ ...prev, statusFilter: value }));
  };

  const handlePaymentTypeFilterChange = (value) => {
    setState((prev) => ({ ...prev, paymentTypeFilter: value }));
  };

  const handleReset = () => {
    setState((prev) => ({
      ...prev,
      searchTerm: '',
      statusFilter: undefined,
      paymentTypeFilter: undefined,
      currentPage: 1,
    }));
  };

  // Delete payment
  const handleDeletePayment = async (paymentId) => {
    Modal.confirm({
      title: 'Delete Payment',
      icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
      content: 'Are you sure you want to delete this payment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, actionLoading: true }));
          await DataService.delete(`${API.payment.path}/${paymentId}`);
          message.success('Payment deleted successfully');
          getPayments(currentPage, pageSize);
          setState((prev) => ({ ...prev, actionLoading: false }));
        } catch (error) {
          console.error('Error deleting payment:', error);
          message.error(error?.response?.data?.message || 'Failed to delete payment');
          setState((prev) => ({ ...prev, actionLoading: false }));
        }
      },
    });
  };

  // Update payment status
  const handleUpdateStatusClick = (payment) => {
    setState((prev) => ({
      ...prev,
      updateStatusModalVisible: true,
      selectedPayment: payment,
      selectedStatus: payment.status,
    }));
  };

  const handleUpdateStatus = async () => {
    if (!selectedPayment || selectedStatus === undefined) {
      message.warning('Please select a status');
      return;
    }

    try {
      setState((prev) => ({ ...prev, actionLoading: true }));
      await DataService.patch(`${API.payment.path}/${selectedPayment.id}/status`, {
        status: selectedStatus,
      });
      message.success('Payment status updated successfully');
      setState((prev) => ({
        ...prev,
        updateStatusModalVisible: false,
        selectedPayment: null,
        selectedStatus: undefined,
        actionLoading: false,
      }));
      getPayments(currentPage, pageSize);
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error(error?.response?.data?.message || 'Failed to update payment status');
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  const handleCancelStatusUpdate = () => {
    setState((prev) => ({
      ...prev,
      updateStatusModalVisible: false,
      selectedPayment: null,
      selectedStatus: undefined,
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
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (v) => <span style={{ color: '#1890ff', fontWeight: 600 }}>₹{(v || 0).toFixed(2)}</span>,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: 'Wallet',
      dataIndex: 'walletAmountUsed',
      key: 'walletAmountUsed',
      width: 110,
      align: 'right',
      render: (v) => <span style={{ color: '#ff4d4f' }}>{v > 0 ? `₹${v.toFixed(2)}` : '-'}</span>,
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayAmount',
      key: 'gatewayAmount',
      width: 110,
      align: 'right',
      render: (v) => <span style={{ color: '#52c41a' }}>{v > 0 ? `₹${v.toFixed(2)}` : '-'}</span>,
    },
    {
      title: 'Payment Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 160,
      render: (v) => PaymentType[v] || `Unknown (${v})`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v) => (
        <PlainLabel color={PaymentStatusColors[v] || 'default'}>{PaymentStatus[v] || `Unknown (${v})`}</PlainLabel>
      ),
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      render: (v) => v || '-',
    },
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: 'Initiated At',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
      width: 160,
      sorter: (a, b) => moment(a.initiatedAt).unix() - moment(b.initiatedAt).unix(),
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const actionMenu = {
          items: [
            {
              key: 'update-status',
              icon: <FeatherIcon icon="edit" size={14} />,
              label: 'Update Status',
              onClick: () => handleUpdateStatusClick(record),
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <FeatherIcon icon="trash-2" size={14} />,
              label: 'Delete',
              danger: true,
              onClick: () => handleDeletePayment(record.id),
            },
          ],
        };

        return (
          <Dropdown menu={actionMenu} trigger={['click']} placement="bottomRight">
            <Button size="small" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FeatherIcon icon="more-vertical" size={14} />
              Actions
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        ghost
        title={
          customerDetails ? `Payments - ${customerDetails.firstName} ${customerDetails.lastName}` : 'Customer Payments'
        }
        buttons={[
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
            key="wallet"
            size="default"
            type="white"
            onClick={() => navigate(`/admin/customer/${customerId}/wallet`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FeatherIcon icon="dollar-sign" size={14} />
            Wallet
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
              {/* Customer Details Card */}
              {customerDetails && (
                <Col xs={24}>
                  <Card>
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Customer Name"
                          value={`${customerDetails.firstName} ${customerDetails.lastName}`}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Email" value={customerDetails.email || '-'} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Phone" value={customerDetails.phoneNumber || '-'} />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic title="Customer ID" value={customerDetails.id} />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}

              {/* Filters */}
              <Col xs={24}>
                <Card title="Filters">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Search
                        placeholder="Search by transaction ID..."
                        allowClear
                        onSearch={handleSearch}
                        value={searchTerm}
                        onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Select
                        placeholder="Payment Status"
                        style={{ width: '100%' }}
                        allowClear
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                      >
                        {Object.keys(PaymentStatus).map((key) => (
                          <Option key={key} value={parseInt(key)}>
                            {PaymentStatus[key]}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Select
                        placeholder="Payment Type"
                        style={{ width: '100%' }}
                        allowClear
                        value={paymentTypeFilter}
                        onChange={handlePaymentTypeFilterChange}
                      >
                        {Object.keys(PaymentType).map((key) => (
                          <Option key={key} value={parseInt(key)}>
                            {PaymentType[key]}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Button type="default" onClick={handleReset} style={{ width: '100%' }}>
                        <FeatherIcon icon="refresh-cw" size={14} style={{ marginRight: '8px' }} />
                        Reset Filters
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Payments Table */}
              <Col xs={24}>
                <Card title={`Payments (${totalCount})`}>
                  <Spin spinning={loading}>
                    <Table
                      className="table-responsive"
                      dataSource={payments}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 1400 }}
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

      {/* Update Status Modal */}
      <Modal
        title="Update Payment Status"
        open={updateStatusModalVisible}
        onOk={handleUpdateStatus}
        onCancel={handleCancelStatusUpdate}
        confirmLoading={actionLoading}
        okText="Update"
        cancelText="Cancel"
      >
        {selectedPayment && (
          <>
            <p style={{ marginBottom: '16px' }}>
              <strong>Payment ID:</strong> {selectedPayment.id}
              <br />
              <strong>Total Amount:</strong>{' '}
              <span style={{ color: '#1890ff', fontWeight: 600 }}>
                ₹{(selectedPayment.totalAmount || 0).toFixed(2)}
              </span>
              <br />
              {selectedPayment.walletAmountUsed > 0 && (
                <>
                  <strong>Wallet Used:</strong>{' '}
                  <span style={{ color: '#ff4d4f' }}>₹{selectedPayment.walletAmountUsed.toFixed(2)}</span>
                  <br />
                </>
              )}
              {selectedPayment.gatewayAmount > 0 && (
                <>
                  <strong>Gateway Amount:</strong>{' '}
                  <span style={{ color: '#52c41a' }}>₹{selectedPayment.gatewayAmount.toFixed(2)}</span>
                  <br />
                </>
              )}
              <strong>Current Status:</strong>{' '}
              <PlainLabel color={PaymentStatusColors[selectedPayment.status] || 'default'}>
                {PaymentStatus[selectedPayment.status] || 'Unknown'}
              </PlainLabel>
            </p>
            <Select
              placeholder="Select new status"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={(value) => setState((prev) => ({ ...prev, selectedStatus: value }))}
            >
              {Object.keys(PaymentStatus).map((key) => (
                <Option key={key} value={parseInt(key)}>
                  <PlainLabel color={PaymentStatusColors[key] || 'default'}>{PaymentStatus[key]}</PlainLabel>
                </Option>
              ))}
            </Select>
          </>
        )}
      </Modal>
    </>
  );
}

export default CustomerPaymentScreen;
