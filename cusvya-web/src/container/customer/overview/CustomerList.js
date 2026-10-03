import React, { useCallback, useState } from 'react';
import { Table, Pagination, Dropdown, Modal, Descriptions, Spin, message } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { DataService } from '../../../config/dataService/dataService';

const BILLING_LABELS = { 0: 'Prepaid', 1: 'Postpaid' };

const boolTag = (val) =>
  val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

const dlStatusLabel = (status) => {
  if (status === 2) return <PlainLabel color="success">Approved</PlainLabel>;
  if (status === 1) return <PlainLabel color="warning">Pending Approval</PlainLabel>;
  if (status === 3) return <PlainLabel color="red">Rejected</PlainLabel>;
  return <PlainLabel color="default">Not Initiated</PlainLabel>;
};

function CustomerList({
  customers,
  loading,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onDelete,
  getData,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycRecord, setKycRecord] = useState(null);
  const [kycFrontDocument, setKycFrontDocument] = useState(null);
  const [kycBackDocument, setKycBackDocument] = useState(null);
  const [dlModalVisible, setDlModalVisible] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlSubmitting, setDlSubmitting] = useState(false);
  const [dlRecord, setDlRecord] = useState(null);
  const [dlFrontDocument, setDlFrontDocument] = useState(null);
  const [dlBackDocument, setDlBackDocument] = useState(null);
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [dlRejectReason, setDlRejectReason] = useState('');

  const maskAadhar = (value) => {
    const cleaned = String(value || '').replace(/\s/g, '');
    if (cleaned.length !== 12) return value || '-';
    return `XXXX XXXX ${cleaned.slice(-4)}`;
  };

  const kycStatusLabel = (status) => {
    if (status === 2) return <PlainLabel color="success">Approved</PlainLabel>;
    if (status === 1) return <PlainLabel color="warning">Pending Approval</PlainLabel>;
    if (status === 3) return <PlainLabel color="red">Rejected</PlainLabel>;
    return <PlainLabel color="default">Not Initiated</PlainLabel>;
  };

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const buildDocumentUrl = (filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `${getApiUrl()}/${String(filePath).replace(/^\/+/, '')}`;
  };

  const loadDocument = useCallback(async (documentId) => {
    if (!documentId) return null;
    try {
      const documentResponse = await DataService.get(`${API.document.path}/${documentId}`);
      return documentResponse?.data || null;
    } catch (error) {
      return null;
    }
  }, []);

  const openKycModal = useCallback(
    async (record) => {
      setKycModalVisible(true);
      setActiveCustomerId(record.id);
      setKycLoading(true);
      setKycRecord(null);
      setKycFrontDocument(null);
      setKycBackDocument(null);

      try {
        const response = await DataService.get(`${API.customer.path}/${record.id}/kyc`);
        const data = response?.data || null;
        setKycRecord(data);

        const [frontDoc, backDoc] = await Promise.all([
          loadDocument(data?.aadharFrontDocumentId || data?.documentId),
          loadDocument(data?.aadharBackDocumentId),
        ]);

        setKycFrontDocument(frontDoc);
        setKycBackDocument(backDoc);
      } catch (error) {
        message.error(error?.response?.data?.message || error?.message || 'Failed to load KYC details');
      } finally {
        setKycLoading(false);
      }
    },
    [loadDocument],
  );

  const openDlModal = useCallback(
    async (record) => {
      setDlModalVisible(true);
      setActiveCustomerId(record.id);
      setDlLoading(true);
      setDlRecord(null);
      setDlFrontDocument(null);
      setDlBackDocument(null);

      try {
        const response = await DataService.get(`${API.customer.path}/${record.id}/dl`);
        const data = response?.data || null;
        setDlRecord(data);

        const [frontDoc, backDoc] = await Promise.all([
          loadDocument(data?.drivingLicenceFrontDocumentId),
          loadDocument(data?.drivingLicenceBackDocumentId),
        ]);

        setDlFrontDocument(frontDoc);
        setDlBackDocument(backDoc);
      } catch (error) {
        message.error(error?.response?.data?.message || error?.message || 'Failed to load Driving Licence details');
      } finally {
        setDlLoading(false);
      }
    },
    [loadDocument],
  );

  const closeKycModal = () => {
    if (kycLoading || kycSubmitting) return;
    setKycModalVisible(false);
    setKycRecord(null);
    setKycFrontDocument(null);
    setKycBackDocument(null);
    setKycRejectReason('');
  };

  const closeDlModal = () => {
    if (dlLoading || dlSubmitting) return;
    setDlModalVisible(false);
    setDlRecord(null);
    setDlFrontDocument(null);
    setDlBackDocument(null);
    setDlRejectReason('');
  };

  const approveKyc = useCallback(async () => {
    if (!activeCustomerId) return;
    try {
      setKycSubmitting(true);
      await DataService.patch(`${API.customer.path}/${activeCustomerId}/kyc/approve`, { approve: true });
      message.success('KYC approved successfully');
      closeKycModal();
      getData(currentPage, pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to approve KYC');
    } finally {
      setKycSubmitting(false);
    }
  }, [activeCustomerId, getData, currentPage, pageSize]);

  const approveDl = useCallback(async () => {
    if (!activeCustomerId) return;
    try {
      setDlSubmitting(true);
      await DataService.patch(`${API.customer.path}/${activeCustomerId}/dl/approve`, { approve: true });
      message.success('Driving Licence approved successfully');
      closeDlModal();
      getData(currentPage, pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to approve Driving Licence');
    } finally {
      setDlSubmitting(false);
    }
  }, [activeCustomerId, getData, currentPage, pageSize]);

  const rejectKyc = useCallback(async () => {
    if (!activeCustomerId) return;
    const reason = kycRejectReason.trim();
    if (!reason) {
      message.warning('Rejection reason is required');
      return;
    }

    try {
      setKycSubmitting(true);
      await DataService.patch(`${API.customer.path}/${activeCustomerId}/kyc/reject`, { reason });
      message.success('KYC rejected successfully');
      closeKycModal();
      getData(currentPage, pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to reject KYC');
    } finally {
      setKycSubmitting(false);
    }
  }, [activeCustomerId, getData, currentPage, pageSize, kycRejectReason]);

  const rejectDl = useCallback(async () => {
    if (!activeCustomerId) return;
    const reason = dlRejectReason.trim();
    if (!reason) {
      message.warning('Rejection reason is required');
      return;
    }

    try {
      setDlSubmitting(true);
      await DataService.patch(`${API.customer.path}/${activeCustomerId}/dl/reject`, { reason });
      message.success('Driving Licence rejected successfully');
      closeDlModal();
      getData(currentPage, pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to reject Driving Licence');
    } finally {
      setDlSubmitting(false);
    }
  }, [activeCustomerId, getData, currentPage, pageSize, dlRejectReason]);

  const renderDocPreview = (document) => {
    const src = buildDocumentUrl(document?.filePath);
    if (!src) return '-';
    return (
      <img src={src} alt={document?.name || 'Document'} style={{ width: '100%', maxWidth: 280, borderRadius: 8 }} />
    );
  };

  const handleDelete = useCallback(
    (id) => {
      dispatch(
        axiosDataDelete({
          path: API.customer.path,
          id,
          getData: () => getData(currentPage, pageSize),
        }),
      );
      onDelete();
    },
    [dispatch, currentPage, pageSize, getData, onDelete],
  );

  const confirmDelete = (record) => {
    Modal.confirm({
      title: 'Delete Customer',
      icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete customer "${record.firstName} ${record.lastName}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDelete(record.id),
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 130,
      render: (v) => v || '-',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 130,
      render: (v) => v || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (v) => v || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (v) => v || '-',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: 'Preferred Language',
      dataIndex: 'preferredLanguageCode',
      key: 'preferredLanguageCode',
      width: 140,
      render: (v, record) => v || record?.PreferredLanguageCode || '-',
    },
    {
      title: 'KYC Status',
      dataIndex: 'customerKycStatus',
      key: 'customerKycStatus',
      width: 130,
      align: 'center',
      render: kycStatusLabel,
    },
    {
      title: 'DL Status',
      dataIndex: 'customerDLStatus',
      key: 'customerDLStatus',
      width: 130,
      align: 'center',
      render: dlStatusLabel,
    },
    {
      title: 'Phone Verified',
      dataIndex: 'isPhoneVerified',
      key: 'isPhoneVerified',
      width: 120,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Billing',
      dataIndex: 'billingType',
      key: 'billingType',
      width: 100,
      render: (v) => BILLING_LABELS[v] ?? '-',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (v) => <PlainLabel color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</PlainLabel>,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '-'),
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
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const actionMenu = {
          items: [
            {
              key: 'edit',
              icon: <FeatherIcon icon="edit" size={14} />,
              label: 'Edit',
              onClick: () => onEdit(record),
            },
            {
              key: 'arrears',
              icon: <FeatherIcon icon="alert-triangle" size={14} />,
              label: 'Arrears',
              onClick: () => navigate(`/admin/customer/${record.id}/arrears`),
            },
            {
              key: 'payments',
              icon: <FeatherIcon icon="credit-card" size={14} />,
              label: 'Payments',
              onClick: () => navigate(`/admin/customer/${record.id}/payments`),
            },
            {
              key: 'wallet',
              icon: <FeatherIcon icon="dollar-sign" size={14} />,
              label: 'Wallet',
              onClick: () => navigate(`/admin/customer/${record.id}/wallet`),
            },
            {
              key: 'kyc',
              icon: <FeatherIcon icon="shield" size={14} />,
              label: 'Approve KYC',
              onClick: () => openKycModal(record),
            },
            {
              key: 'dl',
              icon: <FeatherIcon icon="credit-card" size={14} />,
              label: 'Driving Licence',
              onClick: () => openDlModal(record),
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <FeatherIcon icon="trash-2" size={14} />,
              label: 'Delete',
              danger: true,
              onClick: () => confirmDelete(record),
            },
          ],
        };

        return (
          <Dropdown menu={actionMenu} trigger={['click']} placement="bottomRight">
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

  return (
    <div>
      <Table
        className="table-responsive"
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1600 }}
      />
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>

      <Modal
        open={kycModalVisible}
        onCancel={closeKycModal}
        width={900}
        confirmLoading={kycSubmitting}
        title="Customer KYC"
        destroyOnClose
        footer={[
          <Button key="reject" type="default" danger onClick={rejectKyc} loading={kycSubmitting}>
            Reject KYC
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={approveKyc}
            loading={kycSubmitting}
            disabled={Number(kycRecord?.status ?? 0) === 2}
          >
            {Number(kycRecord?.status ?? 0) === 2 ? 'Approved' : 'Approve KYC'}
          </Button>,
        ]}
      >
        {kycLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : kycRecord ? (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Customer ID">{kycRecord.customerId}</Descriptions.Item>
              <Descriptions.Item label="Aadhar Number">{maskAadhar(kycRecord.aadharNumber)}</Descriptions.Item>
              <Descriptions.Item label="Status">{kycStatusLabel(kycRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="Aadhar Front">{renderDocPreview(kycFrontDocument)}</Descriptions.Item>
              <Descriptions.Item label="Aadhar Back">{renderDocPreview(kycBackDocument)}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {kycRecord.createdAt ? moment(kycRecord.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {kycRecord.updatedAt ? moment(kycRecord.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Rejection Reason</label>
              <textarea
                value={kycRejectReason}
                onChange={(event) => setKycRejectReason(event.target.value)}
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d9d9d9', resize: 'vertical' }}
                placeholder="Enter reason for rejection"
              />
            </div>
          </>
        ) : (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Status">{kycStatusLabel(0)}</Descriptions.Item>
            <Descriptions.Item label="Aadhar Number">-</Descriptions.Item>
            <Descriptions.Item label="Aadhar Front">-</Descriptions.Item>
            <Descriptions.Item label="Aadhar Back">-</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        open={dlModalVisible}
        onCancel={closeDlModal}
        width={900}
        confirmLoading={dlSubmitting}
        title="Customer Driving Licence"
        destroyOnClose
        footer={[
          <Button key="reject" type="default" danger onClick={rejectDl} loading={dlSubmitting}>
            Reject DL
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={approveDl}
            loading={dlSubmitting}
            disabled={Number(dlRecord?.status ?? 0) === 2}
          >
            {Number(dlRecord?.status ?? 0) === 2 ? 'Approved' : 'Approve Driving Licence'}
          </Button>,
        ]}
      >
        {dlLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : dlRecord ? (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Customer ID">{dlRecord.customerId}</Descriptions.Item>
              <Descriptions.Item label="DL Number">{dlRecord.drivingLicenceNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">{kycStatusLabel(dlRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="DL Front">{renderDocPreview(dlFrontDocument)}</Descriptions.Item>
              <Descriptions.Item label="DL Back">{renderDocPreview(dlBackDocument)}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dlRecord.createdAt ? moment(dlRecord.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {dlRecord.updatedAt ? moment(dlRecord.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Rejection Reason</label>
              <textarea
                value={dlRejectReason}
                onChange={(event) => setDlRejectReason(event.target.value)}
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d9d9d9', resize: 'vertical' }}
                placeholder="Enter reason for rejection"
              />
            </div>
          </>
        ) : (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Status">{kycStatusLabel(0)}</Descriptions.Item>
            <Descriptions.Item label="DL Number">-</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

CustomerList.propTypes = {
  customers: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getData: PropTypes.func.isRequired,
};

export default CustomerList;
