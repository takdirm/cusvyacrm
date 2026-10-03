import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Spin, Select, Button as AntButton, Space, Table, Modal, Input, message, Tag } from 'antd';
import axios from 'axios';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { getItem, getSelectedRegion } from '../../utility/localStorageControl';
import { getVehicleCategoryText, getVehicleTypeText } from '../../config/enum/enum';

const { Option } = Select;

function ManageCatalogueVehicles() {
  const [catalogues, setCatalogues] = useState([]);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newCatalogueId, setNewCatalogueId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getHeaders = () => {
    const token = getItem('access_token');
    const selectedRegion = getSelectedRegion();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (selectedRegion?.code) {
      headers['X-Region-Code'] = selectedRegion.code;
    }

    return Object.keys(headers).length > 0 ? { headers } : {};
  };

  const fetchCatalogues = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/Catalogue/paged?page=1&pageSize=1000`, getHeaders());
      const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
      setCatalogues(items);
      if (!selectedCatalogueId && items[0]?.id) {
        setSelectedCatalogueId(String(items[0].id));
      }
    } catch {
      setCatalogues([]);
      setSelectedCatalogueId('');
    }
  };

  const fetchVehicles = async (catalogueId = selectedCatalogueId) => {
    if (!catalogueId) {
      setVehicles([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api/Catalogue/${catalogueId}/vehicles`, getHeaders());
      const data = response.data;
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        setVehicles(Array.isArray(data?.items) ? data.items : []);
      }
    } catch (error) {
      setVehicles([]);
      message.error(error.response?.data?.message || 'Failed to load assigned vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogues();
  }, []);

  useEffect(() => {
    if (selectedCatalogueId) {
      fetchVehicles(selectedCatalogueId);
    }
  }, [selectedCatalogueId]);

  const selectedCatalogue = useMemo(
    () => catalogues.find((catalogue) => String(catalogue.id) === String(selectedCatalogueId)) || null,
    [catalogues, selectedCatalogueId],
  );

  const existingCatalogueId = selectedVehicle?.catalogueId
    ? String(selectedVehicle.catalogueId)
    : String(selectedCatalogueId || '');

  const existingCatalogue = useMemo(
    () => catalogues.find((catalogue) => String(catalogue.id) === String(existingCatalogueId)) || selectedCatalogue,
    [catalogues, existingCatalogueId, selectedCatalogue],
  );

  const openChangeCatalogueModal = (record) => {
    const currentCatalogueId = record?.catalogueId ? String(record.catalogueId) : String(selectedCatalogueId || '');
    setSelectedVehicle(record);
    setNewCatalogueId(currentCatalogueId);
    setChangeModalVisible(true);
  };

  const closeChangeCatalogueModal = () => {
    setChangeModalVisible(false);
    setSelectedVehicle(null);
    setNewCatalogueId('');
  };

  const handleChangeCatalogue = async () => {
    if (!selectedVehicle?.id) {
      message.error('Vehicle not selected');
      return;
    }

    if (!newCatalogueId) {
      message.error('Please select catalogue');
      return;
    }

    if (String(existingCatalogueId) === String(newCatalogueId)) {
      message.warning('Please select a different catalogue');
      return;
    }

    try {
      setSubmitLoading(true);
      await axios.put(
        `${getApiUrl()}/api/Catalogue/${newCatalogueId}/vehicles/${selectedVehicle.id}/assign`,
        {},
        getHeaders(),
      );
      message.success('Catalogue changed successfully');
      closeChangeCatalogueModal();
      fetchVehicles(selectedCatalogueId);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to change catalogue');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 230,
      render: (_, record) => (
        <div style={{ display: 'grid', gap: 6 }}>
          <strong>{record.name || '-'}</strong>
          <span style={{ color: '#666' }}>UID: {record.uid || '-'}</span>
          <span style={{ color: '#666' }}>Reg: {record.registerationNumber || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Model',
      key: 'model',
      width: 180,
      render: (_, record) => <span>{record.vehicleModel?.name || '-'}</span>,
    },
    {
      title: 'Category',
      key: 'category',
      width: 150,
      render: (_, record) => getVehicleCategoryText(record.vehicleCategory),
    },
    {
      title: 'Type',
      key: 'type',
      width: 180,
      render: (_, record) => getVehicleTypeText(record.vehicleType),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>{record.isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space>
          <AntButton type="primary" size="small" onClick={() => openChangeCatalogueModal(record)}>
            Change Catalogue
          </AntButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader ghost title="Manage Vehicles" />
      <Main>
        <Cards headless style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={10}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Catalogue</label>
              <Select
                showSearch
                optionFilterProp="children"
                value={selectedCatalogueId || undefined}
                onChange={(value) => setSelectedCatalogueId(value || '')}
                placeholder="Select catalogue"
                style={{ width: '100%' }}
              >
                {catalogues.map((catalogue) => (
                  <Option key={catalogue.id} value={String(catalogue.id)}>
                    {catalogue.summary ||
                      `${catalogue.brand || ''} ${catalogue.model || ''}` ||
                      `Catalogue #${catalogue.id}`}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={8} lg={4}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>&nbsp;</label>
              <AntButton
                type="primary"
                icon={<FeatherIcon icon="search" size={14} />}
                onClick={() => fetchVehicles(selectedCatalogueId)}
                block
              >
                Search
              </AntButton>
            </Col>
          </Row>
        </Cards>

        <Cards
          title={
            selectedCatalogue
              ? `Vehicles in ${selectedCatalogue.summary || `Catalogue #${selectedCatalogue.id}`}`
              : 'Vehicles'
          }
        >
          {loading ? (
            <div className="spin" style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={vehicles}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 900 }}
              locale={{ emptyText: 'No vehicles assigned to this catalogue' }}
            />
          )}
        </Cards>
      </Main>

      <Modal
        title={`Change Catalogue${selectedVehicle?.name ? ` - ${selectedVehicle.name}` : ''}`}
        open={changeModalVisible}
        onCancel={closeChangeCatalogueModal}
        onOk={handleChangeCatalogue}
        okText="Submit"
        confirmLoading={submitLoading}
        okButtonProps={{ disabled: !newCatalogueId }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Existing Catalogue</label>
            <Input
              value={
                existingCatalogue?.summary ||
                `${existingCatalogue?.brand || ''} ${existingCatalogue?.model || ''}`.trim() ||
                (existingCatalogue?.id ? `Catalogue #${existingCatalogue.id}` : '-')
              }
              disabled
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>New Catalogue</label>
            <Select
              showSearch
              optionFilterProp="children"
              value={newCatalogueId || undefined}
              onChange={(value) => setNewCatalogueId(value || '')}
              style={{ width: '100%' }}
              placeholder="Select new catalogue"
            >
              {catalogues.map((catalogue) => (
                <Option key={catalogue.id} value={String(catalogue.id)}>
                  {catalogue.summary ||
                    `${catalogue.brand || ''} ${catalogue.model || ''}` ||
                    `Catalogue #${catalogue.id}`}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ManageCatalogueVehicles;
