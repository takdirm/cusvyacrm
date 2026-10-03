import React, { useState, useEffect } from 'react';
import { Form, message, Select, DatePicker } from 'antd';
import { useDispatch } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import propTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { axiosDataSubmit } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';

function CreateBooking({ visible, onCancel }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    visible,
    modalType: 'primary',
    isSubmitting: false,
    customers: [],
    artists: [],
    addresses: [],
    loadingCustomers: false,
    loadingArtists: false,
    loadingAddresses: false,
  });

  let searchTimeout = null;

  useEffect(() => {
    let unmounted = false;
    if (!unmounted) {
      setState((prevState) => ({
        ...prevState,
        visible,
      }));
    }
    return () => {
      unmounted = true;
    };
  }, [visible]);

  // Search customers
  const handleCustomerSearch = async (searchTerm) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!searchTerm || searchTerm.length < 2) {
      setState((prev) => ({ ...prev, customers: [] }));
      return;
    }

    searchTimeout = setTimeout(async () => {
      setState((prev) => ({ ...prev, loadingCustomers: true }));
      try {
        const token = getItem('access_token');
        let apiUrl =
          window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
        if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
        const response = await axios.get(`${apiUrl}/api${API.customer.path}/search?searchTerm=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setState((prev) => ({
          ...prev,
          customers: response.data || [],
          loadingCustomers: false,
        }));
      } catch (error) {
        console.error('Error searching customers:', error);
        setState((prev) => ({ ...prev, loadingCustomers: false, customers: [] }));
      }
    }, 500);
  };

  // Search artists
  const handleArtistSearch = async (searchTerm) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!searchTerm || searchTerm.length < 2) {
      setState((prev) => ({ ...prev, artists: [] }));
      return;
    }

    searchTimeout = setTimeout(async () => {
      setState((prev) => ({ ...prev, loadingArtists: true }));
      try {
        const token = getItem('access_token');
        let apiUrl =
          window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
        if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
        const response = await axios.get(`${apiUrl}/api${API.artist.path}/search/${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setState((prev) => ({
          ...prev,
          artists: response.data || [],
          loadingArtists: false,
        }));
      } catch (error) {
        console.error('Error searching artists:', error);
        setState((prev) => ({ ...prev, loadingArtists: false, artists: [] }));
      }
    }, 500);
  };

  const handleCustomerChange = async (customerId) => {
    // Fetch addresses for selected customer
    setState((prev) => ({ ...prev, loadingAddresses: true, addresses: [] }));
    form.setFieldsValue({ addressId: undefined });

    try {
      const token = getItem('access_token');
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
      const response = await axios.get(`${apiUrl}/api${API.customer.path}/${customerId}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const addresses = response.data || [];
      setState((prev) => ({
        ...prev,
        addresses,
        loadingAddresses: false,
      }));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      message.warning('Could not fetch addresses for this customer');
      setState((prev) => ({ ...prev, loadingAddresses: false }));
    }
  };

  const handleOk = async (values) => {
    try {
      setState((prevState) => ({ ...prevState, isSubmitting: true }));

      // Create Booking DTO with the form values
      const bookingDto = {
        customerId: values.customerId,
        addressId: values.addressId,
        artistId: values.artistId,
        scheduledTime: values.scheduledTime ? values.scheduledTime.toISOString() : null,
        promotionId: 0,
        status: 0, // Pending
        paymentType: 0, // COD
        taxAmount: 0,
        totalPrice: 0,
        paymentId: 0,
      };

      // Dispatch the create action
      await dispatch(axiosDataSubmit(API.booking.path, bookingDto));

      message.success('Booking created successfully!');

      // Reset form and close modal
      form.resetFields();
      setState((prevState) => ({
        ...prevState,
        addresses: [],
      }));
      onCancel();
    } catch (error) {
      console.error('Error creating Booking:', error);
      message.error('Failed to create Booking. Please try again.');
    } finally {
      setState((prevState) => ({ ...prevState, isSubmitting: false }));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setState((prevState) => ({
      ...prevState,
      addresses: [],
    }));
    onCancel();
  };

  // Handle form submission
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        handleOk(values);
      })
      .catch((errorInfo) => {
        console.log('Validation Failed:', errorInfo);
      });
  };

  return (
    <Modal
      type={state.modalType}
      title="Create New Booking"
      visible={state.visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" key="back" outlined onClick={handleCancel} disabled={state.isSubmitting}>
            Cancel
          </Button>
          <Button size="default" type="primary" key="submit" onClick={handleSubmit} loading={state.isSubmitting}>
            {state.isSubmitting ? 'Creating...' : 'Create Booking'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={700}
    >
      <BasicFormWrapper>
        <Form form={form} name="createBooking" layout="vertical">
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[
              {
                required: true,
                message: 'Please select a customer!',
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Type to search customer (min 2 characters)"
              loading={state.loadingCustomers}
              onSearch={handleCustomerSearch}
              onChange={handleCustomerChange}
              filterOption={false}
              notFoundContent={state.loadingCustomers ? 'Searching...' : 'Type to search'}
            >
              {state.customers.map((customer) => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="addressId"
            label="Address"
            rules={[
              {
                required: true,
                message: 'Please select an address!',
              },
            ]}
          >
            <Select
              placeholder="Select address"
              loading={state.loadingAddresses}
              disabled={state.addresses.length === 0}
              notFoundContent={state.loadingAddresses ? 'Loading...' : 'Select a customer first'}
            >
              {state.addresses.map((address) => {
                const parts = [
                  address.houseApartment,
                  address.line1,
                  address.line2,
                  address.city,
                  address.state,
                  address.postalCode,
                ].filter(Boolean);
                const fullAddress = parts.join(', ');
                return (
                  <Select.Option key={address.id} value={address.id}>
                    {fullAddress || 'No address details'}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="artistId"
            label="Artist"
            rules={[
              {
                required: true,
                message: 'Please select an artist!',
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Type to search artist (min 2 characters)"
              loading={state.loadingArtists}
              onSearch={handleArtistSearch}
              filterOption={false}
              notFoundContent={state.loadingArtists ? 'Searching...' : 'Type to search'}
            >
              {state.artists.map((artist) => (
                <Select.Option key={artist.id} value={artist.id}>
                  {artist.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="scheduledTime"
            label="Scheduled Time"
            rules={[
              {
                required: true,
                message: 'Please select scheduled time!',
              },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="Select date and time"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < moment().startOf('day')}
            />
          </Form.Item>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

CreateBooking.propTypes = {
  visible: propTypes.bool.isRequired,
  onCancel: propTypes.func.isRequired,
};

export default CreateBooking;
