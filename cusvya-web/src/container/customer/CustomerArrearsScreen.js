import React, { useEffect, useState } from 'react';
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
  Form,
  DatePicker,
  Dropdown,
  Menu,
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
import {
  ArrearsType,
  ArrearsTypeLabels,
  ArrearsStatus,
  ArrearsStatusColors,
  ArrearsCalculationType,
} from '../../config/enum/arrearsEnums';
import PlainLabel from '../../components/labels/plain-label';
import {
  arrearFormFields,
  getArrearEndpoint,
  getArrearFormFields,
  getArrearTypeName,
} from '../../config/helper/arrearFormConfig';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

function CustomerArrearsScreen() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [updateStatusForm] = Form.useForm();

  const [state, setState] = useState({
    loading: false,
    arrears: [],
    summary: null,
    customerDetails: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    statusFilter: null,
    arrearsTypeFilter: null,
    modalVisible: false,
    modalType: null,
    selectedArrear: null,
    actionLoading: false,
    createArrearModalVisible: false,
    selectedArrearType: null,
    activeBookings: [],
    bookingsLoading: false,
    updateStatusModalVisible: false,
    selectedStatus: null,
  });

  const {
    loading,
    arrears,
    summary,
    customerDetails,
    totalCount,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    arrearsTypeFilter,
    modalVisible,
    modalType,
    selectedArrear,
    actionLoading,
    createArrearModalVisible,
    selectedArrearType,
    activeBookings,
    bookingsLoading,
    updateStatusModalVisible,
    selectedStatus,
  } = state;

  // Fetch summary data
  const getSummary = async () => {
    try {
      const response = await DataService.get(`${API.arrears.customerSummary}/${customerId}/summary`);
      const summaryData = response?.data?.data ?? response?.data ?? null;
      if (summaryData) {
        setState((prev) => ({ ...prev, summary: summaryData }));
      }
    } catch (error) {
      console.error('Error fetching arrears summary:', error);
      // Don't clear existing summary on error
    }
  };

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

  // Fetch active bookings for the customer
  const getActiveBookings = async () => {
    try {
      setState((prev) => ({ ...prev, bookingsLoading: true }));
      const response = await DataService.get(`${API.booking.activeBookings}/${customerId}/active`);
      let bookingsData = response?.data?.data ?? response?.data ?? [];

      // Ensure bookingsData is always an array
      if (!Array.isArray(bookingsData)) {
        bookingsData = bookingsData ? [bookingsData] : [];
      }

      setState((prev) => ({ ...prev, activeBookings: bookingsData, bookingsLoading: false }));
    } catch (error) {
      console.error('Error fetching active bookings:', error);
      setState((prev) => ({ ...prev, activeBookings: [], bookingsLoading: false }));
    }
  };

  // Fetch arrears list
  const getArrears = async (page = currentPage, size = pageSize) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const params = new URLSearchParams({
        pageNumber: page,
        pageSize: size,
      });

      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.append('status', statusFilter);
      }

      if (arrearsTypeFilter !== null && arrearsTypeFilter !== undefined && arrearsTypeFilter !== '') {
        params.append('arrearsType', arrearsTypeFilter);
      }

      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }

      const response = await DataService.get(`${API.arrears.customerArrears}/${customerId}?${params.toString()}`);
      const data = response?.data?.data ?? {};

      setState((prev) => ({
        ...prev,
        arrears: data.arrears ?? [],
        totalCount: data.totalCount ?? 0,
        summary: data.summary ?? prev.summary,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching arrears:', error);
      message.error('Failed to fetch arrears');
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (customerId) {
      getCustomerDetails();
      getSummary();
      getArrears();
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      getArrears(1, pageSize);
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [statusFilter, arrearsTypeFilter, searchTerm]);

  const handlePageChange = (page, size) => {
    setState((prev) => ({ ...prev, currentPage: page, pageSize: size }));
    getArrears(page, size);
  };

  const openModal = (type, arrear) => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalType: type,
      selectedArrear: arrear,
    }));
    form.resetFields();

    if (type === 'confirm') {
      form.setFieldsValue({
        dueDate: moment().add(7, 'days'),
      });
    }
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      modalType: null,
      selectedArrear: null,
    }));
    form.resetFields();
  };

  const handleConfirm = async (values) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      const payload = {
        transactionId: selectedArrear.transactionId,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        confirmationNotes: values.confirmationNotes || null,
      };

      await DataService.put(`${API.arrears.confirm}/${selectedArrear.transactionId}/confirm`, payload);
      message.success('Arrear confirmed successfully');
      closeModal();

      // Refresh data sequentially to ensure consistency
      await getArrears();
      await getSummary();
    } catch (error) {
      console.error('Error confirming arrear:', error);
      message.error(error.response?.data?.message || 'Failed to confirm arrear');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  const handleCancel = async (values) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      const payload = {
        reason: values.reason,
      };

      await DataService.delete(`${API.arrears.cancel}/${selectedArrear.transactionId}/cancel`, payload);
      message.success('Arrear cancelled successfully');
      closeModal();

      // Refresh data sequentially to ensure consistency
      await getArrears();
      await getSummary();
    } catch (error) {
      console.error('Error cancelling arrear:', error);
      message.error(error.response?.data?.message || 'Failed to cancel arrear');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  const handleWaive = async (values) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      const payload = {
        transactionId: selectedArrear.transactionId,
        waiverReason: values.waiverReason,
        remarks: values.remarks || null,
        waivedBy: null, // This should be the current user ID if available
      };

      await DataService.put(`${API.arrears.waive}/${selectedArrear.transactionId}/waive`, payload);
      message.success('Arrear waived successfully');
      closeModal();

      // Refresh data sequentially to ensure consistency
      await getArrears();
      await getSummary();
    } catch (error) {
      console.error('Error waiving arrear:', error);
      message.error(error.response?.data?.message || 'Failed to waive arrear');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  const handleModalSubmit = (values) => {
    if (modalType === 'confirm') {
      handleConfirm(values);
    } else if (modalType === 'cancel') {
      handleCancel(values);
    } else if (modalType === 'waive') {
      handleWaive(values);
    }
  };

  // Open create arrear modal
  const openCreateArrearModal = (arrearsType) => {
    setState((prev) => ({
      ...prev,
      createArrearModalVisible: true,
      selectedArrearType: arrearsType,
    }));
    form.resetFields();
  };

  // Close create arrear modal
  const closeCreateArrearModal = () => {
    setState((prev) => ({
      ...prev,
      createArrearModalVisible: false,
      selectedArrearType: null,
    }));
    form.resetFields();
  };

  // Handle create arrear
  const handleCreateArrear = async (values) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      const endpoint = getArrearEndpoint(selectedArrearType);

      if (!endpoint) {
        message.error('Invalid arrear type');
        setState((prev) => ({ ...prev, actionLoading: false }));
        return;
      }

      // Prepare payload with required arrearsType field
      const payload = {
        customerId: parseInt(customerId),
        arrearsType: selectedArrearType,
        ...values,
      };

      // Convert numeric fields if present
      if (payload.replacementCost !== null && payload.replacementCost !== undefined && payload.replacementCost !== '') {
        payload.replacementCost = Number(payload.replacementCost);
      }

      await DataService.post(API.arrears[endpoint], payload);
      message.success('Arrear created successfully');
      closeCreateArrearModal();

      // Refresh data sequentially to ensure consistency
      await getArrears();
      await getSummary();
    } catch (error) {
      console.error('Error creating arrear:', error);
      message.error(error.response?.data?.message || 'Failed to create arrear');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  // Open update status modal
  const openUpdateStatusModal = (arrear) => {
    setState((prev) => ({
      ...prev,
      updateStatusModalVisible: true,
      selectedArrear: arrear,
      selectedStatus: arrear.status,
    }));
    updateStatusForm.setFieldsValue({
      status: arrear.status,
      remarks: '',
    });
  };

  // Close update status modal
  const closeUpdateStatusModal = () => {
    setState((prev) => ({
      ...prev,
      updateStatusModalVisible: false,
      selectedArrear: null,
      selectedStatus: null,
    }));
    updateStatusForm.resetFields();
  };

  // Handle update status
  const handleUpdateStatus = async (values) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: true }));

      await DataService.put(`${API.arrears.updateStatus}/${selectedArrear.transactionId}/status`, {
        status: values.status,
        remarks: values.remarks || '',
      });
      message.success('Status updated successfully');
      closeUpdateStatusModal();

      // Refresh data sequentially to ensure consistency
      await getArrears();
      await getSummary();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setState((prev) => ({ ...prev, actionLoading: false }));
    }
  };

  // Handle delete arrear
  const handleDeleteArrear = (arrear) => {
    Modal.confirm({
      title: 'Delete Arrear',
      icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete this arrear?</p>
          <div style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div>
              <strong>Transaction ID:</strong> {arrear.transactionId}
            </div>
            <div>
              <strong>Type:</strong> {ArrearsTypeLabels[arrear.arrearsType]}
            </div>
            <div>
              <strong>Amount:</strong> ₹{Number(arrear.amount || 0).toFixed(2)}
            </div>
          </div>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await DataService.delete(`${API.arrears.delete}/${arrear.transactionId}`);
          message.success('Arrear deleted successfully');

          // Refresh data sequentially to ensure consistency
          await getArrears();
          await getSummary();
        } catch (error) {
          console.error('Error deleting arrear:', error);
          message.error(error.response?.data?.message || 'Failed to delete arrear');
        }
      },
    });
  };

  const getActionMenu = (record) => {
    const items = [];

    // Only show confirm for pending arrears
    if (record.status === 0) {
      items.push({
        key: 'confirm',
        icon: <FeatherIcon icon="check-circle" size={14} />,
        label: 'Confirm',
        onClick: () => openModal('confirm', record),
      });
    }

    // Only show cancel for pending arrears
    if (record.status === 0) {
      items.push({
        key: 'cancel',
        icon: <FeatherIcon icon="x-circle" size={14} />,
        label: 'Cancel',
        onClick: () => openModal('cancel', record),
        danger: true,
      });
    }

    // Show waive for pending and confirmed arrears
    if (record.status === 0 || record.status === 1) {
      items.push({
        key: 'waive',
        icon: <FeatherIcon icon="gift" size={14} />,
        label: 'Waive Off',
        onClick: () => openModal('waive', record),
      });
    }

    // Add divider if there are previous items
    if (items.length > 0) {
      items.push({
        type: 'divider',
      });
    }

    // Show update status for all arrears except cancelled and waived
    if (record.status !== 4 && record.status !== 5) {
      items.push({
        key: 'updateStatus',
        icon: <FeatherIcon icon="edit-2" size={14} />,
        label: 'Update Status',
        onClick: () => openUpdateStatusModal(record),
      });
    }

    // Show delete for pending arrears
    if (record.status === 0) {
      items.push({
        key: 'delete',
        icon: <FeatherIcon icon="trash-2" size={14} />,
        label: 'Delete',
        onClick: () => handleDeleteArrear(record),
        danger: true,
      });
    }

    return { items };
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 180,
      render: (v) => v || '-',
    },
    {
      title: 'Arrear Type',
      dataIndex: 'arrearsType',
      key: 'arrearsType',
      width: 180,
      render: (v) => ArrearsTypeLabels[v] || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v) => (v ? `₹${Number(v).toFixed(2)}` : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v) => (
        <PlainLabel color={ArrearsStatusColors[v] || 'default'}>{ArrearsStatus[v] || 'Unknown'}</PlainLabel>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 160,
      render: (v) => (v ? moment(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const menu = getActionMenu(record);
        if (menu.items.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        return (
          <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              outlined
              style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FeatherIcon icon="more-vertical" size={14} />
              Actions
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  const renderModal = () => {
    let title = '';
    let fields = null;

    if (modalType === 'confirm') {
      title = 'Confirm Arrear';
      fields = (
        <>
          <Form.Item label="Due Date" name="dueDate">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            label="Confirmation Notes"
            name="confirmationNotes"
            rules={[{ max: 500, message: 'Confirmation notes cannot exceed 500 characters' }]}
          >
            <TextArea rows={4} placeholder="Enter confirmation notes (optional)" maxLength={500} showCount />
          </Form.Item>
        </>
      );
    } else if (modalType === 'cancel') {
      title = 'Cancel Arrear';
      fields = (
        <>
          <Form.Item
            label="Cancellation Reason"
            name="reason"
            rules={[
              { required: true, message: 'Please enter cancellation reason' },
              { max: 500, message: 'Cancellation reason cannot exceed 500 characters' },
            ]}
          >
            <TextArea rows={4} placeholder="Enter reason for cancellation" maxLength={500} showCount />
          </Form.Item>
        </>
      );
    } else if (modalType === 'waive') {
      title = 'Waive Off Arrear';
      fields = (
        <>
          <Form.Item
            label="Waiver Reason"
            name="waiverReason"
            rules={[
              { required: true, message: 'Please enter waiver reason' },
              { max: 500, message: 'Waiver reason cannot exceed 500 characters' },
            ]}
          >
            <TextArea rows={3} placeholder="Enter reason for waiving off" maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            label="Remarks"
            name="remarks"
            rules={[{ max: 1000, message: 'Remarks cannot exceed 1000 characters' }]}
          >
            <TextArea rows={3} placeholder="Enter additional remarks (optional)" maxLength={1000} showCount />
          </Form.Item>
        </>
      );
    }

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FeatherIcon
              icon={modalType === 'confirm' ? 'check-circle' : modalType === 'cancel' ? 'x-circle' : 'gift'}
              size={20}
            />
            {title}
          </div>
        }
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        {selectedArrear && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <strong>Transaction ID:</strong> {selectedArrear.transactionId}
              </Col>
              <Col span={12}>
                <strong>Amount:</strong> ₹{Number(selectedArrear.amount || 0).toFixed(2)}
              </Col>
              <Col span={12}>
                <strong>Type:</strong> {ArrearsTypeLabels[selectedArrear.arrearsType]}
              </Col>
              <Col span={12}>
                <strong>Status:</strong>{' '}
                <PlainLabel color={ArrearsStatusColors[selectedArrear.status]}>
                  {ArrearsStatus[selectedArrear.status]}
                </PlainLabel>
              </Col>
            </Row>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          {fields}
          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading} danger={modalType === 'cancel'}>
                {modalType === 'confirm' ? 'Confirm' : modalType === 'cancel' ? 'Cancel Arrear' : 'Waive Off'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // Render create arrear modal with dynamic form fields
  const renderCreateArrearModal = () => {
    if (selectedArrearType === null || selectedArrearType === undefined) return null;

    const formFields = getArrearFormFields(selectedArrearType);
    const arrearTypeName = getArrearTypeName(selectedArrearType);

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FeatherIcon icon="plus-circle" size={20} />
            Create {arrearTypeName}
          </div>
        }
        open={createArrearModalVisible}
        onCancel={closeCreateArrearModal}
        footer={null}
        width={700}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateArrear}>
          <Row gutter={16}>
            {/* Dynamic fields based on arrear type */}
            {formFields.map((field) => {
              const colSpan = field.type === 'textarea' ? 24 : 12;
              const rules = [];

              if (field.required) {
                rules.push({ required: true, message: `Please enter ${field.label.toLowerCase()}` });
              }

              if (field.min !== undefined) {
                rules.push({ type: 'number', min: field.min, message: `Minimum value is ${field.min}` });
              }

              if (field.maxLength) {
                rules.push({ max: field.maxLength, message: `Maximum ${field.maxLength} characters` });
              }

              if (field.minLength) {
                rules.push({ min: field.minLength, message: `Minimum ${field.minLength} characters` });
              }

              return (
                <Col span={colSpan} key={field.name}>
                  <Form.Item label={field.label} name={field.name} rules={rules}>
                    {field.type === 'number' ? (
                      <Input type="number" step="0.01" placeholder={`Enter ${field.label.toLowerCase()}`} />
                    ) : field.type === 'textarea' ? (
                      <TextArea rows={3} placeholder={`Enter ${field.label.toLowerCase()}`} />
                    ) : field.type === 'date' ? (
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    ) : field.type === 'datetime' ? (
                      <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm:ss" />
                    ) : (
                      <Input placeholder={`Enter ${field.label.toLowerCase()}`} />
                    )}
                  </Form.Item>
                </Col>
              );
            })}
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={closeCreateArrearModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                Create Arrear
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // Render update status modal
  const renderUpdateStatusModal = () => {
    if (!updateStatusModalVisible || !selectedArrear) return null;

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FeatherIcon icon="edit-2" size={20} />
            Update Status
          </div>
        }
        open={updateStatusModalVisible}
        onCancel={closeUpdateStatusModal}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <strong>Transaction ID:</strong> {selectedArrear.transactionId}
            </Col>
            <Col span={12}>
              <strong>Amount:</strong> ₹{Number(selectedArrear.amount || 0).toFixed(2)}
            </Col>
            <Col span={12}>
              <strong>Type:</strong> {ArrearsTypeLabels[selectedArrear.arrearsType]}
            </Col>
            <Col span={12}>
              <strong>Current Status:</strong>{' '}
              <PlainLabel color={ArrearsStatusColors[selectedArrear.status]}>
                {ArrearsStatus[selectedArrear.status]}
              </PlainLabel>
            </Col>
          </Row>
        </div>

        <Form form={updateStatusForm} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item label="New Status" name="status" rules={[{ required: true, message: 'Please select a status' }]}>
            <Select style={{ width: '100%' }} placeholder="Select new status">
              {Object.keys(ArrearsStatus).map((key) => (
                <Option key={key} value={Number(key)}>
                  <PlainLabel color={ArrearsStatusColors[key]} style={{ marginRight: '8px' }}>
                    {ArrearsStatus[key]}
                  </PlainLabel>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Remarks" name="remarks" rules={[{ required: true, message: 'Please enter remarks' }]}>
            <TextArea
              rows={4}
              placeholder="Enter remarks about this status update (e.g., Manually confirmed by admin)"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={closeUpdateStatusModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                Update Status
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  if (!customerId) {
    return (
      <Main>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FeatherIcon icon="alert-triangle" size={48} style={{ color: '#ff4d4f' }} />
            <h3>Customer ID not found</h3>
            <Button type="primary" onClick={() => navigate('/admin/customer/list')}>
              Back to Customers
            </Button>
          </div>
        </Card>
      </Main>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Customer Arrears"
          subTitle={
            customerDetails || summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>
                  {customerDetails
                    ? `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim()
                    : summary?.customerName || `Customer #${customerId}`}
                </span>
                {customerDetails?.phoneNumber && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    <FeatherIcon icon="phone" size={12} style={{ marginRight: '4px' }} />
                    {customerDetails.phoneNumber}
                  </span>
                )}
              </div>
            ) : (
              `Loading customer information...`
            )
          }
          buttons={[
            <Button key="payments" type="default" onClick={() => navigate(`/admin/customer/${customerId}/payments`)}>
              <FeatherIcon icon="credit-card" size={14} style={{ marginRight: '8px' }} />
              Payments
            </Button>,
            <Button key="wallet" type="default" onClick={() => navigate(`/admin/customer/${customerId}/wallet`)}>
              <FeatherIcon icon="dollar-sign" size={14} style={{ marginRight: '8px' }} />
              Wallet
            </Button>,
            <Button key="back" type="default" onClick={() => navigate('/admin/customer/list')}>
              <FeatherIcon icon="arrow-left" size={14} style={{ marginRight: '8px' }} />
              Back to Customers
            </Button>,
            <Dropdown
              key="create"
              menu={{
                items: [0, 3, 6].map((key) => ({
                  key: key,
                  label: ArrearsTypeLabels[key],
                  icon: <FeatherIcon icon="file-plus" size={14} />,
                  onClick: () => openCreateArrearModal(key),
                })),
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="primary">
                <FeatherIcon icon="plus" size={14} style={{ marginRight: '8px' }} />
                Create Arrear
                <FeatherIcon icon="chevron-down" size={14} style={{ marginLeft: '8px' }} />
              </Button>
            </Dropdown>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={[25, 25]}>
          {/* Customer Info Card */}
          {(customerDetails || summary) && (
            <Col xs={24}>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                }}
              >
                <Row gutter={16} align="middle">
                  <Col>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FeatherIcon icon="user" size={24} />
                    </div>
                  </Col>
                  <Col flex="auto">
                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>
                      {customerDetails
                        ? `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim()
                        : summary?.customerName || 'Unknown Customer'}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px' }}>
                      <span>
                        <FeatherIcon icon="hash" size={12} style={{ marginRight: '4px' }} />
                        ID: {customerId}
                      </span>
                      {customerDetails?.phoneNumber && (
                        <span>
                          <FeatherIcon icon="phone" size={12} style={{ marginRight: '4px' }} />
                          {customerDetails.phoneNumber}
                        </span>
                      )}
                      {customerDetails?.email && (
                        <span>
                          <FeatherIcon icon="mail" size={12} style={{ marginRight: '4px' }} />
                          {customerDetails.email}
                        </span>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          )}

          {/* Summary Card */}
          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FeatherIcon icon="pie-chart" size={20} />
                  Arrears Summary
                </div>
              }
            >
              {summary ? (
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic title="Total Arrears" value={summary.totalArrearsCount || 0} />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic title="Total Amount" value={summary.totalArrearsAmount || 0} precision={2} prefix="₹" />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic
                      title="Remaining Balance"
                      value={summary.totalRemainingBalance || 0}
                      precision={2}
                      prefix="₹"
                      valueStyle={{ color: summary.totalRemainingBalance > 0 ? '#cf1322' : '#3f8600' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic title="Pending" value={summary.pendingCount || 0} valueStyle={{ color: '#faad14' }} />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic
                      title="Confirmed"
                      value={summary.confirmedCount || 0}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic title="Paid" value={summary.paidCount || 0} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic
                      title="Partially Paid"
                      value={summary.partiallyPaidCount || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} lg={6}>
                    <Statistic title="Waived" value={summary.waivedCount || 0} valueStyle={{ color: '#722ed1' }} />
                  </Col>
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                </div>
              )}
            </Cards>
          </Col>

          {/* Arrears List Card */}
          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FeatherIcon icon="list" size={20} />
                  Arrears List
                </div>
              }
            >
              {/* Filters */}
              <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col xs={24} sm={12} md={8}>
                  <Select
                    placeholder="Filter by Status"
                    style={{ width: '100%' }}
                    allowClear
                    value={statusFilter}
                    onChange={(value) => setState((prev) => ({ ...prev, statusFilter: value }))}
                  >
                    {Object.keys(ArrearsStatus).map((key) => (
                      <Option key={key} value={Number(key)}>
                        {ArrearsStatus[key]}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Select
                    placeholder="Filter by Arrear Type"
                    style={{ width: '100%' }}
                    allowClear
                    value={arrearsTypeFilter}
                    onChange={(value) => setState((prev) => ({ ...prev, arrearsTypeFilter: value }))}
                  >
                    {Object.keys(ArrearsType).map((key) => (
                      <Option key={key} value={Number(key)}>
                        {ArrearsTypeLabels[key]}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Search
                    placeholder="Search by transaction ID..."
                    allowClear
                    onSearch={(value) => setState((prev) => ({ ...prev, searchTerm: value }))}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {/* Table */}
              <Table
                className="table-responsive"
                dataSource={arrears}
                columns={columns}
                rowKey="transactionId"
                loading={loading}
                pagination={false}
                scroll={{ x: 1200 }}
              />

              {/* Pagination */}
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
            </Cards>
          </Col>
        </Row>
      </Main>

      {renderModal()}
      {renderCreateArrearModal()}
      {renderUpdateStatusModal()}
    </>
  );
}

export default CustomerArrearsScreen;
