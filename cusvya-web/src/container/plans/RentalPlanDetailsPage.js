import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Spin, Popconfirm, Pagination, Empty, message, Dropdown, Modal as AntModal } from 'antd';
import PlainLabel from '../../components/labels/plain-label';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { getItem } from '../../utility/localStorageControl';
import CreateRentalPlanDetail from './overview/CreateRentalPlanDetail';
import UpdateRentalPlanDetail from './overview/UpdateRentalPlanDetail';

function RentalPlanDetailsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchPlan = useCallback(async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/api/Plan/rental/${planId}`, getHeaders());
      setPlan(res.data);
    } catch {
      // non-critical
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const fetchDetails = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${getApiUrl()}/api/Plan/rental/${planId}/details/paged?page=${page}&pageSize=${pageSize}`,
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
    [planId],
  );

  useEffect(() => {
    if (planId) {
      fetchPlan();
      fetchDetails(1);
    }
  }, [planId, fetchPlan, fetchDetails]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${getApiUrl()}/api/Plan/rental/details/${id}`, getHeaders());
      message.success('Detail deleted');
      fetchDetails(currentPage);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete detail');
    }
  };

  const boolTag = (v) =>
    v ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 65, fixed: 'left' },
    {
      title: 'KM Limit',
      dataIndex: 'kmLimit',
      key: 'kmLimit',
      width: 150,
      render: (v) => <strong>{v || '-'}</strong>,
    },
    {
      title: 'KM Value',
      dataIndex: 'kmValue',
      key: 'kmValue',
      width: 100,
      align: 'center',
    },
    {
      title: 'Price Multiplier',
      dataIndex: 'priceMultiplier',
      key: 'priceMultiplier',
      width: 130,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(2) : '-'),
    },
    {
      title: 'Extra KM Charge',
      dataIndex: 'extraKmCharge',
      key: 'extraKmCharge',
      width: 140,
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
      width: 90,
      align: 'center',
      render: (v) => (v ? <PlainLabel color="gold">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 85,
      align: 'center',
      render: (v) =>
        v ? <PlainLabel color="success">Active</PlainLabel> : <PlainLabel color="red">Inactive</PlainLabel>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FeatherIcon icon="edit" size={14} />
                Edit
              </span>
            ),
            onClick: () => {
              setSelectedDetail(record);
              setUpdateVisible(true);
            },
          },
          {
            key: 'delete',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <FeatherIcon icon="trash-2" size={14} />
                Delete
              </span>
            ),
            onClick: () =>
              AntModal.confirm({
                title: 'Delete Detail',
                content: `Delete detail "${record.kmLimit}"?`,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => handleDelete(record.id),
              }),
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              type="white"
              outlined
              style={{ padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Actions
              <FeatherIcon icon="chevron-down" size={13} />
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/admin/plans/rental')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: '#1890ff',
              }}
            >
              <FeatherIcon icon="arrow-left" size={18} />
            </button>
            Plan Details
            {plan?.name && <span style={{ fontWeight: 400, fontSize: 14, color: '#888' }}>— {plan.name}</span>}
          </span>
        }
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={() => setCreateVisible(true)}>
              <FeatherIcon icon="plus" size={14} style={{ marginRight: 4 }} />
              Add Detail
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
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
                    size="middle"
                    locale={{ emptyText: <Empty description="No details found for this plan" /> }}
                  />
                  <div style={{ marginTop: 20, textAlign: 'right' }}>
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
                </>
              )}
            </Cards>
          </Col>
        </Row>
      </Main>

      {createVisible && (
        <CreateRentalPlanDetail
          visible={createVisible}
          onCancel={(refresh) => {
            setCreateVisible(false);
            if (refresh) fetchDetails(currentPage);
          }}
          rentalPlanId={Number(planId)}
        />
      )}

      {updateVisible && selectedDetail && (
        <UpdateRentalPlanDetail
          visible={updateVisible}
          detailData={selectedDetail}
          onCancel={(refresh) => {
            setUpdateVisible(false);
            setSelectedDetail(null);
            if (refresh) fetchDetails(currentPage);
          }}
        />
      )}
    </>
  );
}

export default RentalPlanDetailsPage;
