import React, { useState, useEffect } from 'react';
import { Row, Col, Card, message, Popconfirm, Spin, Empty } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import AddAddress from './AddAddress';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';

function CustomerAddress() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    addresses: [],
    customerData: null,
    loading: false,
    addModalVisible: false,
  });

  useEffect(() => {
    if (customerId) {
      fetchAddresses();
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const token = getItem('access_token');
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);

      const response = await axios.get(`${apiUrl}/api${API.customer.path}/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState((prev) => ({ ...prev, customerData: response.data }));
    } catch (error) {
      console.error('Error fetching customer data:', error);
      message.error('Failed to fetch customer data');
    }
  };

  const fetchAddresses = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const token = getItem('access_token');
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);

      const response = await axios.get(`${apiUrl}/api${API.customer.path}/${customerId}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState((prev) => ({ ...prev, addresses: response.data || [], loading: false }));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      message.error('Failed to fetch addresses');
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = async (addressId) => {
    try {
      const token = getItem('access_token');
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);

      await axios.delete(`${apiUrl}/api${API.customer.path}/${customerId}/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      message.error('Failed to delete address');
    }
  };

  const showAddModal = () => {
    setState((prev) => ({ ...prev, addModalVisible: true }));
  };

  const hideAddModal = () => {
    setState((prev) => ({ ...prev, addModalVisible: false }));
    fetchAddresses();
  };

  const handleBack = () => {
    navigate('/admin/customer/list');
  };

  const renderAddressCard = (address) => {
    const fullAddress = [
      address.houseApartment,
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <Col xs={24} sm={24} md={12} lg={8} key={address.id}>
        <Card
          style={{ marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          actions={[
            <Popconfirm
              key="delete"
              title="Are you sure you want to delete this address?"
              onConfirm={() => handleDelete(address.id)}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Button type="link" danger>
                <FeatherIcon icon="trash-2" size={16} />
                Delete
              </Button>
            </Popconfirm>,
          ]}
        >
          <div style={{ minHeight: '180px' }}>
            {address.tag && (
              <div style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {address.tag}
                </span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#262626' }}>
                <strong>{fullAddress || 'No address details'}</strong>
              </p>
            </div>

            {(address.senderName || address.senderPhone || address.senderDesignation) && (
              <div
                style={{
                  borderTop: '1px solid #f0f0f0',
                  paddingTop: '12px',
                  marginTop: '12px',
                }}
              >
                <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c' }}>
                  <strong>Contact Details:</strong>
                </p>
                {address.senderName && (
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>
                    <FeatherIcon icon="user" size={12} style={{ marginRight: '6px' }} />
                    {address.senderName}
                    {address.senderDesignation && ` (${address.senderDesignation})`}
                  </p>
                )}
                {address.senderPhone && (
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>
                    <FeatherIcon icon="phone" size={12} style={{ marginRight: '6px' }} />
                    {address.senderPhone}
                  </p>
                )}
              </div>
            )}

            {address.createdAt && (
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#bfbfbf' }}>
                Added: {moment(address.createdAt).format('YYYY-MM-DD HH:mm')}
              </p>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <>
      <PageHeader
        ghost
        title={`Customer Addresses - ${state.customerData?.name || 'Loading...'}`}
        buttons={[
          <div key="1" style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" type="white" outlined onClick={handleBack}>
              <FeatherIcon icon="arrow-left" size={14} style={{ marginRight: '4px' }} />
              Back
            </Button>
            <Button size="small" type="primary" onClick={showAddModal}>
              <FeatherIcon icon="plus" size={14} style={{ marginRight: '4px' }} />
              Add Address
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Cards headless>
          {state.loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : state.addresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Empty description="No addresses found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" onClick={showAddModal}>
                  Add First Address
                </Button>
              </Empty>
            </div>
          ) : (
            <Row gutter={[16, 16]}>{state.addresses.map((address) => renderAddressCard(address))}</Row>
          )}
        </Cards>

        {state.addModalVisible && (
          <AddAddress visible={state.addModalVisible} onCancel={hideAddModal} customerId={customerId} />
        )}
      </Main>
    </>
  );
}

export default CustomerAddress;
