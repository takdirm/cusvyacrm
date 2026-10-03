import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Table, Spin, Popconfirm, Pagination, Empty, message } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import PropTypes from 'prop-types';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import CreateRentalPlanDetail from './CreateRentalPlanDetail';
import UpdateRentalPlanDetail from './UpdateRentalPlanDetail';
import { Button } from '../../../components/buttons/buttons';
import { getItem } from '../../../utility/localStorageControl';

function RentalPlanDetails({ visible, onClose, plan }) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [createVisible, setCreateVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${getItem('access_token')}` } });

  const fetchDetails = useCallback(
    async (page = 1) => {
      if (!plan?.id) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${getApiUrl()}/api/Plan/rental/${plan.id}/details/paged?page=${page}&pageSize=${pageSize}`,
          getHeaders(),
        );
        const data = res.data;
        setDetails(data.items ?? (Array.isArray(data) ? data : []));
        setTotalCount(data.totalCount ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        message.error('Failed to load plan details');
        setDetails([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan?.id],
  );

  useEffect(() => {
    if (visible && plan?.id) {
      setCurrentPage(1);
      fetchDetails(1);
    }
  }, [visible, plan?.id, fetchDetails]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${getApiUrl()}/api/Plan/rental/details/${id}`, getHeaders());
      message.success('Detail deleted');
      fetchDetails(currentPage);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete detail');
    }
  };

  const handleCreateClose = (refresh) => {
    setCreateVisible(false);
    if (refresh) fetchDetails(currentPage);
  };

  const handleUpdateClose = (refresh) => {
    setUpdateVisible(false);
    setSelectedDetail(null);
    if (refresh) fetchDetails(currentPage);
  };

  const boolTag = (v) =>
    v ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: 'KM Limit',
      dataIndex: 'kmLimit',
      key: 'kmLimit',
      width: 140,
      render: (v) => <strong>{v || '-'}</strong>,
    },
    {
      title: 'KM Value',
      dataIndex: 'kmValue',
      key: 'kmValue',
      width: 90,
      align: 'center',
    },
    {
      title: 'Price Multiplier',
      dataIndex: 'priceMultiplier',
      key: 'priceMultiplier',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(2) : '-'),
    },
    {
      title: 'Extra KM Charge',
      dataIndex: 'extraKmCharge',
      key: 'extraKmCharge',
      width: 130,
      align: 'right',
      render: (v) => (v != null ? `₹${Number(v).toFixed(2)}` : '-'),
    },
    {
      title: 'Unlimited',
      dataIndex: 'isUnlimited',
      key: 'isUnlimited',
      width: 90,
      align: 'center',
      render: boolTag,
    },
    {
      title: 'Popular',
      dataIndex: 'isPopular',
      key: 'isPopular',
      width: 85,
      align: 'center',
      render: (v) => (v ? <PlainLabel color="gold">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center',
      render: (v) =>
        v ? <PlainLabel color="success">Active</PlainLabel> : <PlainLabel color="red">Inactive</PlainLabel>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            type="primary"
            outlined
            onClick={() => {
              setSelectedDetail(record);
              setUpdateVisible(true);
            }}
            style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FeatherIcon icon="edit" size={12} />
            Edit
          </Button>
          <Popconfirm
            title="Delete this detail?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button
              size="small"
              type="danger"
              outlined
              style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FeatherIcon icon="trash-2" size={12} />
              Del
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <FeatherIcon icon="list" size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Plan Details
              {plan?.name && (
                <span style={{ fontWeight: 400, fontSize: 13, color: '#888', marginLeft: 8 }}>— {plan.name}</span>
              )}
            </span>
            <Button
              size="small"
              type="primary"
              onClick={() => setCreateVisible(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FeatherIcon icon="plus" size={13} />
              Add Detail
            </Button>
          </div>
        }
        open={visible}
        onClose={onClose}
        width={860}
        bodyStyle={{ padding: '16px 24px' }}
        closable
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={details}
              rowKey="id"
              pagination={false}
              scroll={{ x: 900 }}
              size="small"
              locale={{ emptyText: <Empty description="No details found for this plan" /> }}
            />
            {totalCount > pageSize && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page) => {
                    setCurrentPage(page);
                    fetchDetails(page);
                  }}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                />
              </div>
            )}
          </>
        )}
      </Drawer>

      {createVisible && (
        <CreateRentalPlanDetail visible={createVisible} onCancel={handleCreateClose} rentalPlanId={plan?.id} />
      )}

      {updateVisible && selectedDetail && (
        <UpdateRentalPlanDetail visible={updateVisible} onCancel={handleUpdateClose} detailData={selectedDetail} />
      )}
    </>
  );
}

RentalPlanDetails.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  plan: PropTypes.object,
};

export default RentalPlanDetails;
