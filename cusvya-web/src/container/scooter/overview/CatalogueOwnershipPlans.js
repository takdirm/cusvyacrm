import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Table, Spin, Modal, List, Popconfirm, message, Empty, Input } from 'antd';
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

function CatalogueOwnershipPlans() {
  const { catalogueId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [catalogue, setCatalogue] = useState(null);
  const [assignedPlans, setAssignedPlans] = useState([]);

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

  const getHeaders = () => {
    const token = getItem('access_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchCatalogue = useCallback(async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api${API.catalogue.path}/${catalogueId}`, getHeaders());
      setCatalogue(response.data);
    } catch {
      setCatalogue(null);
    }
  }, [catalogueId]);

  const fetchAssignedPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/ownership-plans`,
        getHeaders(),
      );
      const data = response.data;
      setAssignedPlans(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load ownership plans');
      setAssignedPlans([]);
    } finally {
      setLoading(false);
    }
  }, [catalogueId]);

  useEffect(() => {
    if (!catalogueId) return;
    fetchCatalogue();
    fetchAssignedPlans();
  }, [catalogueId, fetchCatalogue, fetchAssignedPlans]);

  const assignedPlanIds = useMemo(() => new Set(assignedPlans.map((plan) => plan.id)), [assignedPlans]);

  const openAddModal = async () => {
    setAddModalVisible(true);
    setAllPlansLoading(true);
    setAddSearchTerm('');
    try {
      const response = await axios.get(`${getApiUrl()}/api${API.ownershipPlan.path}`, getHeaders());
      const data = response.data;
      setAllPlans(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load available plans');
      setAllPlans([]);
    } finally {
      setAllPlansLoading(false);
    }
  };

  const handleAddPlan = async (ownershipPlanId) => {
    setAddingPlanId(ownershipPlanId);
    try {
      await axios.post(
        `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/ownership-plans?ownershipPlanId=${ownershipPlanId}`,
        null,
        getHeaders(),
      );
      message.success('Plan assigned successfully');
      setAddModalVisible(false);
      fetchAssignedPlans();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign plan');
    } finally {
      setAddingPlanId(null);
    }
  };

  const handleRemovePlan = async (ownershipPlanId) => {
    try {
      await axios.delete(
        `${getApiUrl()}/api${API.catalogue.path}/${catalogueId}/ownership-plans/${ownershipPlanId}`,
        getHeaders(),
      );
      message.success('Plan removed successfully');
      fetchAssignedPlans();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to remove plan');
    }
  };

  const filteredAllPlans = allPlans.filter((plan) => {
    if (assignedPlanIds.has(plan.id)) return false;
    if (!addSearchTerm.trim()) return true;
    const term = addSearchTerm.toLowerCase();
    return (
      plan.tenure?.toLowerCase().includes(term) ||
      String(plan.tenureInMonths || '').includes(term) ||
      String(plan.tenureInWeeks || '').includes(term) ||
      plan.frequency?.toLowerCase().includes(term) ||
      plan.badge?.toLowerCase().includes(term)
    );
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70, fixed: 'left' },
    { title: 'Tenure', dataIndex: 'tenure', key: 'tenure', width: 180, render: (value) => value || '-' },
    {
      title: 'Tenure (Months)',
      dataIndex: 'tenureInMonths',
      key: 'tenureInMonths',
      width: 130,
      align: 'center',
      render: (value) => value ?? '-',
    },
    {
      title: 'Tenure (Weeks)',
      dataIndex: 'tenureInWeeks',
      key: 'tenureInWeeks',
      width: 130,
      align: 'center',
      render: (value) => value ?? '-',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (value) => (value ? <PlainLabel color="purple">{value}</PlainLabel> : '-'),
    },
    {
      title: 'Badge',
      dataIndex: 'badge',
      key: 'badge',
      width: 110,
      render: (value) => (value ? <PlainLabel color="geekblue">{value}</PlainLabel> : '-'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (value) =>
        value ? <PlainLabel color="success">Active</PlainLabel> : <PlainLabel color="red">Inactive</PlainLabel>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <Popconfirm
          title="Remove this ownership plan from the catalogue?"
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
              onClick={() => navigate('/admin/scooter/catalogues')}
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
            Manage Plans
            {catalogue && (
              <span style={{ fontWeight: 400, fontSize: 14, color: '#888' }}>
                — {catalogue.brand || ''} {catalogue.model || ''}
              </span>
            )}
          </span>
        }
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={openAddModal}>
              <FeatherIcon icon="plus" size={14} style={{ marginRight: 4 }} />
              Assign Plan
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
                <Table
                  columns={columns}
                  dataSource={assignedPlans}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 980 }}
                  size="middle"
                  locale={{ emptyText: <Empty description="No ownership plans assigned yet" /> }}
                />
              )}
            </Cards>
          </Col>
        </Row>

        <Modal
          title="Assign Ownership Plan"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
          width={600}
        >
          <Input
            placeholder="Search by tenure, months, weeks, frequency or badge..."
            value={addSearchTerm}
            onChange={(event) => setAddSearchTerm(event.target.value)}
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
                      Assign
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {plan.tenure || `Plan #${plan.id}`}
                        {plan.badge && (
                          <PlainLabel color="geekblue" style={{ marginLeft: 8 }}>
                            {plan.badge}
                          </PlainLabel>
                        )}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {plan.tenureInMonths != null ? `${plan.tenureInMonths} months` : '-'}
                        {plan.tenureInWeeks != null ? ` · ${plan.tenureInWeeks} weeks` : ''}
                        {plan.frequency ? ` · ${plan.frequency}` : ''}
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

export default CatalogueOwnershipPlans;
