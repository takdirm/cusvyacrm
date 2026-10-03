import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Spin, Modal, List, Pagination, Popconfirm, message, Empty, Input } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { getItem } from '../../../utility/localStorageControl';
import { API } from '../../../config/api/index';

function RentalPlans() {
  const { modelId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vehicleModel, setVehicleModel] = useState(null);
  const [assignedPlans, setAssignedPlans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Plan modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [allPlans, setAllPlans] = useState([]);
  const [allPlansLoading, setAllPlansLoading] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addingPlanId, setAddingPlanId] = useState(null);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${getItem('access_token')}` } });

  const fetchVehicleModel = useCallback(async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/api${API.vehicleModel.path}/${modelId}`, getHeaders());
      setVehicleModel(res.data);
    } catch {
      /* non-critical */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const fetchAssignedPlans = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${getApiUrl()}/api/Vehicle/models/${modelId}/rental-plans/paged?page=${page}&pageSize=${pageSize}`,
          getHeaders(),
        );
        const data = res.data;
        setAssignedPlans(data.items ?? (Array.isArray(data) ? data : []));
        setTotalCount(data.totalCount ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        message.error('Failed to load rental plans');
        setAssignedPlans([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelId],
  );

  useEffect(() => {
    if (modelId) {
      fetchVehicleModel();
      fetchAssignedPlans(1);
    }
  }, [modelId, fetchVehicleModel, fetchAssignedPlans]);

  const openAddModal = async () => {
    setAddModalVisible(true);
    setAllPlansLoading(true);
    setAddSearchTerm('');
    try {
      const res = await axios.get(`${getApiUrl()}/api${API.rentalPlan.path}`, getHeaders());
      const data = res.data;
      setAllPlans(data.items ?? (Array.isArray(data) ? data : []));
    } catch {
      message.error('Failed to load available plans');
      setAllPlans([]);
    } finally {
      setAllPlansLoading(false);
    }
  };

  const handleAddPlan = async (rentalPlanId) => {
    setAddingPlanId(rentalPlanId);
    try {
      await axios.post(`${getApiUrl()}/api/Vehicle/models/${modelId}/rental-plans`, { rentalPlanId }, getHeaders());
      message.success('Plan added successfully');
      setAddModalVisible(false);
      fetchAssignedPlans(currentPage);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to add plan');
    } finally {
      setAddingPlanId(null);
    }
  };

  const handleRemovePlan = async (planId) => {
    try {
      await axios.delete(`${getApiUrl()}/api/Vehicle/models/${modelId}/rental-plans/${planId}`, getHeaders());
      message.success('Plan removed');
      fetchAssignedPlans(currentPage);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to remove plan');
    }
  };

  const filteredAllPlans = allPlans.filter(
    (p) =>
      !addSearchTerm.trim() ||
      p.name?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
      p.badge?.toLowerCase().includes(addSearchTerm.toLowerCase()),
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 65, fixed: 'left' },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', width: 110, render: (v) => v || '-' },
    {
      title: 'Days',
      dataIndex: 'durationInDays',
      key: 'durationInDays',
      width: 80,
      align: 'center',
      render: (v) => v ?? '-',
    },
    {
      title: 'Badge',
      dataIndex: 'badge',
      key: 'badge',
      width: 100,
      render: (v) => (v ? <PlainLabel color="geekblue">{v}</PlainLabel> : '-'),
    },
    {
      title: 'Preferred',
      dataIndex: 'isPreferred',
      key: 'isPreferred',
      width: 90,
      align: 'center',
      render: (v) => (v ? <PlainLabel color="gold">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>),
    },
    {
      title: 'Discount %',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      width: 100,
      align: 'center',
      render: (v) => (v ? `${v}%` : '-'),
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
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <Popconfirm
          title="Remove this plan from the vehicle model?"
          onConfirm={() => handleRemovePlan(record.id)}
          okText="Remove"
          cancelText="Cancel"
          okType="danger"
        >
          <Button
            size="small"
            type="danger"
            outlined
            style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FeatherIcon icon="x" size={13} />
            Remove
          </Button>
        </Popconfirm>
      ),
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
              onClick={() => navigate('/admin/vehicle/models')}
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
            Rental Plans
            {vehicleModel && (
              <span style={{ fontWeight: 400, fontSize: 14, color: '#888' }}>— {vehicleModel.name}</span>
            )}
          </span>
        }
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={openAddModal}>
              <FeatherIcon icon="plus" size={14} style={{ marginRight: 4 }} />
              Add Plan
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
                    dataSource={assignedPlans}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 900 }}
                    size="middle"
                    locale={{ emptyText: <Empty description="No rental plans assigned yet" /> }}
                  />
                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      onChange={(page) => {
                        setCurrentPage(page);
                        fetchAssignedPlans(page);
                      }}
                      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                    />
                  </div>
                </>
              )}
            </Cards>
          </Col>
        </Row>

        <Modal
          title="Select a Rental Plan to Add"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
          width={560}
        >
          <Input
            placeholder="Search by name or badge..."
            value={addSearchTerm}
            onChange={(e) => setAddSearchTerm(e.target.value)}
            prefix={<FeatherIcon icon="search" size={14} color="#bbb" />}
            style={{ marginBottom: 12 }}
            allowClear
          />
          {allPlansLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <List
              size="small"
              dataSource={filteredAllPlans}
              locale={{ emptyText: 'No plans available' }}
              renderItem={(plan) => (
                <List.Item
                  actions={[
                    <Button
                      key="add"
                      type="primary"
                      size="small"
                      loading={addingPlanId === plan.id}
                      onClick={() => handleAddPlan(plan.id)}
                    >
                      Add
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {plan.name}
                        {plan.badge && (
                          <PlainLabel color="geekblue" style={{ marginLeft: 8 }}>
                            {plan.badge}
                          </PlainLabel>
                        )}
                        {plan.isPreferred && (
                          <PlainLabel color="gold" style={{ marginLeft: 4 }}>
                            Preferred
                          </PlainLabel>
                        )}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {plan.duration || `${plan.durationInDays ?? 0} days`}
                        {plan.discountPercentage ? ` · ${plan.discountPercentage}% discount` : ''}
                        {plan.colorCode && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: plan.colorCode,
                              marginLeft: 6,
                              verticalAlign: 'middle',
                            }}
                          />
                        )}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>
      </Main>
    </>
  );
}

export default RentalPlans;
